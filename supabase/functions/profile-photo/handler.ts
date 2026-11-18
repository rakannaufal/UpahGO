import { createClient } from "@supabase/supabase-js";
import * as magick from "@imagemagick/magick-wasm";
import { mediaKeyPattern } from "../../../shared/media-cleanup.mjs";
import { createTelemetry } from "../../../shared/observability.mjs";
import {
  processPhoto,
  readBoundedBytes,
} from "../../../shared/photo-processing.mjs";
// No request data is logged. The gateway secret prevents direct rate-limit bypass.
let initialized: Promise<void> | undefined;
export async function handlePhotoRequest(request: Request): Promise<Response> {
  const trace = createTelemetry({
    service: "photo",
    environment: Deno.env.get("UPAHGO_ENVIRONMENT"),
    enabled: Deno.env.get("UPAHGO_TELEMETRY_ENABLED") === "true",
    route: "photo",
    method: request.method,
  });
  trace.operation("photo_" + request.method.toLowerCase());
  let response: Response;
  try {
    response = await dispatchPhotoRequest(request, trace);
  } catch {
    trace.error("INTERNAL_ERROR");
    response = Response.json(
      { error: "PHOTO_UNAVAILABLE", requestId: trace.requestId },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  response.headers.set("X-Request-ID", trace.requestId);
  trace.finish(response.status);
  return response;
}
async function dispatchPhotoRequest(
  request: Request,
  trace: ReturnType<typeof createTelemetry>,
): Promise<Response> {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
  const reply = (data: { error?: string; data?: unknown }, status = 200) => {
    if (data.error) trace.error(data.error);
    return new Response(
      JSON.stringify(
        data.error ? { ...data, requestId: trace.requestId } : data,
      ),
      { status, headers },
    );
  };
  try {
    const secret = Deno.env.get("UPAHGO_GATEWAY_SECRET") ?? "";
    const supplied = request.headers.get("x-upahgo-gateway") ?? "";
    const digest = async (s: string) =>
      new Uint8Array(
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)),
      );
    const a = await digest(secret),
      b = await digest(supplied);
    if (
      secret.length < 32 ||
      a.reduce((n, value, index) => n | (value ^ b[index]!), 0) !== 0
    )
      return reply({ error: "FORBIDDEN" }, 403);
    trace.trustGatewayId(request.headers.get("x-upahgo-request-id"));
    const token = request.headers.get("Authorization") ?? "";
    const url = Deno.env.get("SUPABASE_URL")!;
    const boundedFetch: typeof fetch = (input, options) => {
      const path = new URL(input instanceof Request ? input.url : String(input))
        .pathname;
      const dependency = path.startsWith("/auth/")
        ? "auth"
        : path.startsWith("/storage/")
          ? "storage"
          : "database";
      return trace.fetch(dependency, input, {
        ...options,
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      });
    };
    const client = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: {
        fetch: boundedFetch,
        headers: {
          Authorization: token,
          "x-upahgo-gateway": secret,
          "x-upahgo-request-id": trace.requestId,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    const { data: auth, error: authError } = await client.auth.getUser();
    if (authError || !auth.user) {
      const unavailable =
        authError && ![400, 401, 403].includes(authError.status ?? 0);
      return reply(
        { error: unavailable ? "PHOTO_UNAVAILABLE" : "UNAUTHENTICATED" },
        unavailable ? 503 : 401,
      );
    }
    const rpc = async (operation: string, args = {}) => {
      const { data, error } = await client.rpc("upahgo_action", {
        p_operation: operation,
        p_args: args,
      });
      if (error)
        throw new Error(
          [
            "UNAVAILABLE",
            "ACCOUNT_RESTRICTED",
            "LOCATION_STALE",
            "LOCATION_REQUIRED",
            "RATE_LIMITED",
          ].includes(error.message)
            ? error.message
            : "PHOTO_UNAVAILABLE",
        );
      return data;
    };
    const admin = createClient(
      url,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        global: {
          fetch: boundedFetch,
          headers: { "x-upahgo-request-id": trace.requestId },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
    const storage = admin.storage.from("profile-photos");
    const params = new URL(request.url).searchParams;
    if (request.method === "GET") {
      const id = params.get("id"),
        role = params.get("role");
      if (
        !id ||
        !/^[0-9a-f-]{36}$/i.test(id) ||
        !["worker", "employer"].includes(role ?? "")
      )
        throw new Error("PHOTO_INVALID");
      const access = await rpc("photo_access", { id, role });
      if (!access.key)
        return reply({ data: { uri: null, status: access.status } });
      const path =
        access.key + (params.get("size") === "detail" ? ".jpg" : "-thumb.jpg");
      const { data, error } = await storage.createSignedUrl(path, 60);
      if (error) throw new Error("PHOTO_UNAVAILABLE");
      return reply({ data: { uri: data.signedUrl, status: access.status } });
    }
    if (!["POST", "DELETE"].includes(request.method))
      return reply({ error: "METHOD_NOT_ALLOWED" }, 405);
    const bootstrap = await rpc("bootstrap");
    if (!bootstrap.profile || bootstrap.account.status !== "active")
      throw new Error("ACCOUNT_RESTRICTED");
    const role = bootstrap.account.role;
    if (!["worker", "employer"].includes(role))
      throw new Error("PHOTO_INVALID");
    if (request.method === "DELETE") {
      const { error } = await admin.rpc("upahgo_photo_replace", {
        p_user: auth.user.id,
        p_role: role,
        p_key: null,
      });
      if (error) throw new Error("PHOTO_UNAVAILABLE");
      return reply({ data: { status: null, cleanup: "queued" } }, 202);
    }
    if (request.headers.get("Content-Type") !== "image/jpeg")
      throw new Error("PHOTO_INVALID");
    if (request.headers.get("x-upahgo-photo-consent") !== "true")
      return reply({ error: "CONSENT_REQUIRED" }, 400);
    const bytes = await readBoundedBytes(request);
    initialized ??= Deno.readFile(
      new URL("./magick.wasm", import.meta.url),
    ).then((bytes) => magick.initializeImageMagick(bytes));
    await initialized;
    const images = processPhoto(magick, bytes);
    // Reserve before any bytes are written, so a killed/failed upload is discoverable.
    const { data: reservation, error: reserveError } = await admin.rpc(
      "upahgo_media_admin",
      {
        p_action: "reserve",
        p_args: { userId: auth.user.id, role },
      },
    );
    const key = reservation?.key;
    if (
      reserveError ||
      typeof key !== "string" ||
      !mediaKeyPattern.test(key) ||
      !key.startsWith(`${auth.user.id}/${role}/`)
    )
      throw new Error("PHOTO_UNAVAILABLE");
    for (const [suffix, data] of [
      [".jpg", images.detail],
      ["-thumb.jpg", images.thumb],
    ] as const) {
      const { error } = await storage.upload(key + suffix, data, {
        contentType: "image/jpeg",
        upsert: false,
        cacheControl: "60",
      });
      if (error) throw new Error("PHOTO_UNAVAILABLE");
    }
    const { error } = await admin.rpc("upahgo_photo_replace", {
      p_user: auth.user.id,
      p_role: role,
      p_key: key,
    });
    // Cleanup owns removals; an uncertain commit must never delete a possibly active key.
    if (error) throw new Error("PHOTO_UNAVAILABLE");
    return reply({ data: { status: "pending" } });
  } catch (error) {
    const allowed = [
      "PHOTO_INVALID",
      "PHOTO_UNAVAILABLE",
      "ACCOUNT_RESTRICTED",
      "UNAVAILABLE",
      "RATE_LIMITED",
      "LOCATION_STALE",
      "LOCATION_REQUIRED",
      "BODY_TOO_LARGE",
    ];
    const code =
      error instanceof Error && allowed.includes(error.message)
        ? error.message
        : "PHOTO_UNAVAILABLE";
    return reply(
      { error: code },
      code === "RATE_LIMITED"
        ? 429
        : code === "BODY_TOO_LARGE"
          ? 413
          : code === "PHOTO_UNAVAILABLE"
            ? 503
            : 400,
    );
  }
}
