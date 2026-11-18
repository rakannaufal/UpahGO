import { copyFile } from "node:fs/promises";
await copyFile(
  new URL(import.meta.resolve("@imagemagick/magick-wasm/magick.wasm")),
  new URL("../supabase/functions/profile-photo/magick.wasm", import.meta.url),
);
console.log(
  "Prepared pinned ImageMagick WASM for the server function; not included in the mobile app.",
);
