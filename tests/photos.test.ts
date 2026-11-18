import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as magick from "@imagemagick/magick-wasm";
import { processPhoto, readBoundedBytes } from "../shared/photo-processing.mjs";
test("photo processing bounds decoding, re-encodes JPEG, strips metadata, makes thumbnail", async () => {
  await magick.initializeImageMagick(
    await readFile(
      import.meta
        .resolve("@imagemagick/magick-wasm/magick.wasm")
        .replace("file://", ""),
    ),
  );
  const bytes = new Uint8Array(
    await readFile(new URL("./fixtures/synthetic-photo.jpg", import.meta.url)),
  );
  magick.ImageMagick.read(bytes, (image) =>
    assert.ok(image.profileNames.includes("exif")),
  );
  const result = processPhoto(magick, bytes);
  assert.equal(
    Buffer.from(result.detail).includes(
      Buffer.from("Synthetic private metadata"),
    ),
    false,
  );
  magick.ImageMagick.read(result.detail, (image) => {
    assert.equal(image.width, 1280);
    assert.equal(image.height, 960);
    assert.deepEqual(image.profileNames, []);
  });
  magick.ImageMagick.read(result.thumb, (image) => {
    assert.equal(image.width, 160);
    assert.equal(image.height, 120);
  });
  for (const bad of [
    new Uint8Array([255, 216, 0, 0]),
    new TextEncoder().encode('<svg onload="bad"/>'),
    new Uint8Array(5 * 1024 * 1024 + 1),
  ])
    assert.throws(() => processPhoto(magick, bad), /PHOTO_INVALID/);
});
test("stream reader rejects oversized chunked uploads", async () => {
  const request = new Request("https://local.example", {
    method: "POST",
    body: new Uint8Array(33),
  });
  await assert.rejects(() => readBoundedBytes(request, 32), /BODY_TOO_LARGE/);
});
