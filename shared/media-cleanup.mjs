export const mediaKeyPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/(worker|employer)\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
async function rpc(client, action, args = {}) {
  const { data, error } = await client.rpc("upahgo_media_admin", {
    p_action: action,
    p_args: args,
  });
  if (error)
    throw new Error(
      error.message === "MEDIA_CLEANUP_DISABLED"
        ? "MEDIA_CLEANUP_DISABLED"
        : "DATABASE_FAILED",
    );
  return data;
}
export async function processMediaCleanup(client) {
  await rpc(client, "maintain");
  const job = await rpc(client, "claim");
  let status = "idle";
  if (job) {
    if (!mediaKeyPattern.test(job.key) || !/^[0-9a-f-]{36}$/.test(job.lease))
      throw new Error("DATABASE_FAILED");
    const args = { key: job.key, lease: job.lease };
    try {
      const { error } = await client.storage
        .from("profile-photos")
        .remove([job.key + ".jpg", job.key + "-thumb.jpg"]);
      if (error) throw new Error("STORAGE_FAILED");
      await rpc(client, "done", args);
      status = "completed";
    } catch (error) {
      const code =
        error instanceof Error && error.message === "STORAGE_FAILED"
          ? "STORAGE_FAILED"
          : "DATABASE_FAILED";
      await rpc(client, "fail", { ...args, error: code });
      status = "retry_pending";
    }
  }
  return { status, ...(await rpc(client, "stats")) };
}
