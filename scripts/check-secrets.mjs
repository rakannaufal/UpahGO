import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
const skip = new Set([
  "node_modules",
  "dist",
  "dist-android",
  ".expo",
  ".wrangler",
  ".git",
  "test-results",
  "playwright-report",
]);
const patterns = [
  /sb_secret_[A-Za-z0-9_-]{20,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /AIza[0-9A-Za-z_-]{35}/,
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
];
let files = 0;
const hits = [];
async function scan(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (
      skip.has(entry.name) ||
      entry.name.startsWith(".env") ||
      entry.name.startsWith(".dev.vars")
    )
      continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await scan(file);
    else if (
      /\.(tsx?|m?js|cjs|jsonc?|md|sql|ya?ml)$/.test(file) &&
      entry.name !== "package-lock.json"
    ) {
      files++;
      const text = await readFile(file, "utf8");
      if (patterns.some((pattern) => pattern.test(text))) hits.push(file);
    }
  }
}
await scan("apps");
await scan("workers");
await scan("shared");
await scan("docs");
await scan("supabase");
await scan("scripts");
if (hits.length) {
  console.error("Potential credential patterns in:", hits);
  process.exitCode = 1;
} else
  console.log(
    `Secret pattern check: ${files} source/config/document files; no matching embedded credentials. Env/build/dependencies excluded. Not an exhaustive scan.`,
  );
