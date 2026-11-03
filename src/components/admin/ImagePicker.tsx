"use client";

import { useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, X } from "lucide-react";
import { inputClass } from "./ui";

/**
 * Upload a file or paste a URL — both produce a plain string the form stores.
 * Used for brand logos (single) and product images (up to 5, reorderable).
 */
export function ImagePicker({
  images,
  onChange,
  max = 5,
  label = "Images",
}: {
  images: string[];
  onChange: (next: string[]) => void;
  max?: number;
  label?: string;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const full = images.length >= max;

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    const added: string[] = [];
    for (const file of Array.from(files).slice(0, max - images.length)) {
      const body = new FormData();
      body.append("file", file);
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        added.push(data.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    }
    if (added.length) onChange([...images, ...added]);
    setBusy(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  function addUrl() {
    const trimmed = url.trim();
    if (!trimmed || full) return;
    onChange([...images, trimmed]);
    setUrl("");
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  return (
    <div>
      <p className="mb-1 text-sm font-medium text-neutral-700">
        {label}{" "}
        <span className="font-normal text-wx-muted">
          ({images.length}/{max}
          {max > 1 ? " — first is the main image" : ""})
        </span>
      </p>

      {images.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-2">
          {images.map((src, i) => (
            <li
              key={`${src}-${i}`}
              className="group relative h-20 w-20 overflow-hidden rounded-xl border border-wx-line bg-wx-bg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              {i === 0 && max > 1 && (
                <span className="absolute left-1 top-1 rounded bg-wx-purple px-1 text-[9px] font-bold text-white">
                  MAIN
                </span>
              )}
              <button
                type="button"
                onClick={() => onChange(images.filter((_, j) => j !== i))}
                aria-label={`Remove image ${i + 1}`}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition group-hover:opacity-100"
              >
                <X size={12} aria-hidden="true" />
              </button>
              {max > 1 && images.length > 1 && (
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                  <button type="button" onClick={() => move(i, i - 1)} aria-label="Move earlier" className="px-2 py-0.5">
                    ←
                  </button>
                  <button type="button" onClick={() => move(i, i + 1)} aria-label="Move later" className="px-2 py-0.5">
                    →
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={full || busy}
          onClick={() => fileInput.current?.click()}
          className="wx-focus inline-flex items-center gap-1.5 rounded-xl border border-wx-line bg-white px-3 py-2 text-sm font-medium transition hover:border-wx-purple disabled:opacity-50"
        >
          {busy ? (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus size={14} aria-hidden="true" />
          )}
          Upload
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple={max > 1}
          hidden
          onChange={(e) => upload(e.target.files)}
        />

        <div className="flex min-w-[14rem] flex-1 items-center gap-1">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
            placeholder="…or paste an image URL"
            disabled={full}
            className={inputClass}
          />
          <button
            type="button"
            onClick={addUrl}
            disabled={full || !url.trim()}
            aria-label="Add image URL"
            className="wx-focus rounded-xl border border-wx-line bg-white p-2 transition hover:border-wx-purple disabled:opacity-50"
          >
            <Link2 size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
