import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { handleRequest } from "../workers/api/src/handler.mjs";
import { createTelemetry } from "../shared/observability.mjs";

const user = "11111111-1111-4111-8111-111111111111";
const secret = "synthetic-secret-never-log-this-value";
const token = "Bearer synthetic-access-token-never-log";
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
function env(limiter = 200) {
  return {
    ENVIRONMENT: "staging",
    TELEMETRY_ENABLED: "true",
    SUPABASE_URL: "https://upstream.example",
    SUPABASE_PUBLISHABLE_KEY: "synthetic-public-key",
    GATEWAY_SECRET: secret,
    ALLOWED_ORIGINS: "https://app.example",
    LIMITER: {
      idFromName: (name: string) => name,
      get: () => ({
        fetch: async () => new Response(null, { status: limiter }),
      }),
    },
  };
}
function request(path = "/v1/action", method = "POST") {
  return new Request("https://api.example" + path, {
    method,
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
      "X-Request-ID": "attacker-controlled",
      Origin: "https://app.example",
      "CF-Connecting-IP": "192.0.2.99",
    },
    body:
      method === "POST"
        ? JSON.stringify({
            operation: "bootstrap",
            args: {
              phone: "synthetic-private-phone",
              gps: "synthetic-private-gps",
            },
          })
        : undefined,
  });
}
test("request IDs are server-generated, exposed on success/errors and shared with dependencies", async () => {
  const logs: any[] = [];
  const forwarded: string[] = [];
  const response = await handleRequest(
    request(),
    env(),
    async (url: URL, init: RequestInit) => {
      assert.equal(
        init.redirect,
        "manual",
        "workerd-compatible, never follows redirect",
      );
      if (url.pathname === "/auth/v1/user") return Response.json({ id: user });
      forwarded.push(new Headers(init.headers).get("x-upahgo-request-id")!);
      return Response.json({
        account: { id: user },
        private: "synthetic-private-response",
      });
    },
    (line: string) => logs.push(JSON.parse(line)),
  );
  const id = response.headers.get("X-Request-ID")!;
  assert.match(id, uuid);
  assert.deepEqual(forwarded, [id]);
  assert.equal(
    response.headers.get("Access-Control-Expose-Headers"),
    "X-Request-ID",
  );
  assert.equal(logs.length, 5);
  assert.ok(logs.every((event) => event.requestId === id));
  assert.equal(logs.filter((event) => event.kind === "request").length, 1);
  const output = JSON.stringify(logs);
  for (const value of [
    secret,
    token,
    user,
    "192.0.2.99",
    "synthetic-private-phone",
    "synthetic-private-gps",
    "synthetic-private-response",
    "attacker-controlled",
    "https://",
  ])
    assert.ok(!output.includes(value), value);
  for (const event of logs)
    assert.ok(
      Object.keys(event).every((key) =>
        [
          "version",
          "service",
          "environment",
          "route",
          "method",
          "timestamp",
          "requestId",
          "operation",
          "kind",
          "status",
          "code",
          "durationMs",
          "dependency",
          "outcome",
        ].includes(key),
      ),
    );
  assert.ok(logs.every((event) => event.durationMs >= 0));
});
test("Auth, database and limiter faults are distinct, redacted and measurable", async () => {
  for (const stage of ["auth", "database", "limiter"]) {
    const logs: any[] = [];
    const response = await handleRequest(
      request(),
      env(stage === "limiter" ? 500 : 200),
      async (url: URL) => {
        if (stage === "auth" || url.pathname !== "/auth/v1/user")
          return Response.json(
            { message: secret, details: token },
            { status: 503 },
          );
        return Response.json({ id: user });
      },
      (line: string) => logs.push(JSON.parse(line)),
    );
    assert.equal(response.status, stage === "limiter" ? 503 : 502);
    assert.ok(
      logs.some(
        (event) =>
          event.kind === "dependency" &&
          event.dependency === stage &&
          event.outcome === "error",
      ),
    );
    assert.equal(logs.at(-1).status, response.status);
    assert.ok(!JSON.stringify(logs).includes(secret));
    assert.ok(!JSON.stringify(await response.json()).includes(secret));
  }
});
test("unexpected PostgREST400 is an outage; explicit input rejection remains400", async () => {
  for (const message of [
    "synthetic-private-missing-relation",
    "INVALID_INPUT",
  ]) {
    const result = await handleRequest(
      request(),
      env(),
      async (url: URL) =>
        url.pathname === "/auth/v1/user"
          ? Response.json({ id: user })
          : Response.json({ message }, { status: 400 }),
      () => {},
    );
    assert.equal(result.status, message === "INVALID_INPUT" ? 400 : 502);
    assert.equal(
      (await result.json()).error,
      message === "INVALID_INPUT" ? "INVALID_INPUT" : "NETWORK_ERROR",
    );
  }
});
test("timeouts, malformed upstream responses and early rejects retain one safe terminal event", async () => {
  for (const mode of [
    "timeout",
    "malformed",
    "not_found",
    "unauthenticated",
    "preflight",
  ]) {
    const logs: any[] = [];
    const req =
      mode === "not_found"
        ? request("/private-synthetic-user?token=private-query", "GET")
        : mode === "preflight"
          ? request("/v1/action", "OPTIONS")
          : request();
    if (mode === "unauthenticated") req.headers.delete("Authorization");
    const response = await handleRequest(
      req,
      env(),
      async () => {
        if (mode === "timeout") throw new DOMException(secret, "TimeoutError");
        return new Response("synthetic-private-invalid-json");
      },
      (line: string) => logs.push(JSON.parse(line)),
    );
    assert.match(response.headers.get("X-Request-ID")!, uuid);
    assert.equal(logs.filter((event) => event.kind === "request").length, 1);
    assert.ok(!JSON.stringify(logs).includes("private-query"));
    if (mode === "timeout")
      assert.ok(logs.some((event) => event.outcome === "timeout"));
    if (mode === "not_found") assert.equal(logs.at(-1).code, "NOT_FOUND");
    if (["timeout", "malformed"].includes(mode))
      assert.equal(response.status, 502);
  }
});
test("photo forwarding keeps HTTP202 and only the gateway ID; health is liveness only", async () => {
  const logs: any[] = [];
  const response = await handleRequest(
    request("/v1/photo", "DELETE"),
    env(),
    async (url: URL, init: RequestInit) => {
      if (url.pathname === "/auth/v1/user") return Response.json({ id: user });
      assert.match(new Headers(init.headers).get("x-upahgo-request-id")!, uuid);
      return Response.json(
        { data: { status: null, cleanup: "queued" } },
        { status: 202 },
      );
    },
    (line: string) => logs.push(JSON.parse(line)),
  );
  assert.equal(response.status, 202);
  const health = await handleRequest(
    request("/healthz", "GET"),
    env(),
    () => assert.fail("health must not call upstream"),
    () => {},
  );
  assert.equal(health.status, 204);
  assert.equal(health.headers.get("Cache-Control"), "no-store");
});
test("disabled telemetry and logger failure never break a completed response", async () => {
  let count = 0;
  const quiet = await handleRequest(
    request("/healthz", "GET"),
    { ...env(), TELEMETRY_ENABLED: "false" },
    fetch,
    () => {
      count++;
    },
  );
  assert.equal(quiet.status, 204);
  assert.equal(count, 0);
  const noisy = await handleRequest(
    request("/healthz", "GET"),
    env(),
    fetch,
    () => {
      throw new Error(secret);
    },
  );
  assert.equal(noisy.status, 204);
  const trace = createTelemetry({
    service: "photo",
    environment: secret,
    route: secret,
    method: token,
    enabled: true,
    sink: (line: string) => {
      assert.ok(!line.includes(secret));
      assert.ok(!line.includes(token));
    },
  });
  trace.operation(secret);
  trace.error(secret);
  trace.finish(503);
});
test("Worker observability disables invocation/query/trace capture; source maps are private artifacts", async () => {
  const config = JSON.parse(
    (await readFile("workers/api/wrangler.jsonc", "utf8")).replace(
      /,\s*([}\]])/g,
      "$1",
    ),
  );
  assert.equal(config.observability.enabled, true);
  assert.equal(config.observability.logs.invocation_logs, false);
  assert.equal(config.observability.redact_query_string, true);
  assert.equal(config.observability.traces.enabled, false);
  assert.equal(config.upload_source_maps, true);
  assert.equal(config.observability.logs.head_sampling_rate, 1);
});
