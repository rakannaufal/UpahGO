import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
await mkdir(".impeccable/review", { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
});
await page.route("https://*.supabase.co/**", (r) => r.abort());
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const captures = [];
const button = (name) => page.getByRole("button", { name, exact: true });
async function shot(name) {
  await expect(
    page.getByText("Memuat data...", { exact: true }).filter({ visible: true }),
  ).toHaveCount(0);
  // Native Animated layout and floating labels must settle after navigation/resizing.
  await page.waitForTimeout(350);
  await page.screenshot({ path: `.impeccable/review/${name}.png` });
  captures.push({
    name,
    width: page.viewportSize().width,
    height: page.viewportSize().height,
  });
}
async function tab(name) {
  await page.getByRole("tab", { name, exact: true }).click();
  await expect(
    page.getByTestId(`page-${name}`).filter({ visible: true }),
  ).toBeVisible();
}
await page.goto("http://localhost:8081");
await expect(button("Coba demo")).toBeVisible();
await shot("login-web");
await button("Coba demo").click();
await expect(button("Lewati")).toBeVisible();
await shot("onboarding-web");
await button("Lanjut").click();
await expect(page.getByText("Temukan di peta", { exact: false })).toBeVisible();
await shot("onboarding-map-web");
await button("Lanjut").click();
await expect(button("Pilih peran")).toBeVisible();
await shot("onboarding-cod-web");
await button("Pilih peran").click();
await expect(
  page.getByRole("heading", { name: "Kamu ingin apa?", exact: true }),
).toBeVisible();
await shot("role-web");
await page
  .getByRole("radio", { name: "Cari kerja · Buruh", exact: true })
  .check();
await button("Lanjut").click();
await expect(button("Gunakan lokasi demo")).toBeVisible();
await shot("location-web");
await button("Gunakan lokasi demo").click();
await expect(button("Simpan profil")).toBeVisible();
await shot("setup-web");
await button("Lewati dulu").click();
const cards = page.getByRole("button", {
  name: /, Penyedia kerja, .*Lihat profil/,
});
await expect(cards).toHaveCount(5);
await shot("mobile");
await page.setViewportSize({ width: 320, height: 740 });
await shot("compact-web");
await page.setViewportSize({ width: 504, height: 812 });
await shot("reference-width-web");
await page.setViewportSize({ width: 1440, height: 1000 });
await shot("desktop");
await page.setViewportSize({ width: 390, height: 844 });
await button("Filter pekerjaan").click();
await expect(
  page.getByRole("heading", { name: "Filter pekerjaan", exact: true }),
).toBeVisible();
await shot("job-filter-web");
await button("Tutup").click();
await button("Lokasi dan radius").click();
await expect(button("Terapkan")).toBeVisible();
await shot("radius-filter-web");
await button("Tutup").click();
await tab("Temukan");
await expect(button("2 akun di Sukajadi")).toBeVisible();
await page
  .locator(".leaflet-tile-loaded")
  .first()
  .waitFor({ state: "attached", timeout: 10000 })
  .catch(() => {});
await shot("map-web");
await page.setViewportSize({ width: 320, height: 740 });
await shot("map-compact-web");
await page.setViewportSize({ width: 1440, height: 1000 });
await shot("map-desktop-web");
await page.setViewportSize({ width: 390, height: 844 });
await button("2 akun di Sukajadi").click();
await expect(
  page.getByRole("heading", { name: "Akun di area ini", exact: true }),
).toBeVisible();
await shot("map-group-web");
await page.getByRole("button", { name: /^Rumah Bu Rina, / }).click();
await expect(button("Lihat profil")).toBeVisible();
await shot("map-person-web");
await button("Lihat profil").click();
await expect(
  page.getByText("Tugas jelas, upah dibayar sesuai kesepakatan.", {
    exact: true,
  }),
).toBeVisible();
await shot("profile-web");
await button("Kembali").click();
await button("Tidak tampil").click();
await expect(
  page.getByRole("heading", { name: "Pengaturan peta", exact: true }),
).toBeVisible();
await shot("map-settings-web");
await button("Tutup").click();
await tab("Aktivitas");
await expect(
  page.getByRole("button", { name: /Rumah Bu Rina, Menunggu persetujuan/ }),
).toBeVisible();
await shot("activity-web");
await button("Pekerjaan").click();
await expect(
  page.getByRole("button", { name: /Bersihkan rumah sore ini/ }),
).toBeVisible();
await shot("work-web");
await page.getByRole("button", { name: /Bersih dapur mingguan/ }).click();
await expect(button("Nilai penyedia kerja")).toBeVisible();
await shot("completed-work-web");
await button("Nilai penyedia kerja").click();
await page.getByRole("radio", { name: "5 bintang", exact: true }).check();
await page
  .getByLabel("Ulasan (opsional)", { exact: true })
  .fill("Tugas jelas, upah sesuai kesepakatan.");
