import { operations, errors } from "../../../shared/worker-contract.mjs";
import { readBoundedBytes } from "../../../shared/photo-processing.mjs";
import { createTelemetry } from "../../../shared/observability.mjs";
const maxBody = 16384;
async function limitedJson(request) {
  if (!request.body) throw new Error("INVALID_INPUT");
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBody) {
      await reader.cancel();
      throw new Error("BODY_TOO_LARGE");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Error("INVALID_INPUT");
  }
}
async function keyHash(value) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
export async function handleRequest(
  request,
  env,
  fetcher = fetch,
  sink = console.log,
) {
  const path = new URL(request.url).pathname;
  const trace = createTelemetry({
    service: "gateway",
    environment: env.ENVIRONMENT,
    enabled: env.TELEMETRY_ENABLED === "true",
    method: request.method,
    sink,
    route:
      request.method === "OPTIONS"
        ? "preflight"
        : path === "/v1/action"
          ? "action"
          : path === "/v1/photo"
            ? "photo"
            : path === "/healthz"
              ? "health"
              : "not_found",
  });
  let response;
  try {
    response = await dispatch(request, env, fetcher, trace);
  } catch {
    trace.error("INTERNAL_ERROR");
    response = Response.json(
      { error: "INTERNAL_ERROR", requestId: trace.requestId },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  }
  response.headers.set("X-Request-ID", trace.requestId);
  trace.finish(response.status);
  return response;
}
async function dispatch(request, env, fetcher, trace) {
  const origin = request.headers.get("Origin");
  const origins = (env.ALLOWED_ORIGINS || "").split(",").filter(Boolean);
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    Vary: "Origin",
    "Access-Control-Expose-Headers": "X-Request-ID",
  };
  if (origin && origins.includes(origin))
    headers["Access-Control-Allow-Origin"] = origin;
  const respond = (data, status = 200) => {
    if (data.error) trace.error(data.error);
    return new Response(
      JSON.stringify(
        data.error ? { ...data, requestId: trace.requestId } : data,
      ),
      { status, headers },
    );
  };
  if (origin && !origins.includes(origin))
    return respond({ error: "FORBIDDEN" }, 403);
  if (request.method === "OPTIONS")
    return new Response(null, {
      status: 204,
      headers: {
        ...headers,
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Authorization, Content-Type, x-upahgo-photo-consent",
        "Access-Control-Max-Age": "600",
      },
    });
  const url = new URL(request.url);
  if (url.pathname === "/healthz" && request.method === "GET")
    return new Response(null, { status: 204, headers });
  const media = url.pathname === "/v1/photo";
  if (media) trace.operation("photo_" + request.method.toLowerCase());
  if (url.pathname !== "/v1/action" && !media)
    return respond({ error: "NOT_FOUND" }, 404);
  if (
    media
      ? !["GET", "POST", "DELETE"].includes(request.method)
      : request.method !== "POST"
  )
    return respond({ error: "METHOD_NOT_ALLOWED" }, 405);
  if (
    !media &&
    !request.headers.get("Content-Type")?.startsWith("application/json")
  )
    return respond({ error: "INVALID_INPUT" }, 415);
  const token = request.headers.get("Authorization");
  if (!token || !/^Bearer [A-Za-z0-9_.-]{20,8192}$/.test(token))
    return respond({ error: "UNAUTHENTICATED" }, 401);
  try {
    let service;
    try {
      service = new URL(env.SUPABASE_URL);
    } catch {
      throw new Error("GATEWAY_NOT_CONFIGURED");
    }
    if (
      service.protocol !== "https:" &&
      !(
        env.ENVIRONMENT === "development" &&
        ["localhost", "127.0.0.1"].includes(service.hostname)
      )
    )
      throw new Error("GATEWAY_NOT_CONFIGURED");
    if (
      !env.SUPABASE_PUBLISHABLE_KEY ||
      env.GATEWAY_SECRET?.length < 32 ||
      !env.GATEWAY_SECRET ||
      !env.LIMITER
    )
      throw new Error("GATEWAY_NOT_CONFIGURED");
    const allow = async (key, limit) => {
      const stub = env.LIMITER.get(
        env.LIMITER.idFromName(await keyHash(env.GATEWAY_SECRET + key)),
      );
      const response = await trace.fetch(
        "limiter",
        "https://limiter/check",
        {
          method: "POST",
          body: JSON.stringify({ limit }),
          signal: AbortSignal.timeout(5000),
        },
        stub.fetch.bind(stub),
      );
      if (response.status !== 200)
        throw new Error(
          response.status === 429 ? "RATE_LIMITED" : "GATEWAY_NOT_CONFIGURED",
        );
    };
    // CF supplies this header; an attacker-controlled forwarding header is never used.
    await allow(
      "ip:" + (request.headers.get("CF-Connecting-IP") || "local"),
      180,
    );
    const body = media ? null : await limitedJson(request);
    if (
      !media &&
      (!body ||
        Object.keys(body).some((k) => !["operation", "args"].includes(k)) ||
        !operations.includes(body.operation) ||
        !body.args ||
        Array.isArray(body.args) ||
        typeof body.args !== "object")
    )
      throw new Error("INVALID_INPUT");
    if (!media) trace.operation(body.operation);
    const authHeaders = {
      apikey: env.SUPABASE_PUBLISHABLE_KEY,
      Authorization: token,
    };
    const userResponse = await trace.fetch(
      "auth",
      new URL("/auth/v1/user", service),
      {
        headers: authHeaders,
        signal: AbortSignal.timeout(8000),
        // workerd supports manual redirects; every non-2xx response fails closed.
        redirect: "manual",
      },
      fetcher,
    );
    if (!userResponse.ok)
      throw new Error(
        userResponse.status === 401 || userResponse.status === 403
          ? "UNAUTHENTICATED"
          : "NETWORK_ERROR",
      );
    const user = await userResponse.json();
    if (typeof user.id !== "string" || !/^[0-9a-f-]{36}$/i.test(user.id))
      throw new Error("UNAUTHENTICATED");
    await allow("user:" + user.id, 90);
    if (media) {
      await allow(
        "photo:" + (request.method === "GET" ? "read:" : "write:") + user.id,
        request.method === "GET" ? 90 : 3,
      );
      if (
        [...url.searchParams.keys()].some(
          (k) => !["id", "role", "size"].includes(k),
        )
      )
        throw new Error("PHOTO_INVALID");
      if (
        request.method === "POST" &&
        request.headers.get("Content-Type") !== "image/jpeg"
      )
        throw new Error("PHOTO_INVALID");
      if (
        request.method === "POST" &&
        request.headers.get("x-upahgo-photo-consent") !== "true"
      )
        throw new Error("CONSENT_REQUIRED");
      const bytes =
        request.method === "POST" ? await readBoundedBytes(request) : undefined;
      const destination = new URL("/functions/v1/profile-photo", service);
      destination.search = url.search;
      const response = await trace.fetch(
        "photo",
        destination,
        {
          method: request.method,
          headers: {
            ...authHeaders,
            "Content-Type": "image/jpeg",
            "x-upahgo-gateway": env.GATEWAY_SECRET,
            "x-upahgo-request-id": trace.requestId,
            "x-upahgo-photo-consent":
              request.headers.get("x-upahgo-photo-consent") ?? "false",
          },
          body: bytes,
          signal: AbortSignal.timeout(25000),
          redirect: "manual",
        },
        fetcher,
      );
      const data = await response.json();
      if (!response.ok || data.error)
        throw new Error(
          response.status >= 500
            ? "NETWORK_ERROR"
            : errors.includes(data.error)
              ? data.error
              : "PHOTO_UNAVAILABLE",
        );
      return respond(data, response.status);
    }
    const result = await trace.fetch(
      "database",
      new URL("/rest/v1/rpc/upahgo_action", service),
      {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
          "x-upahgo-gateway": env.GATEWAY_SECRET,
          "x-upahgo-request-id": trace.requestId,
        },
        body: JSON.stringify({
          p_operation: body.operation,
          p_args: body.args,
        }),
        signal: AbortSignal.timeout(10000),
        redirect: "manual",
      },
      fetcher,
    );
    const data = await result.json();
    if (!result.ok)
      throw new Error(
        result.status >= 500
          ? "NETWORK_ERROR"
          : errors.includes(data.message) || data.message === "INVALID_INPUT"
            ? data.message
            : "NETWORK_ERROR",
      );
    return respond({ data });
  } catch (error) {
    const known = [
      ...errors,
      "INVALID_INPUT",
      "BODY_TOO_LARGE",
      "NETWORK_ERROR",
    ];
    const code =
      error instanceof Error && known.includes(error.message)
        ? error.message
        : "NETWORK_ERROR";
    return respond(
      { error: code },
      code === "UNAUTHENTICATED"
        ? 401
        : code === "RATE_LIMITED"
          ? 429
          : code === "BODY_TOO_LARGE"
            ? 413
            : code === "GATEWAY_NOT_CONFIGURED"
              ? 503
              : code === "NETWORK_ERROR" || code === "PHOTO_UNAVAILABLE"
                ? 502
                : 400,
    );
  }
}
