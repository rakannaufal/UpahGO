import { test, expect, type Page } from "@playwright/test";
import {
  demoArea,
  demoTags,
  demoCity,
  demoLocation,
} from "../../apps/mobile/src/demo";
const button = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });
test.beforeEach(async ({ page }) => {
  await page.route("https://*.supabase.co/**", (route) => route.abort());
});

for (const detail of ["contact", "agreement"] as const) {
  test(`${detail} bootstrap failure recovers without a blank screen`, async ({
    page,
    context,
  }) => {
    const actor = "11111111-1111-4111-8111-111111111111";
    const other = "22222222-2222-4222-8222-222222222222";
    const now = Math.floor(Date.now() / 1000);
    const token =
      [
        { alg: "HS256", typ: "JWT" },
        { sub: actor, aud: "authenticated", exp: now + 3600, iat: now },
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
        body: `<script>location.replace(${JSON.stringify(callback + "?code=synthetic-test-code")})</script>`,
      });
    });
    await page.route("**/auth/v1/token?**", (route) =>
      route.fulfill({
        json: {
          access_token: token,
          refresh_token: "synthetic-refresh-token",
          expires_in: 3600,
          token_type: "bearer",
          user: {
            id: actor,
            aud: "authenticated",
            role: "authenticated",
            app_metadata: {},
            user_metadata: {},
          },
        },
      }),
    );
    let bootstrapFails = true;
    await page.route("**/v1/action", async (route) => {
      const { operation } = route.request().postDataJSON();
      if (operation === "bootstrap" && bootstrapFails)
        return route.fulfill({ status: 503, json: { error: "NETWORK_ERROR" } });
      const createdAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 86400000).toISOString();
      const profile = {
        id: actor,
        name: "Akun uji sintetis",
        region: "Jakarta uji",
        areaId: demoArea.id,
        role: "employer",
        tags: ["sweep"],
        bio: "Data uji",
        whatsappReady: true,
        status: "active",
        visibleUntil: null,
      };
      const data =
        operation === "bootstrap"
          ? {
              account: {
                id: actor,
                role: "employer",
                introSeen: true,
                setupDone: true,
                browseAreaId: demoArea.id,
                status: "active",
                location: demoLocation(),
              },
              profile,
              areas: [demoArea],
              tags: demoTags,
              city: demoCity,
            }
          : operation === "contacts"
            ? [
                {
                  id: "synthetic-detail",
                  senderId: actor,
                  receiverId: other,
                  senderName: "Akun uji sintetis",
                  receiverName: "Pekerja uji",
                  senderRole: "employer",
                  receiverRole: "worker",
                  status: "pending",
                  createdAt,
                  expiresAt,
                },
              ]
            : operation === "agreements"
              ? [
                  {
                    id: "synthetic-detail",
                    contactId: "synthetic-contact",
                    workerId: other,
                    employerId: actor,
                    creatorId: actor,
                    workerName: "Pekerja uji",
                    employerName: "Akun uji sintetis",
                    title: "Pekerjaan uji sintetis",
                    tasks: "Menyapu ruang tamu",
                    wage: 150000,
                    startsAt: expiresAt,
                    timezone: "Asia/Jakarta",
                    status: "proposed",
                    paymentReceivedAt: null,
                    createdAt,
                  },
                ]
              : [];
      await route.fulfill({ json: { data } });
    });
    await page.goto("/");
    await button(page, "Masuk dengan Google").click();
    await expect(
      page.getByRole("heading", { name: "Memuat akun" }),
    ).toBeVisible();
    await page.evaluate((path) => {
      history.pushState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }, `/${detail}/synthetic-detail`);
    await expect(
      page.getByRole("heading", { name: "Memuat akun" }),
    ).toBeVisible();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(button(page, "Kembali")).toBeVisible();
    await page.screenshot({
      path: `.impeccable/review/${detail}-bootstrap-error-web.png`,
    });
    bootstrapFails = false;
    await button(page, "Coba lagi").click();
    await expect(
      page.getByRole("heading", {
        name: detail === "contact" ? "Permintaan kontak" : "Kesepakatan kerja",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(
        detail === "contact"
          ? "Menunggu persetujuan"
          : "Pekerjaan uji sintetis",
        { exact: true },
      ),
    ).toBeVisible();
  });
}
