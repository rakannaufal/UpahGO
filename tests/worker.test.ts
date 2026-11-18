import test from "node:test";
import assert from "node:assert/strict";
import { handleRequest } from "../workers/api/src/handler.mjs";
import { operations, errors } from "../shared/contracts.ts";
import {
  operations as gatewayOperations,
  errors as gatewayErrors,
} from "../shared/worker-contract.mjs";
test("generated Worker contract matches the application contract", () => {
  assert.deepEqual(gatewayOperations, operations);
  assert.deepEqual(gatewayErrors, Object.keys(errors));
});
const token = "Bearer synthetic-token-for-unit-test";
test("photo gateway requires consent and session, bounds input and uses only the fixed function", async () => {
  const auth = () =>
    new Response(
      JSON.stringify({ id: "11111111-1111-4111-8111-111111111111" }),
    );
  const photo = (headers = {}, bytes = new Uint8Array([255, 216, 255, 217])) =>
    new Request("https://api.example/v1/photo", {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "image/jpeg",
        ...headers,
      },
      body: bytes,
    });
  let r = await handleRequest(photo({ Authorization: "" }), environment(), () =>
    assert.fail("auth missing"),
  );
  assert.equal(r.status, 401);
  r = await handleRequest(photo(), environment(), async (url) => {
    assert.ok(String(url).endsWith("/auth/v1/user"));
    return auth();
  });
  assert.equal((await r.json()).error, "CONSENT_REQUIRED");
  r = await handleRequest(
    photo(
      { "x-upahgo-photo-consent": "true" },
      new Uint8Array(5 * 1024 * 1024 + 1),
    ),
    environment(),
    async () => auth(),
  );
  assert.equal(r.status, 413);
  r = await handleRequest(
    photo({ "x-upahgo-photo-consent": "true" }),
    environment(),
    async (url, options) => {
      if (String(url).endsWith("/auth/v1/user")) return auth();
      assert.equal(
        String(url),
        "https://project.supabase.co/functions/v1/profile-photo",
      );
      assert.equal(options.headers["x-upahgo-photo-consent"], "true");
      assert.equal(options.method, "POST");
      assert.ok(options.body instanceof Uint8Array);
      return new Response(JSON.stringify({ data: { status: "pending" } }));
    },
  );
  assert.equal((await r.json()).data.status, "pending");
});
function environment(status = 200) {
  return {
    SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "public-unit-test-key",
    GATEWAY_SECRET: "synthetic-gateway-secret-for-unit-test",
    ALLOWED_ORIGINS: "https://app.example",
    LIMITER: {
      idFromName: (name: string) => name,
      get: () => ({ fetch: async () => new Response(null, { status }) }),
    },
  };
}
function request(
  body: unknown = { operation: "bootstrap", args: {} },
  headers = {},
) {
  return new Request("https://api.example/v1/action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}
test("CORS denies unlisted browser origins; missing token denied", async () => {
  let r = await handleRequest(
    request(undefined, { Origin: "https://evil.example" }),
    environment(),
  );
  assert.equal(r.status, 403);
  r = await handleRequest(
    request(undefined, { Authorization: "" }),
    environment(),
  );
  assert.equal(r.status, 401);
});
test("gateway and limiter failure deny requests before upstream", async () => {
  for (const status of [429, 500]) {
    const r = await handleRequest(request(), environment(status), () =>
      assert.fail("upstream must not run"),
    );
    assert.equal(r.status, status === 429 ? 429 : 503);
  }
  const r = await handleRequest(request(), {
    ...environment(),
    GATEWAY_SECRET: "",
  });
  assert.equal(r.status, 503);
});
test("bounded body, allowlisted operation, no arbitrary target URL", async () => {
  for (const body of [
    { operation: "delete_database", args: {} },
    { operation: "bootstrap", args: {}, url: "http://localhost" },
    { operation: "bootstrap", args: "no" },
  ]) {
    const r = await handleRequest(request(body), environment(), () =>
      assert.fail("upstream must not run"),
    );
    assert.equal(r.status, 400);
  }
  const r = await handleRequest(
    request({ operation: "bootstrap", args: { large: "a".repeat(17000) } }),
    environment(),
  );
  assert.equal(r.status, 413);
});
test("verifies session then forwards only to fixed RPC with gateway header", async () => {
  const seen: URL[] = [];
  const fetcher = async (url: URL, init: RequestInit) => {
    seen.push(url);
    if (url.pathname === "/auth/v1/user")
      return Response.json({ id: "11111111-1111-4111-8111-111111111111" });
    assert.equal(
      new Headers(init.headers).get("x-upahgo-gateway"),
      environment().GATEWAY_SECRET,
    );
    assert.equal(new Headers(init.headers).get("Authorization"), token);
    assert.deepEqual(JSON.parse(String(init.body)), {
      p_operation: "bootstrap",
      p_args: {},
    });
    return Response.json({ profile: null, areas: [], tags: [] });
  };
  const r = await handleRequest(request(), environment(), fetcher);
  assert.equal(r.status, 200);
  assert.deepEqual(
    seen.map((x) => x.hostname),
    ["project.supabase.co", "project.supabase.co"],
  );
  assert.equal(r.headers.get("Cache-Control"), "no-store");
});
test("invalid session never reaches RPC; internal database errors are redacted", async () => {
  let calls = 0;
  let r = await handleRequest(request(), environment(), async () => {
    calls++;
    return new Response(null, { status: 401 });
  });
  assert.equal(r.status, 401);
  assert.equal(calls, 1);
  calls = 0;
  r = await handleRequest(request(), environment(), async () => {
    calls++;
    return calls === 1
      ? Response.json({ id: "11111111-1111-4111-8111-111111111111" })
      : Response.json(
          { message: "private table name and SQL text" },
          { status: 500 },
        );
  });
  assert.equal(r.status, 502);
  assert.deepEqual(await r.json(), {
    error: "NETWORK_ERROR",
    requestId: r.headers.get("X-Request-ID"),
  });
});