await shot("rating-web");
await button("Kirim penilaian").click();
await expect(page.getByText("Penilaianmu", { exact: true })).toBeVisible();
await shot("rating-submitted-web");
await button("Kembali").click();
await button("Kontak").click();
await page
  .getByRole("button", { name: /Rumah Bu Rina, Menunggu persetujuan/ })
  .click();
await expect(button("Setujui dan bagikan nomor")).toBeVisible();
await shot("contact-consent-web");
await page.getByRole("checkbox").check();
await button("Setujui dan bagikan nomor").click();
await button("Buat kesepakatan kerja").click();
await page
  .getByLabel("Judul pekerjaan", { exact: true })
  .fill("Bersihkan ruang tamu");
await page
  .getByLabel("Tugas dan batas pekerjaan", { exact: true })
  .fill("Menyapu dan mengepel ruang tamu. Alat disediakan pemberi kerja.");
await page.getByLabel("Total upah tunai (Rp)", { exact: true }).fill("150000");
await page
  .getByLabel("Tanggal pekerjaan", { exact: true })
  .fill(new Date(Date.now() + 172800000).toISOString().slice(0, 10));
await page.getByLabel("Jam mulai", { exact: true }).fill("09:00");
await shot("agreement-form-web");
await button("Tinjau kesepakatan").click();
await expect(button("Kirim kesepakatan")).toBeVisible();
await shot("agreement-review-web");
await button("Kembali").click();
await button("Buang perubahan").click();
await button("Kembali").click();
await tab("Notifikasi");
await expect(
  page.getByRole("button", { name: /Jadwal kerja disepakati/ }),
).toBeVisible();
await shot("notices-web");
await tab("Akun");
await expect(button("Edit profil")).toBeVisible();
await shot("account-web");
await button("Edit profil").click();
await expect(page.getByLabel("Nama tampilan", { exact: true })).toHaveValue(
  "Rakan Demo",
);
await shot("edit-profile-web");
await button("Kembali").click();
await button("Foto profil (opsional)").click();
await expect(button("Pilih dari galeri")).toBeVisible();
await shot("photo-empty-web");
const chooser = page.waitForEvent("filechooser");
await button("Pilih dari galeri").click();
await (await chooser).setFiles("tests/fixtures/synthetic-photo.jpg");
await expect(page.getByRole("img", { name: "Pratinjau foto" })).toBeVisible();
await button("Potong persegi dari tengah").click();
await shot("photo-preview-web");
await page.getByRole("checkbox").check();
await button("Kirim foto").click();
await expect(
  page.getByText("Menunggu peninjauan. Belum tampil publik.", { exact: true }),
).toBeVisible();
await shot("photo-pending-web");
await button("Kembali").click();
await page.getByRole("button", { name: /^Nomor WhatsApp,/ }).click();
await expect(
  page.getByText("Nomor terverifikasi", { exact: true }),
).toBeVisible();
await shot("phone-web");
await button("Kembali").click();
await button("Bantuan dan privasi").click();
await expect(button("Rating dan ulasan")).toBeVisible();
await shot("help-web");
await button("Katalog pekerjaan").click();
await expect(
  page.getByLabel("Cari jenis pekerjaan", { exact: true }),
).toBeVisible();
await shot("catalog-web");
await page.getByLabel("Cari jenis pekerjaan", { exact: true }).fill("galon");
await shot("catalog-search-web");
await button(
  "Lainnya · Usulkan pekerjaan, Disimpan untuk peninjauan, belum menjadi layanan aktif.",
).click();
await page
  .getByLabel("Nama pekerjaan", { exact: true })
  .fill("Rapikan peralatan hobi");
await page
  .getByLabel("Rincian tugas", { exact: true })
  .fill("Rapikan peralatan di meja tanpa alat tajam atau bahan kimia.");
await shot("suggestion-form-web");
await button("Kirim usulan").click();
await expect(button("Tutup usulan")).toBeVisible();
await shot("suggestion-receipt-web");
await button("Tutup usulan").click();
await button("Kembali").click();
await button("Kembali").click();
await button("Penghapusan akun").click();
await expect(button("Ajukan penghapusan")).toBeVisible();
await shot("deletion-web");
await button("Kembali").click();
await page.getByRole("tab", { name: "Beranda", exact: true }).focus();
await page.keyboard.press("Enter");
const focus = await page.evaluate(() => ({
  outline: getComputedStyle(document.activeElement).outlineStyle,
  width: getComputedStyle(document.activeElement).outlineWidth,
}));
await writeFile(
  ".impeccable/review/browser-evidence.json",
  JSON.stringify(
    {
      scope:
        "Chrome web preview only. Synthetic profiles, GPS, work and reviews; not Android evidence.",
      captures,
      errors,
      focus,
      recordedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);
await browser.close();
console.log(JSON.stringify({ captures: captures.length, errors, focus }));
