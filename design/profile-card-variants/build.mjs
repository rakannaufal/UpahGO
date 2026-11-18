import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "../..");
const tokens = JSON.parse(fs.readFileSync(`${root}/design/tokens.json`, "utf8"));
const controls = JSON.parse(fs.readFileSync(`${root}/assets/ceria/controls.json`, "utf8"));
const services = JSON.parse(fs.readFileSync(`${root}/assets/ceria/services.json`, "utf8"));
const star = '<svg class="star" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.8 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.4 6.3-.9Z" fill="#F6BE3A" stroke="#A7740C" stroke-width="1.4" stroke-linejoin="round"/></svg>';
const replacements = {
  __FONT__: fs.readFileSync(`${root}/assets/brand/source/Roboto-variable.ttf`).toString("base64"),
  __TOKENS__: Object.entries(tokens.color).map(([name, value]) => `--${name}:${value};`).join(""),
  __HOME__: controls.home.replace("<svg ", '<svg aria-hidden="true" '),
  __BROOM__: services.cleaning_services.replace("<svg ", '<svg aria-hidden="true" '),
  __STAR__: star,
};
let html = fs.readFileSync(`${directory}/prototype.template.html`, "utf8");
for (const [placeholder, value] of Object.entries(replacements)) html = html.replaceAll(placeholder, value);
if (/__(?:FONT|TOKENS|HOME|BROOM|STAR)__/.test(html)) throw new Error("Unresolved design asset");
fs.writeFileSync(`${directory}/index.html`, html);
console.log("Built four static card concepts using existing Ceria assets and tokens.");
