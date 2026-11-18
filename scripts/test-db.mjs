import pg from "pg";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { testHistory } from "./test-history.mjs";
const url = process.env.TEST_DATABASE_URL;
if (!url || !/^upahgo_test/.test(new URL(url).pathname.slice(1)))
  throw new Error(
    "Use a disposable database named upahgo_test*, via TEST_DATABASE_URL",
  );
const db = new pg.Client({ connectionString: url });
await db.connect();
await db.query(`drop schema if exists upahgo_private cascade; drop schema if exists auth cascade; drop function if exists public.upahgo_action(text,jsonb); drop function if exists public.upahgo_photo_replace(uuid,text,text);
 do $$ begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon; end if; if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if; end $$;
 create schema auth; create table auth.users(id uuid primary key, phone text, phone_confirmed_at timestamptz);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
const migrationDir = new URL("../supabase/migrations/", import.meta.url);
for (const file of (await readdir(migrationDir))
  .filter((f) => f.endsWith(".sql"))
  .sort())
  await db.query(await readFile(new URL(file, migrationDir), "utf8"));
const ids = [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
  "44444444-4444-4444-8444-444444444444",
];
const area = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const otherArea = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const secret = "local-test-gateway-secret-never-for-production";
await db.query(
  `update upahgo_private.gateway_config set secret_hash=extensions.digest($1,'sha256')`,
  [secret],
);
await db.query(
  `insert into auth.users select x::uuid,'6281234567890',now() from unnest($1::text[]) x`,
  [ids],
);
await db.query(
  `insert into upahgo_private.cities(id,label,south,north,west,east,boundary,attribution) values
   ('test-city','Kota uji',-6.5,-5.8,106.5,107.2,'{"type":"MultiPolygon","coordinates":[[[[106.5,-6.5],[107.2,-6.5],[107.2,-5.8],[106.5,-5.8],[106.5,-6.5]]]]}','Synthetic test boundary'),
   ('other-city','Kota lain uji',-6.5,-5.8,107.8,108.2,'{"type":"MultiPolygon","coordinates":[[[[107.8,-6.5],[108.2,-6.5],[108.2,-5.8],[107.8,-5.8],[107.8,-6.5]]]]}','Synthetic test boundary')`,
);
await db.query(
  `insert into upahgo_private.areas(id,label,latitude,longitude,timezone,city_id) values($1,'Area sintetis',-6.2,106.8,'Asia/Jakarta','test-city')`,
  [area],
);
await db.query(
  `insert into upahgo_private.areas(id,label,latitude,longitude,timezone,city_id) values($1,'Area kota lain',-6.2,108.0,'Asia/Jakarta','other-city')`,
  [otherArea],
);
let count = 0;
count += await testHistory(db, secret);
const pekanbaru = JSON.parse(
  await readFile(new URL("../shared/pekanbaru.json", import.meta.url), "utf8"),
);
const boundaryCheck = await db.query(
  "select upahgo_private.in_boundary($1::jsonb,0.507,101.447) inside, upahgo_private.in_boundary($1::jsonb,-6.2,106.8) outside",
  [JSON.stringify(pekanbaru.boundary)],
);
assert.deepEqual(boundaryCheck.rows[0], { inside: true, outside: false });
count++;
const holeCheck = await db.query(
  `select upahgo_private.in_boundary('{"type":"MultiPolygon","coordinates":[[[[0,0],[10,0],[10,10],[0,10],[0,0]],[[4,4],[6,4],[6,6],[4,6],[4,4]]]]}',2,2) inside,
   upahgo_private.in_boundary('{"type":"MultiPolygon","coordinates":[[[[0,0],[10,0],[10,10],[0,10],[0,0]],[[4,4],[6,4],[6,6],[4,6],[4,4]]]]}',5,5) hole`,
);
assert.deepEqual(holeCheck.rows[0], { inside: true, hole: false });
count++;
async function action(actor, op, args = {}, gateway = secret) {
  await db.query(
    `select set_config('request.jwt.claim.sub',$1,false),set_config('request.headers',$2,false)`,
    [actor, JSON.stringify({ "x-upahgo-gateway": gateway })],
  );
  await db.query("set role authenticated");
  try {
    const r = await db.query("select public.upahgo_action($1,$2) result", [
      op,
      args,
    ]);
    return r.rows[0].result;
  } finally {
    await db.query("reset role");
  }
}
async function denied(actor, op, args, code, gateway) {
  await assert.rejects(action(actor, op, args, gateway), (e) =>
    e.message.includes(code),
  );
  count++;
}
const fix = (longitude = 106.8, radiusKm = 5) => ({
  latitude: -6.2,
  longitude,
  accuracyMeters: 20,
  capturedAt: new Date().toISOString(),
  radiusKm,
});
await denied("", "bootstrap", {}, "UNAUTHENTICATED");
await denied(ids[0], "bootstrap", {}, "GATEWAY_NOT_CONFIGURED", "incorrect");
for (let i = 0; i < 3; i++) {
  await action(ids[i], "set_role", { role: i === 0 ? "employer" : "worker" });
  await action(ids[i], "set_location", fix());
  await action(ids[i], "save_profile", {
    name: `Akun sintetis ${i}`,
    region: "Jakarta uji",
    areaId: area,
    role: i === 0 ? "employer" : "worker",
    tags: ["sweep"],
    bio: "Data pengujian lokal",
  });
  await action(ids[i], "visibility", { enabled: true });
}
// Initial prices are owner-provided, role-specific and separate from agreement wages.
const pricedProfile = {
  name: "Akun sintetis 1",
  region: "Jakarta uji",
  areaId: area,
  role: "worker",
  tags: ["sweep"],
  bio: "Data pengujian lokal",
};
await action(ids[1], "save_profile", {
  ...pricedProfile,
  priceAmount: 135000,
  priceNegotiable: true,
});
assert.equal((await action(ids[1], "bootstrap")).profile.priceAmount, 135000);
count++;
// Profile edits revoke map visibility. Public reads require a fresh opt-in.
await denied(ids[0], "profile", { id: ids[1], role: "worker" }, "UNAVAILABLE");
await action(ids[1], "visibility", { enabled: true });
assert.equal(
  (await action(ids[0], "profile", { id: ids[1], role: "worker" }))
    .priceNegotiable,
  true,
);
count++;
assert.equal(
  (await action(ids[0], "discover", { role: "worker" })).find(
    (p) => p.id === ids[1],
  ).priceAmount,
  135000,
);
count++;
await action(ids[1], "save_profile", pricedProfile);
assert.equal((await action(ids[1], "bootstrap")).profile.priceAmount, 135000);
count++;
for (const priceAmount of [0, 999, 50000001, -1000, 1000.5, "120000", {}, []])
  await denied(
    ids[1],
    "save_profile",
    { ...pricedProfile, priceAmount, priceNegotiable: true },
    "PRICE_INVALID",
  );
await denied(
  ids[1],
  "save_profile",
  { ...pricedProfile, priceAmount: null, priceNegotiable: true },
  "PRICE_INVALID",
);
await denied(
  ids[1],
  "save_profile",
  { ...pricedProfile, priceAmount: 120000, priceNegotiable: "true" },
  "PRICE_INVALID",
);
await denied(
  ids[1],
  "save_profile",
  { ...pricedProfile, priceNegotiable: true },
  "PRICE_INVALID",
);
await denied(
  ids[1],
  "save_profile",
  { ...pricedProfile, priceAmount: "1".repeat(17000) },
  "INVALID_INPUT",
);
await denied(
  ids[1],
  "save_profile",
  {
    ...pricedProfile,
    priceAmount: 120000,
    priceNegotiable: true,
    ownerId: ids[0],
  },
  "INVALID_INPUT",
);
await denied(
  ids[1],
  "save_profile",
  {
    ...pricedProfile,
    role: "employer",
    priceAmount: 120000,
    priceNegotiable: true,
  },
  "PROFILE_INVALID",
);
await denied(
  ids[1],
  "save_profile",
  { ...pricedProfile, priceAmount: 120000, priceNegotiable: true },
  "GATEWAY_NOT_CONFIGURED",
  "incorrect",
);
assert.equal((await action(ids[1], "bootstrap")).profile.priceAmount, 135000);
assert.equal((await action(ids[0], "bootstrap")).profile.priceAmount, null);
count++;
await action(ids[1], "set_role", { role: "employer" });
assert.equal((await action(ids[1], "bootstrap")).profile.priceAmount, null);
count++;
await action(ids[1], "set_role", { role: "worker" });
assert.equal((await action(ids[1], "bootstrap")).profile.priceAmount, 135000);
count++;
await action(ids[1], "save_profile", {
  ...pricedProfile,
  priceAmount: null,
  priceNegotiable: false,
});
assert.equal((await action(ids[1], "bootstrap")).profile.priceAmount, null);
count++;
await action(ids[1], "visibility", { enabled: true });
await db.query("delete from upahgo_private.rate_buckets");

// Discovery redesign: contextual effort, pre-limit search, private photos and suggestions.
const workContext = {
  durationMinutes: 45,
  quantity: 1,
  loadKg: 0,
  floors: 0,
  lift: false,
  distanceMeters: 10,
  workers: 1,
  tools: "Alat tersedia",
};
for (const [i, extra] of [
  [0, { workContext }],
  [1, { acceptedEfforts: ["light", "medium"] }],
]) {
  const saved = await action(ids[i], "save_profile", {
    name: `Akun sintetis ${i}`,
    region: "Jakarta uji",
    areaId: area,
    role: i === 0 ? "employer" : "worker",
    tags: ["sweep"],
    bio: "Data pengujian lokal",
    ...extra,
  });
  assert.deepEqual(
    i === 0 ? saved.workContext : saved.acceptedEfforts,
    i === 0 ? workContext : ["light", "medium"],
  );
  count++;
  await action(ids[i], "visibility", { enabled: true });
}
assert.equal(
  (await action(ids[0], "discover", { role: "worker", effort: "light" }))
    .length,
  1,
);
count++;
assert.equal(
  (await action(ids[1], "discover", { role: "employer", effort: "light" }))
    .length,
  1,
);
count++;
await denied(
  ids[0],
  "save_profile",
  {
    name: "Akun uji",
    region: "Jakarta",
    role: "employer",
    tags: ["sweep"],
    bio: "",
    workContext: { ...workContext, workers: 0 },
  },
  "CONTEXT_INVALID",
);
for (const args of [
  { offset: -1 },
  { offset: 0.5 },
  { offset: 1001 },
  { effort: "easy" },
  { query: "x".repeat(81) },
  { sort: "fake" },
])
  await denied(
    ids[0],
    "discover",
    { role: "worker", ...args },
    "FILTER_INVALID",
  );
const suggested = await action(ids[1], "suggest_job", {
  title: "Pekerjaan usulan",
  detail: "Rincian tugas untuk ditinjau",
  workContext,
});
assert.equal(suggested.status, "pending");
count++;
assert.equal((await action(ids[1], "job_suggestions")).length, 1);
count++;
assert.deepEqual(await action(ids[0], "job_suggestions"), []);
count++;
await denied(
  ids[1],
  "suggest_job",
  { title: "Pekerjaan usulan", detail: "Hubungi 081234567890" },
  "SUGGESTION_INVALID",
);
const photoKey = `${ids[1]}/worker/55555555-5555-4555-8555-555555555555`;
await db.query("select public.upahgo_photo_replace($1,'worker',$2)", [
  ids[1],
  photoKey,
]);
assert.equal(
  (await action(ids[1], "photo_access", { id: ids[1], role: "worker" })).key,
  photoKey,
);
count++;
assert.equal(
  (await action(ids[0], "photo_access", { id: ids[1], role: "worker" })).key,
  null,
);
count++;
await db.query(
  "update upahgo_private.profile_photos set status='approved' where user_id=$1",
  [ids[1]],
);
assert.equal(
  (await action(ids[0], "photo_access", { id: ids[1], role: "worker" })).key,
  photoKey,
);
count++;
assert.equal(
  (await action(ids[0], "profile", { id: ids[1], role: "worker" })).photoReady,
  true,
);
count++;
await db.query("set role authenticated");
await assert.rejects(
  db.query("select public.upahgo_photo_replace($1,'worker',null)", [ids[1]]),
  /permission denied/,
);
count++;
await assert.rejects(
  db.query("select * from upahgo_private.profile_photos"),
  /permission denied/,
);
count++;
await db.query("reset role");
await assert.rejects(
  db.query("select public.upahgo_photo_replace($1,'worker',$2)", [
    ids[1],
    `${ids[0]}/worker/55555555-5555-4555-8555-555555555555`,
  ]),
  /PHOTO_INVALID/,
);
count++;
await db.query("select public.upahgo_photo_replace($1,'worker',null)", [
  ids[1],
]);
assert.equal(
  (await action(ids[0], "profile", { id: ids[1], role: "worker" })).photoReady,
  false,
);
count++;
const batchIds = Array.from(
  { length: 45 },
  (_, i) => `88888888-8888-4888-8888-${String(i + 1).padStart(12, "0")}`,
);
for (let i = 0; i < batchIds.length; i++) {
  await db.query("insert into auth.users(id) values($1)", [batchIds[i]]);
  await db.query(
    "insert into upahgo_private.accounts(id,role) values($1,'worker')",
    [batchIds[i]],
  );
  await db.query(
    "insert into upahgo_private.profiles(id,name,region,area_id,role,tags,bio) values($1,$2,'Kota uji',$3,'worker',array['sweep'],'Data sintetis')",
    [batchIds[i], i === 44 ? "Temuan khusus" : "Batch uji", area],
  );
  await db.query(
    "insert into upahgo_private.account_locations values($1,'test-city',-6.2,106.8,20,now(),5)",
    [batchIds[i]],
  );
  await db.query(
    "insert into upahgo_private.presences(user_id,role,area_id,tags,expires_at,city_id,latitude,longitude) values($1,'worker',$2,array['sweep'],now()+interval '1 hour','test-city',-6.2,106.8)",
    [batchIds[i], area],
  );
}
assert.equal(
  (
    await action(ids[0], "discover", { role: "worker", query: "Temuan khusus" })
  )[0].id,
  batchIds[44],
);
count++;
const pageOne = await action(ids[0], "discover", { role: "worker", offset: 0 }),
  pageTwo = await action(ids[0], "discover", { role: "worker", offset: 40 });
assert.equal(pageOne.length, 40);
assert.equal(pageTwo.length, 7);
assert.equal(new Set([...pageOne, ...pageTwo].map((p) => p.id)).size, 47);
count++;
await db.query("delete from auth.users where id=any($1::uuid[])", [batchIds]);
await db.query("delete from upahgo_private.rate_buckets");

await denied(ids[0], "visibility", {}, "INVALID_INPUT");
await denied(
  ids[0],
  "save_profile",
  { name: null, region: "Jakarta", role: "worker", tags: [], bio: "" },
  "PROFILE_INVALID",
);
await denied(
  ids[0],
  "save_profile",
  {
    name: "Akun uji",
    region: "Jakarta",
    role: "employer",
    tags: ["not-a-tag"],
    bio: "",
  },
  "TAGS_INVALID",
);
const fresh = await action(ids[3], "bootstrap");
assert.equal(fresh.profile, null);
assert.equal(fresh.account.role, null);
count++;
await denied(ids[3], "set_role", { role: "operator" }, "INVALID_INPUT");
await action(ids[3], "onboarding", { step: "intro" });
await action(ids[3], "set_role", { role: "employer" });
await denied(ids[3], "discover", { role: "worker" }, "LOCATION_REQUIRED");
await action(ids[3], "set_location", fix());
await action(ids[3], "onboarding", { step: "profile" });
await action(ids[3], "set_area", { areaId: area });
const skipped = await action(ids[3], "bootstrap");
assert.equal(skipped.profile, null);
assert.equal(skipped.account.setupDone, true);
assert.equal(skipped.account.browseAreaId, area);
count++;
assert.equal(
  (await action(ids[3], "discover", { areaId: area, role: "worker" })).length,
  2,
);
count++;
assert.deepEqual(await action(ids[3], "contacts"), []);
count++;
await denied(ids[3], "visibility", { enabled: true }, "PROFILE_INCOMPLETE");
await denied(
  ids[3],
  "request_contact",
  { targetId: ids[1], targetRole: "worker", consent: true },
  "PROFILE_INCOMPLETE",
);
await denied(
  ids[3],
  "set_role",
  { role: "worker", ownerId: ids[0] },
  "INVALID_INPUT",
);
await denied(ids[3], "set_area", { areaId: otherArea }, "CITY_MISMATCH");
const people = await action(ids[0], "discover", {
  areaId: area,
  role: "worker",
});
assert.equal(people.length, 2);
assert.equal("phone" in people[0], false);
count++;
await denied(
  ids[0],
  "request_contact",
  { targetId: ids[1], targetRole: "worker", consent: false },
  "CONSENT_REQUIRED",
);
const c = await action(ids[0], "request_contact", {
  targetId: ids[1],
  targetRole: "worker",
  consent: true,
});
async function concurrentAction(actor, op, args) {
  const connection = new pg.Client({ connectionString: url });
  await connection.connect();
  try {
    await connection.query(
      "select set_config('request.jwt.claim.sub',$1,false),set_config('request.headers',$2,false)",
      [actor, JSON.stringify({ "x-upahgo-gateway": secret })],
    );
    await connection.query("set role authenticated");
    return (
      await connection.query("select public.upahgo_action($1,$2) result", [
        op,
        args,
      ])
    ).rows[0].result;
  } finally {
    await connection.end();
  }
}
const duplicates = await Promise.all([
  concurrentAction(ids[0], "request_contact", {
    targetId: ids[1],
    targetRole: "worker",
    consent: true,
  }),
  concurrentAction(ids[0], "request_contact", {
    targetId: ids[1],
    targetRole: "worker",
    consent: true,
  }),
]);
assert.deepEqual(
  duplicates.map((x) => x.id),
  [c.id, c.id],
);
count++;
assert.equal(
  (
    await action(ids[0], "request_contact", {
      targetId: ids[1],
      targetRole: "worker",
      consent: true,
    })
  ).id,
  c.id,
);
count++;
await denied(ids[0], "approved_contact", { id: c.id }, "FORBIDDEN");
await denied(
  ids[2],
  "respond_contact",
  { id: c.id, action: "accept", consent: true },
  "UNAVAILABLE",
);
await denied(
  ids[0],
  "respond_contact",
  { id: c.id, action: "accept", consent: true },
  "FORBIDDEN",
);
await action(ids[1], "respond_contact", {
  id: c.id,
  action: "accept",
  consent: true,
});
assert.match(
  (await action(ids[0], "approved_contact", { id: c.id })).phone,
  /^628/,
);
count++;
await denied(ids[2], "approved_contact", { id: c.id }, "UNAVAILABLE");
await db.query("update auth.users set phone=$1 where id=$2", [
  "6289999999999",
  ids[1],
]);
await denied(ids[0], "approved_contact", { id: c.id }, "CONTACT_EXPIRED");
await db.query("update auth.users set phone=$1 where id=$2", [
  "6281234567890",
  ids[1],
]);
await db.query(
  "update upahgo_private.contacts set expires_at=now()-interval '1 second' where id=$1",
  [c.id],
);
await denied(ids[0], "approved_contact", { id: c.id }, "CONTACT_EXPIRED");
await db.query(
  "update upahgo_private.contacts set expires_at=now()+interval '30 days' where id=$1",
  [c.id],
);
await db.query(
  "update upahgo_private.presences set expires_at=now()-interval '1 second' where user_id=$1",
  [ids[1]],
);
assert.equal(
  (await action(ids[0], "discover", { areaId: area, role: "worker" })).length,
  1,
);
count++;
await action(ids[1], "visibility", { enabled: true });
await denied(
  ids[0],
  "create_agreement",
  {
    contactId: c.id,
    title: "Valid",
    tasks: "Rincian pekerjaan valid",
    wage: 150000,
    startsAt: new Date(Date.now() + 86400000).toISOString(),
    timezone: "UTC",
  },
  "AGREEMENT_INVALID",
);
const g = await action(ids[0], "create_agreement", {
  contactId: c.id,
  title: "Bersihkan rumah",
  tasks: "Menyapu dan mengepel ruang tamu",
  wage: 150000,
  startsAt: new Date(Date.now() + 86400000).toISOString(),
  timezone: "Asia/Jakarta",
});
await denied(
  ids[2],
  "agreement_action",
  { id: g.id, action: "accept" },
  "UNAVAILABLE",
);
await denied(
  ids[0],
  "create_agreement",
  {
    contactId: c.id,
    title: "Pekerjaan lain",
    tasks: "Rincian berbeda valid",
    wage: 200000,
    startsAt: new Date(Date.now() + 86400000).toISOString(),
    timezone: "Asia/Jakarta",
  },
  "STATE_CONFLICT",
);
await denied(
  ids[0],
  "agreement_action",
  { id: g.id, action: "accept" },
  "STATE_CONFLICT",
);
await action(ids[1], "agreement_action", { id: g.id, action: "accept" });
await denied(
  ids[0],
  "agreement_action",
  { id: g.id, action: "acknowledge_payment" },
  "STATE_CONFLICT",
);
await action(ids[1], "agreement_action", {
  id: g.id,
  action: "request_completion",
});
const done = await action(ids[0], "agreement_action", {
  id: g.id,
  action: "confirm_completion",
});
assert.equal(done.paymentReceivedAt, null);
count++;
await denied(
  ids[0],
  "agreement_action",
  { id: g.id, action: "acknowledge_payment" },
  "STATE_CONFLICT",
);
const paid = await action(ids[1], "agreement_action", {
  id: g.id,
  action: "acknowledge_payment",
});
assert.ok(paid.paymentReceivedAt);
count++;
// Location and reputation are server gates, not client-side filters.
await db.query("delete from upahgo_private.rate_buckets");
await denied(
  ids[0],
  "set_location",
  { ...fix(), accuracyMeters: 1001 },
  "LOCATION_INACCURATE",
);
await denied(
  ids[0],
  "set_location",
  { ...fix(), capturedAt: new Date(Date.now() - 6 * 60000).toISOString() },
  "LOCATION_STALE",
);
await denied(
  ids[0],
  "set_location",
  { ...fix(), longitude: 999 },
  "LOCATION_REQUIRED",
);
await denied(
  ids[0],
  "set_location",
  { ...fix(), longitude: 110 },
  "CITY_UNAVAILABLE",
);
await denied(ids[0], "set_radius", { radiusKm: 2 }, "RADIUS_INVALID");
await denied(ids[0], "set_radius", { radiusKm: 4.9 }, "RADIUS_INVALID");
await denied(
  ids[0],
  "discover",
  { role: "worker", radiusKm: 20 },
  "INVALID_INPUT",
);
const rounded = await action(ids[0], "set_location", {
  ...fix(),
  latitude: -6.200123,
  longitude: 106.800456,
});
assert.equal(rounded.location.latitude, -6.2);
assert.equal(rounded.location.longitude, 106.8);
count++;
await action(ids[2], "set_location", fix(106.9));
await action(ids[2], "visibility", { enabled: true });
assert.equal((await action(ids[0], "discover", { role: "worker" })).length, 1);
count++;
await denied(ids[0], "profile", { id: ids[2], role: "worker" }, "UNAVAILABLE");
await denied(
  ids[0],
  "request_contact",
  { targetId: ids[2], targetRole: "worker", consent: true },
  "UNAVAILABLE",
);
await action(ids[0], "set_radius", { radiusKm: 20 });
assert.equal((await action(ids[0], "discover", { role: "worker" })).length, 2);
count++;
await action(ids[2], "set_location", fix(108));
await action(ids[2], "visibility", { enabled: true });
await denied(ids[0], "profile", { id: ids[2], role: "worker" }, "UNAVAILABLE");
await denied(ids[0], "set_area", { areaId: otherArea }, "CITY_MISMATCH");
await denied(
  ids[0],
  "save_profile",
  {
    name: "Akun uji",
    region: "Kota lain",
    areaId: otherArea,
    role: "employer",
    tags: ["sweep"],
    bio: "",
  },
  "CITY_MISMATCH",
);
await db.query(
  "update upahgo_private.account_locations set captured_at=now()-interval '31 minutes' where user_id=$1",
  [ids[0]],
);
await denied(ids[0], "discover", { role: "worker" }, "LOCATION_STALE");
await action(ids[0], "set_location", fix());
await action(ids[2], "set_location", fix());
await action(ids[2], "visibility", { enabled: true });
await denied(
  ids[2],
  "submit_review",
  { id: g.id, score: 5, comment: "" },
  "UNAVAILABLE",
);
await denied(
  ids[1],
  "submit_review",
  { id: g.id, score: 0, comment: "" },
  "REVIEW_INVALID",
);
await denied(
  ids[1],
  "submit_review",
  { id: g.id, score: 4.5, comment: "" },
  "REVIEW_INVALID",
);
await denied(
  ids[1],
  "submit_review",
  { id: g.id, score: 5, comment: "Hubungi 081234567890" },
  "REVIEW_INVALID",
);
await denied(
  ids[1],
  "submit_review",
  { id: g.id, score: 5, comment: "https://example.com" },
  "REVIEW_INVALID",
);
await denied(
  ids[1],
  "submit_review",
  { id: g.id, score: 5, targetId: ids[2] },
  "INVALID_INPUT",
);
const ratingRace = await Promise.allSettled([
  concurrentAction(ids[1], "submit_review", {
    id: g.id,
    score: 4,
    comment: "Tugas jelas.",
  }),
  concurrentAction(ids[1], "submit_review", {
    id: g.id,
    score: 4,
    comment: "Tugas jelas.",
  }),
]);
assert.equal(ratingRace.filter((r) => r.status === "fulfilled").length, 1);
assert.match(
  ratingRace.find((r) => r.status === "rejected").reason.message,
  /REVIEW_EXISTS/,
);
count++;
await action(ids[0], "submit_review", {
  id: g.id,
  score: 5,
  comment: "Kerja rapi.",
});
const ratedWorker = await action(ids[0], "profile", {
  id: ids[1],
  role: "worker",
});
assert.equal(ratedWorker.ratingAverage, 5);
assert.equal(ratedWorker.ratingCount, 1);
assert.equal("accuracyMeters" in ratedWorker, false);
count++;
const reviews = await action(ids[0], "reviews", { id: ids[1], role: "worker" });
assert.equal(reviews.length, 1);
assert.equal(reviews[0].score, 5);
assert.equal("reviewerId" in reviews[0], false);
count++;
const ownReviews = await action(ids[1], "agreement_reviews", { id: g.id });
assert.equal(ownReviews.submitted.score, 4);
assert.equal(ownReviews.received.score, 5);
count++;
await denied(ids[2], "agreement_reviews", { id: g.id }, "UNAVAILABLE");
await db.query(
  "update upahgo_private.agreements set status='agreed',payment_received_at=null where id=$1",
  [g.id],
);
await denied(
  ids[0],
  "submit_review",
  { id: g.id, score: 5 },
  "REVIEW_NOT_ALLOWED",
);
await db.query(
  "update upahgo_private.agreements set status='completed',payment_received_at=$2 where id=$1",
  [g.id, paid.paymentReceivedAt],
);
await action(ids[1], "set_role", { role: "employer" });
const switched = await action(ids[1], "bootstrap");
assert.equal(switched.profile.visibleUntil, null);
assert.deepEqual(switched.profile.tags, []);
count++;
await denied(ids[1], "visibility", { enabled: true }, "PROFILE_INCOMPLETE");
const history = await action(ids[1], "agreements");
assert.equal(history[0].workerId, ids[1]);
assert.equal(history[0].employerId, ids[0]);
count++;
await action(ids[1], "set_role", { role: "worker" });
assert.deepEqual((await action(ids[1], "bootstrap")).profile.tags, ["sweep"]);
count++;
assert.equal(
  (
    await action(ids[1], "agreement_action", {
      id: g.id,
      action: "acknowledge_payment",
    })
  ).paymentReceivedAt,
  paid.paymentReceivedAt,
);
count++;
await action(ids[0], "block", { targetId: ids[1] });
await denied(ids[0], "approved_contact", { id: c.id }, "UNAVAILABLE");
assert.equal(
  (await action(ids[0], "discover", { areaId: area, role: "worker" })).length,
  1,
);
count++;
await action(ids[0], "block", { targetId: ids[2] });
await action(ids[0], "unblock", { targetId: ids[1] });
assert.equal(
  (await db.query("select count(*) from upahgo_private.blocks")).rows[0].count,
  "1",
);
count++;
await action(ids[0], "request_deletion", { confirm: true });
await denied(
  ids[1],
  "request_contact",
  { targetId: ids[2], targetRole: "worker", consent: true },
  "FORBIDDEN",
);
await denied(
  ids[3],
  "request_deletion",
  { confirm: false },
  "CONSENT_REQUIRED",
);
await action(ids[3], "request_deletion", { confirm: true });
const deletedWithoutProfile = await action(ids[3], "bootstrap");
assert.equal(deletedWithoutProfile.profile, null);
assert.equal(deletedWithoutProfile.account.status, "deletion_requested");
assert.equal(deletedWithoutProfile.account.location, null);
count++;
await denied(ids[3], "set_role", { role: "worker" }, "ACCOUNT_RESTRICTED");
await denied(
  ids[0],
  "discover",
  { areaId: area, role: "worker" },
  "ACCOUNT_RESTRICTED",
);
await db.query("set role authenticated");
await assert.rejects(
  db.query("select upahgo_private.account_action('bootstrap','{}')"),
  /permission denied/,
);
count++;
await assert.rejects(
  db.query("select * from upahgo_private.account_locations"),
  /permission denied/,
);
count++;
await assert.rejects(
  db.query("select * from upahgo_private.reviews"),
  /permission denied/,
);
count++;
await assert.rejects(
  db.query("select upahgo_private.core_action('bootstrap','{}')"),
  /permission denied/,
);
count++;
await assert.rejects(
  db.query("select * from upahgo_private.profiles"),
  /permission denied/,
);
count++;
await assert.rejects(
  db.query("select * from upahgo_private.profile_prices"),
  /permission denied/,
);
count++;
await assert.rejects(
  db.query("select upahgo_private.price_json($1,'worker')", [ids[1]]),
  /permission denied/,
);
count++;
await db.query("reset role; set role anon");
await assert.rejects(
  db.query("select public.upahgo_action('bootstrap','{}')"),
  /permission denied/,
);
count++;
await db.query("reset role");
console.log(
  `DB: ${count} assertions passed (local PostgreSQL, synthetic auth shim).`,
);
await db.end();
