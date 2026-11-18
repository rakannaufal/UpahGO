import { readdir, readFile, writeFile } from "node:fs/promises";
const dir = new URL("../assets/icons/exports/", import.meta.url);
const icons = {};
for (const file of await readdir(dir))
  if (file.startsWith("ui-") && file.endsWith(".svg"))
    icons[file.slice(3, -4)] = await readFile(new URL(file, dir), "utf8");
await writeFile(
  new URL("../apps/mobile/src/icons.json", import.meta.url),
  JSON.stringify(icons),
);
