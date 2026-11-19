import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { pathToFileURL, fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const fingerprintRequire = createRequire(
  require.resolve("@expo/fingerprint/package.json"),
);
const micromatchRequire = createRequire(
  require.resolve("micromatch/package.json"),
);
const cases = [
  "minimatch-default",
  "minimatch-optimization2",
  "picomatch4",
  "picomatch2",
];

export function runProbe(name) {
  if (!cases.includes(name)) throw new Error("UNKNOWN_PROBE");
  const child = spawnSync(
    process.execPath,
    [
      "--max-old-space-size=128",
      fileURLToPath(import.meta.url),
      "--case",
      name,
    ],
    { encoding: "utf8", timeout: 1500, maxBuffer: 16384 },
  );
  return {
    name,
    timeout: child.error?.code === "ETIMEDOUT",
    status: child.status,
    signal: child.signal,
    result: child.status === 0 ? JSON.parse(child.stdout) : null,
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (process.argv[2] === "--case") {
    const name = process.argv[3];
    if (!cases.includes(name)) throw new Error("UNKNOWN_PROBE");
    const started = performance.now();
    let result;
    if (name.startsWith("minimatch")) {
      const { Minimatch } = fingerprintRequire("minimatch");
      const pattern =
        Array.from({ length: 16 }, (_, index) => `x${index}/**/..`).join("/") +
        "/z";
      result = {
        version: fingerprintRequire("minimatch/package.json").version,
        rejected: false,
      };
      try {
        const matcher = new Minimatch(pattern, {
          optimizationLevel: name === "minimatch-default" ? 1 : 2,
        });
        result.parts = matcher.globParts.length;
      } catch (error) {
        if (
          !(error instanceof RangeError) ||
          !error.message.startsWith("optimizationLevel 2: too many patterns")
        )
          throw error;
        result.rejected = true;
        result.code = "GLOB_EXPANSION_LIMIT";
      }
    } else {
      const resolve = name === "picomatch2" ? micromatchRequire : require;
      const matcher = resolve("picomatch")("+(*a)");
      result = {
        version: resolve("picomatch/package.json").version,
        matched: matcher("a".repeat(30) + "!"),
      };
    }
    console.log(
      JSON.stringify({
        ...result,
        durationMs: Math.round(performance.now() - started),
      }),
    );
  } else {
    // Fixed synthetic patterns only. Isolate CPU/memory; never probe a running service.
    console.log(JSON.stringify(cases.map(runProbe), null, 2));
  }
}
