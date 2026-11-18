import { chromium, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, "captures");
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage({ viewport: { width: 1060, height: 1100 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const button = (name) => page.getByRole("button", { name, exact: true });
const captures = [];
async function capture(name, width = 412) {
  await page.setViewportSize({ width, height: 1100 });
  await page.evaluate(() => document.fonts.ready);
  const device = page.locator("#device");
  await expect(device).toBeVisible();
  const overflow = await page.evaluate(() => [...document.querySelectorAll(".device,.content,.person-card,.section,.profile-summary")].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.className));
  expect(overflow).toEqual([]);
  await device.screenshot({ path: path.join(output, `${name}.png`) });
  captures.push(name);
}
try {
  await page.goto(pathToFileURL(path.join(root, "index.html")).href);
  await capture("cards-employer");
  await button("Lihat profil Rumah Bu Rina").click();
  await capture("profile-top");
  await button("Akses dan kondisi lokasi").click();
  await expect(page.getByText("2 area · lantai dasar.", { exact: false })).toBeVisible();
  await capture("profile-details");
  await button("Tawar upah").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(button("Minta izin · simulasi")).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(button("Tawar upah")).toBeFocused();
  await button("Tawar upah").click();
  await page.locator("#consent").check();
  await button("Minta izin · simulasi").click();
  await expect(button("Simulasikan izin disetujui")).toBeVisible();
  await capture("contact-pending");
  await button("Simulasikan izin disetujui").click();
  await capture("offer");
  await page.locator("#amount").fill("0");
  await button("Tinjau usulan").click();
  await expect(page.getByText("Isi total Rp1.000 sampai Rp50.000.000.")).toBeVisible();
  await expect(page.locator("#amount")).toHaveValue("0");
  await capture("offer-validation");
  await page.locator("#amount").fill("100000");
  await page.locator("#message").fill("Dua area, alat sudah tersedia. <b>contoh</b>");
  await button("Tinjau usulan").click();
  await expect(page.getByText("Dua area, alat sudah tersedia. <b>contoh</b>")).toBeVisible();
  expect(await page.locator("#content b").count()).toBe(0);
  await button("Kembali").click();
  await expect(page.locator("#amount")).toHaveValue("100.000");
  await expect(page.locator("#message")).toHaveValue("Dua area, alat sudah tersedia. <b>contoh</b>");
  await page.locator("#message").fill("Dua area, alat sudah tersedia.");
  await button("Tinjau usulan").click();
  await capture("offer-review");
  await button("Simpan draf · simulasi").click();
  await expect(page.getByText("Tidak ada tawaran dikirim.", { exact: false })).toBeVisible();
  await button("Edit usulan").click();
  await expect(page.locator("#amount")).toHaveValue("100.000");
  await button("Kartu profil").click();
  await button("Cari tenaga").click();
  await capture("cards-worker");
  await button("Lihat profil Dimas Saputra").click();
  await capture("worker-profile");
  await button("Tanpa harga").click();
  await capture("missing-price");
  await expect(page.getByText("Harga belum diisi")).toBeVisible();
  await expect(page.locator(".profile-price")).not.toContainText("Rp");
  await button("Reset konsep").click();
  await button("Kartu profil").click();
  await button("Nama & tag panjang").click();
  await capture("cards-long-320", 320);
  await button("Lihat profil Rumah Keluarga Bu Rina di Sukajadi").click();
  await capture("profile-long-320", 320);
  await button("Gagal memuat").click();
  await expect(button("Coba lagi")).toBeVisible();
  await button("Coba lagi").click();
  await expect(page.locator(".person-card")).toHaveCount(2);
  await page.getByRole("searchbox").fill("xyz");
  await expect(page.getByText("Belum ada yang cocok")).toBeVisible();
  await button("Hapus pencarian").click();
  await expect(page.locator(".person-card")).toHaveCount(2);
  await button("Memuat").click();
  await expect(page.getByRole("status")).toContainText("Memuat profil contoh");
  await button("Reset konsep").click();
  await capture("cards-320", 320);
  await button("Lihat profil Rumah Bu Rina").click();
  await capture("profile-320", 320);
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.screenshot({ path: path.join(output, "review-desktop.png"), fullPage: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await button("Tawar upah").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(button("Tawar upah")).toBeFocused();
  const ratios = await page.evaluate(() => {
    const luminance = (color) => {
      const values = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => {v /= 255;return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4});
      return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
    };
    return [...document.querySelectorAll("#device span,#device p,#device h1,#device h2,#device h3,#device small,#device strong,#device button")].filter(e => e.getClientRects().length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())).map(e => {
      const style = getComputedStyle(e);
      let ancestor=e, background;
      while(ancestor){const bg=getComputedStyle(ancestor).backgroundColor;if(bg!=="rgba(0, 0, 0, 0)" && bg!=="transparent"){background=bg;break}ancestor=ancestor.parentElement}
      const a=luminance(style.color),b=luminance(background||"rgb(255,255,255)");
      return {text:e.textContent.slice(0,60),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
    });
  });
  expect(ratios.filter(r=>r.ratio<4.5)).toEqual([]);
  expect(errors).toEqual([]);
  const results = { scope: "Standalone concept, Chrome web only; no app/backend changes", captures, pageErrors: errors, minimumMeasuredTextContrast: Math.min(...ratios.map(r=>r.ratio)), checks: ["320/412 containment", "worker/employer price labels", "missing price", "long name/tags", "consent gate and pending", "numeric validation and preserved input", "review/edit/memory-only draft", "HTML escaping", "search/empty/retry/loading", "keyboard Escape/focus restoration", "reduced motion"] };
  fs.writeFileSync(path.join(root,"verification.json"), JSON.stringify(results,null,2));
  console.log(JSON.stringify(results,null,2));
} finally {
  await browser.close();
}
