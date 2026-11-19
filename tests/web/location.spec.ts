import type { Page, BrowserContext } from "@playwright/test";
import { test, expect } from "./fixtures";
import { DemoApi, demoLocation } from "../../apps/mobile/src/demo";
const button = (p: Page, name: string) =>
  p.getByRole("button", { name, exact: true });
async function installLiveFixture(page: Page, context: BrowserContext) {
  const api = new DemoApi();
  api.actor = "demo-worker";
  api.accounts[api.actor]!.location = null;
  const writes: Record<string, unknown>[] = [];
  const failures = { nextBootstrap: false };
  const now = Math.floor(Date.now() / 1000);
  const token =
    [
      { alg: "HS256", typ: "JWT" },
      {
        sub: "11111111-1111-4111-8111-111111111111",
        aud: "authenticated",
        exp: now + 3600,
        iat: now,
      },
    ]
      .map((v) => Buffer.from(JSON.stringify(v)).toString("base64url"))
      .join(".") + ".synthetic-signature";
  await context.route("**/auth/v1/authorize?**", async (route) => {
    const callback = new URL(route.request().url()).searchParams.get(
      "redirect_to",
    )!;
    await route.fulfill({
      contentType: "text/html",
      body: `<script>location.replace(${JSON.stringify(callback + "?code=synthetic-location-test")})</script>`,
    });
  });
  await page.route("**/auth/v1/token?**", (route) =>
    route.fulfill({
      json: {
        access_token: token,
        refresh_token: "synthetic-refresh",
        expires_in: 3600,
        token_type: "bearer",
        user: {
          id: "11111111-1111-4111-8111-111111111111",
          aud: "authenticated",
          role: "authenticated",
          app_metadata: {},
          user_metadata: {},
        },
      },
    }),
  );
  await page.route("**/v1/action", async (route) => {
    const { operation, args } = route.request().postDataJSON();
    if (operation === "set_location") writes.push(args);
    if (operation === "bootstrap" && failures.nextBootstrap) {
      failures.nextBootstrap = false;
      await route.fulfill({ status: 503, json: { error: "NETWORK_ERROR" } });
      return;
    }
    try {
      await route.fulfill({ json: { data: api.execute(operation, args) } });
    } catch (e) {
      await route.fulfill({
        status: 400,
        json: { error: (e as Error).message },
      });
    }
  });
  return { api, writes, failures };
}
test("live GPS permission rejection, inaccurate fix and successful retry", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["geolocation"]);
  const { writes } = await installLiveFixture(page, context);
  await page.addInitScript(() => {
    const state = { mode: "denied" };
    Object.assign(window, { syntheticGPS: state });
    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition(
          success: PositionCallback,
          error: PositionErrorCallback,
        ) {
          if (state.mode === "denied")
            error({ code: 1 } as GeolocationPositionError);
          else
            success({
              coords: {
                latitude: 0.507,
                longitude: 101.447,
                accuracy: state.mode === "inaccurate" ? 1500 : 20,
              },
              timestamp: Date.now() - (state.mode === "stale" ? 6 * 60000 : 0),
            } as GeolocationPosition);
        },
      },
    });
  });
  await page.goto("/");
  await button(page, "Masuk dengan Google").click();
  await expect(
    page.getByRole("heading", { name: "Lokasi & jangkauan", exact: true }),
  ).toBeVisible();
  await page.getByRole("radio", { name: "3 km", exact: true }).check();
  await button(page, "Aktifkan lokasi").click();
  await expect(page.getByText(/Izin lokasi ditolak/)).toBeVisible();
  expect(writes.length).toBe(0);
  await page.evaluate(() => {
    (
      window as unknown as { syntheticGPS: { mode: string } }
    ).syntheticGPS.mode = "inaccurate";
  });
  await button(page, "Aktifkan lokasi").click();
  await expect(page.getByText(/Lokasi belum cukup akurat/)).toBeVisible();
  expect(writes.length).toBe(0);
  await page.evaluate(() => {
    (
      window as unknown as { syntheticGPS: { mode: string } }
    ).syntheticGPS.mode = "stale";
  });
  await button(page, "Aktifkan lokasi").click();
  await expect(
    page.getByText(/Perbarui lokasi untuk melanjutkan/),
  ).toBeVisible();
  expect(writes.length).toBe(0);
  await page.evaluate(() => {
    (
      window as unknown as { syntheticGPS: { mode: string } }
    ).syntheticGPS.mode = "ready";
  });
  await button(page, "Aktifkan lokasi").click();
  await expect(page.getByTestId("page-Beranda")).toBeVisible();
  expect(writes.length).toBeGreaterThan(0);
  expect(writes[0]!.radiusKm).toBe(3);
  expect("cityId" in writes[0]!).toBe(false);
  await expect(
    page.getByRole("button", { name: /Rumah Bu Rina, .*Lihat profil/ }),
  ).toBeVisible();
});
test("GPS bootstrap failure stays recoverable; foreground retains the changed radius", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({
    latitude: 0.507,
    longitude: 101.447,
    accuracy: 20,
  });
  const { writes, failures } = await installLiveFixture(page, context);
  await page.goto("/");
  await button(page, "Masuk dengan Google").click();
  await expect(button(page, "Aktifkan lokasi")).toBeVisible();
  failures.nextBootstrap = true;
  await button(page, "Aktifkan lokasi").click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(button(page, "Aktifkan lokasi")).toBeVisible();
  await button(page, "Aktifkan lokasi").click();
  await expect(page.getByTestId("page-Beranda")).toBeVisible();
  await button(page, "Lokasi dan radius").click();
  await page.getByRole("radio", { name: "3 km", exact: true }).check();
  await button(page, "Terapkan").click();
  await expect.poll(() => writes.at(-1)?.radiusKm).toBe(3);
  const before = writes.length;
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => writes.length).toBeGreaterThan(before);
  expect(writes.at(-1)?.radiusKm).toBe(3);
});
test("GPS outside supported city never falls back to a different location", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({
    latitude: -6.2,
    longitude: 106.8,
    accuracy: 20,
  });
  const { api, writes } = await installLiveFixture(page, context);
  await page.goto("/");
  await button(page, "Masuk dengan Google").click();
  await button(page, "Aktifkan lokasi").click();
  await expect(page.getByText(/Wilayah ini belum tersedia/)).toBeVisible();
  expect(writes.length).toBe(1);
  expect(api.accounts[api.actor]!.location).toBe(null);
  await expect(
    page.getByRole("radio", { name: "5 km", exact: true }),
  ).toBeChecked();
  await context.setGeolocation({
    latitude: demoLocation().latitude,
    longitude: demoLocation().longitude,
    accuracy: 20,
  });
  await button(page, "Aktifkan lokasi").click();
  await expect(page.getByTestId("page-Beranda")).toBeVisible();
});
test("map tile failure keeps approximate markers and list usable", async ({
  page,
}) => {
  await page.route("https://tile.openstreetmap.org/**", (r) => r.abort());
  await page.goto("/");
  await button(page, "Coba demo").click();
  await button(page, "Lewati").click();
  await page
    .getByRole("radio", { name: "Cari kerja · Buruh", exact: true })
    .check();
  await button(page, "Lanjut").click();
  await button(page, "Gunakan lokasi demo").click();
  await button(page, "Lewati dulu").click();
  await page.getByRole("tab", { name: "Temukan", exact: true }).click();
  await expect(
    page.getByText(
      "Peta dasar belum termuat. Titik dan daftar tetap tersedia.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(button(page, "2 akun di Sukajadi")).toBeVisible();
  await button(page, "Lihat daftar").click();
  await expect(
    page.getByRole("button", { name: /, Penyedia kerja, .*Lihat profil/ }),
  ).toHaveCount(5);
});
