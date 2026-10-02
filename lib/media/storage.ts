import path from "path";

/** Uploaded files live outside /public so they are served by the /uploads route (works after build). */
export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// Vercel limits request bodies to ~4.5 MB, so stay below that
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB

/** On Vercel (BLOB_READ_WRITE_TOKEN set) files go to Vercel Blob; locally they go to ./uploads. */
export const isBlobStorage = () => !!process.env.BLOB_READ_WRITE_TOKEN;

export const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "application/pdf": "pdf",
};

export const EXTENSION_MIME: Record<string, string> = Object.fromEntries(
  Object.entries(MIME_EXTENSIONS).map(([mime, ext]) => [ext, mime])
);

/** Verifies the real content type from the file's magic bytes (never trust the client's MIME). */
export function sniffMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString("ascii") === "GIF8") return "image/gif";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buf.subarray(4, 8).toString("ascii") === "ftyp" && /avif|avis/.test(buf.subarray(8, 12).toString("ascii"))) return "image/avif";
  if (buf.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  return null;
}
