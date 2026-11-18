import { open } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";
import { privacyClient } from "./privacy-client.mjs";

export async function runLedger(client, mode, path) {
  if (!["export", "replay"].includes(mode) || !isAbsolute(path))
    throw new Error("LEDGER_ARGUMENTS_INVALID");
  const rpc = async (action, args = {}) => {
    const { data, error } = await client.rpc("upahgo_deletion_admin", {
      p_action: action,
      p_args: args,
    });
    if (error) throw new Error("LEDGER_OPERATION_FAILED");
    return data;
  };
  const validate = (entries) => {
    if (
      !Array.isArray(entries) ||
      entries.length > 100000 ||
      entries.some(
        (item) =>
          !item ||
          typeof item.userId !== "string" ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            item.userId,
          ),
      )
    )
      throw new Error("LEDGER_FORMAT_INVALID");
  };
  let entries;
  if (mode === "export") {
    entries = [];
    let afterUserId;
    while (true) {
      const page = await rpc("ledger", afterUserId ? { afterUserId } : {});
      if (!Array.isArray(page) || entries.length + page.length > 100000)
        throw new Error("LEDGER_TOO_LARGE");
      entries.push(...page);
      if (page.length < 1000) break;
      const next = page.at(-1)?.userId;
      if (!next || next === afterUserId)
        throw new Error("LEDGER_CURSOR_INVALID");
      afterUserId = next;
    }
    validate(entries);
    const file = await open(path, "wx", 0o600);
    try {
      await file.writeFile(
        JSON.stringify({
          format: 1,
          generatedAt: new Date().toISOString(),
          entries,
        }) + "\n",
      );
      await file.sync();
    } finally {
      await file.close();
    }
    const directory = await open(dirname(path), "r");
    try {
      await directory.sync();
    } finally {
      await directory.close();
    }
  } else {
    const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    let document;
    try {
      const info = await file.stat();
      if (
        !info.isFile() ||
        (info.mode & 0o077) !== 0 ||
        info.size > 32 * 1024 * 1024
      )
        throw new Error("LEDGER_FILE_UNSAFE");
      document = JSON.parse(await file.readFile("utf8"));
    } finally {
      await file.close();
    }
    if (
      document.format !== 1 ||
      !Array.isArray(document.entries) ||
      document.entries.length > 100000
    )
      throw new Error("LEDGER_FORMAT_INVALID");
    entries = document.entries;
    validate(entries);
  }
  for (let i = 0; i < entries.length; i += 100)
    await rpc(mode === "export" ? "ack_ledger" : "replay", {
      userIds: entries.slice(i, i + 100).map((item) => item.userId),
    });
  return {
    status: mode === "export" ? "exported" : "requeued",
    records: entries.length,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const [mode, path, flag] = process.argv.slice(2);
    if (flag !== "--apply") throw new Error("APPLY_REQUIRED");
    console.log(JSON.stringify(await runLedger(privacyClient(), mode, path)));
  } catch {
    console.error(
      "LEDGER_OPERATION_FAILED: verify arguments, access, approved policy and private durable path; keep restored traffic closed",
    );
    process.exitCode = 1;
  }
}
