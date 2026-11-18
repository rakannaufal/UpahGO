import { test, expect } from "@playwright/test";
import { DemoApi } from "../../apps/mobile/src/demo";
import type { ActionResults } from "../../shared/contracts";

test("photo deletion distinguishes queued cleanup, retries and prevents duplicate submission", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({
    latitude: 0.507,
    longitude: 101.447,
    accuracy: 20,
  });
  const api = new DemoApi();
  api.actor = "demo-worker";
  api.profile()!.photoStatus = "pending";
  const user = "11111111-1111-4111-8111-111111111111";
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("https://*.supabase.co/**", (route) => route.abort());
  const now = Math.floor(Date.now() / 1000);
  const token =
    [
      { alg: "HS256", typ: "JWT" },
      { sub: user, aud: "authenticated", exp: now + 3600, iat: now },
    ]
      .map((value) => Buffer.from(JSON.stringify(value)).toString("base64url"))
      .join(".") + ".synthetic-signature";
  await context.route("**/auth/v1/authorize?**", async (route) => {
    const callback = new URL(route.request().url()).searchParams.get(
      "redirect_to",
    )!;
    await route.fulfill({
      contentType: "text/html",
      body: `<script>location.replace(${JSON.stringify(callback + "?code=synthetic-media-code")})</script>`,
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
          id: user,
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
    const data = structuredClone(api.execute(operation, args));
    if (operation === "bootstrap") {
      const bootstrap = data as ActionResults["bootstrap"];
      bootstrap.account.id = user;
      bootstrap.profile!.id = user;
    }
    await route.fulfill({ json: { data } });
  });
  let attempts = 0;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/v1/photo**", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({
        json: { data: { uri: null, status: api.profile()!.photoStatus } },
      });
    expect(route.request().method()).toBe("DELETE");
    expect(route.request().headers().authorization).toBe(`Bearer ${token}`);
    attempts++;
    if (attempts === 1)
      return route.fulfill({ status: 503, json: { error: "NETWORK_ERROR" } });
    await pending;
    api.profile()!.photoStatus = null;
    await route.fulfill({
      status: 202,
      json: { data: { status: null, cleanup: "queued" } },
    });
  });
  const button = (name: string) =>
    page.getByRole("button", { name, exact: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await button("Masuk dengan Google").click();
  await expect(page.getByTestId("page-Beranda")).toBeVisible();
  await page.getByRole("tab", { name: "Akun", exact: true }).click();
  await button("Foto profil (opsional)").click();
  await expect(
    page.getByText("Menunggu peninjauan. Belum tampil publik.", {
      exact: true,
    }),
  ).toBeVisible();
  await button("Hapus foto").focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText(/Penghapusan salinan server diproses terpisah/),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(button("Hapus foto dari profil")).toHaveCount(0);
  await button("Hapus foto").click();
  await button("Tutup").click();
  await expect(button("Hapus foto dari profil")).toHaveCount(0);
  await button("Hapus foto").click();
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      (await button("Hapus foto dari profil").boundingBox())!.height,
    ).toBeGreaterThanOrEqual(48);
    await page.screenshot({
      path: `audits/2026-11-18-production/remediation/media-001/evidence/confirm-${width}.png`,
    });
  }
  await button("Batal").click();
  expect(attempts).toBe(0);
  await button("Hapus foto").click();
  await button("Hapus foto dari profil").click();
  await expect(page.getByRole("alert").filter({ visible: true })).toBeVisible();
  await expect(page.getByRole("alert").filter({ visible: true })).toHaveCount(
    1,
  );
  await expect(button("Hapus foto dari profil")).toBeEnabled();
  await button("Hapus foto dari profil").click();
  await expect(button("Hapus foto dari profil")).toBeDisabled();
  expect(attempts).toBe(2);
  release();
  await expect(
    page.getByText(
      "Foto dihapus dari profil. Penghapusan salinan server masuk antrean.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(button("Hapus foto")).toHaveCount(0);
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("heading", { name: "Foto profil", exact: true }),
    ).toHaveCount(1);
    // Native-style screens scroll internally; capture the viewport without full-page resizing.
    await page.screenshot({
      path: `audits/2026-11-18-production/remediation/media-001/evidence/queued-${width}.png`,
    });
  }
  expect(errors).toEqual([]);
});
