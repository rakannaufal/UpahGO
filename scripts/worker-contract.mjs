import { readFile, writeFile } from "node:fs/promises";
const source = await readFile(
  new URL("../shared/contracts.ts", import.meta.url),
  "utf8",
);
const operations = source.match(
  /export const operations = (\[[\s\S]*?\]) as const;/,
)[1];
const errors = [...source.matchAll(/^  ([A-Z_]+):\s/gm)].map(
  (match) => match[1],
);
await writeFile(
  new URL("../shared/worker-contract.mjs", import.meta.url),
  `// Generated from contracts.ts by scripts/worker-contract.mjs.\nexport const operations = ${operations};\nexport const errors = ${JSON.stringify(errors)};\n`,
);
