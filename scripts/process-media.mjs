import { privacyClient } from "./privacy-client.mjs";
import { processMediaCleanup } from "../shared/media-cleanup.mjs";
try {
  if (process.argv[2] !== "--apply") throw new Error("APPLY_REQUIRED");
  const result = await processMediaCleanup(privacyClient());
  console.log(JSON.stringify(result));
  if (
    result.status === "retry_pending" ||
    result.failed > 0 ||
    result.overdue > 0 ||
    result.protected > 0 ||
    result.invalidObjects ||
    result.incompleteProfiles > 0
  )
    process.exitCode = 1;
} catch (error) {
  console.error(
    error instanceof Error &&
      ["APPLY_REQUIRED", "MEDIA_CLEANUP_DISABLED"].includes(error.message)
      ? error.message
      : "MEDIA_CLEANUP_FAILED",
  );
  process.exitCode = 1;
}
