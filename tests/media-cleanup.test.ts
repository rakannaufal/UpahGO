import test from "node:test";
import assert from "node:assert/strict";
import { processMediaCleanup } from "../shared/media-cleanup.mjs";

const key =
  "11111111-1111-4111-8111-111111111111/worker/22222222-2222-4222-8222-222222222222";
const lease = "33333333-3333-4333-8333-333333333333";
function fixture() {
  const files = new Set([
    key + ".jpg",
    key + "-thumb.jpg",
    "foreign/active.jpg",
  ]);
  const calls: string[] = [];
  const state = {
    stage: "pending",
    failStorage: false,
    uncertain: false,
    catalogLag: false,
  };
  const client = {
    rpc: async (
      _: string,
      {
        p_action,
        p_args,
      }: { p_action: string; p_args: Record<string, unknown> },
    ) => {
      calls.push(p_action);
      if (p_action === "claim")
        return {
          data: state.stage === "completed" ? null : { key, lease },
          error: null,
        };
      if (p_action === "done") {
        assert.equal(
          [...files].some((file) => file.startsWith(key)),
          false,
        );
        if (state.catalogLag)
          return { data: null, error: { message: "STORAGE_STILL_EXISTS" } };
        state.stage = "completed";
        if (state.uncertain)
          return {
            data: null,
            error: { message: "synthetic lost completion" },
          };
      }
      if (p_action === "fail") {
        assert.ok(
          ["STORAGE_FAILED", "DATABASE_FAILED"].includes(String(p_args.error)),
        );
        if (state.stage === "completed")
          return { data: null, error: { message: "LEASE_EXPIRED" } };
      }
      return {
        data:
          p_action === "stats"
            ? {
                enabled: true,
                failed: 0,
                pending: state.stage === "completed" ? 0 : 1,
                overdue: 0,
                protected: 0,
                invalidObjects: false,
                incompleteProfiles: 0,
              }
            : { ok: true },
        error: null,
      };
    },
    storage: {
      from: (bucket: string) => {
        assert.equal(bucket, "profile-photos");
        return {
          remove: async (paths: string[]) => {
            calls.push("remove");
            assert.deepEqual(paths, [key + ".jpg", key + "-thumb.jpg"]);
            if (state.failStorage)
              return { error: { message: "synthetic sensitive failure" } };
            paths.forEach((path) => files.delete(path));
            return { error: null };
          },
        };
      },
    },
  };
  return { client, state, files, calls };
}
test("media consumer removes only its retired pair, drains idempotently and reports safe counts", async () => {
  const f = fixture();
  checkStatus(await processMediaCleanup(f.client), "completed");
  assert.deepEqual([...f.files], ["foreign/active.jpg"]);
  checkStatus(await processMediaCleanup(f.client), "idle");
  assert.equal(f.calls.filter((call) => call === "remove").length, 1);
});
test("Storage and catalog errors remain retryable; success is never reported early", async () => {
  const f = fixture();
  f.state.failStorage = true;
  checkStatus(await processMediaCleanup(f.client), "retry_pending");
  assert.equal(f.calls.includes("done"), false);
  f.state.failStorage = false;
  f.state.catalogLag = true;
  checkStatus(await processMediaCleanup(f.client), "retry_pending");
  f.state.catalogLag = false;
  checkStatus(await processMediaCleanup(f.client), "completed");
});
test("a lost completion response is safe to retry without deleting the active/foreign image", async () => {
  const f = fixture();
  f.state.uncertain = true;
  await assert.rejects(processMediaCleanup(f.client), /DATABASE_FAILED/);
  checkStatus(await processMediaCleanup(f.client), "idle");
  assert.deepEqual([...f.files], ["foreign/active.jpg"]);
});
test("disabled cleanup and malformed claims never reach Storage", async () => {
  const f = fixture();
  await assert.rejects(
    processMediaCleanup({
      ...f.client,
      rpc: async () => ({
        data: null,
        error: { message: "MEDIA_CLEANUP_DISABLED" },
      }),
    }),
    /MEDIA_CLEANUP_DISABLED/,
  );
  await assert.rejects(
    processMediaCleanup({
      ...f.client,
      rpc: async () => ({ data: { key: "../active", lease }, error: null }),
    }),
    /DATABASE_FAILED/,
  );
  assert.equal(f.calls.includes("remove"), false);
});
function checkStatus(result: { status: string }, expected: string) {
  assert.equal(result.status, expected);
}
