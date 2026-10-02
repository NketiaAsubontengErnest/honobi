"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { deleteMedia } from "@/actions/media";
import { Copy, FileText, Trash2, Upload } from "lucide-react";

type Media = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number | null;
  altText: string | null;
  folder: string | null;
  createdAt: string;
};

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export function MediaClient({
  media,
  canUpload,
  canDelete,
}: {
  media: Media[];
  canUpload: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  const folders = Array.from(new Set(media.map((m) => m.folder).filter(Boolean))) as string[];
  const visible = filter === "all" ? media : media.filter((m) => m.folder === filter);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setMessage(null);
    try {
      const body = new FormData();
      Array.from(files).forEach((f) => body.append("files", f));
      body.append("folder", "uploads");
      const res = await fetch("/api/media", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ ok: false, text: json.errors?.join(" · ") || json.error || "Upload failed" });
      } else {
        const errs = json.errors?.length ? ` (${json.errors.join(" · ")})` : "";
        setMessage({ ok: true, text: `Uploaded ${json.saved.length} file(s)${errs}` });
        router.refresh();
      }
    } catch {
      setMessage({ ok: false, text: "Upload failed. Check your connection and try again." });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(m: Media) {
    if (!confirm(`Remove "${m.filename}" from the library?`)) return;
    setBusy(true);
    try {
      await deleteMedia(m.id);
      router.refresh();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Delete failed" });
    } finally {
      setBusy(false);
    }
  }

  async function copy(m: Media) {
    try {
      await navigator.clipboard.writeText(window.location.origin + m.url);
      setCopied(m.id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setMessage({ ok: false, text: "Could not copy the link" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Media Library</h1>
        {canUpload && (
          <div className="flex gap-2">
            <Button onClick={() => inputRef.current?.click()} disabled={busy} className="gap-2">
              <Upload className="h-4 w-4" /> {busy ? "Working..." : "Upload"}
            </Button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif,application/pdf"
              className="hidden"
              onChange={(e) => upload(e.target.files)}
            />
          </div>
        )}
      </div>

      {message && <p className={`text-sm ${message.ok ? "text-green-600" : "text-destructive"}`}>{message.text}</p>}

      {folders.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {["all", ...folders].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 text-xs capitalize ${filter === f ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-muted-foreground">No media yet. {canUpload ? "Upload files or import the site images." : ""}</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {visible.map((m) => (
            <Card key={m.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square bg-muted flex items-center justify-center">
                  {m.mimeType.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.url} alt={m.altText ?? m.filename} className="object-cover w-full h-full" />
                  ) : (
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="p-2 space-y-1">
                  <p className="text-xs truncate" title={m.filename}>{m.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(m.createdAt)} {formatSize(m.size) && `· ${formatSize(m.size)}`}
                  </p>
                  <div className="flex gap-1 pt-1">
                    <Button size="sm" variant="outline" className="h-7 flex-1 gap-1 px-2 text-xs" onClick={() => copy(m)}>
                      <Copy className="h-3 w-3" /> {copied === m.id ? "Copied" : "Copy URL"}
                    </Button>
                    {canDelete && (
                      <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => remove(m)} aria-label="Delete">
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
