import test from "node:test";
import assert from "node:assert/strict";
import { nativeCallbackUrl } from "../shared/native-auth.ts";

test("native callbacks use exact production or QA schemes", () => {
  assert.equal(nativeCallbackUrl(), "upahgo://auth/callback");
  assert.equal(nativeCallbackUrl("upahgo"), "upahgo://auth/callback");
  assert.equal(nativeCallbackUrl("upahgo-qa"), "upahgo-qa://auth/callback");
  for (const scheme of ["https", "upahgo-qa://evil", ["upahgo"], "", null])
    assert.throws(() => nativeCallbackUrl(scheme), /UNAUTHENTICATED/);
});

test("QA package and callback stay separate; invalid build variants fail closed", async () => {
  const previous = process.env.UPAHGO_APP_VARIANT;
  try {
    for (const variant of [undefined, "production", "qa"]) {
      if (variant === undefined) delete process.env.UPAHGO_APP_VARIANT;
      else process.env.UPAHGO_APP_VARIANT = variant;
      const { default: config } = await import(
        `../apps/mobile/app.config.ts?test-variant=${variant}`
      );
      assert.equal(config.name, variant === "qa" ? "Upahgo QA" : "Upahgo");
      assert.equal(
        config.android.package,
        variant === "qa" ? "id.upahgo.app.qa" : "id.upahgo.app",
      );
      assert.equal(
        nativeCallbackUrl(config.scheme),
        variant === "qa"
          ? "upahgo-qa://auth/callback"
          : "upahgo://auth/callback",
      );
    }
    process.env.UPAHGO_APP_VARIANT = "typo";
    await assert.rejects(
      import("../apps/mobile/app.config.ts?test-variant=invalid"),
      /INVALID_APP_VARIANT/,
    );
  } finally {
    if (previous === undefined) delete process.env.UPAHGO_APP_VARIANT;
    else process.env.UPAHGO_APP_VARIANT = previous;
  }
});
