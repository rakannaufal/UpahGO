import { test, expect, type Page } from "@playwright/test";
import {
  demoArea,
  demoTags,
  demoCity,
  demoLocation,
} from "../../apps/mobile/src/demo";
import type { Agreement, Contact, Notice } from "../../shared/contracts";
import fs from "node:fs";

const actor = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const createdAt = "2026-01-01T00:00:00.000Z";
const expiresAt = new Date(Date.now() + 86400000).toISOString();
const contact: Contact = {
  id: "old-contact",
  senderId: actor,
  receiverId: other,
  senderName: "Akun uji",
  receiverName: "Kontak lama",
  senderRole: "employer",
  receiverRole: "worker",
  status: "accepted",
  createdAt,
  expiresAt,
};
const agreement: Agreement = {
  id: "old-agreement",
  contactId: contact.id,
  workerId: other,
  employerId: actor,
  creatorId: actor,
  workerName: "Pekerja uji",
  employerName: "Akun uji",
  title: "Pekerjaan aktif lama",
  tasks: "Menyapu ruang tamu",
  wage: 150000,
  startsAt: expiresAt,
  timezone: "Asia/Jakarta",
  status: "agreed",
  paymentReceivedAt: null,
  createdAt,
};
const notice: Notice = {
  id: "old-notice",
  title: "Kabar lama",
  body: "Data pengujian sintetis",
  route: `/agreement/${agreement.id}`,
  read: false,
  createdAt,
};
const button = (p: Page, name: string) =>
  p.getByRole("button", { name, exact: true });
async function tab(p: Page, name: string) {
  await p.getByRole("tab", { name, exact: true }).click();
  await expect(
    p.getByTestId(`page-${name}`).filter({ visible: true }),
  ).toBeVisible();
}

test("history loads older records, retries in place, filters at server and ignores a stale page", async ({
  page,
  context,
}) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("https://*.supabase.co/**", (route) => route.abort());
  const now = Math.floor(Date.now() / 1000);
  const token =
    [
      { alg: "HS256", typ: "JWT" },
      { sub: actor, aud: "authenticated", exp: now + 3600, iat: now },
    ]
      .map((x) => Buffer.from(JSON.stringify(x)).toString("base64url"))
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
  let failNext = true;
  let holdNext = false;
  let release: (() => void) | undefined;
  let held = false;
  const detailCalls: string[] = [];
  await page.route("**/v1/action", async (route) => {
    const { operation, args } = route.request().postDataJSON();
    let data: unknown = [];
    if (operation === "bootstrap")
      data = {
        account: {
          id: actor,
          role: "employer",
          introSeen: true,
          setupDone: true,
          browseAreaId: demoArea.id,
          status: "active",
          location: demoLocation(),
        },
        profile: {
          id: actor,
          name: "Akun uji",
          region: "Kota uji",
          areaId: demoArea.id,
          role: "employer",
          tags: ["sweep"],
          bio: "Data sintetis",
          whatsappReady: true,
          status: "active",
          visibleUntil: null,
        },
        areas: [demoArea],
        tags: demoTags,
        city: demoCity,
      };
    if (operation === "contacts") {
      if (args.after && failNext) {
        failNext = false;
        return route.fulfill({ status: 503, json: { error: "NETWORK_ERROR" } });
      }
      if (args.after && holdNext) {
        held = true;
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      }
      if (args.filter === "active") data = [contact];
      else if (args.filter === "history") data = [];
      else
        data = args.after
          ? [contact]
          : Array.from({ length: 100 }, (_, i) => ({
              ...contact,
              id: `contact-${i}`,
              receiverName: `Kontak terbaru ${i}`,
              status: "declined",
            }));
    }
    if (operation === "agreements")
      data = args.filter === "history" ? [] : [agreement];
    if (operation === "notifications")
      data = args.after
        ? [notice]
        : Array.from({ length: 100 }, (_, i) => ({
            ...notice,
            id: `notice-${i}`,
            title: `Kabar terbaru ${i}`,
          }));
    if (operation === "contact" || operation === "agreement") {
      detailCalls.push(operation);
      expect(args.id).toBe(operation === "contact" ? contact.id : agreement.id);
      data = operation === "contact" ? contact : agreement;
    }
    if (operation === "agreement_reviews")
      data = { submitted: null, received: null };
    if (operation === "read_notification") data = { ok: true };
    await route.fulfill({ json: { data } });
  });
  await page.goto("/");
  await button(page, "Masuk dengan Google").click();
  await expect(
    page.getByRole("tab", { name: "Aktivitas", exact: true }),
  ).toBeVisible();
  await tab(page, "Aktivitas");
  await button(page, "Muat lebih banyak").click();
  await expect(button(page, "Coba muat lagi")).toBeVisible();
  await expect(
    button(page, "Kontak terbaru 0, Ditolak · Terkirim"),
  ).toBeAttached();
  await button(page, "Coba muat lagi").click();
  const oldCard = page.getByRole("button", { name: /^Kontak lama,/ });
  await expect(oldCard).toBeVisible();
  await expect(button(page, "Muat lebih banyak")).toHaveCount(0);
  fs.mkdirSync("audits/2026-11-18-production/remediation/core-001", {
    recursive: true,
  });
  await page.screenshot({
    path: "audits/2026-11-18-production/remediation/core-001/older-contact-390.png",
  });
  await oldCard.click();
  await expect(
    page.getByRole("heading", { name: "Permintaan kontak", exact: true }),
  ).toBeVisible();
  await button(page, "Kembali").click();
  await button(page, "Filter aktivitas").click();
  await page.getByRole("radio", { name: "Aktif", exact: true }).click();
  await expect(oldCard).toBeVisible();
  await button(page, "Pekerjaan").click();
  await page.getByRole("button", { name: /^Pekerjaan aktif lama,/ }).click();
  await expect(
    page.getByRole("heading", { name: "Kesepakatan kerja", exact: true }),
  ).toBeVisible();
  await button(page, "Kembali").click();
  await button(page, "Kontak").click();
  await button(page, "Filter aktivitas").click();
  await page.getByRole("radio", { name: "Semua status", exact: true }).click();
  holdNext = true;
  await button(page, "Muat lebih banyak").click();
  await expect.poll(() => held).toBe(true);
  await button(page, "Pekerjaan").click();
  await expect(
    page.getByRole("button", { name: /^Pekerjaan aktif lama,/ }),
  ).toBeVisible();
  const lateResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/v1/action") &&
      response.request().postDataJSON().operation === "contacts" &&
      response.request().postDataJSON().args.after,
  );
  release!();
  await lateResponse;
  await expect(oldCard).toHaveCount(0);
  await button(page, "Filter aktivitas").click();
  await page.getByRole("radio", { name: "Riwayat", exact: true }).click();
  await expect(
    page.getByText("Belum ada pekerjaan", { exact: true }),
  ).toBeVisible();
  await tab(page, "Notifikasi");
  await button(page, "Muat lebih banyak").click();
  const oldNotice = page.getByRole("button", {
    name: "Kabar lama, belum dibaca",
    exact: true,
  });
  await expect(oldNotice).toBeVisible();
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await oldNotice.scrollIntoViewIfNeeded();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `audits/2026-11-18-production/remediation/core-001/older-notice-${width}.png`,
    });
  }
  await oldNotice.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Kesepakatan kerja", exact: true }),
  ).toBeVisible();
  expect(detailCalls).toEqual(["contact", "agreement", "agreement"]);
  expect(errors).toEqual([]);
});
