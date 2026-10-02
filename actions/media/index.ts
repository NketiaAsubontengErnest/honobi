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
