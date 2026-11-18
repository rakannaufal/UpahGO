import { privacyClient } from "./privacy-client.mjs";
import {
  processDeletion,
  maintainDeletions,
} from "../shared/account-erasure.mjs";

if (process.argv[2] !== "--apply")
  throw new Error(
    "Use --apply only in an approved environment with an approved deletion policy",
  );
try {
  const client = privacyClient();
  const result = await processDeletion(client);
  const maintenance = await maintainDeletions(client);
  console.log(JSON.stringify({ ...result, ...maintenance }));
  if (result.status === "retry_pending") process.exitCode = 1;
} catch (error) {
  console.error(
    error instanceof Error && error.message === "POLICY_NOT_APPROVED"
      ? "POLICY_NOT_APPROVED"
      : "DELETION_RUN_FAILED",
  );
  process.exitCode = 1;
}
