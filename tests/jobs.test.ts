import test from "node:test";
import assert from "node:assert/strict";
import {
  jobs,
  categories,
  estimateEffort,
  validateWorkContext,
  validateJobSuggestion,
} from "../shared/jobs.ts";
import { DemoApi, demoLocation } from "../apps/mobile/src/demo.ts";
import type { Person } from "../shared/contracts.ts";
const context = {
  durationMinutes: 45,
  quantity: 1,
  loadKg: 0,
  floors: 0,
  lift: false,
  distanceMeters: 10,
  workers: 1,
  tools: "Alat tersedia",
};
test("catalog preserves historical IDs; deferred jobs never become active from a search", () => {
  assert.equal(jobs.length, 128);
  assert.equal(categories.length, 16);
  assert.equal(new Set(jobs.map((j) => j.id)).size, 128);
  assert.deepEqual(
    jobs
      .filter((j) => j.enabled)
      .map((j) => j.id)
      .sort(),
    ["sweep", "mop", "dust", "kitchen", "bathroom", "windows"].sort(),
  );
  assert.equal(jobs.find((j) => j.id === "water-carry")!.enabled, false);
});
test("effort stays unknown without details; heavy work cannot appear as light", () => {
  assert.equal(estimateEffort(["sweep"], null), "unknown");
  assert.equal(estimateEffort(["unreviewed"], context), "unknown");
  assert.equal(estimateEffort(["sweep"], context), "light");
  assert.equal(estimateEffort(["mop"], context), "medium");
  assert.equal(estimateEffort(["water-carry"], context), "heavy");
  assert.equal(
    estimateEffort(["sweep"], { ...context, floors: 2, loadKg: 10 }),
    "heavy",
  );
  for (const patch of [
    { durationMinutes: 0 },
    { loadKg: -1 },
    { quantity: 1.5 },
    { workers: 0 },
    { tools: "Telepon 081234567890" },
    { tools: "https://example.com" },
    { extra: "bad" },
  ])
    assert.throws(() => validateWorkContext({ ...context, ...patch }));
});
test("demo search, category and effort share geographic restrictions and stable sorting", () => {
  const api = new DemoApi();
  api.actor = "demo-worker";
  api.execute("set_location", demoLocation(10));
  const galon = api.execute("discover", {
    role: "employer",
    query: "galon",
    effort: "heavy",
    category: "family-4",
  }) as Person[];
  assert.equal(galon.length, 1);
  assert.ok(galon[0]!.tags.includes("water-carry"));
  assert.deepEqual(
    api.execute("discover", {
      role: "employer",
      query: "galon",
      effort: "light",
    }),
    [],
  );
  assert.equal(
    (
      api.execute("discover", {
        role: "employer",
        effort: "unknown",
      }) as Person[]
    ).length,
    1,
  );
  api.execute("set_radius", { radiusKm: 1 });
  assert.ok(
    (
      api.execute("discover", { role: "employer", query: "galon" }) as Person[]
    ).every((p) => p.distanceKm <= 1),
  );
  for (const args of [
    { offset: -1 },
    { offset: 1.5 },
    { offset: 1001 },
    { query: "x".repeat(81) },
    { sort: "unsafe" },
  ])
    assert.throws(() => api.execute("discover", { role: "employer", ...args }));
});
test("job suggestions stay private pending proposals; do not enable free tags", () => {
  const api = new DemoApi();
  api.actor = "demo-worker";
  api.execute("suggest_job", {
    title: "Pekerjaan baru",
    detail: "Rincian kebutuhan untuk ditinjau",
  });
  assert.equal((api.execute("job_suggestions", {}) as unknown[]).length, 1);
  api.actor = "demo-employer";
  assert.deepEqual(api.execute("job_suggestions", {}), []);
  assert.throws(() => validateJobSuggestion("X", "terlalu pendek"));
  assert.throws(() =>
    api.execute("save_profile", {
      name: "Akun uji",
      role: "employer",
      region: "Pekanbaru",
      tags: ["Pekerjaan baru"],
      bio: "",
    }),
  );
});
