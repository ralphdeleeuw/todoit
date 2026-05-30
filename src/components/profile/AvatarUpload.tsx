"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";

interface AvatarUploadProps {
  currentImage: string | null;
  initial: string;
  size?: number;
  accentColor?: string;
}

export function AvatarUpload({ currentImage, initial, size = 56, accentColor }: AvatarUploadProps) {
  const [image, setImage] = useState(currentImage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch("/api/user/avatar", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload mislukt");
        return;
      }
      setImage(data.image);
    } catch {
      setError("Upload mislukt");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const fontSize = Math.round(size * 0.36);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <button
        type="button"
        onClick={() => !loading && inputRef.current?.click()}
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center font-bold text-white relative group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        style={{ background: accentColor ?? "var(--accent-primary)" }}
        aria-label="Profielfoto wijzigen"
      >
        {image ? (
          <img src={image} alt="" className="w-full h-full object-cover" />
        ) : (
          <span style={{ fontSize }}>{initial}</span>
        )}

        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
          {loading ? (
            <Loader2 className="text-white animate-spin" style={{ width: size * 0.36, height: size * 0.36 }} />
          ) : (
            <Camera className="text-white" style={{ width: size * 0.36, height: size * 0.36 }} />
          )}
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />

      {error && (
        <p
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 text-[11px] text-red-400 whitespace-nowrap rounded-lg px-2 py-1"
          style={{ background: "var(--arc-panel)" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
