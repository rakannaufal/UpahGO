import test from "node:test";
import assert from "node:assert/strict";
import { processDeletion } from "../shared/account-erasure.mjs";
import { DemoApi } from "../apps/mobile/src/demo.ts";

const userId = "11111111-1111-4111-8111-111111111111";
const lease = "22222222-2222-4222-8222-222222222222";
const photo = "33333333-3333-4333-8333-333333333333.jpg";
function fixture(stage = "requested") {
  const files = new Set([
    `${userId}/worker/${photo}`,
    `${userId}/employer/${photo}`,
    `another-user/worker/${photo}`,
  ]);
  const calls: string[] = [];
  const state = {
    stage,
    storageFails: false,
    authFails: false,
    authMissing: false,
    databaseFailsOnce: false,
    claimed: false,
  };
  const client = {
    rpc: async (
      _name: string,
      input: { p_action: string; p_args: Record<string, unknown> },
    ) => {
      calls.push(input.p_action);
      if (input.p_action === "claim") {
        state.claimed = true;
        return { data: { userId, lease, stage: state.stage }, error: null };
      }
      if (input.p_action === "prepare") state.stage = "storage";
      if (input.p_action === "storage_done") state.stage = "auth";
      if (input.p_action === "auth_done") {
        state.stage = "verify";
        state.claimed = false;
        if (state.databaseFailsOnce) {
          state.databaseFailsOnce = false;
          return {
            data: null,
            error: { message: "synthetic uncertain response" },
          };
        }
      }
      if (input.p_action === "fail") {
        if (!state.claimed)
          return { data: null, error: { message: "LEASE_EXPIRED" } };
        assert.ok(
          [
            "AUTH_FAILED",
            "STORAGE_FAILED",
            "DATABASE_FAILED",
            "INVALID_STORAGE_KEY",
          ].includes(String(input.p_args.error)),
        );
      }
      return { data: { ok: true }, error: null };
    },
    storage: {
      from: (bucket: string) => {
        assert.equal(bucket, "profile-photos");
        return {
          list: async (prefix: string) => {
            assert.ok(prefix === userId || prefix.startsWith(`${userId}/`));
            if (state.storageFails)
              return {
                data: null,
                error: { message: "synthetic storage failure" },
              };
            const children = [
              ...new Set(
                [...files]
                  .filter((path) => path.startsWith(prefix + "/"))
                  .map((path) => path.slice(prefix.length + 1).split("/")[0]),
              ),
            ].slice(0, 100);
            return {
              data: children.map((name) => ({
                name,
                id: prefix === userId ? null : "synthetic-object",
              })),
              error: null,
            };
          },
          remove: async (paths: string[]) => {
            paths.forEach((path) => {
              assert.ok(path.startsWith(`${userId}/`));
              files.delete(path);
            });
            return { error: null };
          },
        };
      },
    },
    auth: {
      admin: {
        deleteUser: async (id: string) => {
          assert.equal(id, userId);
          assert.equal(
            [...files].some((path) => path.startsWith(userId + "/")),
            false,
          );
          calls.push("delete_auth");
          return {
            error: state.authFails
              ? { status: 503, code: "unavailable" }
              : state.authMissing
                ? { status: 404, code: "user_not_found" }
                : null,
          };
        },
      },
    },
  };
  return { client, files, calls, state };
}

test("erasure drains both photo roles and orphans before Auth, never another user's bytes", async () => {
  const f = fixture();
  assert.deepEqual(await processDeletion(f.client), {
    status: "verification_pending",
  });
  assert.deepEqual([...f.files], [`another-user/worker/${photo}`]);
  assert.deepEqual(f.calls, [
    "claim",
    "prepare",
    "storage_done",
    "delete_auth",
    "auth_done",
  ]);
  f.files.add(`${userId}/worker/${photo}`);
  assert.deepEqual(await processDeletion(f.client), {
    status: "awaiting_ledger",
  });
  assert.equal(f.files.has(`${userId}/worker/${photo}`), false);
});

test("Storage failure cannot advance to Auth; retry resumes the committed stage", async () => {
  const f = fixture();
  f.state.storageFails = true;
  assert.deepEqual(await processDeletion(f.client), {
    status: "retry_pending",
    error: "STORAGE_FAILED",
  });
  assert.equal(f.calls.includes("delete_auth"), false);
  f.state.storageFails = false;
  f.state.authFails = true;
  assert.deepEqual(await processDeletion(f.client), {
    status: "retry_pending",
    error: "AUTH_FAILED",
  });
  f.state.authFails = false;
  f.state.authMissing = true;
  assert.deepEqual(await processDeletion(f.client), {
    status: "verification_pending",
  });
  assert.equal(f.calls.filter((call) => call === "prepare").length, 1);
});

test("uncertain Auth completion resumes verification without deleting a different account", async () => {
  const f = fixture();
  f.state.databaseFailsOnce = true;
  await assert.rejects(processDeletion(f.client), /DATABASE_FAILED/);
  assert.deepEqual(await processDeletion(f.client), {
    status: "awaiting_ledger",
  });
  assert.equal(f.calls.filter((call) => call === "delete_auth").length, 1);
});

test("unexpected Storage names fail closed; disabled policy and idle queue do no work", async () => {
  const f = fixture("storage");
  f.files.add(`${userId}/worker/../../another-user.jpg`);
  assert.deepEqual(await processDeletion(f.client), {
    status: "retry_pending",
    error: "INVALID_STORAGE_KEY",
  });
  assert.equal(f.calls.includes("delete_auth"), false);
  assert.deepEqual(
    await processDeletion({ rpc: async () => ({ data: null, error: null }) }),
    { status: "idle" },
  );
  await assert.rejects(
    processDeletion({
      rpc: async () => ({
        data: null,
        error: { message: "POLICY_NOT_APPROVED" },
      }),
    }),
    /POLICY_NOT_APPROVED/,
  );
});

test("demo deletion requests are idempotent and never imply physical service deletion", async () => {
  const api = new DemoApi();
  api.actor = "demo-worker";
  assert.deepEqual(await api.call("request_deletion", { confirm: true }), {
    ok: true,
  });
  assert.deepEqual(await api.call("request_deletion", { confirm: true }), {
    ok: true,
  });
  assert.equal(
    (await api.call("bootstrap")).account.status,
    "deletion_requested",
  );
  await assert.rejects(
    api.call("request_deletion", { confirm: false }),
    /CONSENT_REQUIRED/,
  );
});

test("large photo folders yield a lease before Auth and safely drain on the next run", async () => {
  const f = fixture();
  for (let i = 0; i < 401; i++)
    f.files.add(
      `${userId}/worker/33333333-3333-4333-8333-${String(i).padStart(12, "0")}.jpg`,
    );
  assert.deepEqual(await processDeletion(f.client), { status: "pending" });
  assert.equal(f.calls.includes("delete_auth"), false);
  assert.equal(f.calls.at(-1), "defer");
  assert.deepEqual(await processDeletion(f.client), {
    status: "verification_pending",
  });
  assert.deepEqual([...f.files], [`another-user/worker/${photo}`]);
});
