import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";

const root = fileURLToPath(new URL("../", import.meta.url));
const user = "11111111-1111-4111-8111-111111111111";
const secret = "synthetic-private-gateway-secret-local-ops";
const token = "synthetic-private-local-ops-token";
const sensitive = "synthetic-private-upstream-error";
let mode = "success";
let redirectsFollowed = 0;
const forwarded = [];
// The real Worker/DO use loopback only; this server substitutes Auth/PostgREST.
const upstream = createServer(async (request, response) => {
  for await (const _ of request) {
    /* Drain the small fixture request. */
  }
  response.setHeader("Content-Type", "application/json");
  if (request.url === "/auth/v1/user") {
    if (mode === "redirect") {
      response.writeHead(302, { Location: "/private-redirect" });
      response.end("{}");
      return;
    }
    response.statusCode = mode === "auth-failure" ? 503 : 200;
    response.end(
      JSON.stringify(
        mode === "auth-failure" ? { message: sensitive } : { id: user },
      ),
    );
  } else if (request.url === "/rest/v1/rpc/upahgo_action") {
    forwarded.push(request.headers["x-upahgo-request-id"]);
    response.statusCode = mode === "database-failure" ? 400 : 200;
    response.end(
      JSON.stringify(
        mode === "database-failure"
          ? { message: sensitive }
          : { account: { id: user, status: "active" } },
      ),
    );
  } else {
    if (request.url === "/private-redirect") redirectsFollowed++;
    response.statusCode = 404;
    response.end("{}");
  }
});
const listen = async (server) => {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return server.address().port;
};
const freePort = async () => {
  const server = createServer();
  const port = await listen(server);
  await new Promise((resolve) => server.close(resolve));
  return port;
};
const directory = await mkdtemp(join(tmpdir(), "upahgo-ops-runtime-"));
let worker;
let output = "";
try {
  const upstreamPort = await listen(upstream);
  const workerPort = await freePort();
  const config = JSON.parse(
    (await readFile(join(root, "workers/api/wrangler.jsonc"), "utf8")).replace(
      /,\s*([}\]])/g,
      "$1",
    ),
  );
  config.main = join(root, "workers/api/src/index.js");
  config.vars = {
    ENVIRONMENT: "development",
    TELEMETRY_ENABLED: "true",
    SUPABASE_URL: `http://127.0.0.1:${upstreamPort}`,
    SUPABASE_PUBLISHABLE_KEY: "synthetic-public-key",
    GATEWAY_SECRET: secret,
    ALLOWED_ORIGINS: "",
  };
  const configPath = join(directory, "wrangler.json");
  const envPath = join(directory, "empty.env");
  await writeFile(configPath, JSON.stringify(config));
  await writeFile(envPath, "");
  worker = spawn(
    process.execPath,
    [
      join(root, "node_modules/wrangler/bin/wrangler.js"),
      "dev",
      "--config",
      configPath,
      "--env-file",
      envPath,
      "--local",
      "--ip",
      "127.0.0.1",
      "--port",
      String(workerPort),
      "--inspector-port",
      String(await freePort()),
      "--persist-to",
      join(directory, "state"),
      "--show-interactive-dev-session=false",
    ],
    {
      cwd: directory,
      env: {
        ...process.env,
        WRANGLER_SEND_METRICS: "false",
        WRANGLER_LOG_PATH: join(directory, "wrangler.log"),
        NO_COLOR: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  worker.on("error", () => {});
  const capture = (chunk) => {
    output = (output + chunk).slice(-262144);
  };
  worker.stdout.on("data", capture);
  worker.stderr.on("data", capture);
  const origin = `http://127.0.0.1:${workerPort}`;
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    assert.equal(worker.exitCode, null, "Worker exited before readiness");
    try {
      const response = await fetch(origin + "/healthz", {
        signal: AbortSignal.timeout(1000),
      });
      if (response.status === 204) {
        ready = true;
        break;
      }
    } catch {
      /* Wait for the owned local runtime. */
    }
    await delay(200);
  }
  assert.ok(ready, "Local Worker did not become ready");
  const ids = [];
  for (mode of ["success", "auth-failure", "database-failure", "redirect"]) {
    const response = await fetch(origin + "/v1/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Request-ID": "untrusted-input",
      },
      body: JSON.stringify({ operation: "bootstrap", args: {} }),
      signal: AbortSignal.timeout(20000),
    });
    const id = response.headers.get("X-Request-ID");
    assert.match(
      id,
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    const body = await response.json();
    assert.equal(response.status, mode === "success" ? 200 : 502);
    if (mode !== "success") {
      assert.equal(body.error, "NETWORK_ERROR");
      assert.equal(body.requestId, id);
    }
    ids.push(id);
  }
  await delay(500);
  const events = output.split("\n").flatMap((line) => {
    try {
      const event = JSON.parse(line.trim());
      return event.version === 1 && event.service === "gateway" ? [event] : [];
    } catch {
      return [];
    }
  });
  for (const id of ids) {
    const correlated = events.filter((event) => event.requestId === id);
    assert.equal(
      correlated.filter((event) => event.kind === "request").length,
      1,
      "Exactly one terminal event per call",
    );
    assert.ok(
      correlated.some(
        (event) => event.dependency === "limiter" && event.status === 200,
      ),
    );
    assert.ok(correlated.some((event) => event.dependency === "auth"));
  }
  assert.deepEqual(forwarded, [ids[0], ids[2]]);
  assert.equal(
    redirectsFollowed,
    0,
    "Upstream redirects never receive credentials",
  );
  assert.ok(
    events.some((event) => event.dependency === "auth" && event.status === 503),
  );
  assert.ok(
    events.some(
      (event) => event.dependency === "database" && event.status === 400,
    ),
  );
  for (const value of [
    user,
    secret,
    token,
    sensitive,
    "untrusted-input",
    "http://",
  ])
    assert.ok(
      !JSON.stringify(events).includes(value),
      "Application events must exclude private fixture data",
    );
  console.log(
    JSON.stringify({
      runtime: "local Wrangler/workerd + SQLite Durable Object",
      upstream: "synthetic loopback",
      scenarios: 4,
      requestCorrelation: "pass",
      redaction: "pass",
      remoteDeployment: false,
    }),
  );
} catch (error) {
  // Only synthetic fixture settings exist in this isolated runtime.
  console.error(output.slice(-12000));
  throw error;
} finally {
  if (worker && worker.exitCode === null) {
    const stopped = once(worker, "exit");
    worker.kill("SIGTERM");
    await Promise.race([stopped, delay(5000)]);
    if (worker.exitCode === null) {
      worker.kill("SIGKILL");
      await stopped;
    }
  }
  upstream.closeAllConnections();
  await new Promise((resolve) => upstream.close(resolve));
  await rm(directory, { recursive: true, force: true });
}
