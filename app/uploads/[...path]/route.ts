import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { EXTENSION_MIME, UPLOAD_DIR } from "@/lib/media/storage";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const resolved = path.resolve(UPLOAD_DIR, ...segments);

  // Block path traversal outside the uploads directory
  if (!resolved.startsWith(UPLOAD_DIR + path.sep)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const mime = EXTENSION_MIME[path.extname(resolved).slice(1).toLowerCase()];
  if (!mime) return new NextResponse("Not found", { status: 404 });

  try {
    const data = await readFile(resolved);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
