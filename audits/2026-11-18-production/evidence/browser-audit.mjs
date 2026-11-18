import { chromium, firefox, webkit } from "@playwright/test";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
const output = new URL("./", import.meta.url);
const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const report = {
  browserAvailability: Object.fromEntries(
    [["firefox", firefox], ["webkit", webkit]].map(([name, engine]) => [name, existsSync(engine.executablePath())]),
  ),
  errors: [], externalRequestsBlocked: 0, viewports: [],
};
try {
  const page = await browser.newPage({ viewport: { width: 375, height: 900 } });
  page.on("pageerror", error => report.errors.push(error.message));
  await page.route("**/*", route => {
    const url = new URL(route.request().url());
    if (["localhost", "127.0.0.1"].includes(url.hostname)) return route.continue();
    report.externalRequestsBlocked++;
    return route.abort();
  });
  await page.addInitScript(() => {
    window.auditMetrics = { lcp: null, cls: 0 };
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) window.auditMetrics.lcp = entry.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.auditMetrics.cls += entry.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false, latency: 150,
    downloadThroughput: 1600000 / 8, uploadThroughput: 750000 / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.goto("http://localhost:8081/");
  await page.getByRole("button", { name: "Coba demo", exact: true }).waitFor();
  await page.waitForLoadState("networkidle");
  report.loginLabSample = await page.evaluate(() => ({
    ...window.auditMetrics,
    navigationMs: performance.getEntriesByType("navigation")[0]?.duration,
    transferredBytes: performance.getEntriesByType("resource").reduce((n,x)=>n+x.transferSize,0),
    jsTransferredBytes: performance.getEntriesByType("resource").filter(x=>x.name.includes(".js")).reduce((n,x)=>n+x.transferSize,0),
  }));
  report.loginLabSample.conditions = "One cold Chrome sample, 375x900, CPU 4x, 150ms latency, 1.6Mbps down / 0.75Mbps up. Not field p75, INP or an Android device measurement.";
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  const button = name => page.getByRole("button",{name,exact:true});
  await button("Coba demo").click();
  await button("Lewati").click();
  await page.getByRole("radio",{name:"Cari kerja · Buruh",exact:true}).check();
  await button("Lanjut").click();
  await button("Gunakan lokasi demo").click();
  await button("Lewati dulu").click();
  const cards=page.getByTestId("person-card");
  await cards.first().waitFor();
  for(const width of [320,375,414,768,1024,1440]) {
    await page.setViewportSize({width,height:960});
    const fixed=cards.filter({hasText:"Rumah Kak Maya"});
    await fixed.scrollIntoViewIfNeeded();
    const dimensions=await cards.evaluateAll(nodes=>nodes.map(node=>({
      width:node.clientWidth,scrollWidth:node.scrollWidth,
      x:node.getBoundingClientRect().x,y:node.getBoundingClientRect().y,
    })));
    const data={width,twoColumns:Math.abs(dimensions[0].y-dimensions[1].y)<1,
      overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),
      overflowingCards:dimensions.filter(x=>x.scrollWidth>x.width+1).length,
      fixedPriceLabel:await fixed.getByTestId("profile-fixed-price").innerText(),
      fixedPriceLabelCount:await fixed.getByTestId("profile-fixed-price").count(),
    };
    report.viewports.push(data);
    if(data.overflow||data.overflowingCards||!data.twoColumns||data.fixedPriceLabel!=="Harga tetap") throw new Error(JSON.stringify(data));
    if([320,414].includes(width)) await fixed.screenshot({path:new URL(`fixed-card-${width}.png`,output).pathname});
  }
  const fixed=cards.filter({hasText:"Rumah Kak Maya"});
  await fixed.focus();
  await page.keyboard.press("Enter");
  await page.getByTestId("page-Profil").getByTestId("profile-fixed-price").waitFor();
  report.fixedPriceDetail = await page.getByTestId("page-Profil").getByTestId("profile-fixed-price").innerText();
  report.fixedProfileOfferButtonCount = await button("Tawar upah").count();
  report.clickThrough = "Demo > intro skip > worker role > demo location > skip profile > six viewport checks > fixed-price card focus + Enter > profile shows Harga tetap; no Tawar upah button.";
  report.headers=await page.request.get("http://localhost:8081/").then(r=>r.headers());
  report.offlineStatus="External endpoints blocked throughout; live offline/expiry behavior not inferred from demo.";
} finally {
  await browser.close();
  await writeFile(new URL("browser-audit.json",output),JSON.stringify(report,null,2)+"\n");
}
console.log(JSON.stringify(report,null,2));
