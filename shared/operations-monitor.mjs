const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const probeCodes = new Set([
  "OK",
  "HEALTH_UNAVAILABLE",
  "API_UNAVAILABLE",
  "SYNTHETIC_AUTH_FAILED",
  "SYNTHETIC_RESPONSE_INVALID",
]);
export function monitorConfig(env) {
  let api, webhook;
  try {
    api = new URL(env.OPS_API_ORIGIN);
    webhook = new URL(env.OPS_ALERT_WEBHOOK_URL);
  } catch {
    throw new Error("MONITOR_CONFIG_INVALID");
  }
  for (const url of [api, webhook]) {
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.hostname === "localhost" ||
      url.hostname.endsWith(".local") ||
      url.hostname.endsWith(".internal") ||
      url.hostname.includes(":") ||
      /^[0-9.]+$/.test(url.hostname)
    )
      throw new Error("MONITOR_CONFIG_INVALID");
  }
  if (
    api.pathname !== "/" ||
    api.search ||
    api.hash ||
    webhook.hash ||
    !/^[a-z][a-z0-9_-]{2,39}$/.test(env.OPS_OWNER_REF ?? "") ||
    !uuid.test(env.OPS_SYNTHETIC_USER_ID ?? "") ||
    !/^[A-Za-z0-9_.-]{20,8192}$/.test(env.OPS_SYNTHETIC_ACCESS_TOKEN ?? "")
  )
    throw new Error("MONITOR_CONFIG_INVALID");
  return {
    apiOrigin: api.origin,
    webhookURL: webhook.href,
    owner: env.OPS_OWNER_REF,
    userId: env.OPS_SYNTHETIC_USER_ID,
    accessToken: env.OPS_SYNTHETIC_ACCESS_TOKEN,
  };
}
async function boundedJson(response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("INVALID_RESPONSE");
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 262144) throw new Error("INVALID_RESPONSE");
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}
export async function probeService(config, fetcher = fetch) {
  const started = performance.now();
  let stage = "health",
    status = 0,
    requestId = null,
    code = "HEALTH_UNAVAILABLE";
  const result = (ok) => ({
    ok,
    stage,
    status,
    requestId,
    code,
    durationMs: Math.max(0, Math.round(performance.now() - started)),
  });
  try {
    const health = await fetcher(new URL("/healthz", config.apiOrigin), {
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    status = health.status;
    const id = health.headers.get("X-Request-ID");
    requestId = uuid.test(id ?? "") ? id : null;
    await health.body?.cancel();
    if (status !== 204 || !requestId) return result(false);
    stage = "api";
    status = 0;
    requestId = null;
    code = "API_UNAVAILABLE";
    const response = await fetcher(new URL("/v1/action", config.apiOrigin), {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(20000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.accessToken}`,
      },
      body: JSON.stringify({ operation: "bootstrap", args: {} }),
    });
    status = response.status;
    const apiId = response.headers.get("X-Request-ID");
    requestId = uuid.test(apiId ?? "") ? apiId : null;
    if (!response.ok) {
      await response.body?.cancel();
      if (status === 401 || status === 403) code = "SYNTHETIC_AUTH_FAILED";
      return result(false);
    }
    code = "SYNTHETIC_RESPONSE_INVALID";
    const data = await boundedJson(response);
    if (
      !requestId ||
      data?.data?.account?.id !== config.userId ||
      data.data.account.status !== "active"
    )
      return result(false);
    code = "OK";
    return result(true);
  } catch {
    return result(false);
  }
}
export function initialMonitorState() {
  return {
    version: 1,
    failures: 0,
    open: false,
    incidentStartedAt: null,
    lastNotifiedAt: null,
    lastRunAt: null,
  };
}
export function validateMonitorState(state) {
  const keys = Object.keys(initialMonitorState());
  if (
    !state ||
    Object.keys(state).length !== keys.length ||
    Object.keys(state).some((key) => !keys.includes(key)) ||
    state.version !== 1 ||
    !Number.isSafeInteger(state.failures) ||
    state.failures < 0 ||
    state.failures > 1000000 ||
    typeof state.open !== "boolean" ||
    [state.incidentStartedAt, state.lastNotifiedAt, state.lastRunAt].some(
      (value) => value !== null && (!Number.isSafeInteger(value) || value < 0),
    ) ||
    (state.open && state.incidentStartedAt === null)
  )
    throw new Error("MONITOR_STATE_INVALID");
  return state;
}
export function advanceMonitor(previous, probe, now = Date.now()) {
  validateMonitorState(previous);
  if (
    !probeCodes.has(probe.code) ||
    typeof probe.ok !== "boolean" ||
    !Number.isSafeInteger(now) ||
    now < 0 ||
    (previous.lastRunAt !== null && now < previous.lastRunAt)
  )
    throw new Error("MONITOR_RESULT_INVALID");
  const state = {
    ...previous,
    lastRunAt: now,
    failures: probe.ok ? 0 : Math.min(1000000, previous.failures + 1),
  };
  let kind = null;
  if (probe.ok) {
    if (state.open) kind = "recovery";
    else {
      state.incidentStartedAt = null;
      state.lastNotifiedAt = null;
    }
  } else {
    state.incidentStartedAt ??= now;
    if (
      state.failures >= 3 &&
      (state.lastNotifiedAt === null || now - state.lastNotifiedAt >= 900000)
    ) {
      state.open = true;
      kind = "alert";
    }
  }
  return { state, kind };
}
export async function notifyMonitor(
  config,
  state,
  kind,
  probe,
  fetcher = fetch,
) {
  if (!["alert", "recovery"].includes(kind) || !probeCodes.has(probe.code))
    throw new Error("MONITOR_RESULT_INVALID");
  const id = `upahgo-${kind}-${state.incidentStartedAt}-${kind === "alert" ? (state.lastNotifiedAt ?? 0) : 0}`;
  const response = await fetcher(config.webhookURL, {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(5000),
    headers: { "Content-Type": "application/json", "Idempotency-Key": id },
    body: JSON.stringify({
      version: 1,
      event: kind,
      ownerRef: config.owner,
      monitor: "api",
      code: probe.code,
      requestId: uuid.test(probe.requestId ?? "") ? probe.requestId : null,
      status: probe.status,
      incidentStartedAt: state.incidentStartedAt,
    }),
  });
  await response.body?.cancel();
  if (!response.ok) throw new Error("ALERT_DELIVERY_FAILED");
  return kind === "recovery"
    ? { ...state, open: false, incidentStartedAt: null, lastNotifiedAt: null }
    : { ...state, lastNotifiedAt: state.lastRunAt };
}
