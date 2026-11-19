import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtemp, mkdir, writeFile, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runProbe } from "../scripts/probe-glob-security.mjs";

const require = createRequire(import.meta.url);
const fingerprintRequire = createRequire(
  require.resolve("@expo/fingerprint/package.json"),
);
const {
  createFingerprintAsync,
  DEFAULT_IGNORE_PATHS,
} = require("@expo/fingerprint");
const { buildPathMatchObjects, isIgnoredPathWithMatchObjects } =
  fingerprintRequire("./build/utils/Path.js");

test("Expo fingerprint preserves build-file exclusions, negation and source matching with patched minimatch", () => {
  const matchers = buildPathMatchObjects([
    ...DEFAULT_IGNORE_PATHS,
    "generated/**/*",
    "!generated/keep.kt",
  ]);
  for (const [path, ignored] of [
    ["android/app/build/outputs/app.apk", true],
    ["ios/Pods/Example/Example.m", true],
    [".DS_Store", true],
    ["generated/remove.kt", true],
    ["generated/keep.kt", false],
    ["android/app/src/main/MainActivity.kt", false],
  ])
    assert.equal(
      isIgnoredPathWithMatchObjects(path, matchers),
      ignored,
      String(path),
    );
});
test("patched matcher rejects globparts amplification within an isolated time and memory limit", () => {
  const result = runProbe("minimatch-optimization2");
  assert.equal(result.timeout, false);
  assert.equal(result.status, 0);
  assert.equal(result.result.rejected, true);
  assert.equal(result.result.code, "GLOB_EXPANSION_LIMIT");
});
test(
  "real fingerprint hashing ignores build outputs but detects native source changes",
  { timeout: 60000 },
  async () => {
    const directory = await mkdtemp(join(tmpdir(), "upahgo-sec-fingerprint-"));
    const nativePath = join(directory, "android/app/src/main/MainActivity.kt");
    const outputPath = join(directory, "android/app/build/outputs/app.apk");
    try {
      await symlink(
        resolve("node_modules"),
        join(directory, "node_modules"),
        "dir",
      );
      await mkdir(join(directory, "android/app/src/main"), { recursive: true });
      await mkdir(join(directory, "android/app/build/outputs"), {
        recursive: true,
      });
      await writeFile(
        join(directory, "package.json"),
        JSON.stringify({
          name: "synthetic-fingerprint-fixture",
          version: "1.0.0",
          dependencies: { expo: "58.0.25", "react-native": "0.88.1" },
        }),
      );
      await writeFile(
        join(directory, "app.json"),
        JSON.stringify({
          expo: {
            name: "Synthetic fixture",
            slug: "synthetic-fixture",
            platforms: ["android"],
          },
        }),
      );
      await writeFile(
        join(directory, "android/app/build.gradle"),
        "// Synthetic native project\n",
      );
      await writeFile(
        join(directory, "android/app/src/main/AndroidManifest.xml"),
        '<manifest package="id.synthetic.fixture"><application /></manifest>',
      );
      await writeFile(nativePath, "// Synthetic native source version one\n");
      const options = {
        platforms: ["android"],
        silent: true,
        concurrentIoLimit: 2,
      };
      const first = await createFingerprintAsync(directory, options);
      await writeFile(outputPath, "synthetic ignored output");
      const ignored = await createFingerprintAsync(directory, options);
      assert.equal(ignored.hash, first.hash);
      await writeFile(nativePath, "// Synthetic native source version two\n");
      const changed = await createFingerprintAsync(directory, options);
      assert.notEqual(changed.hash, first.hash);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  },
);
