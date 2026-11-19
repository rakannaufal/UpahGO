import { test, expect } from "./fixtures";
import { DemoApi } from "../../apps/mobile/src/demo";

for (const enabled of [false, true]) {
  test(`account erasure policy ${enabled ? "enabled" : "disabled"}: honest copy, consent and retry`, async ({
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
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("https://*.supabase.co/**", (route) => route.abort());
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
        .map((value) =>
          Buffer.from(JSON.stringify(value)).toString("base64url"),
        )
        .join(".") + ".synthetic-signature";
    await context.route("**/auth/v1/authorize?**", async (route) => {
      const callback = new URL(route.request().url()).searchParams.get(
        "redirect_to",
      )!;
      await route.fulfill({
        contentType: "text/html",
        body: `<script>location.replace(${JSON.stringify(callback + "?code=synthetic-erasure-code")})</script>`,
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
    await page.route("**/auth/v1/logout?**", (route) =>
      route.fulfill({ status: 204 }),
    );
    let attempts = 0;
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/v1/action", async (route) => {
      const { operation, args } = route.request().postDataJSON();
      if (operation === "request_deletion") {
        attempts++;
        expect(args).toEqual({ confirm: true });
        if (attempts === 1)
          return route.fulfill({
            status: 503,
            json: { error: "NETWORK_ERROR" },
          });
        await pending;
      }
      let data;
      try {
        data = api.execute(operation, args);
      } catch (error) {
        return route.fulfill({
          status: 400,
          json: { error: (error as Error).message },
        });
      }
      if (operation === "bootstrap")
        Object.assign(data, {
          deletionPolicy: {
            enabled,
            version: "synthetic-test",
            workDays: 365,
            reportDays: 180,
            backupDays: 30,
          },
        });
      await route.fulfill({ json: { data } });
    });
    const button = (name: string) =>
      page.getByRole("button", { name, exact: true });
    await page.goto("/");
    await button("Masuk dengan Google").click();
    await expect(page.getByTestId("page-Beranda")).toBeVisible();
    await page.getByRole("tab", { name: "Akun", exact: true }).click();
    await button("Ketentuan dan privasi").click();
    await expect(
      page.getByText(
        /Catatan bersama dapat disimpan terbatas sesuai kebijakan retensi/,
      ),
    ).toBeVisible();
    await button("Kembali").click();
    await button("Hapus akun").click();
    await expect(
      page.getByRole("heading", { name: "Penghapusan akun", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(
        enabled
          ? /Rincian kerja dan komentar ulasan dapat disimpan 365 hari/
          : /Pemrosesan penghapusan produksi belum diaktifkan/,
      ),
    ).toBeVisible();
    await expect(button("Ajukan penghapusan")).toBeDisabled();
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `audits/2026-11-18-production/remediation/priv-001/evidence/policy-${enabled ? "enabled" : "disabled"}-${width}.png`,
        fullPage: true,
      });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    const consent = page.getByRole("checkbox");
    await consent.focus();
    await page.keyboard.press("Space");
    await expect(consent).toBeChecked();
    await page.keyboard.press("Space");
    await expect(consent).not.toBeChecked();
    await page.keyboard.press("Enter");
    await expect(consent).toBeChecked();
    await button("Ajukan penghapusan").click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(consent).toBeChecked();
    await button("Ajukan penghapusan").click();
    await expect(button("Ajukan penghapusan")).toBeDisabled();
    expect(attempts).toBe(2);
    release();
    await expect(
      page
        .getByText("Permintaan penghapusan tercatat. Akun dibatasi.", {
          exact: true,
        })
        .filter({ visible: true }),
    ).toBeVisible();
    expect(errors).toEqual([]);
    await button("Keluar akun").click();
    await expect(button("Masuk dengan Google")).toBeVisible();
  });
}
