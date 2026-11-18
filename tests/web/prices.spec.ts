import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";

const button = (p: Page, name: string) =>
  p.getByRole("button", { name, exact: true });
const output = ".impeccable/review/profile-pricing";
async function tab(p: Page, name: string) {
  await p.getByRole("tab", { name, exact: true }).click();
  await expect(
    p.getByTestId(`page-${name}`).filter({ visible: true }),
  ).toBeVisible();
}
async function actor(p: Page, name: string) {
  await tab(p, "Akun");
  await button(p, name).click();
  await expect(p.getByTestId("page-Beranda")).toBeVisible();
}
async function enter(p: Page) {
  await p.goto("/");
  await button(p, "Coba demo").click();
  await button(p, "Lewati").click();
  await p
    .getByRole("radio", { name: "Cari kerja · Buruh", exact: true })
    .check();
  await button(p, "Lanjut").click();
  await button(p, "Gunakan lokasi demo").click();
  await button(p, "Lewati dulu").click();
  await expect(p.getByTestId("page-Beranda")).toBeVisible();
}

test("profile price edits, contact consent and negotiated agreement stay separate", async ({
  page: p,
}) => {
  test.setTimeout(120000);
  fs.mkdirSync(output, { recursive: true });
  const errors: string[] = [];
  const captures: string[] = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.emulateMedia({ reducedMotion: "reduce" });
  await p.route("https://*.supabase.co/**", (r) => r.abort());
  await p.setViewportSize({ width: 412, height: 892 });
  const capture = async (name: string) => {
    await expect(
      p.locator('[aria-busy="true"]').filter({ visible: true }),
    ).toHaveCount(0);
    await expect(
      p.getByText("Memuat data…", { exact: true }).filter({ visible: true }),
    ).toHaveCount(0);
    const reveal = p.getByTestId("content-reveal").filter({ visible: true });
    if (await reveal.count())
      await expect(reveal.last()).toHaveCSS("opacity", "1");
    expect(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (!process.env.UPAHGO_SKIP_CAPTURES)
      await p.screenshot({ path: `${output}/${name}.png` });
    captures.push(name);
  };
  const checkLabel = async (label: string) => {
    const input = p.getByLabel(label, { exact: true });
    await input.scrollIntoViewIfNeeded();
    const labelBox = (await p
      .getByText(label, { exact: true })
      .filter({ visible: true })
      .boundingBox())!;
    const inputBox = (await input.boundingBox())!;
    expect(labelBox.y + labelBox.height).toBeLessThanOrEqual(inputBox.y);
  };

  await enter(p);
  // Employer detail exposes real task facts and an accessible disclosure.
  await p
    .getByRole("button", { name: /^Rumah Bu Rina, .*Lihat profil/ })
    .click();
  await expect(
    p.getByText("Anggaran pekerjaan", { exact: true }),
  ).toBeVisible();
  await expect(
    p.getByTestId("page-Profil").getByText("Rp 120.000", { exact: true }),
  ).toBeVisible();
  for (const width of [320, 412, 1440]) {
    await p.setViewportSize({ width, height: 892 });
    await capture(`employer-detail-${width}`);
  }
  const access = button(p, "Akses dan kondisi lokasi");
  await access.click();
  await expect(access).toHaveAttribute("aria-expanded", "true");
  await expect(p.getByText(/Jarak jalan\/angkut/)).toBeVisible();
  await capture("employer-conditions-1440");
  await access.focus();
  await p.keyboard.press("Enter");
  await expect(access).toHaveAttribute("aria-expanded", "false");
  await button(p, "Kembali").click();

  await actor(p, "Buruh demo");
  await tab(p, "Akun");
  await button(p, "Edit profil").click();
  const price = p.getByLabel("Tarif mulai (Rp, opsional)", { exact: true });
  await price.fill("999");
  await button(p, "Simpan profil").click();
  await expect(p.getByRole("alert")).toContainText("nominal");
  await expect(price).toHaveValue("999");
  await price.fill("135000");
  await expect(price).toHaveValue("135.000");
  await expect(p.getByRole("alert")).toHaveCount(0);
  const negotiable = p.getByRole("checkbox", {
    name: "Harga bisa dinegosiasikan",
    exact: true,
  });
  await negotiable.check();
  for (const width of [320, 412, 1440]) {
    await p.setViewportSize({ width, height: 892 });
    await price.scrollIntoViewIfNeeded();
    await checkLabel("Tarif mulai (Rp, opsional)");
    await capture(`edit-price-${width}`);
  }
  await button(p, "Simpan profil").click();
  await tab(p, "Temukan");
  await button(p, "Tidak tampil").click();
  await p.getByRole("switch", { name: "Tampil di peta", exact: true }).click();
  await button(p, "Tutup").click();
  await actor(p, "Penyedia kerja demo");
  const dimas = p.getByRole("button", {
    name: /^Dimas Saputra, .*Lihat profil/,
  });
  await expect(dimas).toContainText("Rp 135.000");
  await expect(dimas).toContainText("Bisa nego");
  for (const width of [320, 412, 1440]) {
    await p.setViewportSize({ width, height: 892 });
    await capture(`cards-${width}`);
    await dimas.scrollIntoViewIfNeeded();
    await capture(`card-details-${width}`);
  }
  await dimas.click();
  await expect(
    p.getByTestId("page-Profil").getByText("Rp 135.000", { exact: true }),
  ).toBeVisible();
  await expect(p.getByText("Menyapu ruangan", { exact: true })).toBeVisible();
  for (const width of [320, 412, 1440]) {
    await p.setViewportSize({ width, height: 892 });
    await capture(`worker-detail-${width}`);
    expect(
      (await button(p, "Tawar upah").boundingBox())!.height,
    ).toBeGreaterThanOrEqual(48);
  }
  await p.setViewportSize({ width: 412, height: 892 });
  await button(p, "Tawar upah").click();
  await expect(button(p, "Kirim permintaan kontak")).toBeDisabled();
  await p.getByRole("checkbox").check();
  await button(p, "Kirim permintaan kontak").click();
  await expect(
    p.getByText("Menunggu persetujuan", { exact: true }),
  ).toBeVisible();
  await expect(button(p, "Tawar upah")).toHaveCount(0);
  await expect(button(p, "Buka WhatsApp")).toHaveCount(0);
  await button(p, "Kembali").click();
  await actor(p, "Buruh demo");
  await tab(p, "Aktivitas");
  await p
    .getByRole("button", { name: /Rumah Bu Rina, Menunggu persetujuan/ })
    .click();
  await expect(button(p, "Setujui dan bagikan nomor")).toBeDisabled();
  await p.getByRole("checkbox").check();
  await button(p, "Setujui dan bagikan nomor").click();
  await button(p, "Tawar upah").click();
  await expect(
    p.getByText("Anggaran pekerjaan", { exact: true }),
  ).toBeVisible();
  await button(p, "Tinjau usulan").click();
  await expect(p.getByRole("alert")).toBeVisible();
  const offer = p.getByLabel("Total upah yang diusulkan (Rp)", { exact: true });
  await offer.fill("125000");
  await expect(p.getByRole("alert")).toHaveCount(0);
  await p
    .getByLabel("Catatan usulan (opsional)", { exact: true })
    .fill("Sapu dan pel ruang tamu. Alat dari pemberi kerja.");
  for (const width of [320, 412, 1440]) {
    await p.setViewportSize({ width, height: 892 });
    await checkLabel("Total upah yang diusulkan (Rp)");
    await checkLabel("Catatan usulan (opsional)");
    await capture(`offer-${width}`);
  }
  await button(p, "Tinjau usulan").click();
  await expect(
    p.getByText("Rp 125.000", { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  await expect(
    p.getByText("Usulan belum dikirim.", { exact: false }),
  ).toBeVisible();
  await capture("offer-review-1440");
  await button(p, "Edit usulan").click();
  await expect(offer).toHaveValue("125.000");
  await button(p, "Kembali").click();
  await button(p, "Lanjut mengisi").click();
  await expect(offer).toHaveValue("125.000");
  await button(p, "Tinjau usulan").click();
  await button(p, "Lanjut ke rincian kerja").click();
  await expect(
    p.getByLabel("Total upah tunai (Rp)", { exact: true }),
  ).toHaveValue("125.000");
  await expect(
    p.getByLabel("Tugas dan batas pekerjaan", { exact: true }),
  ).toHaveValue("Sapu dan pel ruang tamu. Alat dari pemberi kerja.");
  await p
    .getByLabel("Judul pekerjaan", { exact: true })
    .fill("Sesi bersih ruang tamu");
  await p
    .getByLabel("Tanggal pekerjaan", { exact: true })
    .fill(new Date(Date.now() + 172800000).toISOString().slice(0, 10));
  await button(p, "Tinjau kesepakatan").click();
  await expect(
    p.getByText("Total upah tunai di tempat", { exact: true }),
  ).toBeVisible();
  await button(p, "Kirim kesepakatan").click();
  await expect(
    p.getByText("Menunggu kesepakatan", { exact: true }),
  ).toBeVisible();
  await expect(button(p, "Uang tunai sudah diterima")).toHaveCount(0);
  await button(p, "Kembali").click();
  await button(p, "Kembali").click();
  await actor(p, "Penyedia kerja demo");
  await tab(p, "Aktivitas");
  await button(p, "Pekerjaan").click();
  await p.getByRole("button", { name: /Sesi bersih ruang tamu/ }).click();
  await expect(
    p
      .getByTestId("page-Kesepakatan kerja")
      .getByText("Rp 125.000", { exact: true }),
  ).toBeVisible();
  await button(p, "Setujui pekerjaan").click();
  await button(p, "Konfirmasi").click();
  await expect(p.getByText("Disepakati", { exact: true })).toBeVisible();
  await expect(button(p, "Uang tunai sudah diterima")).toHaveCount(0);
  await button(p, "Kembali").click();
  await actor(p, "Buruh demo");
  await tab(p, "Akun");
  await button(p, "Edit profil").click();
  await expect(price).toHaveValue("135.000");
  await price.fill("50000000");
  await button(p, "Simpan profil").click();
  await tab(p, "Temukan");
  await button(p, "Tidak tampil").click();
  await p.getByRole("switch", { name: "Tampil di peta", exact: true }).click();
  await button(p, "Tutup").click();
  await actor(p, "Penyedia kerja demo");
  await p.setViewportSize({ width: 320, height: 892 });
  await expect(dimas).toContainText("Rp 50.000.000");
  await dimas.scrollIntoViewIfNeeded();
  const maximumPrice = dimas.getByText("Rp 50.000.000", { exact: true });
  expect((await maximumPrice.boundingBox())!.height).toBeLessThanOrEqual(25);
  await capture("maximum-price-320");
  await actor(p, "Buruh demo");
  await tab(p, "Akun");
  await button(p, "Edit profil").click();
  await expect(price).toHaveValue("50.000.000");
  await price.fill("");
  await expect(negotiable).not.toBeChecked();
  await expect(negotiable).toBeDisabled();
  await button(p, "Simpan profil").click();
  await tab(p, "Temukan");
  await button(p, "Tidak tampil").click();
  await p.getByRole("switch", { name: "Tampil di peta", exact: true }).click();
  await button(p, "Tutup").click();
  await actor(p, "Penyedia kerja demo");
  await expect(dimas).toContainText("Harga belum diisi");
  await expect(dimas).not.toContainText("Rp 50.000.000");
  await dimas.click();
  await expect(button(p, "Tawar upah")).toHaveCount(0);
  await expect(
    p.getByTestId("page-Profil").getByText("Bahas bersama", { exact: true }),
  ).toBeVisible();
  await capture("no-price-320");
  expect(errors).toEqual([]);
  if (!process.env.UPAHGO_SKIP_CAPTURES)
    fs.writeFileSync(
      `${output}/captures.json`,
      JSON.stringify(
        {
          platform: "Chrome web preview, synthetic demo",
          captures,
          pageErrors: errors,
        },
        null,
        2,
      ),
    );
});
