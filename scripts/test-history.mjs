import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

export async function testHistory(db, secret) {
  let checks = 0;
  const employer = "a1111111-1111-4111-8111-111111111111";
  const worker = "a2222222-2222-4222-8222-222222222222";
  const stranger = "a3333333-3333-4333-8333-333333333333";
  const rpc = async (actor, operation, args = {}, gateway = secret) => {
    await db.query("savepoint history_call");
    try {
      await db.query(
        "select set_config('request.jwt.claim.sub',$1,true),set_config('request.headers',$2,true)",
        [actor, JSON.stringify({ "x-upahgo-gateway": gateway })],
      );
      await db.query("set local role authenticated");
      const result = (
        await db.query("select public.upahgo_action($1,$2) value", [
          operation,
          args,
        ])
      ).rows[0].value;
      await db.query("reset role");
      await db.query("release savepoint history_call");
      return result;
    } catch (error) {
      await db.query("rollback to savepoint history_call");
      throw error;
    }
  };
  const denied = async (actor, op, args, code, gateway) => {
    await assert.rejects(rpc(actor, op, args, gateway), (error) =>
      error.message.includes(code),
    );
    checks++;
  };
  await db.query("begin");
  try {
    for (const [id, role] of [
      [employer, "employer"],
      [worker, "worker"],
      [stranger, "worker"],
    ]) {
      await db.query("insert into auth.users(id) values($1)", [id]);
      await db.query(
        "insert into upahgo_private.accounts(id,role) values($1,$2)",
        [id, role],
      );
      await db.query(
        "insert into upahgo_private.profiles(id,name,region,role,tags,bio) values($1,'History test','Synthetic',$2,array['sweep'],'Synthetic test')",
        [id, role],
      );
    }
    const contact = (
      await db.query(
        `insert into upahgo_private.contacts
      (sender_id,receiver_id,sender_role,receiver_role,status,sender_phone_hash,created_at,expires_at)
      values($1,$2,'employer','worker','accepted',decode('00','hex'),now()-interval '200 days',now()+interval '10 days') returning id`,
        [employer, worker],
      )
    ).rows[0].id;
    await db.query(
      `insert into upahgo_private.contacts
      (sender_id,receiver_id,sender_role,receiver_role,status,sender_phone_hash,created_at)
      select $1,$2,'employer','worker','declined',decode('00','hex'),now()-interval '1 day' from generate_series(1,101)`,
      [employer, worker],
    );
    const agreement = (
      await db.query(
        `insert into upahgo_private.agreements
      (contact_id,creator_id,worker_id,employer_id,title,tasks,wage,starts_at,timezone,status,created_at)
      values($1,$2,$3,$2,'Old active work','Synthetic history test',10000,now()+interval '1 day','Asia/Jakarta','agreed',now()-interval '200 days') returning id`,
        [contact, employer, worker],
      )
    ).rows[0].id;
    const workContext = {
      durationMinutes: 45,
      quantity: 1,
      loadKg: 0,
      floors: 0,
      lift: false,
      distanceMeters: 10,
      workers: 1,
      tools: "Synthetic tools",
    };
    await db.query(
      "insert into upahgo_private.agreement_details values($1,$2)",
      [agreement, workContext],
    );
    await db.query(
      `insert into upahgo_private.agreements
      (contact_id,creator_id,worker_id,employer_id,title,tasks,wage,starts_at,timezone,status,created_at)
      select $1,$2,$3,$2,'Finished history','Synthetic history test',10000,now(),'Asia/Jakarta','completed',now()-interval '1 day' from generate_series(1,101)`,
      [contact, employer, worker],
    );
    await db.query(
      `insert into upahgo_private.notifications(recipient_id,title,body,route,created_at)
      select $1,'Synthetic history','Test','/contact/'||$2,now()-interval '1 day' from generate_series(1,102)`,
      [employer, contact],
    );

    for (const actor of [employer, worker]) {
      assert.equal((await rpc(actor, "contact", { id: contact })).id, contact);
      checks++;
      assert.deepEqual(
        (await rpc(actor, "agreement", { id: agreement })).workContext,
        workContext,
      );
      checks++;
      assert.equal(
        (await rpc(actor, "agreement", { id: agreement })).id,
        agreement,
      );
      checks++;
    }
    await denied(stranger, "contact", { id: contact }, "UNAVAILABLE");
    await denied(stranger, "agreement", { id: agreement }, "UNAVAILABLE");
    await denied(employer, null, {}, "INVALID_INPUT");
    await denied(employer, "contact", { id: "invalid" }, "INVALID_INPUT");
    await denied(employer, "contacts", { targetId: worker }, "INVALID_INPUT");
    await denied(
      employer,
      "agreement",
      { id: agreement, extra: "x".repeat(17000) },
      "INVALID_INPUT",
    );
    await denied("", "contact", { id: contact }, "UNAUTHENTICATED");
    await denied(
      employer,
      "agreement",
      { id: agreement },
      "GATEWAY_NOT_CONFIGURED",
      "incorrect",
    );
    for (const op of ["contacts", "agreements", "notifications"]) {
      const first = await rpc(employer, op);
      assert.equal(first.length, 100);
      checks++;
      const after = { id: first.at(-1).id, createdAt: first.at(-1).createdAt };
      // A new item ahead of the cursor must not shift or duplicate the older page.
      if (op === "notifications")
        await db.query(
          "insert into upahgo_private.notifications(recipient_id,title,body,route) values($1,'New','Test','/')",
          [employer],
        );
      const next = await rpc(employer, op, { after });
      assert.equal(new Set([...first, ...next].map((x) => x.id)).size, 102);
      checks++;
      assert.equal(
        (
          await rpc(employer, op, {
            after: { id: next.at(-1).id, createdAt: next.at(-1).createdAt },
          })
        ).length,
        0,
      );
      checks++;
      await denied(
        employer,
        op,
        { after: { id: contact, createdAt: "invalid" } },
        "INVALID_INPUT",
      );
      await denied(employer, op, { after: { id: contact } }, "INVALID_INPUT");
      await denied(
        employer,
        op,
        { after: { id: contact, createdAt: "infinity" } },
        "INVALID_INPUT",
      );
      await denied(employer, op, { filter: "invalid" }, "INVALID_INPUT");
    }
    assert.deepEqual(
      (await rpc(employer, "contacts", { filter: "active" })).map((x) => x.id),
      [contact],
    );
    checks++;
    assert.deepEqual(
      (await rpc(employer, "agreements", { filter: "active" })).map(
        (x) => x.id,
      ),
      [agreement],
    );
    checks++;
    assert.deepEqual(
      (await rpc(employer, "agreements", { filter: "active" }))[0].workContext,
      workContext,
    );
    checks++;
    assert.equal(
      (
        await rpc(employer, "contacts", {
          targetId: worker,
          targetRole: "worker",
          filter: "active",
        })
      )[0].id,
      contact,
    );
    checks++;
    assert.equal(
      (
        await rpc(stranger, "contacts", {
          targetId: worker,
          targetRole: "worker",
          filter: "active",
        })
      ).length,
      0,
    );
    checks++;
    await db.query(
      "update upahgo_private.contacts set expires_at=now()-interval '1 second' where id=$1",
      [contact],
    );
    assert.equal(
      (await rpc(employer, "contacts", { filter: "active" })).length,
      0,
    );
    checks++;
    assert.equal(
      (await rpc(employer, "contact", { id: contact })).status,
      "expired",
    );
    checks++;
    // History access survives changed roles, blocks and absent GPS; phone access does not.
    await db.query(
      "update upahgo_private.accounts set role='worker' where id=$1",
      [employer],
    );
    await db.query(
      "insert into upahgo_private.blocks(owner_id,target_id) values($1,$2)",
      [employer, worker],
    );
    assert.equal(
      (await rpc(employer, "agreement", { id: agreement })).id,
      agreement,
    );
    checks++;
    assert.equal((await rpc(employer, "contact", { id: contact })).id, contact);
    checks++;
    await denied(employer, "approved_contact", { id: contact }, "UNAVAILABLE");
    assert.equal(
      (
        await rpc(worker, "agreement_action", {
          id: agreement,
          action: "request_completion",
        })
      ).status,
      "completion_requested",
    );
    checks++;
    assert.equal(
      (
        await rpc(employer, "agreement_action", {
          id: agreement,
          action: "confirm_completion",
        })
      ).status,
      "completed",
    );
    checks++;
    assert.ok(
      (
        await rpc(worker, "agreement_action", {
          id: agreement,
          action: "acknowledge_payment",
        })
      ).paymentReceivedAt,
    );
    checks++;
    await db.query(
      "update upahgo_private.accounts set status='restricted' where id=$1",
      [employer],
    );
    await denied(employer, "contact", { id: contact }, "ACCOUNT_RESTRICTED");
    await denied(employer, "agreements", {}, "ACCOUNT_RESTRICTED");
    await db.query(
      "update upahgo_private.accounts set status='active' where id=$1",
      [employer],
    );
    await db.query(
      await readFile(
        new URL(
          "../supabase/rollbacks/202611180002_history_pagination.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    assert.equal((await rpc(employer, "contacts")).length, 100);
    checks++;
    assert.equal((await rpc(employer, "agreements")).length, 100);
    checks++;
    assert.equal((await rpc(employer, "notifications")).length, 100);
    checks++;
    assert.equal(
      (
        await db.query(
          "select count(*)::int n from upahgo_private.agreements where employer_id=$1",
          [employer],
        )
      ).rows[0].n,
      102,
    );
    checks++;
    return checks;
  } finally {
    await db.query("rollback");
  }
}
