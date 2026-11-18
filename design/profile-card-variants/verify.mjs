import { chromium, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(directory, "captures");
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage();
const errors = [];
const requests = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("request", (request) => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
const cases = [];

async function verifyLayout(name, width, textScale = 1) {
  await page.setViewportSize({ width, height: 1000 });
  await page.evaluate((scale) => { document.documentElement.style.fontSize = `${16 * scale}px`; }, textScale);
  await page.evaluate(() => document.fonts.ready);
  const overflow = await page.evaluate(() => [...document.querySelectorAll("main,.option,.stage,.card,.body,.price-banner,.horizontal-head,.person,.budget-line,.tags,.price,.price-row,.price-head")].filter((element) => element.scrollWidth > element.clientWidth + 1).map((element) => ({ element: element.className || element.tagName, width: element.clientWidth, scroll: element.scrollWidth })));
  expect(overflow, name).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const numericLineCounts = await page.locator(".amount span:last-child").evaluateAll((elements) => elements.map((element) => { const range = document.createRange(); range.selectNodeContents(element); return range.getClientRects().length; }));
  expect(numericLineCounts).toEqual([1, 1, 1, 1]);
  await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
  cases.push(name);
}

try {
  await page.goto(pathToFileURL(path.join(directory, "index.html")).href);
  await expect(page.locator("article.card")).toHaveCount(4);
  await expect(page.locator(".card h3")).toHaveText(Array(4).fill("Rumah Bu Rina"));
  await expect(page.locator(".amount")).toHaveText(Array(4).fill("Rp 120.000"));
  await expect(page.locator(".nego")).toHaveText(Array(4).fill("Bisa nego"));
  await expect(page.locator(".horizontal-card .price-row .rating")).toHaveCount(1);
  await expect(page.locator(".horizontal-card .price .nego,.horizontal-card .service-line .rating")).toHaveCount(0);
  await expect(page.locator(".horizontal-card .service-line .nego")).toHaveCount(1);
  await expect(page.getByText("data contoh sintetis", { exact: false })).toBeVisible();
  expect(await page.locator("button,a,input,select,textarea,[tabindex]").count()).toBe(0);
  await verifyLayout("desktop-960", 960);
  await page.locator("main").screenshot({ path: path.join(directory, "overview.png") });
  for (let index = 0; index < 4; index++) await page.locator("article.card").nth(index).screenshot({ path: path.join(output, `card-${index + 1}.png`) });
  await verifyLayout("mobile-412", 412);
  await verifyLayout("mobile-320", 320);
  await verifyLayout("text-200-percent-320", 320, 2);
  await page.evaluate(() => {
    document.querySelectorAll(".card h3").forEach((element) => { element.textContent = "Rumah Keluarga Bu Rina di Sukajadi"; });
    document.querySelectorAll(".tags li:first-child").forEach((element) => { element.textContent = "Membersihkan halaman depan"; });
  });
  await verifyLayout("long-content-320", 320);

  const contrast = await page.evaluate(() => {
    const luminance = (color) => {
      const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map((value) => { const channel = value / 255; return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4; });
      return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
    };
    const ratio = (a, b) => { const first = luminance(a), second = luminance(b); return (Math.max(first, second) + .05) / (Math.min(first, second) + .05); };
    const text = [...document.querySelectorAll("main *")].filter((element) => element.getClientRects().length && [...element.childNodes].some((node) => node.nodeType === 3 && node.textContent.trim())).map((element) => {
      let parent = element;
      let background = "rgb(255, 255, 255)";
      while (parent) { const value = getComputedStyle(parent).backgroundColor; if (value !== "rgba(0, 0, 0, 0)" && value !== "transparent") { background = value; break; } parent = parent.parentElement; }
      return { text: element.textContent.trim().slice(0, 50), ratio: ratio(getComputedStyle(element).color, background) };
    });
    const icons = [...document.querySelectorAll(".avatar svg path,.star path")].map((element) => {
      let parent = element.parentElement;
      let background = "rgb(255, 255, 255)";
      while (parent) { const value = getComputedStyle(parent).backgroundColor; if (value !== "rgba(0, 0, 0, 0)" && value !== "transparent") { background = value; break; } parent = parent.parentElement; }
      return { icon: element.closest(".star") ? "gold-star-outline" : "home", ratio: ratio(getComputedStyle(element).stroke, background) };
    });
    return { text, icons };
  });
  expect(contrast.text.filter((item) => item.ratio < 4.5)).toEqual([]);
  expect(contrast.icons.filter((item) => item.ratio < 3)).toEqual([]);
  const sizes = await page.locator(".avatar svg,.star,.service-art").evaluateAll((elements) => elements.map((element) => ({ expected: element.classList.contains("service-art") ? element.closest(".horizontal-card") ? 80 : 40 : 24, width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })));
  expect(sizes.filter((item) => item.width !== item.expected || item.width !== item.height)).toEqual([]);
  const borders = await page.locator("article.card").evaluateAll((elements) => elements.map((element) => ({ width: getComputedStyle(element).borderTopWidth, color: getComputedStyle(element).borderTopColor })));
  expect(borders).toEqual(Array(4).fill({ width: "1px", color: "rgb(227, 231, 228)" }));
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
  const result = { scope: "Static component study, selected variant 2 revised; app verification recorded separately", cases, cardCount: 4, selectedVariant: 2, selectedServiceArtSize: 80, otherServiceArtSize: 40, selectedRatingPosition: "right of price", selectedNegotiableStyle: "plain dark green text", border: borders[0], iconSize: 24, goldStar: { fill: "#F6BE3A", stroke: "#A7740C" }, minimumTextContrast: Math.min(...contrast.text.map((item) => item.ratio)), minimumIconOutlineContrast: Math.min(...contrast.icons.map((item) => item.ratio)), interactiveElements: 0, externalRequests: requests, pageErrors: errors };
  fs.writeFileSync(path.join(directory, "verification.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
