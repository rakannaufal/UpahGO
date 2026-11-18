import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "../..");
const icons = JSON.parse(fs.readFileSync(`${root}/assets/ceria/controls.json`, "utf8"));
const services = JSON.parse(fs.readFileSync(`${root}/assets/ceria/services.json`, "utf8"));
const font = fs.readFileSync(`${root}/assets/brand/source/Roboto-variable.ttf`).toString("base64");
const template = fs.readFileSync(`${directory}/prototype.template.html`, "utf8");
const html = template.replace("__FONT__", font).replace("__ART__", JSON.stringify({ icons, services }).replaceAll("<", "\\u003c"));
fs.writeFileSync(`${directory}/index.html`, html);
console.log("Built design/profile-pricing/index.html from existing Ceria assets.");
