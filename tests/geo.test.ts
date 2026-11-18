import test from "node:test";
import assert from "node:assert/strict";
import {
  distanceKm,
  inCity,
  locationFresh,
  validateLocation,
  validateReview,
} from "../shared/geo.ts";
import { DemoApi, demoCity, demoLocation } from "../apps/mobile/src/demo.ts";
import type { City, Person } from "../shared/contracts.ts";

test("city boundary excludes other cities and polygon holes", () => {
  assert.equal(inCity(demoCity, 0.507, 101.447), true);
  assert.equal(inCity(demoCity, -6.2, 106.8), false);
  const city = {
    ...demoCity,
    boundary: {
      type: "MultiPolygon",
      coordinates: [
        [
          [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ],
          [
            [4, 4],
            [6, 4],
            [6, 6],
            [4, 6],
            [4, 4],
          ],
        ],
      ],
    },
  } as City;
  assert.equal(inCity(city, 2, 2), true);
  assert.equal(inCity(city, 5, 5), false);
  assert.equal(inCity(city, Number.NaN, 5), false);
  assert.equal(
    Math.round(
      distanceKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 }),
    ),
    111,
  );
});
test("location rejects inaccurate, stale and invalid fixes", () => {
  const fix = demoLocation();
  validateLocation(fix);
  assert.throws(
    () => validateLocation({ ...fix, accuracyMeters: 1001 }),
    /LOCATION_INACCURATE/,
  );
  assert.throws(
    () => validateLocation({ ...fix, longitude: Infinity }),
    /LOCATION_REQUIRED/,
  );
  assert.throws(
    () => validateLocation({ ...fix, capturedAt: "invalid" }),
    /LOCATION_STALE/,
  );
  assert.throws(
    () =>
      validateLocation({
        ...fix,
        capturedAt: new Date(Date.now() - 6 * 60000).toISOString(),
      }),
    /LOCATION_STALE/,
  );
  assert.equal(
    locationFresh({
      ...fix,
      capturedAt: new Date(Date.now() - 31 * 60000).toISOString(),
    }),
    false,
  );
});
test("demo starts populated, automatically limits radius and applies district/job filters", () => {
  const api = new DemoApi();
  api.execute("set_role", { role: "worker" });
  assert.throws(
    () => api.execute("discover", { role: "employer" }),
    /LOCATION_REQUIRED/,
  );
  api.execute("set_location", demoLocation());
  const nearby = api.execute("discover", { role: "employer" }) as Person[];
  assert.equal(nearby.length, 5);
  assert.ok(
    nearby.every(
      (p) => p.distanceKm <= 5 && inCity(demoCity, p.latitude, p.longitude),
    ),
  );
  assert.ok(nearby.every((p) => p.ratingCount > 0 && p.ratingAverage !== null));
  assert.ok((api.execute("contacts", {}) as unknown[]).length);
  assert.ok((api.execute("agreements", {}) as unknown[]).length);
  assert.ok((api.execute("notifications", {}) as unknown[]).length);
  api.execute("set_radius", { radiusKm: 1 });
  assert.equal(
    (api.execute("discover", { role: "employer" }) as Person[]).length,
    2,
  );
  api.execute("set_radius", { radiusKm: 10 });
  assert.equal(
    (api.execute("discover", { role: "employer" }) as Person[]).length,
    6,
  );
  const filtered = api.execute("discover", {
    role: "employer",
    areaId: "demo-area",
    tag: "sweep",
  }) as Person[];
  assert.equal(filtered.length, 1);
  assert.ok(
    filtered.every((p) => p.tags.includes("sweep") && p.areaId === "demo-area"),
  );
  assert.throws(
    () =>
      api.execute("set_location", {
        ...demoLocation(),
        latitude: -6.2,
        longitude: 106.8,
      }),
    /CITY_UNAVAILABLE/,
  );
});
test("rating requires completed participation, bounded text, and one submission", () => {
  const api = new DemoApi();
  api.execute("set_role", { role: "worker" });
  const work = api.agreements.find(
    (g) => g.workerId === "demo-me" && g.status === "completed",
  )!;
  validateReview(5, "Pekerjaan rapi.");
  for (const score of [0, 6, 4.5, NaN])
    assert.throws(() => validateReview(score, ""), /REVIEW_INVALID/);
  for (const comment of [
    "a".repeat(301),
    "https://example.com",
    "Hubungi 081234567890",
  ])
    assert.throws(() => validateReview(5, comment), /REVIEW_INVALID/);
  const result = api.execute("submit_review", {
    id: work.id,
    score: 4,
    comment: "Tugas jelas.",
  }) as { score: number };
  assert.equal(result.score, 4);
  assert.throws(
    () => api.execute("submit_review", { id: work.id, score: 5 }),
    /REVIEW_EXISTS/,
  );
  api.actor = "demo-worker";
  assert.throws(
    () => api.execute("submit_review", { id: work.id, score: 5 }),
    /UNAVAILABLE/,
  );
  api.actor = "demo-me";
  work.status = "agreed";
  api.reviews = api.reviews.filter(
    (r) => r.reviewerId !== api.actor || r.agreementId !== work.id,
  );
  assert.throws(
    () => api.execute("submit_review", { id: work.id, score: 5 }),
    /REVIEW_NOT_ALLOWED/,
  );
});
