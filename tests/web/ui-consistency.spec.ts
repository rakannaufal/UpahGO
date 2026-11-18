import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";

const output = ".impeccable/review/ui-consistency";
const button = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });

test("five tabs stay reachable with filled selection and compact consistent controls", async ({
  page,
}) => {
  test.setTimeout(120000);
  fs.mkdirSync(output, { recursive: true });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const role of ["Cari kerja · Buruh", "Cari tenaga · Penyedia kerja"]) {
    await page.goto("/");
    await button(page, "Coba demo").click();
    await button(page, "Lewati").click();
    await page.getByRole("radio", { name: role, exact: true }).check();
    await button(page, "Lanjut").click();
    await button(page, "Gunakan lokasi demo").click();
    await button(page, "Lewati dulu").click();
    for (const width of [320, 412, 840, 1440]) {
      await page.setViewportSize({ width, height: 960 });
      for (const title of [
        "Beranda",
        "Temukan",
        "Aktivitas",
        "Notifikasi",
        "Akun",
      ]) {
        const tab = page.getByRole("tab", { name: title, exact: true });
        await expect(tab).toBeInViewport();
        await tab.click();
        const screen = page
          .getByTestId(`page-${title}`)
          .filter({ visible: true });
        await expect(screen).toBeVisible();
        await expect(tab).toHaveAttribute("aria-selected", "true");
        const navigation = page.getByRole("tablist", {
          name: "Navigasi utama",
        });
        await expect(navigation.getByTestId("icon-filled")).toHaveCount(1);
        await expect(navigation.getByTestId("icon-outline")).toHaveCount(4);
        await expect(tab.getByTestId("icon-filled")).toBeVisible();
        expect(
          await tab
            .locator("div")
            .evaluateAll((nodes) =>
              nodes.some((node) => getComputedStyle(node).height === "2px"),
            ),
        ).toBe(false);
        const icons = screen
          .getByTestId("icon-outline")
          .filter({ visible: true });
        expect(
          await icons.evaluateAll((nodes) =>
            nodes.every((node) => {
              const box = node.getBoundingClientRect();
              return (
                box.width === 24 &&
                box.height === 24 &&
                Array.from(node.querySelectorAll("path")).every((path) => {
                  const style = getComputedStyle(path);
                  return [style.fill, style.stroke].includes("rgb(8, 127, 82)");
                })
              );
            }),
          ),
        ).toBe(true);
        if (title === "Beranda") {
          const shortcut = button(page, "Filter Menyapu");
          await expect(shortcut).toHaveCSS("border-top-width", "1px");
          await expect(shortcut).toHaveCSS(
            "border-top-color",
            "rgb(227, 231, 228)",
          );
          for (const [name, art] of [
            ["Filter Menyapu", "cleaning_services"],
            ["Filter Mengepel", "mop"],
            ["Filter Dapur", "countertops"],
            ["Buka katalog pekerjaan", "inventory_2"],
          ]) {
            const artwork = button(page, name).getByTestId(
              `service-art-${art}`,
            );
            await expect(artwork).toBeVisible();
            await expect(artwork).toHaveAttribute("width", "36");
            await expect(
              button(page, name).getByTestId("icon-outline"),
            ).toHaveCount(0);
          }
          const location = button(page, "Lokasi dan radius");
          await expect(location.locator("..")).toHaveCSS(
            "border-top-width",
            "1px",
          );
          await expect(location.locator("..")).toHaveCSS(
            "border-top-color",
            "rgb(227, 231, 228)",
          );
        }
        if (title === "Aktivitas") {
          for (const name of ["Kontak", "Pekerjaan"]) {
            const segment = button(page, name);
            const box = (await segment.boundingBox())!;
            expect(box.height).toBeGreaterThanOrEqual(48);
            expect(box.height).toBeLessThanOrEqual(52);
            expect(box.width).toBeLessThanOrEqual(160);
            await expect(segment.locator("..")).toHaveCSS(
              "border-top-width",
              "1px",
            );
            await expect(segment.locator("..")).toHaveCSS(
              "border-top-color",
              "rgb(227, 231, 228)",
            );
            await segment.click();
          }
          await button(page, "Filter aktivitas").click();
          await page
            .getByRole("radio", { name: "Riwayat", exact: true })
            .click();
          await expect(
            page.getByRole("heading", { name: "Filter aktivitas" }),
          ).toHaveCount(0);
          await button(page, "Kontak").click();
        }
        if (title === "Akun") {
          await expect(
            page.getByRole("heading", { name: "Akunmu", exact: true }),
          ).toBeVisible();
          await button(page, "Ketentuan dan privasi").click();
          await expect(
            page.getByTestId("page-Ketentuan dan privasi"),
          ).toBeVisible();
          await button(page, "Kembali").click();
          await expect(screen).toBeVisible();
          await screen.getByTestId("page-scroll").evaluate((node) => {
            node.scrollTop = 0;
          });
        }
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        if (role === "Cari kerja · Buruh" && [412, 1440].includes(width)) {
          await expect(
            screen.getByText("Memuat data…", { exact: true }),
          ).toHaveCount(0);
          await page.screenshot({ path: `${output}/${title}-${width}.png` });
        }
      }
      // Revisit Account from Notifications, including a keyboard activation.
      await page.getByRole("tab", { name: "Notifikasi", exact: true }).click();
      const account = page.getByRole("tab", { name: "Akun", exact: true });
      await account.focus();
      await page.keyboard.press("Enter");
      await expect(
        page.getByTestId("page-Akun").filter({ visible: true }),
      ).toBeVisible();
    }
    await button(page, "Keluar dari demo").click();
    await expect(button(page, "Masuk dengan Google")).toBeVisible();
  }
  expect(errors).toEqual([]);
});
