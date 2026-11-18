import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
const button = (p: Page, name: string) =>
  p.getByRole("button", { name, exact: true });
async function tab(p: Page, name: string) {
  await p.getByRole("tab", { name, exact: true }).click();
  await expect(
    p.getByTestId(`page-${name}`).filter({ visible: true }),
  ).toBeVisible();
  await expect(p.getByRole("tab", { name, exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
}
async function enter(p: Page) {
  await p.goto("/");
  await button(p, "Coba demo").click();
  await expect(button(p, "Lewati")).toBeVisible();
  expect(
    (await button(p, "Lewati").boundingBox())!.height,
  ).toBeGreaterThanOrEqual(48);
  await button(p, "Lewati").click();
  await p
    .getByRole("radio", { name: "Cari kerja · Buruh", exact: true })
    .check();
  await button(p, "Lanjut").click();
  await p.getByRole("radio", { name: "5 km", exact: true }).check();
  await button(p, "Gunakan lokasi demo").click();
  await button(p, "Lewati dulu").click();
  await expect(p.getByTestId("page-Beranda")).toBeVisible();
  await expect(
    p.getByRole("button", { name: /Rumah Bu Rina, .*Lihat profil/ }),
  ).toBeVisible();
}
async function actor(p: Page, name: string) {
  await tab(p, "Akun");
  await button(p, name).click();
  await expect(p.getByTestId("page-Beranda")).toBeVisible();
}
async function work(p: Page) {
  await tab(p, "Aktivitas");
  expect(
    (await button(p, "Kontak").boundingBox())!.height,
  ).toBeGreaterThanOrEqual(48);
  expect(
    (await button(p, "Pekerjaan").boundingBox())!.height,
  ).toBeGreaterThanOrEqual(48);
  await button(p, "Pekerjaan").click();
  await p.getByRole("button", { name: /Bersihkan ruang tamu/ }).click();
}
async function confirm(p: Page, label: string) {
  await button(p, label).click();
  await button(p, "Konfirmasi").click();
  await expect(button(p, "Konfirmasi")).toHaveCount(0);
}
test.beforeEach(async ({ page }) => {
  await page.route("https://*.supabase.co/**", (r) => r.abort());
});
test("effort/search carry to map; role switch resets filters; optional photo stays private", async ({
  page: p,
}) => {
  await p.setViewportSize({ width: 390, height: 844 });
  await enter(p);
  await p.getByLabel("Cari pekerjaan", { exact: true }).fill("galon");
  await button(p, "Ubah filter pekerjaan").click();
  await p.getByRole("radio", { name: "Berat", exact: true }).check();
  await button(p, "Terapkan filter").click();
  const cards = p.getByRole("button", {
    name: /, Penyedia kerja, .*Lihat profil/,
  });
  await expect(cards).toHaveCount(1);
  await expect(p.getByText("Angkat galon", { exact: true })).toBeVisible();
  await tab(p, "Temukan");
  await button(p, "Lihat daftar").click();
  await expect(cards).toHaveCount(1);
  await expect(
    p.getByLabel("Cari pekerjaan", { exact: true }).filter({ visible: true }),
  ).toHaveValue("galon");
  await actor(p, "Penyedia kerja demo");
  await expect(
    p.getByLabel("Cari layanan atau buruh", { exact: true }),
  ).toHaveValue("");
  await button(p, "Filter pekerjaan").click();
  await expect(
    p.getByRole("radio", { name: "Semua tenaga", exact: true }),
  ).toBeChecked();
  await button(p, "Tutup").click();
  await tab(p, "Akun");
  await button(p, "Foto tempat (opsional)").click();
  const chooser = p.waitForEvent("filechooser");
  await button(p, "Pilih dari galeri").click();
  await (await chooser).setFiles("tests/fixtures/synthetic-photo.jpg");
  await expect(p.getByRole("img", { name: "Pratinjau foto" })).toBeVisible();
  await button(p, "Potong persegi dari tengah").click();
  await expect(button(p, "Kirim foto")).toBeDisabled();
  await p
    .getByRole("checkbox", {
      name: "Saya berhak memakai foto ini dan mengizinkan tampil publik setelah disetujui.",
      exact: true,
    })
    .check();
  await button(p, "Kirim foto").click();
  await expect(
    p.getByText(
      "Simulasi foto tersimpan di memori. Tidak diunggah atau tampil publik.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    p.getByText("Menunggu peninjauan. Belum tampil publik.", { exact: true }),
  ).toBeVisible();
  await button(p, "Hapus foto").click();
  await button(p, "Hapus foto dari profil").click();
  await expect(
    p.getByText("Foto dihapus dari profil.", { exact: true }),
  ).toBeVisible();
});
test("catalog search and private Other suggestion preserve deferred category boundaries", async ({
  page: p,
}) => {
  await enter(p);
  await tab(p, "Akun");
  await button(p, "Bantuan dan laporan").click();
  await button(p, "Katalog pekerjaan").click();
  await p.getByLabel("Cari jenis pekerjaan", { exact: true }).fill("galon");
  await expect(
    p
      .getByTestId("page-Katalog pekerjaan")
      .getByText("Mengangkat galon penuh", { exact: true }),
  ).toBeVisible();
  await button(
    p,
    "Lainnya · Usulkan pekerjaan, Disimpan untuk peninjauan, belum menjadi layanan aktif.",
  ).click();
  await p
    .getByLabel("Nama pekerjaan", { exact: true })
    .fill("Rapikan peralatan hobi");
  await p
    .getByLabel("Rincian tugas", { exact: true })
    .fill("Rapikan peralatan di meja tanpa alat tajam atau bahan kimia.");
  await button(p, "Kirim usulan").click();
  await expect(
    p.getByText(
      "Usulan tersimpan. Belum menjadi layanan aktif; operasional peninjauan belum dibuka.",
      { exact: true },
    ),
  ).toBeVisible();
  await button(p, "Tutup usulan").click();
  await expect(
    p.getByText("Rapikan peralatan hobi", { exact: true }),
  ).toBeVisible();
});

test("populated demo, two-column profile cards, city/radius/job filters and map", async ({
  page: p,
}) => {
  const errors: string[] = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.setViewportSize({ width: 390, height: 844 });
  await enter(p);
  await expect(
    p.getByRole("heading", { name: "Beranda", exact: true }),
  ).toHaveCount(0);
  const cards = p.getByRole("button", {
    name: /, Penyedia kerja, .*Lihat profil/,
  });
  await expect(cards).toHaveCount(5);
  const a = await cards.nth(0).boundingBox(),
    b = await cards.nth(1).boundingBox();
  expect(a!.y).toBe(b!.y);
  expect(b!.x).toBeGreaterThan(a!.x);
  const first = cards.first();
  await expect(first.getByTestId("profile-negotiable")).toHaveCount(1);
  await expect(first.getByTestId("rating-summary")).toContainText("5,0 (1)");
  const fixed = cards.filter({ hasText: "Rumah Kak Maya" });
  await expect(fixed.getByTestId("profile-fixed-price")).toHaveText(
    "Harga tetap",
  );
  await expect(fixed.getByTestId("profile-negotiable")).toHaveCount(0);
  await expect(fixed).toHaveAccessibleName(/Harga tetap/);
  await expect(first.getByTestId("profile-negotiable")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  await expect(
    first.getByTestId("rating-summary").locator("svg path"),
  ).toHaveAttribute("fill", "#F6BE3A");
  fs.mkdirSync(".impeccable/review/two-column-cards", { recursive: true });
  for (const width of [320, 412, 840, 1440]) {
    await p.setViewportSize({ width, height: 960 });
    await first.scrollIntoViewIfNeeded();
    const art = first.getByTestId("person-card-artwork");
    const details = first.getByTestId("person-card-details");
    const image = art.locator("svg");
    const compact = (await first.boundingBox())!.width < 260;
    await expect(image).toHaveAttribute("width", compact ? "56" : "80");
    await expect(image).toHaveAttribute("height", compact ? "56" : "80");
    const artBox = (await art.boundingBox())!;
    const detailsBox = (await details.boundingBox())!;
    const labelBox = (await first
      .getByTestId("profile-negotiable")
      .boundingBox())!;
    const priceBox = (await first
      .getByText("Rp 120.000", { exact: true })
      .boundingBox())!;
    const ratingBox = (await first
      .getByTestId("rating-summary")
      .boundingBox())!;
    if (!compact)
      expect(ratingBox.x).toBeGreaterThan(priceBox.x + priceBox.width);
    if (!compact)
      expect(
        Math.abs(
          ratingBox.y + ratingBox.height / 2 - priceBox.y - priceBox.height / 2,
        ),
      ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(
        artBox.y + artBox.height / 2 - detailsBox.y - detailsBox.height / 2,
      ),
    ).toBeLessThanOrEqual(1);
    expect(artBox.x).toBeGreaterThan(labelBox.x + labelBox.width);
    expect(priceBox.y).toBeGreaterThan(detailsBox.y + detailsBox.height);
    const boxes = await cards.evaluateAll((nodes) =>
      nodes.slice(0, 2).map((node) => node.getBoundingClientRect().toJSON()),
    );
    expect(boxes[1].y).toBe(boxes[0].y);
    expect(boxes[1].x).toBeGreaterThan(boxes[0].x);
    expect(
      await cards.evaluateAll((nodes) =>
        nodes
          .filter((node) => node.scrollWidth > node.clientWidth + 1)
          .map((node) => node.getAttribute("aria-label")),
      ),
    ).toEqual([]);
    expect(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await first.screenshot({
      path: `.impeccable/review/two-column-cards/card-${width}.png`,
    });
    const grid = (await p.getByTestId("people-grid").boundingBox())!;
    await p.screenshot({
      path: `.impeccable/review/two-column-cards/row-${width}.png`,
      clip: {
        x: grid.x,
        y: boxes[0].y,
        width: grid.width,
        height: Math.max(boxes[0].height, boxes[1].height),
      },
    });
  }
  await p.setViewportSize({ width: 390, height: 844 });
  await button(p, "Filter pekerjaan").click();
  await p
    .getByRole("radio", {
      name: "Membersihkan jendela terjangkau",
      exact: true,
    })
    .click();
  await button(p, "Terapkan filter").click();
  await expect(cards).toHaveCount(1);
  await button(p, "Ubah filter pekerjaan").click();
  await p.getByRole("radio", { name: "Semua pekerjaan", exact: true }).click();
  await button(p, "Terapkan filter").click();
  await expect(cards).toHaveCount(5);
  await button(p, "Lokasi dan radius").click();
  await p.getByRole("radio", { name: "1 km", exact: true }).check();
  await button(p, "Terapkan").click();
  await expect(cards).toHaveCount(2);
  await button(p, "Lokasi dan radius").click();
  await p.getByRole("radio", { name: "5 km", exact: true }).check();
  await p.getByRole("radio", { name: "Binawidya", exact: true }).check();
  await button(p, "Terapkan").click();
  await expect(
    p.getByText("Belum ada akun yang cocok", { exact: true }),
  ).toBeVisible();
  await button(p, "Lokasi dan radius").click();
  await p.getByRole("radio", { name: "10 km", exact: true }).check();
  await button(p, "Terapkan").click();
  await expect(cards).toHaveCount(1);
  await button(p, "Lokasi dan radius").click();
  await p.getByRole("radio", { name: "Semua kecamatan", exact: true }).check();
  await p.getByRole("radio", { name: "5 km", exact: true }).check();
  await button(p, "Terapkan").click();
  await tab(p, "Temukan");
  await expect(
    p.getByRole("heading", { name: "Temukan", exact: true }),
  ).toHaveCount(0);
  await expect(p.getByTestId("discovery-map")).toBeVisible();
  await expect(button(p, "2 akun di Sukajadi")).toBeVisible();
  await button(p, "2 akun di Sukajadi").click();
  await p.getByRole("button", { name: /^Rumah Bu Rina, / }).click();
  await expect(button(p, "Lihat profil")).toBeVisible();
  await p.keyboard.press("Escape");
  await expect(button(p, "Lihat profil")).toHaveCount(0);
  await button(p, "Lihat daftar").click();
  await expect(cards).toHaveCount(5);
  await cards.first().focus();
  await expect(cards.first()).toBeFocused();
  await p.keyboard.press("Enter");
  await expect(button(p, "Hubungi")).toBeVisible();
  await expect(p.getByText("Ulasan pekerjaan", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
test("bilateral contact, separate COD, both participants rate completed work", async ({
  page: p,
}) => {
  const errors: string[] = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await enter(p);
  await actor(p, "Penyedia kerja demo");
  await p
    .getByRole("button", { name: /^Dimas Saputra, .*Lihat profil/ })
    .click();
  await button(p, "Hubungi").click();
  await expect(button(p, "Kirim permintaan kontak")).toBeDisabled();
  await p.getByRole("checkbox").check();
  await button(p, "Kirim permintaan kontak").click();
  await expect(
    p.getByText("Menunggu persetujuan", { exact: true }),
  ).toBeVisible();
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
  await button(p, "Buka WhatsApp").click();
  await expect(
    p.getByText("Simulasi: WhatsApp tidak dibuka.", { exact: true }),
  ).toBeVisible();
  await button(p, "Buat kesepakatan kerja").click();
  await p
    .getByLabel("Judul pekerjaan", { exact: true })
    .fill("Bersihkan ruang tamu");
  await p
    .getByLabel("Tugas dan batas pekerjaan", { exact: true })
    .fill("Menyapu dan mengepel ruang tamu. Alat disediakan pemberi kerja.");
  await p.getByLabel("Total upah tunai (Rp)", { exact: true }).fill("150000");
  await p
    .getByLabel("Tanggal pekerjaan", { exact: true })
    .fill(new Date(Date.now() + 172800000).toISOString().slice(0, 10));
  await p.getByLabel("Jam mulai", { exact: true }).fill("09:00");
  await button(p, "Tinjau kesepakatan").click();
  await expect(
    p.getByText("Total upah tunai di tempat", { exact: true }),
  ).toBeVisible();
  await button(p, "Kirim kesepakatan").click();
  await expect(
    p.getByText("Menunggu kesepakatan", { exact: true }),
  ).toBeVisible();
  await expect(button(p, "Nilai penyedia kerja")).toHaveCount(0);
  await button(p, "Kembali").click();
  await button(p, "Kembali").click();
  await actor(p, "Penyedia kerja demo");
  await work(p);
  await confirm(p, "Setujui pekerjaan");
  await button(p, "Kembali").click();
  await actor(p, "Buruh demo");
  await work(p);
  await confirm(p, "Ajukan pekerjaan selesai");
  await button(p, "Kembali").click();
  await actor(p, "Penyedia kerja demo");
  await work(p);
  await confirm(p, "Konfirmasi hasil selesai");
  await expect(
    p.getByText("Belum ada pengakuan uang diterima.", { exact: false }),
  ).toBeVisible();
  await expect(button(p, "Uang tunai sudah diterima")).toHaveCount(0);
  await button(p, "Nilai buruh").click();
  await expect(button(p, "Kirim penilaian")).toBeDisabled();
  await p.getByRole("radio", { name: "5 bintang", exact: true }).check();
  await p
    .getByLabel("Ulasan (opsional)", { exact: true })
    .fill("Rapi, tepat waktu.");
  await button(p, "Kirim penilaian").click();
  await expect(p.getByText("Penilaianmu", { exact: true })).toBeVisible();
  await expect(button(p, "Nilai buruh")).toHaveCount(0);
  await button(p, "Kembali").click();
  await actor(p, "Buruh demo");
  await work(p);
  await confirm(p, "Uang tunai sudah diterima");
  await expect(
    p.getByText("Pekerja mencatat uang diterima", { exact: false }),
  ).toBeVisible();
  await button(p, "Nilai penyedia kerja").click();
  await p.getByRole("radio", { name: "4 bintang", exact: true }).check();
  await p
    .getByLabel("Ulasan (opsional)", { exact: true })
    .fill("Tugas jelas, upah sesuai.");
  await button(p, "Kirim penilaian").click();
  await expect(p.getByText("Penilaianmu", { exact: true })).toBeVisible();
  await expect(p.getByText("Penilaian untukmu", { exact: true })).toBeVisible();
  await button(p, "Kembali").click();
  await tab(p, "Notifikasi");
  await p
    .getByRole("button", { name: /Penilaian baru diterima/ })
    .first()
    .click();
  await expect(
    p.getByRole("heading", { name: "Kesepakatan kerja", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("profile validation, draft guard, role history and visibility", async ({
  page: p,
}) => {
  await enter(p);
  await tab(p, "Akun");
  await button(p, "Edit profil").click();
  await p.getByLabel("Nama tampilan", { exact: true }).fill("");
  await button(p, "Simpan profil").click();
  await expect(p.getByRole("alert")).toBeVisible();
  await p
    .getByLabel("Nama tampilan", { exact: true })
    .fill("Nama belum tersimpan");
  await button(p, "Kembali").click();
  await expect(
    p.getByRole("heading", { name: "Buang perubahan?", exact: true }),
  ).toBeVisible();
  await button(p, "Lanjut mengisi").click();
  await expect(p.getByLabel("Nama tampilan", { exact: true })).toHaveValue(
    "Nama belum tersimpan",
  );
  await button(p, "Kembali").click();
  await button(p, "Buang perubahan").click();
  await button(p, "Edit profil").click();
  await p
    .getByLabel("Nama tampilan", { exact: true })
    .fill("Akun uji sintetis");
  await button(p, "Simpan profil").click();
  await tab(p, "Akun");
  await p.getByRole("button", { name: /^Nomor WhatsApp,/ }).click();
  await expect(
    p.getByText("Nomor terverifikasi", { exact: true }),
  ).toBeVisible();
  await button(p, "Kembali").click();
  await tab(p, "Temukan");
  await button(p, "Tidak tampil").click();
  const visible = p.getByRole("switch", {
    name: "Tampil di peta",
    exact: true,
  });
  await visible.click();
  await expect(visible).toBeChecked();
  await visible.click();
  await expect(visible).not.toBeChecked();
  await button(p, "Tutup").click();
  await tab(p, "Akun");
  await button(p, "Peran akun").click();
  await p
    .getByRole("radio", { name: "Cari tenaga · Penyedia kerja", exact: true })
    .check();
  await button(p, "Simpan peran").click();
  await expect(
    p.getByRole("button", { name: /, Buruh, .*Lihat profil/ }),
  ).toHaveCount(5);
  await tab(p, "Temukan");
  await button(p, "Tidak tampil").click();
  await expect(
    p.getByRole("switch", { name: "Tampil di peta", exact: true }),
  ).toBeEnabled();
  await expect(
    p.getByRole("switch", { name: "Tampil di peta", exact: true }),
  ).not.toBeChecked();
});
test("reporting, blocking, populated history, privacy and deletion", async ({
  page: p,
}) => {
  await p.setViewportSize({ width: 320, height: 740 });
  await enter(p);
  await actor(p, "Penyedia kerja demo");
  const person = () =>
    p.getByRole("button", { name: /^Dimas Saputra, .*Lihat profil/ });
  await person().click();
  await button(p, "Pilihan akun").click();
  await button(p, "Laporkan akun").click();
  await p
    .getByLabel("Apa yang terjadi?", { exact: true })
    .fill("Akun sintetis untuk pengujian laporan.");
  await button(p, "Kirim laporan").click();
  await expect(
    p.getByText("Laporan simulasi tercatat", { exact: true }),
  ).toBeVisible();
  await button(p, "Kembali").click();
  await button(p, "Pilihan akun").click();
  await button(p, "Blokir akun").click();
  await button(p, "Batal").click();
  await button(p, "Kembali").click();
  await person().click();
  await button(p, "Hubungi").click();
  await p.getByRole("checkbox").check();
  await button(p, "Kirim permintaan kontak").click();
  await button(p, "Pilihan kontak").click();
  await button(p, "Batalkan permintaan").click();
  await button(p, "Ya, cabut akses kontak").click();
  await expect(p.getByText("Dibatalkan", { exact: true })).toBeVisible();
  await button(p, "Kembali").click();
  await tab(p, "Aktivitas");
  await button(p, "Filter aktivitas").click();
  await p.getByRole("radio", { name: "Riwayat", exact: true }).click();
  await expect(
    p.getByRole("button", { name: /Dimas Saputra, Dibatalkan/ }),
  ).toBeVisible();
  await button(p, "Pekerjaan").click();
  await expect(
    p.getByRole("button", { name: /Pekerjaan selesai/ }).first(),
  ).toBeVisible();
  await tab(p, "Beranda");
  await person().click();
  await button(p, "Pilihan akun").click();
  await button(p, "Blokir akun").click();
  await button(p, "Ya, blokir akun").click();
  await expect(person()).toHaveCount(0);
  await tab(p, "Akun");
  await button(p, "Bantuan dan laporan").click();
  await button(p, "Privasi dan ketentuan").click();
  await expect(
    p.getByText("Versi ini merupakan pengujian lokal.", { exact: false }),
  ).toBeVisible();
  await expect(button(p, "Tutup")).toBeFocused();
  await p.keyboard.press("Escape");
  await expect(p.getByRole("dialog")).toHaveCount(0);
  await button(p, "Kembali").click();
  await button(p, "Hapus akun").click();
  await expect(button(p, "Ajukan penghapusan")).toBeDisabled();
  await p.getByRole("checkbox").check();
  await button(p, "Ajukan penghapusan").click();
  await expect(
    p
      .getByText("Permintaan penghapusan tercatat. Akun dibatasi.", {
        exact: true,
      })
      .filter({ visible: true }),
  ).toBeVisible();
  await button(p, "Keluar akun").click();
  await expect(button(p, "Masuk dengan Google")).toBeVisible();
});
test("responsive rail, keyboard, reduced motion and invalid callback", async ({
  page: p,
}) => {
  await p.emulateMedia({ reducedMotion: "reduce" });
  await enter(p);
  for (const width of [320, 360, 390, 411, 600, 840, 1440]) {
    await p.setViewportSize({ width, height: 1000 });
    await expect(p.getByRole("tablist")).toHaveCSS(
      "flex-direction",
      width >= 840 ? "column" : "row",
    );
    expect(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await p.getByRole("tab", { name: "Akun", exact: true }).focus();
  await p.keyboard.press("Enter");
  await expect(button(p, "Edit profil")).toBeVisible();
  const focus = await p.evaluate(() => ({
    style: getComputedStyle(document.activeElement!).outlineStyle,
    width: getComputedStyle(document.activeElement!).outlineWidth,
  }));
  expect(focus.style).not.toBe("none");
  expect(parseFloat(focus.width)).toBeGreaterThan(0);
  await p.goto("/auth/callback?code=invalid-synthetic-code");
  await expect(
    p.getByText("Masuk belum berhasil.", { exact: false }),
  ).toBeVisible();
  await button(p, "Ulangi masuk").click();
  await expect(button(p, "Masuk dengan Google")).toBeVisible();
});
