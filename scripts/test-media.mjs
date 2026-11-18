import assert from "node:assert/strict";

export async function testMedia(db) {
  const user = "c1111111-1111-4111-8111-111111111111";
  let checks = 0;
  const check = (actual, expected) => {
    assert.deepEqual(actual, expected);
    checks++;
  };
  const query = async (sql, args = []) => {
    await db.query("savepoint media_call");
    try {
      const r = await db.query(sql, args);
      await db.query("release savepoint media_call");
      return r;
    } catch (error) {
      await db.query("rollback to savepoint media_call");
      throw error;
    }
  };
  const admin = async (action, args = {}, role = "service_role") => {
    await db.query(`set local role ${role}`);
    try {
      return (
        await query("select public.upahgo_media_admin($1,$2) value", [
          action,
          args,
        ])
      ).rows[0].value;
    } finally {
      await db.query("reset role");
    }
  };
  const denied = async (operation, message) => {
    await assert.rejects(operation, new RegExp(message));
    checks++;
  };
  const replace = (key) =>
    query("select public.upahgo_photo_replace($1,'worker',$2) value", [
      user,
      key,
    ]);
  const objects = async (
    key,
    age = "2 hours",
    bucket = "profile-photos",
    both = true,
  ) => {
    for (const suffix of both ? [".jpg", "-thumb.jpg"] : [".jpg"])
      await db.query(
        "insert into storage.objects values($1,$2,now()-$3::interval) on conflict do nothing",
        [bucket, key + suffix, age],
      );
  };
  await db.query("begin");
  try {
    await denied(admin("claim"), "MEDIA_CLEANUP_DISABLED");
    await db.query("savepoint missing_media_config");
    await db.query("delete from upahgo_private.media_cleanup_config");
    await denied(admin("maintain"), "MEDIA_CLEANUP_DISABLED");
    await db.query("rollback to savepoint missing_media_config");
    await denied(
      admin("reserve", { userId: user, role: "worker" }, "authenticated"),
      "permission denied",
    );
    await denied(admin("stats", {}, "anon"), "permission denied");
    check(
      (
        await db.query(
          "select has_table_privilege('authenticated','upahgo_private.media_uploads','select') can_read,has_table_privilege('anon','upahgo_private.media_cleanup_config','update') can_enable",
        )
      ).rows[0],
      { can_read: false, can_enable: false },
    );
    await db.query("insert into auth.users(id) values($1)", [user]);
    await db.query(
      "insert into upahgo_private.accounts(id,role) values($1,'worker')",
      [user],
    );
    await db.query(
      "insert into upahgo_private.profiles(id,name,region,role) values($1,'Synthetic media user','Synthetic area','worker')",
      [user],
    );
    await denied(
      admin("reserve", { userId: user, role: "employer" }),
      "ACCOUNT_RESTRICTED",
    );
    await denied(
      admin("reserve", { userId: user, role: "worker", key: "foreign" }),
      "INVALID_INPUT",
    );
    const first = (await admin("reserve", { userId: user, role: "worker" }))
      .key;
    check(first.startsWith(user + "/worker/"), true);
    await replace(first);
    await replace(first);
    check(
      (
        await db.query(
          "select count(*)::int n from upahgo_private.media_cleanup",
        )
      ).rows[0].n,
      0,
    );
    check(
      (
        await db.query(
          "select count(*)::int n from upahgo_private.media_uploads",
        )
      ).rows[0].n,
      0,
    );
    await objects(first);
    const active = (await admin("reserve", { userId: user, role: "worker" }))
      .key;
    await objects(active);
    await replace(active);
    check(
      (
        await db.query(
          "select status from upahgo_private.media_cleanup where object_key=$1",
          [first],
        )
      ).rows[0].status,
      "pending",
    );
    await db.query(
      "update upahgo_private.media_cleanup_config set enabled=true,approved_by='synthetic-test',approved_at=now()",
    );
    const job = await admin("claim");
    check(job.key, first);
    const args = { key: first, lease: job.lease };
    check(await admin("claim"), null);
    await denied(admin("done", { ...args, lease: user }), "LEASE_EXPIRED");
    await denied(admin("done", args), "STORAGE_STILL_EXISTS");
    // Even a late trusted commit cannot reactivate a key being deleted.
    await db.query(
      "insert into upahgo_private.media_uploads(object_key,user_id,role) values($1,$2,'worker')",
      [first, user],
    );
    await denied(replace(first), "PHOTO_UPLOAD_EXPIRED");
    await admin("fail", { ...args, error: "STORAGE_FAILED" });
    check(
      (
        await db.query(
          "select status,lease is null released,next_attempt_at>now() delayed from upahgo_private.media_cleanup where object_key=$1",
          [first],
        )
      ).rows[0],
      { status: "pending", released: true, delayed: true },
    );
    check(await admin("claim"), null);
    await db.query(
      "update upahgo_private.media_cleanup set next_attempt_at=now() where object_key=$1",
      [first],
    );
    await db.query(
      "delete from upahgo_private.media_uploads where object_key=$1",
      [first],
    );
    const retry = await admin("claim");
    await denied(admin("done", args), "LEASE_EXPIRED");
    await db.query(
      "update upahgo_private.media_cleanup set lease_until=now()-interval '1 second' where object_key=$1",
      [first],
    );
    const recovered = await admin("claim");
    check(recovered.key, first);
    check(recovered.lease !== retry.lease, true);
    await denied(
      admin("done", { key: first, lease: retry.lease }),
      "LEASE_EXPIRED",
    );
    await db.query("delete from storage.objects where name in($1,$2)", [
      first + ".jpg",
      first + "-thumb.jpg",
    ]);
    await admin("done", { key: first, lease: recovered.lease });
    check(
      (
        await db.query(
          "select status from upahgo_private.media_cleanup where object_key=$1",
          [first],
        )
      ).rows[0].status,
      "completed",
    );
    await denied(replace(first), "PHOTO_UPLOAD_EXPIRED");
    // Legacy queue mistakes protect the current image; they never remove it.
    await db.query(
      "insert into upahgo_private.media_cleanup(object_key) values($1)",
      [active],
    );
    check(await admin("claim"), null);
    check((await admin("stats")).protected, 1);
    const expired = (await admin("reserve", { userId: user, role: "worker" }))
      .key;
    await objects(expired, "0 minutes", "profile-photos", false);
    await db.query(
      "update upahgo_private.media_uploads set expires_at=now()-interval '1 minute' where object_key=$1",
      [expired],
    );
    const orphan = user + "/employer/22222222-2222-4222-8222-222222222222";
    const young = user + "/employer/33333333-3333-4333-8333-333333333333";
    const foreign = user + "/worker/44444444-4444-4444-8444-444444444444";
    const inFlight = (await admin("reserve", { userId: user, role: "worker" }))
      .key;
    await objects(orphan, "2 hours", "profile-photos", false);
    await objects(young, "10 minutes");
    await objects(foreign, "2 hours", "another-bucket");
    await objects(inFlight);
    await db.query(
      "insert into storage.objects values('profile-photos','unexpected/private.txt',now()-interval '2 hours')",
    );
    check((await admin("maintain")).queued, 2);
    check(
      (
        await db.query(
          "select object_key from upahgo_private.media_cleanup where status='pending' order by object_key",
        )
      ).rows.map((r) => r.object_key),
      [expired, orphan].sort(),
    );
    check((await admin("maintain")).queued, 0);
    check((await admin("stats")).invalidObjects, true);
    check((await admin("stats")).incompleteProfiles, 0);
    await denied(replace(expired), "PHOTO_UPLOAD_EXPIRED");
    // Key retirement survives completion-record expiry because no reservation remains.
    await db.query(
      "update upahgo_private.media_cleanup set completed_at=now()-interval '31 days' where object_key=$1",
      [first],
    );
    await admin("maintain");
    await denied(replace(first), "PHOTO_UPLOAD_EXPIRED");
    // An apparently completed deletion that reappears from Storage is queued again.
    await objects(first);
    await admin("maintain");
    check(
      (
        await db.query(
          "select status from upahgo_private.media_cleanup where object_key=$1",
          [first],
        )
      ).rows[0].status,
      "pending",
    );
    // Removing an already empty profile stays safe and never schedules its new key.
    await replace(null);
    await replace(null);
    check(
      (
        await db.query(
          "select count(*)::int n from upahgo_private.profile_photos where user_id=$1",
          [user],
        )
      ).rows[0].n,
      0,
    );
    const terminal = await admin("claim");
    await db.query(
      "update upahgo_private.media_cleanup set attempts=12 where object_key=$1",
      [terminal.key],
    );
    await admin("fail", {
      key: terminal.key,
      lease: terminal.lease,
      error: "STORAGE_FAILED",
    });
    check((await admin("stats")).failed, 1);
    // Bounded discovery makes progress on later orphan keys instead of rescanning its first page.
    await db.query(
      "insert into storage.objects select 'profile-photos',$1||'/worker/'||extensions.gen_random_uuid()||'.jpg',now()-interval '2 hours' from generate_series(1,101)",
      [user],
    );
    check((await admin("maintain")).queued, 100);
    check((await admin("maintain")).queued, 1);
    check((await admin("maintain")).queued, 0);
    const reserved = (
      await db.query(
        "select count(*)::int n from upahgo_private.media_uploads where user_id=$1 and expires_at>now()",
        [user],
      )
    ).rows[0].n;
    for (let i = reserved; i < 20; i++)
      await admin("reserve", { userId: user, role: "worker" });
    await denied(
      admin("reserve", { userId: user, role: "worker" }),
      "RATE_LIMITED",
    );
    return checks;
  } finally {
    await db.query("rollback");
  }
}
