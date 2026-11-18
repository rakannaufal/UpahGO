export const maxPhotoBytes = 5 * 1024 * 1024;
export async function readBoundedBytes(request, limit = maxPhotoBytes) {
  if (!request.body) throw new Error("PHOTO_INVALID");
  const reader = request.body.getReader();
  const chunks = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > limit) {
      await reader.cancel();
      throw new Error("BODY_TOO_LARGE");
    }
    chunks.push(value);
  }
  const data = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    data.set(chunk, offset);
    offset += chunk.length;
  }
  return data;
}
export function processPhoto(magick, bytes) {
  if (
    !(bytes instanceof Uint8Array) ||
    bytes.length > maxPhotoBytes ||
    bytes.length < 4 ||
    bytes[0] !== 255 ||
    bytes[1] !== 216
  )
    throw new Error("PHOTO_INVALID");
  const { ImageMagick, MagickFormat, ResourceLimits } = magick;
  ResourceLimits.width = 2048n;
  ResourceLimits.height = 2048n;
  ResourceLimits.memory = 96n * 1024n * 1024n;
  ResourceLimits.disk = 0n;
  ResourceLimits.listLength = 4n;
  ResourceLimits.time = 10n;
  ResourceLimits.maxProfileSize = 1024n * 1024n;
  try {
    return ImageMagick.read(bytes, MagickFormat.Jpeg, (image) => {
      if (
        image.width < 32 ||
        image.height < 32 ||
        image.width > 2048 ||
        image.height > 2048
      )
        throw new Error("PHOTO_INVALID");
      image.autoOrient();
      image.strip();
      const scale = Math.min(1, 1280 / Math.max(image.width, image.height));
      image.resize(
        Math.max(1, Math.round(image.width * scale)),
        Math.max(1, Math.round(image.height * scale)),
      );
      image.quality = 82;
      const detail = image.write(
        MagickFormat.Jpeg,
        (data) => new Uint8Array(data),
      );
      const thumbScale = 160 / Math.max(image.width, image.height);
      image.resize(
        Math.max(1, Math.round(image.width * thumbScale)),
        Math.max(1, Math.round(image.height * thumbScale)),
      );
      image.quality = 76;
      const thumb = image.write(
        MagickFormat.Jpeg,
        (data) => new Uint8Array(data),
      );
      if (detail.length > 1024 * 1024 || thumb.length > 100 * 1024)
        throw new Error("PHOTO_INVALID");
      return { detail, thumb };
    });
  } catch {
    throw new Error("PHOTO_INVALID");
  }
}
