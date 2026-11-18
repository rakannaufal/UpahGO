import { open, rename, unlink, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";
import {
  monitorConfig,
  initialMonitorState,
  validateMonitorState,
  probeService,
  advanceMonitor,
  notifyMonitor,
} from "../shared/operations-monitor.mjs";

export async function runMonitor(env, statePath, fetcher = fetch) {
  const config = monitorConfig(env);
  if (!isAbsolute(statePath)) throw new Error("MONITOR_STATE_INVALID");
  const directoryInfo = await stat(dirname(statePath));
  if (!directoryInfo.isDirectory() || (directoryInfo.mode & 0o077) !== 0)
    throw new Error("MONITOR_STATE_INVALID");
  // A single host owns this private state directory. A crash lock needs operator review.
  const lock = await open(statePath + ".lock", "wx", 0o600);
  const save = async (state) => {
    const temporary = statePath + "." + crypto.randomUUID() + ".tmp";
    const file = await open(temporary, "wx", 0o600);
    try {
      await file.writeFile(JSON.stringify(state) + "\n");
      await file.sync();
    } finally {
      await file.close();
    }
    await rename(temporary, statePath);
    const directory = await open(dirname(statePath), "r");
    try {
      await directory.sync();
    } finally {
      await directory.close();
    }
  };
  try {
    let state;
    try {
      const file = await open(
        statePath,
        constants.O_RDONLY | constants.O_NOFOLLOW,
      );
      try {
        const info = await file.stat();
        if (!info.isFile() || (info.mode & 0o077) !== 0 || info.size > 4096)
          throw new Error("MONITOR_STATE_INVALID");
        state = validateMonitorState(JSON.parse(await file.readFile("utf8")));
      } finally {
        await file.close();
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      state = initialMonitorState();
    }
    const probe = await probeService(config, fetcher);
    const next = advanceMonitor(state, probe);
    state = next.state;
    // Save before sending: a lost webhook acknowledgement retries the same idempotency key.
    await save(state);
    let notification = "none";
    if (next.kind) {
      try {
        state = await notifyMonitor(config, state, next.kind, probe, fetcher);
        await save(state);
        notification = "sent";
      } catch {
        notification = "failed";
      }
    }
    return { ...probe, failures: state.failures, notification };
  } finally {
    await lock.close();
    await unlink(statePath + ".lock");
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    if (process.argv.length !== 4 || process.argv[3] !== "--apply")
      throw new Error("APPLY_REQUIRED");
    const result = await runMonitor(process.env, process.argv[2]);
    console.log(JSON.stringify(result));
    if (!result.ok || result.notification === "failed") process.exitCode = 1;
  } catch (error) {
    const code = [
      "APPLY_REQUIRED",
      "MONITOR_CONFIG_INVALID",
      "MONITOR_STATE_INVALID",
      "MONITOR_RESULT_INVALID",
    ].includes(error.message)
      ? error.message
      : error.code === "EEXIST"
        ? "MONITOR_LOCKED"
        : "OPS_MONITOR_FAILED";
    console.error(code);
    process.exitCode = 1;
  }
}
