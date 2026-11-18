import test from "node:test";
import assert from "node:assert/strict";
import { validateProfilePrice, parsePriceAmount } from "../shared/contracts.ts";
import { DemoApi } from "../apps/mobile/src/demo.ts";

test("profile price accepts bounded integer rupiah and explicit removal only", () => {
  for (const amount of [1000, 120000, 50000000])
    validateProfilePrice(amount, true);
  validateProfilePrice(null, false);
  for (const amount of [
    0,
    -1,
    999,
    50000001,
    1.5,
    NaN,
    Infinity,
    "120000",
    undefined,
  ])
    assert.throws(() => validateProfilePrice(amount, true), /PRICE_INVALID/);
  assert.throws(() => validateProfilePrice(null, true), /PRICE_INVALID/);
  assert.throws(() => validateProfilePrice(120000, "true"), /PRICE_INVALID/);
  assert.equal(parsePriceAmount("120000"), 120000);
  for (const value of ["", "1e4", "0x1000", "1000.5", "120.000", "-1000"])
    assert.throws(() => parsePriceAmount(value), /PRICE_INVALID/);
});

test("owner price survives legacy saves and role changes; clearing never changes agreed wages", () => {
  const api = new DemoApi();
  api.actor = "demo-worker";
  const profile = api.profile()!;
  const args = {
    name: profile.name,
    region: profile.region,
    areaId: profile.areaId,
    role: profile.role,
    tags: profile.tags,
    bio: profile.bio,
  };
  const wages = api.agreements.map((g) => g.wage);
  api.execute("save_profile", {
    ...args,
    priceAmount: 135000,
    priceNegotiable: true,
  });
  api.execute("save_profile", args);
  assert.equal(api.profile()!.priceAmount, 135000);
  assert.throws(
    () =>
      api.execute("save_profile", {
        ...args,
        priceAmount: 135000,
        priceNegotiable: null,
      }),
    /PRICE_INVALID/,
  );
  api.execute("set_role", { role: "employer" });
  assert.equal(api.profile()!.priceAmount, null);
  api.execute("set_role", { role: "worker" });
  assert.equal(api.profile()!.priceAmount, 135000);
  assert.equal(api.profile()!.priceNegotiable, true);
  assert.throws(
    () =>
      api.execute("save_profile", {
        ...args,
        priceAmount: 0,
        priceNegotiable: true,
      }),
    /PRICE_INVALID/,
  );
  assert.equal(api.profile()!.priceAmount, 135000);
  api.execute("save_profile", {
    ...args,
    priceAmount: null,
    priceNegotiable: false,
  });
  assert.equal(api.profile()!.priceAmount, null);
  assert.deepEqual(
    api.agreements.map((g) => g.wage),
    wages,
  );
});
