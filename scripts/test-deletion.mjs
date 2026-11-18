import assert from "node:assert/strict";

export async function testDeletion(db, secret) {
  const subject = "b1111111-1111-4111-8111-111111111111";
  const other = "b2222222-2222-4222-8222-222222222222";
  const noProfile = "b3333333-3333-4333-8333-333333333333";
  let checks = 0;
  const check = (actual, expected) => {
    assert.deepEqual(actual, expected);
    checks++;
  };
  const query = async (sql, params = []) => {
    await db.query("savepoint privacy_call");
    try {
      const result = await db.query(sql, params);
      await db.query("release savepoint privacy_call");
      return result;
    } catch (error) {
      await db.query("rollback to savepoint privacy_call");
      throw error;
    }
  };
  const denied = async (sql, params, message) => {
    await assert.rejects(query(sql, params), (error) =>
      error.message.includes(message),
    );
    checks++;
  };
  const admin = async (action, args = {}, role = "service_role") => {
    await db.query(`set local role ${role}`);
    try {
      return (
        await query("select public.upahgo_deletion_admin($1,$2) value", [
          action,
          args,
        ])
      ).rows[0].value;
    } finally {
      await db.query("reset role");
    }
  };
  const call = async (id, operation, args = {}) => {
    await db.query(
      "select set_config('request.jwt.claim.sub',$1,true),set_config('request.headers',$2,true)",
      [id, JSON.stringify({ "x-upahgo-gateway": secret })],
    );
    await db.query("set local role authenticated");
    try {
      return (
        await query("select public.upahgo_action($1,$2) value", [
          operation,
          args,
        ])
      ).rows[0].value;
    } finally {
      await db.query("reset role");
    }
  };
  const request = (id) => call(id, "request_deletion", { confirm: true });
  await db.query("begin");
  try {
    // This is deliberately the first assertion: it fails when the finalizer does not exist.
    await assert.rejects(admin("claim"), /POLICY_NOT_APPROVED/);
    checks++;
    for (const id of [subject, other, noProfile]) {
      await db.query(
        "insert into auth.users(id,phone,phone_confirmed_at) values($1,'6281234567890',now())",
        [id],
      );
      await db.query(
        "insert into upahgo_private.accounts(id,role) values($1,'worker')",
        [id],
      );
      if (id !== noProfile)
        await db.query(
          "insert into upahgo_private.profiles(id,name,region,role,tags,bio) values($1,'Synthetic identity','Synthetic region','worker',array['sweep'],'Private biography')",
          [id],
        );
    }
    const contact = (
      await db.query(
        "insert into upahgo_private.contacts(sender_id,receiver_id,sender_role,receiver_role,status,sender_phone_hash) values($1,$2,'worker','employer','accepted',decode('01','hex')) returning id",
        [subject, other],
      )
    ).rows[0].id;
    check((await call(subject, "bootstrap")).deletionPolicy, {
      enabled: false,
      version: "draft-2026-11",
      workDays: 365,
      reportDays: 180,
      backupDays: 30,
    });
    await assert.rejects(
      call(subject, "request_deletion", { confirm: true, userId: other }),
      /INVALID_INPUT/,
    );
    checks++;
    const agreement = (
      await db.query(
        "insert into upahgo_private.agreements(contact_id,creator_id,worker_id,employer_id,title,tasks,wage,starts_at,timezone,status,payment_received_at) values($1,$2,$2,$3,'Synthetic private title','Synthetic private instructions',120000,now(),'Asia/Jakarta','completed',now()) returning id",
        [contact, subject, other],
      )
    ).rows[0].id;
    await db.query(
      'insert into upahgo_private.agreement_details values($1,\'{"tools":"Private details"}\')',
      [agreement],
    );
    await db.query(
      "insert into upahgo_private.reviews(agreement_id,reviewer_id,target_id,target_role,score,comment) values($1,$2,$3,'employer',5,'Synthetic retained comment')",
      [agreement, subject, other],
    );
    await db.query(
      "insert into upahgo_private.reports(reporter_id,target_id,category,detail) values($1,$2,'other','Synthetic report evidence')",
      [other, subject],
    );
    await db.query(
      "insert into upahgo_private.role_profiles(user_id,role,tags,bio) select $1,x,array['sweep'],'Private role biography' from unnest(array['worker','employer']) x",
      [subject],
    );
    await db.query(
      "insert into upahgo_private.profile_prices values($1,'worker',100000,true),($1,'employer',200000,false)",
      [subject],
    );
    await db.query(
      "insert into upahgo_private.profile_photos(user_id,role,object_key) select $1::uuid,x,$1::text||'/'||x||'/11111111-1111-4111-8111-111111111111' from unnest(array['worker','employer']) x",
      [subject],
    );
    await db.query(
      "insert into upahgo_private.job_suggestions(user_id,title,detail) values($1,'Private suggestion','Synthetic private suggestion')",
      [subject],
    );
    await db.query("insert into upahgo_private.blocks values($1,$2,now())", [
      other,
      subject,
    ]);
    await db.query(
      "insert into upahgo_private.notifications(recipient_id,title,body,route) values($1,'Private notice','Test','/')",
      [subject],
    );
    await assert.rejects(
      admin("claim", {}, "authenticated"),
      /permission denied/,
    );
    checks++;
    await assert.rejects(admin("claim", {}, "anon"), /permission denied/);
    checks++;
    await denied(
      "delete from auth.users where id=$1",
      [subject],
      "DELETION_NOT_PREPARED",
    );
    check(await request(subject), { ok: true });
    check(await request(subject), { ok: true });
    check((await admin("ledger")).length, 1);
    await assert.rejects(
      admin("claim", { userId: other }),
      /POLICY_NOT_APPROVED/,
    );
    checks++;
    check(
      (
        await db.query(
          "select count(*)::int n from upahgo_private.deletion_requests where user_id=$1",
          [subject],
        )
      ).rows[0].n,
      1,
    );
    await db.query(
      "update upahgo_private.deletion_policy set enabled=true,approved_by='synthetic-test',approved_at=now()",
    );
    const job = await admin("claim");
    check(job.userId, subject);
    check(await admin("claim"), null);
    const args = { userId: subject, lease: job.lease };
    await assert.rejects(
      admin("prepare", { ...args, lease: other }),
      /LEASE_EXPIRED/,
    );
    checks++;
    await admin("prepare", args);
    await admin("prepare", args);
    const erased = (
      await db.query(
        "select erased_profile_id id from upahgo_private.deletion_requests where user_id=$1",
        [subject],
      )
    ).rows[0].id;
    check(
      (
        await db.query(
          "select name,auth_user_id from upahgo_private.profiles where id=$1",
          [erased],
        )
      ).rows[0],
      { name: "Akun dihapus", auth_user_id: null },
    );
    check(
      (
        await db.query(
          "select count(*)::int n from upahgo_private.profiles where id=$1",
          [subject],
        )
      ).rows[0].n,
      0,
    );
    check(
      (
        await db.query("select name from upahgo_private.profiles where id=$1", [
          other,
        ])
      ).rows[0].name,
      "Synthetic identity",
    );
    for (const table of [
      "role_profiles",
      "profile_prices",
      "profile_photos",
      "job_suggestions",
      "account_locations",
    ])
      check(
        (
          await db.query(
            `select count(*)::int n from upahgo_private.${table} where user_id=$1`,
            [subject],
          )
        ).rows[0].n,
        0,
      );
    check(
      (
        await db.query(
          "select wage,status,worker_id,employer_id,payment_received_at is not null paid from upahgo_private.agreements where id=$1",
          [agreement],
        )
      ).rows[0],
      {
        wage: 120000,
        status: "completed",
        worker_id: erased,
        employer_id: other,
        paid: true,
      },
    );
    check(
      (
        await db.query(
          "select sender_id,status,octet_length(sender_phone_hash) hash_bytes from upahgo_private.contacts where id=$1",
          [contact],
        )
      ).rows[0],
      { sender_id: erased, status: "revoked", hash_bytes: 0 },
    );
    const counterpartHistory = await call(other, "agreement", {
      id: agreement,
    });
    check(
      [
        counterpartHistory.workerName,
        counterpartHistory.employerName,
        counterpartHistory.wage,
      ],
      ["Akun dihapus", "Synthetic identity", 120000],
    );
    await assert.rejects(admin("auth_done", args), /STATE_CONFLICT/);
    checks++;
    await admin("storage_done", args);
    await assert.rejects(admin("auth_done", args), /AUTH_STILL_EXISTS/);
    checks++;
    await db.query("delete from auth.users where id=$1", [subject]);
    await admin("auth_done", args);
    check(await admin("claim"), null);
    await db.query(
      "update upahgo_private.deletion_requests set next_attempt_at=now() where user_id=$1",
      [subject],
    );
    const verification = await admin("claim");
    await admin("verify_done", { userId: subject, lease: verification.lease });
    const ledger = await admin("ledger");
    check(ledger.length, 1);
    await admin("ack_ledger", { userIds: [subject] });
    check(
      (
        await db.query(
          "select status from upahgo_private.deletion_requests where user_id=$1",
          [subject],
        )
      ).rows[0].status,
      "completed",
    );
    check(await admin("maintain"), { purged: 0 });
    await db.query(
      "update upahgo_private.deletion_retention set expires_at=now()-interval '1 day'",
    );
    await db.query(
      "update upahgo_private.deletion_retention set hold_until=now()+interval '1 day',hold_case='TEST-HOLD' where kind='report'",
    );
    check(await admin("maintain"), { purged: 2 });
    check(
      (
        await db.query(
          "select detail from upahgo_private.reports where target_id=$1",
          [erased],
        )
      ).rows[0].detail,
      "Synthetic report evidence",
    );
    check(
      (
        await db.query(
          "select tasks,wage from upahgo_private.agreements where id=$1",
          [agreement],
        )
      ).rows[0],
      { tasks: "Rincian dihapus sesuai masa retensi.", wage: 120000 },
    );
    await db.query(
      "update upahgo_private.deletion_retention set hold_until=now()-interval '1 hour'",
    );
    check(await admin("maintain"), { purged: 1 });
    // Later evidence about an erased participant receives its own retention deadline.
    await db.query(
      "insert into upahgo_private.reviews(agreement_id,reviewer_id,target_id,target_role,score,comment) values($1,$2,$3,'worker',4,'Later synthetic evidence')",
      [agreement, other, erased],
    );
    await db.query(
      "insert into upahgo_private.reports(reporter_id,target_id,category,detail) values($1,$2,'other','Later synthetic report')",
      [other, erased],
    );
    check(
      (
        await db.query(
          "select count(*)::int n from upahgo_private.deletion_retention",
        )
      ).rows[0].n,
      2,
    );
    await request(other);
    const otherJob = await admin("claim");
    check(otherJob.userId, other);
    await admin("prepare", { userId: other, lease: otherJob.lease });
    await db.query(
      "update upahgo_private.deletion_retention set expires_at=now()-interval '1 day',hold_until=case when kind='review' then now()+interval '1 day' end,hold_case=case when kind='review' then 'TEST-REVIEW' end",
    );
    await admin("maintain");
    check(
      (
        await db.query(
          "select count(*)::int n from upahgo_private.agreements where id=$1",
          [agreement],
        )
      ).rows[0].n,
      1,
    );
    await db.query(
      "update upahgo_private.deletion_retention set hold_until=null",
    );
    await admin("maintain");
    check(
      (
        await db.query(
          "select count(*)::int n from upahgo_private.agreements where id=$1",
          [agreement],
        )
      ).rows[0].n,
      0,
    );
    check(
      (
        await db.query(
          "select count(*)::int n from upahgo_private.contacts where id=$1",
          [contact],
        )
      ).rows[0].n,
      0,
    );
    // Replay the newer ledger against a restored account before reopening traffic.
    await db.query("insert into auth.users(id) values($1)", [subject]);
    await db.query(
      "insert into upahgo_private.accounts(id,role) values($1,'worker')",
      [subject],
    );
    await db.query(
      "insert into upahgo_private.profiles(id,name,region,role) values($1,'Restored identity','Synthetic region','worker')",
      [subject],
    );
    await admin("replay", { userIds: ledger.map((item) => item.userId) });
    check(
      (
        await db.query(
          "select status from upahgo_private.accounts where id=$1",
          [subject],
        )
      ).rows[0].status,
      "deletion_requested",
    );
    check((await admin("claim")).stage, "requested");
    check(await request(noProfile), { ok: true });
    const emptyJob = await admin("claim");
    check(emptyJob.userId, noProfile);
    await admin("prepare", { userId: noProfile, lease: emptyJob.lease });
    check(
      (
        await db.query(
          "select status from upahgo_private.deletion_requests where user_id=$1",
          [noProfile],
        )
      ).rows[0].status,
      "storage",
    );
    const emptyArgs = { userId: noProfile, lease: emptyJob.lease };
    await admin("fail", { ...emptyArgs, error: "STORAGE_FAILED" });
    check(
      (
        await db.query(
          "select lease is null released,next_attempt_at>now() delayed,status from upahgo_private.deletion_requests where user_id=$1",
          [noProfile],
        )
      ).rows[0],
      { released: true, delayed: true, status: "storage" },
    );
    await db.query(
      "update upahgo_private.deletion_requests set next_attempt_at=now() where user_id=$1",
      [noProfile],
    );
    const retry = await admin("claim");
    await assert.rejects(admin("storage_done", emptyArgs), /LEASE_EXPIRED/);
    checks++;
    let retryArgs = { userId: noProfile, lease: retry.lease };
    await db.query(
      "update upahgo_private.deletion_requests set attempts=12 where user_id=$1",
      [noProfile],
    );
    await admin("fail", { ...retryArgs, error: "AUTH_FAILED" });
    check(
      (
        await db.query(
          "select status from upahgo_private.deletion_requests where user_id=$1",
          [noProfile],
        )
      ).rows[0].status,
      "failed",
    );
    check(await admin("claim"), null);
    // Operator recovery must explicitly select the last committed stage.
    await db.query(
      "update upahgo_private.deletion_requests set status='storage',attempts=0,next_attempt_at=now() where user_id=$1",
      [noProfile],
    );
    const recovered = await admin("claim");
    retryArgs = { userId: noProfile, lease: recovered.lease };
    await admin("storage_done", retryArgs);
    await db.query("delete from auth.users where id=$1", [noProfile]);
    await admin("auth_done", retryArgs);
    check(
      (
        await db.query("select count(*)::int n from auth.users where id=$1", [
          noProfile,
        ])
      ).rows[0].n,
      0,
    );
    await admin("replay", { userIds: [noProfile] });
    check(
      (
        await db.query(
          "select status from upahgo_private.deletion_requests where user_id=$1",
          [noProfile],
        )
      ).rows[0].status,
      "requested",
    );
    return checks;
  } finally {
    await db.query("rollback");
  }
}
