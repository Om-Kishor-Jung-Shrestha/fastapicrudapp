"use client";

import { ChangeEvent, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { uploadImage } from "@/lib/productApi";
import { resolveImageUrl } from "@/lib/api";

interface Props {
  value: string;
  onChange: (imageUrl: string) => void;
  label?: string;
  rounded?: boolean;
}

export default function ImageUploader({ value, onChange, label = "Product Image", rounded = false }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch {
      setError("Upload failed. Please try a smaller image file (png, jpg, gif, webp).");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const preview = resolveImageUrl(value);

  return (
    <div>
      <label className="label">{label}</label>
      {preview ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            className={`h-28 w-28 object-cover border border-slate-200 ${rounded ? "rounded-full" : "rounded-lg"}`}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 rounded-full bg-red-600 text-white p-1"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <label
          className={`flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-1 border-2 border-dashed border-slate-300 text-slate-400 hover:border-brand-400 hover:text-brand-500 ${rounded ? "rounded-full" : "rounded-lg"}`}
        >
          <UploadCloud className="h-6 w-6" />
          <span className="text-xs">{uploading ? "Uploading..." : "Upload"}</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
