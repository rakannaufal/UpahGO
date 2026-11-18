import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  readFile,
  stat,
  writeFile,
  chmod,
  symlink,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import {
  monitorConfig,
  probeService,
  initialMonitorState,
  advanceMonitor,
  notifyMonitor,
} from "../shared/operations-monitor.mjs";
import { runMonitor } from "../scripts/monitor-service.mjs";
const user = "11111111-1111-4111-8111-111111111111";
const id = "22222222-2222-4222-8222-222222222222";
const token = "synthetic-private-monitor-access-token";
const webhook = "https://alerts.example/private-webhook-secret";
const env = {
  OPS_API_ORIGIN: "https://api.example",
  OPS_SYNTHETIC_USER_ID: user,
  OPS_SYNTHETIC_ACCESS_TOKEN: token,
  OPS_OWNER_REF: "platform-oncall",
  OPS_ALERT_WEBHOOK_URL: webhook,
};
const health = () =>
  new Response(null, { status: 204, headers: { "X-Request-ID": id } });
test("synthetic probe calls only health/bootstrap, is bounded and never returns private details", async () => {
  const config = monitorConfig(env);
  let count = 0;
  const result = await probeService(
    config,
    async (url: URL, init: RequestInit) => {
      assert.equal(init.redirect, "error");
      assert.ok(init.signal);
      assert.equal(url.origin, "https://api.example");
      count++;
      if (url.pathname === "/healthz") return health();
      assert.equal(init.method, "POST");
      assert.equal((init.headers as any).Authorization, `Bearer ${token}`);
      assert.deepEqual(JSON.parse(String(init.body)), {
        operation: "bootstrap",
        args: {},
      });
      return Response.json(
        {
          data: {
            account: { id: user, status: "active" },
            private: "synthetic-private-bootstrap",
          },
        },
        { headers: { "X-Request-ID": id } },
      );
    },
  );
  assert.equal(count, 2);
  assert.equal(result.ok, true);
  assert.equal(result.code, "OK");
  for (const value of [token, user, "synthetic-private-bootstrap", webhook])
    assert.ok(!JSON.stringify(result).includes(value));
  for (const [key, value] of [
    ["OPS_API_ORIGIN", "http://api.example"],
    ["OPS_API_ORIGIN", "https://127.0.0.1"],
    ["OPS_API_ORIGIN", "https://api.example/private?token=x"],
    ["OPS_ALERT_WEBHOOK_URL", "https://user:password@alerts.example/"],
    ["OPS_OWNER_REF", ""],
    ["OPS_API_ORIGIN", "invalid-private-configuration"],
  ])
    assert.throws(() => monitorConfig({ ...env, [key]: value }));
});
test("monitor CLI requires explicit apply and prints only a safe error code", () => {
  const result = spawnSync(process.execPath, ["scripts/monitor-service.mjs"], {
    encoding: "utf8",
    env: { ...process.env, OPS_API_ORIGIN: "invalid-private-configuration" },
  });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr.trim(), "APPLY_REQUIRED");
  const invalid = spawnSync(
    process.execPath,
    ["scripts/monitor-service.mjs", "/private/synthetic-state.json", "--apply"],
    {
      encoding: "utf8",
      env: { ...process.env, OPS_API_ORIGIN: "invalid-private-configuration" },
    },
  );
  assert.equal(invalid.status, 1);
  assert.equal(invalid.stderr.trim(), "MONITOR_CONFIG_INVALID");
});
test("health, expired credentials, wrong account, oversized JSON and transport failures cannot pass", async () => {
  for (const mode of [
    "health",
    "auth",
    "wrong-account",
    "oversize",
    "network",
  ]) {
    const result = await probeService(monitorConfig(env), async (url: URL) => {
      if (mode === "network") throw new Error(token);
      if (url.pathname === "/healthz")
        return mode === "health"
          ? new Response(token, { status: 503 })
          : health();
      if (mode === "auth") return new Response(token, { status: 401 });
      if (mode === "oversize")
        return new Response("x".repeat(262145), {
          headers: { "X-Request-ID": id },
        });
      return Response.json(
        { data: { account: { id: "foreign", status: "active" } } },
        { headers: { "X-Request-ID": id } },
      );
    });
    assert.equal(result.ok, false, mode);
    assert.ok(!JSON.stringify(result).includes(token));
    if (mode === "auth") assert.equal(result.code, "SYNTHETIC_AUTH_FAILED");
  }
});
test("three consecutive failures, repeats, recovery and clock/state validation", async () => {
  const failed = {
    ok: false,
    stage: "api",
    code: "API_UNAVAILABLE",
    status: 502,
    requestId: id,
    durationMs: 3,
  };
  let state = initialMonitorState();
  for (const now of [1000, 61000]) {
    const next = advanceMonitor(state, failed, now);
    assert.equal(next.kind, null);
    state = next.state;
  }
  let next = advanceMonitor(state, failed, 121000);
  assert.equal(next.kind, "alert");
  state = await notifyMonitor(
    monitorConfig(env),
    next.state,
    next.kind,
    failed,
    async () => new Response(null, { status: 204 }),
  );
  next = advanceMonitor(state, failed, 181000);
  assert.equal(next.kind, null);
  next = advanceMonitor(next.state, failed, 1021000);
  assert.equal(next.kind, "alert");
  next = advanceMonitor(
    next.state,
    { ...failed, ok: true, code: "OK", status: 200 },
    1081000,
  );
  assert.equal(next.kind, "recovery");
  assert.throws(() => advanceMonitor({ ...state, failures: -1 }, failed));
  assert.throws(() => advanceMonitor(state, failed, 1));
});
test("durable monitor retries a failed webhook with one key; acknowledges recovery and keeps private state", async () => {
  const directory = await mkdtemp(join(tmpdir(), "upahgo-ops-"));
  const path = join(directory, "ops-monitor.json");
  let recovered = false,
    failWebhook = true;
  const deliveries: { key: string; payload: any }[] = [];
  const fetcher = async (url: URL | string, init: RequestInit) => {
    if (String(url) === webhook) {
      deliveries.push({
        key: (init.headers as any)["Idempotency-Key"],
        payload: JSON.parse(String(init.body)),
      });
      return new Response(null, { status: failWebhook ? 503 : 204 });
    }
    if (new URL(url).pathname === "/healthz") return health();
    return recovered
      ? Response.json(
          { data: { account: { id: user, status: "active" } } },
          { headers: { "X-Request-ID": id } },
        )
      : new Response(token, { status: 503, headers: { "X-Request-ID": id } });
  };
  try {
    for (let i = 0; i < 2; i++)
      assert.equal((await runMonitor(env, path, fetcher)).notification, "none");
    assert.equal((await runMonitor(env, path, fetcher)).notification, "failed");
    failWebhook = false;
    assert.equal((await runMonitor(env, path, fetcher)).notification, "sent");
    assert.equal(deliveries[0].key, deliveries[1].key);
    recovered = true;
    assert.equal((await runMonitor(env, path, fetcher)).notification, "sent");
    assert.equal(deliveries.at(-1)!.payload.event, "recovery");
    assert.equal(deliveries[0].payload.ownerRef, "platform-oncall");
    for (const value of [user, token, "private-webhook-secret"])
      assert.ok(!JSON.stringify(deliveries).includes(value));
    const content = await readFile(path, "utf8");
    assert.equal(JSON.parse(content).open, false);
    assert.equal((await stat(path)).mode & 0o777, 0o600);
    assert.ok(!content.includes(token));
    assert.equal((await runMonitor(env, path, fetcher)).notification, "none");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
test("unsafe, corrupt or locked monitor state fails before any network or notification", async () => {
  const directory = await mkdtemp(join(tmpdir(), "upahgo-ops-state-"));
  const path = join(directory, "ops-monitor.json");
  const noNetwork = () => assert.fail("unsafe state must not initiate a probe");
  try {
    await writeFile(path, "{}", { mode: 0o600 });
    await assert.rejects(
      runMonitor(env, path, noNetwork),
      /MONITOR_STATE_INVALID/,
    );
    await chmod(path, 0o644);
    await assert.rejects(
      runMonitor(env, path, noNetwork),
      /MONITOR_STATE_INVALID/,
    );
    await rm(path);
    await symlink(join(directory, "missing"), path);
    await assert.rejects(runMonitor(env, path, noNetwork));
    await rm(path);
    await writeFile(path + ".lock", "synthetic", { mode: 0o600 });
    await assert.rejects(runMonitor(env, path, noNetwork), /EEXIST/);
    await rm(path + ".lock");
    await chmod(directory, 0o755);
    await assert.rejects(
      runMonitor(env, path, noNetwork),
      /MONITOR_STATE_INVALID/,
    );
  } finally {
    await chmod(directory, 0o700);
    await rm(directory, { recursive: true, force: true });
  }
});
