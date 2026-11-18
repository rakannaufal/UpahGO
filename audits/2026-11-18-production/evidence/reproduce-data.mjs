import pg from "pg";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";

// This audit uses only its newly-created, disposable loopback database.
const db = new pg.Client({
  connectionString:
    "postgresql://upahgo_audit@127.0.0.1:55439/upahgo_test_audit_20261118",
});
await db.connect();
const result = {};
try {
  result.schema = (
    await db.query(`select c.relname, c.relrowsecurity,
      (select count(*)::int from pg_policies p where p.schemaname=n.nspname and p.tablename=c.relname) policies
      from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='upahgo_private' and c.relkind='r' order by c.relname`)
  ).rows;
  result.indexes = (
    await db.query("select tablename,indexname,indexdef from pg_indexes where schemaname='upahgo_private' order by tablename,indexname")
  ).rows;
  result.functionSecurity = (
    await db.query(`select n.nspname,p.proname,p.prosecdef,p.proconfig,p.proacl::text
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='upahgo_private' or (n.nspname='public' and p.proname like 'upahgo%') order by 1,2`)
  ).rows;
  await db.query("begin");
  const employer = "a1111111-1111-4111-8111-111111111111";
  const worker = "a2222222-2222-4222-8222-222222222222";
  for (const [id, role] of [[employer, "employer"], [worker, "worker"]]) {
    await db.query("insert into auth.users(id) values($1)", [id]);
    await db.query("insert into upahgo_private.accounts(id,role) values($1,$2)", [id,role]);
    await db.query("insert into upahgo_private.profiles(id,name,region,role,tags,bio) values($1,'Synthetic audit account','Synthetic region',$2,array['sweep'],'Synthetic audit data')",[id,role]);
  }
  const oldestContact = (await db.query(`insert into upahgo_private.contacts
    (sender_id,receiver_id,sender_role,receiver_role,status,sender_phone_hash,created_at)
    values($1,$2,'employer','worker','accepted',decode('00','hex'),now()-interval '200 days') returning id`,[employer,worker])).rows[0].id;
  await db.query(`insert into upahgo_private.contacts
    (sender_id,receiver_id,sender_role,receiver_role,status,sender_phone_hash,created_at)
    select $1,$2,'employer','worker','expired',decode('00','hex'),now()-i*interval '1 day'
    from generate_series(1,100) i`,[employer,worker]);
  const oldestAgreement = (await db.query(`insert into upahgo_private.agreements
    (contact_id,creator_id,worker_id,employer_id,title,tasks,wage,starts_at,timezone,status,created_at)
    values($1,$2,$3,$2,'Synthetic active work','Synthetic audit task',10000,now()+interval '1 day','Asia/Jakarta','agreed',now()-interval '200 days') returning id`,[oldestContact,employer,worker])).rows[0].id;
  await db.query(`insert into upahgo_private.agreements
    (contact_id,creator_id,worker_id,employer_id,title,tasks,wage,starts_at,timezone,status,created_at)
    select $1,$2,$3,$2,'Synthetic finished work','Synthetic audit task',10000,now()-interval '1 day','Asia/Jakarta','completed',now()-i*interval '1 day'
    from generate_series(1,100) i`,[oldestContact,employer,worker]);
  await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.headers',$2,true)", [employer,JSON.stringify({"x-upahgo-gateway":"local-test-gateway-secret-never-for-production"})]);
  await db.query("set local role authenticated");
  const contacts=(await db.query("select public.upahgo_action('contacts','{}') value")).rows[0].value;
  const agreements=(await db.query("select public.upahgo_action('agreements','{}') value")).rows[0].value;
  result.history = {
    insertedContacts:101, returnedContacts:contacts.length,
    oldestAcceptedContactExists:true, oldestAcceptedContactReturned:contacts.some(x=>x.id===oldestContact),
    insertedAgreements:101, returnedAgreements:agreements.length,
    oldestAgreedWorkExists:true, oldestAgreedWorkReturned:agreements.some(x=>x.id===oldestAgreement),
    consequence:"Detail routes call list.find(id); older valid objects resolve to UNAVAILABLE, including an active agreement.",
  };
  assert.equal(contacts.length,100);
  assert.equal(agreements.length,100);
  assert.equal(result.history.oldestAcceptedContactReturned,false);
  assert.equal(result.history.oldestAgreedWorkReturned,false);
  await db.query("reset role");
  await db.query("savepoint deletion_probe");
  try {
    await db.query("delete from auth.users where id=$1",[worker]);
    result.authDelete={allowed:true};
  } catch(e) {
    result.authDelete={allowed:false,sqlState:e.code,constraint:e.constraint};
    await db.query("rollback to savepoint deletion_probe");
  }
  assert.equal(result.authDelete.allowed,false);
  result.queryPlans=[];
  const queries=[
    ["active-presences", "select * from upahgo_private.presences where city_id='test-city' and role='worker' and expires_at>now() limit 40",[]],
    ["profile-id", "select * from upahgo_private.profiles where id=$1",[worker]],
    ["contacts", "select * from upahgo_private.contacts where $1 in(sender_id,receiver_id) order by created_at desc limit 100",[employer]],
    ["agreements", "select * from upahgo_private.agreements where $1 in(worker_id,employer_id) order by created_at desc limit 100",[employer]],
    ["notifications", "select * from upahgo_private.notifications where recipient_id=$1 order by created_at desc limit 100",[employer]],
    ["reviews", "select * from upahgo_private.reviews where target_id=$1 and target_role='worker' order by created_at desc,id limit 30",[worker]],
    ["rating-average", "select avg(score),count(*) from upahgo_private.reviews where target_id=$1 and target_role='worker'",[worker]],
    ["profile-photo", "select * from upahgo_private.profile_photos where user_id=$1 and role='worker'",[worker]],
    ["profile-price", "select * from upahgo_private.profile_prices where user_id=$1 and role='worker'",[worker]],
    ["media-cleanup", "select * from upahgo_private.media_cleanup order by created_at limit 100",[]],
  ];
  for(const [name,query,params] of queries) {
    const plan=(await db.query("explain (analyze,buffers,format json) "+query,params)).rows[0]["QUERY PLAN"][0];
    result.queryPlans.push({name,query,planningMs:plan["Planning Time"],executionMs:plan["Execution Time"],plan:plan.Plan});
  }
  await db.query("rollback");
  result.fixtureStatus="All added audit records rolled back. Existing synthetic suite fixture preserved.";
  await writeFile(new URL("./data-probes.json",import.meta.url),JSON.stringify(result,null,2)+"\n");
  console.log(JSON.stringify({history:result.history,authDelete:result.authDelete,tables:result.schema.length,queryPlans:result.queryPlans.length,fixtureStatus:result.fixtureStatus},null,2));
} finally {
  await db.query("rollback").catch(()=>{});
  await db.end();
}
