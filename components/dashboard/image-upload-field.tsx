"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Image picker for forms: choose a file, it uploads immediately and the resulting URL
 * is submitted with the form through a hidden input named `name`.
 * Images uploaded here belong to the record (project / service) and are not added to the media library.
 */
export function ImageUploadField({
  name,
  target,
  initialUrl = "",
}: {
  name: string;
  target: "project" | "service";
  initialUrl?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPG, PNG, WebP, GIF or AVIF).");
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.append("files", file);
      body.append("target", target);
      const res = await fetch("/api/media", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.saved?.[0]) {
        setError(json.errors?.join(" · ") || json.error || "Upload failed");
      } else {
        setUrl(json.saved[0].url);
      }
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={url} />
      {url ? (
        <div className="relative h-40 w-full max-w-xs overflow-hidden rounded-md border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Selected" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex h-40 w-full max-w-xs items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
          No image selected
        </div>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()} className="gap-2">
          <ImagePlus className="h-4 w-4" /> {busy ? "Uploading..." : url ? "Replace image" : "Upload image"}
        </Button>
        {url && (
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => setUrl("")} className="gap-2">
            <Trash2 className="h-4 w-4 text-destructive" /> Remove
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => onPick(e.target.files)}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
