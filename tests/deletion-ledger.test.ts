import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  readFile,
  stat,
  chmod,
  writeFile,
  symlink,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runLedger } from "../scripts/deletion-ledger.mjs";

const entries = Array.from({ length: 1001 }, (_, i) => ({
  userId: `11111111-1111-4111-8111-${String(i).padStart(12, "0")}`,
  requestedAt: "2026-11-18T00:00:00Z",
  policyVersion: "synthetic",
}));

test("ledger saves a private complete snapshot before acknowledging; replay is bounded", async () => {
  const directory = await mkdtemp(join(tmpdir(), "upahgo-ledger-test-"));
  const path = join(directory, "privacy-ledger-test.json");
  const acknowledgements: string[] = [];
  const replays: string[] = [];
  const client = {
    rpc: async (
      _: string,
      input: {
        p_action: string;
        p_args: { afterUserId?: string; userIds?: string[] };
      },
    ) => {
      if (input.p_action === "ledger")
        return {
          data: input.p_args.afterUserId
            ? entries.slice(1000)
            : entries.slice(0, 1000),
          error: null,
        };
      assert.ok(input.p_args.userIds!.length <= 100);
      if (input.p_action === "ack_ledger") {
        const saved = JSON.parse(await readFile(path, "utf8"));
        assert.deepEqual(saved.entries, entries);
        assert.equal((await stat(path)).mode & 0o777, 0o600);
        acknowledgements.push(...input.p_args.userIds!);
      } else replays.push(...input.p_args.userIds!);
      return { data: { ok: true }, error: null };
    },
  };
  try {
    assert.deepEqual(await runLedger(client, "export", path), {
      status: "exported",
      records: 1001,
    });
    assert.deepEqual(
      acknowledgements,
      entries.map((item) => item.userId),
    );
    await assert.rejects(runLedger(client, "export", path), /EEXIST/);
    assert.equal(acknowledgements.length, 1001);
    assert.deepEqual(await runLedger(client, "replay", path), {
      status: "requeued",
      records: 1001,
    });
    assert.deepEqual(replays, acknowledgements);
    await chmod(path, 0o644);
    await assert.rejects(
      runLedger(client, "replay", path),
      /LEDGER_FILE_UNSAFE/,
    );
    await chmod(path, 0o600);
    await writeFile(
      path,
      JSON.stringify({ format: 1, entries: [{ userId: "../foreign" }] }),
    );
    await assert.rejects(
      runLedger(client, "replay", path),
      /LEDGER_FORMAT_INVALID/,
    );
    const link = join(directory, "link.json");
    await symlink(path, link);
    await assert.rejects(runLedger(client, "replay", link));
    assert.equal(replays.length, 1001);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("ledger never acknowledges a failed write or an invalid export cursor", async () => {
  let acknowledgements = 0;
  const client = {
    rpc: async (_: string, input: { p_action: string }) => {
      if (input.p_action === "ledger")
        return { data: entries.slice(0, 1000), error: null };
      acknowledgements++;
      return { data: { ok: true }, error: null };
    },
  };
  await assert.rejects(
    runLedger(
      client,
      "export",
      "/missing-upahgo-test-directory/privacy-ledger.json",
    ),
    /LEDGER_CURSOR_INVALID/,
  );
  client.rpc = async (_: string, input: { p_action: string }) => {
    if (input.p_action === "ledger")
      return { data: entries.slice(0, 1), error: null };
    acknowledgements++;
    return { data: { ok: true }, error: null };
  };
  await assert.rejects(
    runLedger(
      client,
      "export",
      "/missing-upahgo-test-directory/privacy-ledger.json",
    ),
    /ENOENT/,
  );
  assert.equal(acknowledgements, 0);
});
