import test from "node:test";
import assert from "node:assert/strict";
import {
  canTransitionAgreement,
  normalizePhone,
  validateProfile,
  whatsappUrl,
  scheduleIso,
  entryRoute,
} from "../shared/contracts.ts";
import { DemoApi, demoArea, demoLocation } from "../apps/mobile/src/demo.ts";
import type { Agreement } from "../shared/contracts.ts";
const agreement = {
  workerId: "worker",
  employerId: "employer",
  creatorId: "employer",
  status: "proposed",
  paymentReceivedAt: null,
} as Agreement;
test("only the other participant may accept work", () => {
  assert.equal(canTransitionAgreement(agreement, "worker", "accept"), true);
  assert.equal(canTransitionAgreement(agreement, "employer", "accept"), false);
  assert.equal(canTransitionAgreement(agreement, "stranger", "accept"), false);
});
test("completion does not imply payment; only worker acknowledges cash", () => {
  const completed = { ...agreement, status: "completed" } as Agreement;
  assert.equal(
    canTransitionAgreement(completed, "worker", "acknowledge_payment"),
    true,
  );
  assert.equal(
    canTransitionAgreement(completed, "employer", "acknowledge_payment"),
    false,
  );
  assert.equal(
    canTransitionAgreement(
      { ...completed, paymentReceivedAt: "2026-11-17" },
      "worker",
      "acknowledge_payment",
    ),
    false,
  );
  assert.equal(
    canTransitionAgreement(
      { ...agreement, status: "agreed" },
      "worker",
      "acknowledge_payment",
    ),
    false,
  );
});
test("public profiles reject contact leaks and duplicate tags", () => {
  const p = {
    name: "Akun pengujian",
    region: "Jakarta",
    tags: ["sweep"],
    bio: "Bersih-bersih rumah",
  };
  validateProfile(p);
  for (const bio of ["Telepon +6281234567890", "Buka https://example.com"])
    assert.throws(() => validateProfile({ ...p, bio }));
  assert.throws(() => validateProfile({ ...p, tags: ["sweep", "sweep"] }));
});
test("WhatsApp URL never accepts arbitrary destinations", () => {
  assert.equal(normalizePhone("0812-3456-7890"), "+6281234567890");
  assert.equal(whatsappUrl("+6281234567890"), "https://wa.me/6281234567890");
  for (const p of [
    "javascript:alert(1)",
    "https://evil.example",
    "+123?next=bad",
    "081",
  ])
    assert.throws(() => whatsappUrl(p));
});
test("schedule rejects normalized dates and preserves Indonesian time zones", () => {
  assert.equal(
    scheduleIso("2028-02-29", "09:00", "Asia/Jakarta"),
    "2028-02-29T02:00:00.000Z",
  );
  assert.equal(
    scheduleIso("2028-02-29", "09:00", "Asia/Makassar"),
    "2028-02-29T01:00:00.000Z",
  );
  assert.equal(
    scheduleIso("2028-02-29", "09:00", "Asia/Jayapura"),
    "2028-02-29T00:00:00.000Z",
  );
  for (const [date, time, zone] of [
    ["2027-02-29", "09:00", "Asia/Jakarta"],
    ["2028-02-31", "09:00", "Asia/Jakarta"],
    ["2028-12-01", "24:00", "Asia/Jakarta"],
    ["2028-12-01", "09:00", "UTC"],
  ])
    assert.throws(() => scheduleIso(date!, time!, zone!));
});
test("skipped setup permits browsing without a fabricated public profile", async () => {
  const api = new DemoApi();
  api.profiles = api.profiles.filter((p) => p.id !== "demo-me");
  assert.equal(entryRoute(await api.call("bootstrap")), "/onboarding");
  api.execute("onboarding", { step: "intro" });
  assert.equal(entryRoute(await api.call("bootstrap")), "/role");
  api.execute("set_role", { role: "worker" });
  assert.equal(entryRoute(await api.call("bootstrap")), "/location");
  api.execute("set_location", demoLocation());
  assert.equal(entryRoute(await api.call("bootstrap")), "/setup");
  api.execute("onboarding", { step: "profile" });
  api.execute("set_area", { areaId: demoArea.id });
  assert.equal(entryRoute(await api.call("bootstrap")), "/(tabs)/home");
  assert.equal(api.profile(), null);
  assert.equal(
    (await api.call("discover", { role: "employer", areaId: demoArea.id }))
      .length,
    2,
  );
  assert.throws(
    () => api.execute("visibility", { enabled: true }),
    /PROFILE_INCOMPLETE/,
  );
  assert.throws(
    () =>
      api.execute("request_contact", {
        targetId: "demo-employer",
        targetRole: "employer",
        consent: true,
      }),
    /PROFILE_INCOMPLETE/,
  );
});
test("switching role clears presence, restores role-specific content, preserves history", () => {
  const api = new DemoApi();
  api.actor = "demo-worker";
  api.agreements.push({
    ...agreement,
    id: "historical",
    workerId: api.actor,
  } as Agreement);
  const before = structuredClone(api.agreements);
  const tags = [...api.profile()!.tags];
  api.execute("set_role", { role: "employer" });
  assert.equal(api.profile()!.visibleUntil, null);
  assert.deepEqual(api.profile()!.tags, []);
  api.execute("set_role", { role: "worker" });
  assert.deepEqual(api.profile()!.tags, tags);
  assert.deepEqual(api.agreements, before);
});
