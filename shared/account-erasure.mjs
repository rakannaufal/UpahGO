const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const photoName =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(-thumb)?\.jpg$/i;

async function rpc(client, action, args = {}) {
  const { data, error } = await client.rpc("upahgo_deletion_admin", {
    p_action: action,
    p_args: args,
  });
  if (error)
    throw new Error(
      error.message === "POLICY_NOT_APPROVED"
        ? "POLICY_NOT_APPROVED"
        : "DATABASE_FAILED",
    );
  return data;
}

async function purgePhotos(client, userId) {
  const storage = client.storage.from("profile-photos");
  const list = async (path) => {
    const { data, error } = await storage.list(path, {
      limit: 100,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });
    if (error || !Array.isArray(data)) throw new Error("STORAGE_FAILED");
    return data;
  };
  const folders = await list(userId);
  if (
    folders.some(
      (file) => !["worker", "employer"].includes(file.name) || file.id,
    )
  )
    throw new Error("INVALID_STORAGE_KEY");
  for (const role of ["worker", "employer"]) {
    for (let batch = 0; batch < 4; batch++) {
      const files = await list(`${userId}/${role}`);
      if (!files.length) break;
      if (files.some((file) => !photoName.test(file.name)))
        throw new Error("INVALID_STORAGE_KEY");
      const { error } = await storage.remove(
        files.map((file) => `${userId}/${role}/${file.name}`),
      );
      if (error) throw new Error("STORAGE_FAILED");
    }
    if ((await list(`${userId}/${role}`)).length) return false;
  }
  return !(await list(userId)).length;
}

export async function processDeletion(client) {
  const job = await rpc(client, "claim");
  if (!job) return { status: "idle" };
  if (!uuid.test(job.userId) || !uuid.test(job.lease))
    throw new Error("DATABASE_FAILED");
  const args = { userId: job.userId, lease: job.lease };
  let stage = job.stage;
  try {
    if (stage === "requested") {
      await rpc(client, "prepare", args);
      stage = "storage";
    }
    if (stage === "storage" || stage === "verify") {
      if (!(await purgePhotos(client, job.userId))) {
        await rpc(client, "defer", args);
        return { status: "pending" };
      }
      if (stage === "verify") {
        await rpc(client, "verify_done", args);
        return { status: "awaiting_ledger" };
      }
      await rpc(client, "storage_done", args);
      stage = "auth";
    }
    if (stage !== "auth") throw new Error("DATABASE_FAILED");
    const { error } = await client.auth.admin.deleteUser(job.userId);
    if (error && !(error.status === 404 && error.code === "user_not_found"))
      throw new Error("AUTH_FAILED");
    // SQL independently checks Auth absence before recording this transition.
    await rpc(client, "auth_done", args);
    return { status: "verification_pending" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const code = [
      "STORAGE_FAILED",
      "AUTH_FAILED",
      "INVALID_STORAGE_KEY",
    ].includes(message)
      ? message
      : "DATABASE_FAILED";
    await rpc(client, "fail", { ...args, error: code });
    return { status: "retry_pending", error: code };
  }
}

export async function maintainDeletions(client) {
  return rpc(client, "maintain");
}
