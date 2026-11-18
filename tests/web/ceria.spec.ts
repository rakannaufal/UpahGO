import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";

const button = (p: Page, name: string) =>
  p.getByRole("button", { name, exact: true });
const output = ".impeccable/review/ceria";

async function enter(p: Page) {
  await p.goto("/");
  await button(p, "Coba demo").click();
  await button(p, "Lewati").click();
  await p
    .getByRole("radio", { name: "Cari tenaga · Penyedia kerja", exact: true })
    .check();
  await button(p, "Lanjut").click();
  await button(p, "Gunakan lokasi demo").click();
  await button(p, "Lewati dulu").click();
  await expect(
    p.getByRole("button", { name: /^Dimas Saputra, .*Lihat profil/ }),
  ).toBeVisible();
}

test("maximum zoom separates overlapping profile pins; zooming out restores the group", async ({
  page: p,
}) => {
  await enter(p);
  await p.getByRole("tab", { name: "Temukan", exact: true }).click();
  await expect(
    p.getByRole("button", { name: /2 akun di/ }).first(),
  ).toBeVisible();
  await button(p, "2 akun di Sukajadi").click();
  await expect(
    p.getByRole("heading", { name: "Akun di area ini", exact: true }),
  ).toBeVisible();
  await p.keyboard.press("Escape");
  const zoom = p.getByRole("button", { name: "Perbesar peta", exact: true });
  for (
    let i = 0;
    i < 8 && (await zoom.getAttribute("aria-disabled")) !== "true";
    i++
  )
    await zoom.click();
  await expect(
    p.getByText(
      "Pin dipisah agar bisa dipilih. Titik asal tetap lokasi perkiraan.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(p.getByRole("button", { name: /2 akun di/ })).toHaveCount(0);
  const pin = p.getByRole("button", {
    name: "Dimas Saputra, lokasi perkiraan",
    exact: true,
  });
  await expect(pin).toBeInViewport({ timeout: 3000 });
  await pin.click();
  await expect(button(p, "Lihat profil")).toBeVisible();
  await p.keyboard.press("Escape");
  await p.getByRole("button", { name: "Perkecil peta", exact: true }).click();
  await expect(
    p.getByRole("button", { name: /2 akun di/ }).first(),
  ).toBeVisible();
});

test("Ceria route and state captures, narrow and expanded layouts", async ({
  page: p,
}) => {
  test.setTimeout(120000);
  fs.mkdirSync(output, { recursive: true });
  const captures: string[] = [];
  const errors: string[] = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.setViewportSize({ width: 412, height: 892 });
  const capture = async (name: string, pageTitle?: string) => {
    const titles: Record<string, string> = {
      "01": "Upahgo",
      "02": "Upahgo",
      "03": "Upahgo",
      "04": "Upahgo",
      "05": "Pilih peran",
      "06": "Lokasi & jangkauan",
      "07": "Edit profil",
      "08": "Beranda",
      "09": "Profil",
      "10": "Profil",
      "11": "Permintaan kontak",
      "12": "Temukan",
      "13": "Temukan",
      "14": "Temukan",
      "15": "Aktivitas",
      "16": "Aktivitas",
      "17": "Kesepakatan kerja",
      "18": "Notifikasi",
      "19": "Akun",
      "20": "Foto tempat",
      "21": "Nomor WhatsApp",
      "22": "Bantuan dan laporan",
      "23": "Katalog pekerjaan",
      "24": "Penghapusan akun",
    };
    const page = p
      .getByTestId(`page-${pageTitle ?? titles[name.slice(0, 2)] ?? "Beranda"}`)
      .filter({ visible: true });
    await expect(page).toBeVisible();
    await expect(
      page.getByText("Memuat data…", { exact: true }).filter({ visible: true }),
    ).toHaveCount(0);
    await expect(
      p.locator('[aria-busy="true"]').filter({ visible: true }),
    ).toHaveCount(0);
    const reveal = page.getByTestId("content-reveal");
    if (await reveal.count()) await expect(reveal).toHaveCSS("opacity", "1");
    await expect(
      p
        .getByTestId("page-scroll")
        .filter({ visible: true })
        .or(p.getByTestId("discovery-map"))
        .first(),
    ).toBeVisible();
    await p.screenshot({ path: `${output}/${name}.png` });
    expect(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    captures.push(name);
  };
  await p.goto("/");
  await expect(button(p, "Masuk dengan Google").locator("img")).toBeVisible();
  await capture("01-login");
  await button(p, "Coba demo").click();
  await expect(button(p, "Lewati")).toBeVisible();
  await capture("02-intro-role");
  await button(p, "Lanjut").click();
  await capture("03-intro-map");
  await button(p, "Lanjut").click();
  await capture("04-intro-cod");
  await button(p, "Pilih peran").click();
  const worker = p.getByRole("radio", {
    name: "Cari kerja · Buruh",
    exact: true,
  });
  const employer = p.getByRole("radio", {
    name: "Cari tenaga · Penyedia kerja",
    exact: true,
  });
  await worker.check();
  const a = (await worker.boundingBox())!,
    b = (await employer.boundingBox())!;
  expect(a.x).toBeLessThan(b.x);
  expect(a.y).toBe(b.y);
  await capture("05-role");
  await employer.check();
  await button(p, "Lanjut").click();
  await capture("06-location");
  await button(p, "Gunakan lokasi demo").click();
  await capture("07-setup");
  await button(p, "Lewati dulu").click();
  await expect(
    p.getByRole("button", { name: /^Dimas Saputra, .*Lihat profil/ }),
  ).toBeVisible();
  await capture("08-home");
  await expect(button(p, "Buka akun")).toHaveCount(0);
  const search = p.getByRole("textbox", {
    name: "Cari layanan atau buruh",
    exact: true,
  });
  await search.fill("Dimas");
  await expect(
    p.getByRole("button", { name: /^Dimas Saputra, .*Lihat profil/ }),
  ).toBeVisible();
  await button(p, "Hapus pencarian").click();
  await expect(search).toHaveValue("");
  await button(p, "Filter Menyapu").click();
  await expect(button(p, "Reset")).toBeVisible();
  await button(p, "Reset").click();
  await p
    .getByRole("button", { name: /^Dimas Saputra, .*Lihat profil/ })
    .click();
  await capture("09-person");
  await button(p, "Hubungi").click();
  await capture("10-contact-consent");
  await p.getByRole("checkbox").check();
  await button(p, "Kirim permintaan kontak").click();
  await capture("11-contact-pending");
  await button(p, "Kembali").click();
  await p.getByRole("tab", { name: "Temukan", exact: true }).click();
  await expect(p.getByTestId("discovery-map")).toBeVisible();
  await capture("12-map");
  await button(p, "2 akun di Sukajadi").click();
  await expect(
    p.getByRole("heading", { name: "Akun di area ini", exact: true }),
  ).toBeVisible();
  await p.keyboard.press("Escape");
  const zoom = button(p, "Perbesar peta");
  for (
    let i = 0;
    i < 8 && (await zoom.getAttribute("aria-disabled")) !== "true";
    i++
  )
    await zoom.click();
  await expect(
    p.getByText(
      "Pin dipisah agar bisa dipilih. Titik asal tetap lokasi perkiraan.",
      { exact: true },
    ),
  ).toBeVisible();
  await capture("13-map-separated");
  await button(p, "Lihat daftar").click();
  await capture("14-map-list");
  await p.getByRole("tab", { name: "Aktivitas", exact: true }).click();
  await capture("15-activity");
  await button(p, "Pekerjaan").click();
  await capture("16-work-list");
  await p
    .getByRole("button", { name: /Pekerjaan selesai/ })
    .first()
    .click();
  await capture("17-agreement");
  await button(p, "Kembali").click();
  await p.getByRole("tab", { name: "Notifikasi", exact: true }).click();
  await capture("18-notices");
  await p.getByRole("tab", { name: "Akun", exact: true }).click();
  await capture("19-account");
  await button(p, "Hapus akun").scrollIntoViewIfNeeded();
  await capture("25-account-others", "Akun");
  await button(p, "Ketentuan dan privasi").click();
  await capture("26-legal", "Ketentuan dan privasi");
  await expect(
    p.getByText("Versi ini merupakan pengujian lokal.", { exact: false }),
  ).toBeVisible();
  await button(p, "Kembali").click();
  await button(p, "Atribusi data").click();
  await capture("27-attribution", "Atribusi data");
  await p.evaluate(() => {
    (window as unknown as { attributionUrls: string[] }).attributionUrls = [];
    window.open = (url) => {
      (window as unknown as { attributionUrls: string[] }).attributionUrls.push(
        String(url),
      );
      return null;
    };
  });
  for (const name of [
    "Lisensi OpenStreetMap",
    "Sumber batas Pekanbaru",
    "Lisensi Leaflet",
    "Lisensi ilustrasi unDraw",
    "Lisensi Material Symbols",
    "Lisensi Roboto",
  ])
    await button(p, name).click();
  await expect
    .poll(() =>
      p.evaluate(
        () =>
          (window as unknown as { attributionUrls: string[] }).attributionUrls,
      ),
    )
    .toEqual([
      "https://www.openstreetmap.org/copyright",
      "https://www.openstreetmap.org/relation/16563796",
      "https://github.com/Leaflet/Leaflet/blob/v1.9.4/LICENSE",
      "https://undraw.co/license",
      "https://github.com/google/material-design-icons/blob/master/LICENSE",
      "https://github.com/google/fonts/blob/main/ofl/roboto/OFL.txt",
    ]);
  await button(p, "Kembali").click();
  await p.getByRole("button", { name: /^Beri nilai Upahgo,/ }).click();
  await expect(
    p.getByText("Penilaian tersedia setelah Upahgo diterbitkan", {
      exact: false,
    }),
  ).toBeVisible();
  await capture("28-app-rating", "Akun");
  await p.keyboard.press("Escape");
  await button(p, "Foto tempat (opsional)").click();
  await capture("20-photo");
  await button(p, "Kembali").click();
  await p.getByRole("button", { name: /^Nomor WhatsApp,/ }).click();
  await capture("21-phone");
  await button(p, "Kembali").click();
  await button(p, "Bantuan dan laporan").click();
  await capture("22-help");
  await button(p, "Katalog pekerjaan").click();
  await capture("23-catalog");
  await button(p, "Kembali").click();
  await button(p, "Kembali").click();
  await button(p, "Hapus akun").click();
  await capture("24-deletion");
  await button(p, "Kembali").click();
  await p.getByRole("tab", { name: "Beranda", exact: true }).click();
  for (const width of [320, 600, 1440]) {
    await p.setViewportSize({ width, height: 1000 });
    await capture(`home-${width}`);
  }
  for (const width of [320, 1440]) {
    await p.setViewportSize({ width, height: 1000 });
    for (const [tab, name] of [
      ["Aktivitas", "activity"],
      ["Notifikasi", "notices"],
      ["Akun", "account"],
    ]) {
      await p.getByRole("tab", { name: tab, exact: true }).click();
      if (tab === "Aktivitas") {
        await button(p, "Kontak").click();
        await expect(
          p.getByRole("button", { name: /^Dimas Saputra, Menunggu/ }),
        ).toBeVisible();
      }
      if (tab === "Notifikasi")
        await expect(p.getByText("Pembaruan simulasi.").first()).toBeVisible();
      if (tab === "Akun")
        await p
          .getByTestId("page-scroll")
          .filter({ visible: true })
          .evaluate((el) => {
            el.scrollTop = 0;
          });
      await expect(button(p, "Buka akun")).toHaveCount(0);
      await expect(button(p, "Buka bantuan")).toHaveCount(0);
      await capture(`${name}-${width}`, tab);
      if (tab === "Akun") {
        await button(p, "Hapus akun").scrollIntoViewIfNeeded();
        await capture(`account-menu-${width}`, "Akun");
      }
    }
  }
  await button(p, "Keluar dari demo").click();
  await expect(button(p, "Masuk dengan Google")).toBeVisible();
  expect(errors).toEqual([]);
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
