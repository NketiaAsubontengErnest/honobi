"use server";

import { unlink } from "fs/promises";
import path from "path";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/db/prisma";
import { requirePermissionServer } from "@/lib/auth/guard";
import { UPLOAD_DIR } from "@/lib/media/storage";
import { revalidatePath } from "next/cache";

export async function deleteMedia(id: string) {
  await requirePermissionServer("media:delete");
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) throw new Error("Media not found");

  await prisma.media.update({ where: { id }, data: { isActive: false } });

  // Remove the stored file: Vercel Blob URLs via the Blob API, local uploads from disk.
  // Bundled site images (/images/...) are only hidden.
  if (/^https:\/\//.test(media.url)) {
    await del(media.url).catch(() => undefined);
  } else if (media.url.startsWith("/uploads/")) {
    const file = path.resolve(UPLOAD_DIR, media.url.replace(/^\/uploads\//, ""));
    if (file.startsWith(UPLOAD_DIR + path.sep)) await unlink(file).catch(() => undefined);
  }
  revalidatePath("/dashboard/media");
  return { success: true };
}

/** Show or hide an uploaded image on the public gallery (moves it between the "gallery" and "library" folders). */
export async function setMediaInGallery(id: string, inGallery: boolean) {
  await requirePermissionServer("media:upload");
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) throw new Error("Media not found");
  if (!media.mimeType.startsWith("image/")) throw new Error("Only images can be shown in the gallery");
  await prisma.media.update({ where: { id }, data: { folder: inGallery ? "gallery" : "library" } });
  revalidatePath("/dashboard/media");
  revalidatePath("/gallery");
  return { success: true };
}
