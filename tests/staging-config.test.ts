import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { handleRequest } from "../workers/api/src/handler.mjs";

const config = JSON.parse(
  (
    await readFile(
      new URL("../workers/api/wrangler.jsonc", import.meta.url),
      "utf8",
    )
  ).replace(/,\s*([}\]])/g, "$1"),
);

test("staging does not inherit a production route, upstream or limiter binding", () => {
  const staging = config.env.staging;
  assert.notEqual(staging.name, config.name);
  assert.deepEqual(staging.routes, []);
  assert.equal(staging.vars.ENVIRONMENT, "staging");
  assert.equal(config.vars.ENVIRONMENT, "production");
  assert.equal(config.vars.SUPABASE_URL, "");
  assert.equal(
    staging.vars.SUPABASE_URL,
    "https://aqzlgrahfxmbvtfwebsx.supabase.co",
  );
  const limiter = staging.durable_objects.bindings.find(
    (binding: { name: string }) => binding.name === "LIMITER",
  );
  assert.ok(limiter);
  assert.equal(limiter.script_name, undefined);
  assert.equal(limiter.environment, undefined);
  assert.ok(
    staging.migrations.some((migration: { new_sqlite_classes?: string[] }) =>
      migration.new_sqlite_classes?.includes(limiter.class_name),
    ),
  );
});

test("an unconfigured or malformed upstream fails before any outbound request", async () => {
  for (const upstream of [
    config.vars.SUPABASE_URL,
    undefined,
    "not-a-url",
    "http://127.0.0.1:8787",
  ]) {
    const response = await handleRequest(
      new Request("https://api.example/v1/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer synthetic-staging-configuration-test",
        },
        body: JSON.stringify({ operation: "bootstrap", args: {} }),
      }),
      {
        ...config.vars,
        ENVIRONMENT: "staging",
        SUPABASE_URL: upstream,
        SUPABASE_PUBLISHABLE_KEY: "synthetic-public-key",
        GATEWAY_SECRET: "synthetic-private-staging-secret-for-tests",
        LIMITER: {
          idFromName: () => assert.fail("limiter must not be called"),
        },
      },
      () => assert.fail("upstream must not be called"),
      () => {},
    );
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error, "GATEWAY_NOT_CONFIGURED");
  }
});
