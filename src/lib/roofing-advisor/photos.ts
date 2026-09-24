/*
 * Photo upload rules, shared by the browser (to resize before upload) and
 * the photo route (to check what actually arrived).
 */

export const PHOTO_LIMITS = {
  /** Per request. The chat uploads one photo at a time. */
  filesPerRequest: 4,
  /** After in-browser resizing, photos are usually well under 1 MB. */
  maxBytes: 5 * 1024 * 1024,
  /** Long edge the browser resizes to before uploading. */
  maxDimension: 1600,
  perMessage: 4,
} as const;

export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"] as const;

export type AcceptedPhotoType = (typeof ACCEPTED_PHOTO_TYPES)[number];

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

/** The image type from the file's first bytes, ignoring what the browser claims. */
export function sniffImageType(bytes: Uint8Array): AcceptedPhotoType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && ascii(bytes, 1, 3) === "PNG" && bytes[0] === 0x89) return "image/png";
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return "image/webp";
  if (bytes.length >= 12 && ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 4);
    if (/^(?:heic|heix|hevc|hevx)$/.test(brand)) return "image/heic";
    if (/^(?:mif1|msf1|heif)$/.test(brand)) return "image/heif";
  }
  return null;
}

/** A display-safe file name. */
export function cleanFileName(name: string): string {
  const cleaned = name.replace(/[^\w.\- ]+/g, "").trim().slice(0, 80);
  return cleaned || "photo";
}
