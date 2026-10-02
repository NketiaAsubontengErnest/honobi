import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/permissions";
import { MediaClient } from "./media-client";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const user = await getSessionUser();
  const canUpload = !!user && hasPermission(user.role, "media:upload");
  const canDelete = !!user && hasPermission(user.role, "media:delete");

  const media = await prisma.media.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
  const serialized = media.map((m: typeof media[0]) => ({
    id: m.id,
    url: m.url,
    filename: m.filename,
    mimeType: m.mimeType,
    size: m.size,
    altText: m.altText,
    folder: m.folder,
    createdAt: m.createdAt.toISOString(),
  }));
  return <MediaClient media={serialized} canUpload={canUpload} canDelete={canDelete} />;
}
