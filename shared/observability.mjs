import { operations, errors } from "./worker-contract.mjs";

const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const codes = new Set([
  ...errors,
  "INVALID_INPUT",
  "BODY_TOO_LARGE",
  "INTERNAL_ERROR",
  "NOT_FOUND",
  "METHOD_NOT_ALLOWED",
]);
const dependencies = new Set([
  "auth",
  "database",
  "limiter",
  "photo",
  "storage",
]);
const routes = new Set(["action", "photo", "health", "preflight", "not_found"]);
const operationNames = new Set([
  ...operations,
  "photo_get",
  "photo_post",
  "photo_delete",
]);

export function createTelemetry({
  service,
  environment,
  enabled,
  route,
  method,
  sink = console.log,
}) {
  let requestId = crypto.randomUUID();
  const started = performance.now();
  let operation = "unknown";
  let code = null;
  const common = {
    version: 1,
    service: service === "photo" ? "photo" : "gateway",
    environment: ["development", "staging", "production"].includes(environment)
      ? environment
      : "unknown",
    route: routes.has(route) ? route : "not_found",
    method: ["GET", "POST", "DELETE", "OPTIONS"].includes(method)
      ? method
      : "other",
  };
  const elapsed = (start) =>
    Math.max(0, Math.min(120000, Math.round(performance.now() - start)));
  const emit = (event) => {
    if (!enabled) return;
    // Construct events from scalar allowlists; never serialize a Request, Error, body or URL.
    try {
      sink(
        JSON.stringify({
          ...common,
          timestamp: new Date().toISOString(),
          requestId,
          operation,
          ...event,
        }),
      );
    } catch {
      /* Telemetry failure must not replay or fail a business mutation. */
    }
  };
  return {
    get requestId() {
      return requestId;
    },
    trustGatewayId(value) {
      if (uuid.test(value ?? "")) requestId = value;
    },
    operation(value) {
      operation = operationNames.has(value) ? value : "unknown";
    },
    error(value) {
      code = codes.has(value) ? value : "INTERNAL_ERROR";
    },
    finish(status) {
      emit({ kind: "request", status, code, durationMs: elapsed(started) });
    },
    async fetch(dependency, input, options, fetcher = fetch) {
      const name = dependencies.has(dependency) ? dependency : "database";
      const begin = performance.now();
      try {
        const response = await fetcher(input, options);
        emit({
          kind: "dependency",
          dependency: name,
          status: response.status,
          outcome: response.ok
            ? "ok"
            : response.status === 429
              ? "limited"
              : [401, 403].includes(response.status)
                ? "denied"
                : "error",
          durationMs: elapsed(begin),
        });
        return response;
      } catch (error) {
        emit({
          kind: "dependency",
          dependency: name,
          status: 0,
          outcome:
            error?.name === "TimeoutError" || error?.name === "AbortError"
              ? "timeout"
              : "error",
          durationMs: elapsed(begin),
        });
        throw error;
      }
    },
  };
}
