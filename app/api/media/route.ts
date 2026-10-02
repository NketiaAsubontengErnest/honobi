import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { put } from "@vercel/blob";
import path from "path";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { MAX_UPLOAD_BYTES, MIME_EXTENSIONS, UPLOAD_DIR, sniffMime, isBlobStorage } from "@/lib/media/storage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  // "media" = Media library upload. "project" / "service" = an image attached to a project or
  // service form: allowed for people who can edit those, and NOT listed in the media library.
  const target = String(form.get("target") ?? "media");
  const allowed =
    target === "project"
      ? hasPermission(user.role, "projects:create") || hasPermission(user.role, "projects:edit")
      : target === "logo"
        ? hasPermission(user.role, "settings:edit")
        : target === "service"
        ? hasPermission(user.role, "services:create") || hasPermission(user.role, "services:edit")
        : hasPermission(user.role, "media:upload");
  if (!allowed) {
    return NextResponse.json({ error: "You are not allowed to upload images here" }, { status: 403 });
  }
  const registerInLibrary = target !== "project" && target !== "service" && target !== "logo";

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ error: "No files received" }, { status: 400 });
  if (files.length > 20) return NextResponse.json({ error: "Upload at most 20 files at a time" }, { status: 400 });

  const folderInput = String(form.get("folder") ?? "general").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);
  const folder = folderInput || "general";

  const saved: { filename: string; url: string }[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (file.size > MAX_UPLOAD_BYTES) {
      errors.push(`${file.name}: larger than ${MAX_UPLOAD_BYTES / 1024 / 1024} MB`);
      continue;
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const mime = sniffMime(buf);
    if (!mime || !MIME_EXTENSIONS[mime]) {
      errors.push(`${file.name}: only JPG, PNG, WebP, GIF, AVIF and PDF files are allowed`);
      continue;
    }

    const stored = `${randomUUID()}.${MIME_EXTENSIONS[mime]}`;
    const month = new Date().toISOString().slice(0, 7);
    let url: string;
    if (isBlobStorage()) {
      const blob = await put(`media/${month}/${stored}`, buf, {
        access: "public",
        contentType: mime,
        addRandomSuffix: false,
      });
      url = blob.url;
    } else {
      const dir = path.join(UPLOAD_DIR, month);
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, stored), buf);
      url = `/uploads/${month}/${stored}`;
    }
    const originalName = path.basename(file.name).replace(/[^\w.\- ]+/g, "_").slice(0, 120) || stored;
    if (registerInLibrary) {
      await prisma.media.create({
        data: { url, filename: originalName, mimeType: mime, size: buf.length, folder, uploadedById: user.id },
      });
    }
    saved.push({ filename: originalName, url });
  }

  if (saved.length) {
    await logAudit({ userId: user.id, action: "UPLOAD", entity: registerInLibrary ? "media" : target, metadata: { files: saved.map((f) => f.filename) } });
  }

  const status = saved.length === 0 ? 400 : 200;
  return NextResponse.json({ saved, errors }, { status });
}
