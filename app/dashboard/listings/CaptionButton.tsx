// PATH: app/dashboard/listings/CaptionButton.tsx
// AKSI: BUAT FILE BARU

"use client";

import { useState } from "react";
import { generateMarketingCaption } from "./ai-actions";

export default function CaptionButton({
  listingId,
}: {
  listingId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [caption, setCaption] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setCaption(null);
    setCopied(false);

    const result = await generateMarketingCaption(listingId);

    if (result.ok && result.data) {
      setCaption(result.data.caption);
    } else {
      setError(
        result.error || "Maaf, caption belum berhasil dibuat. Silakan coba lagi."
      );
    }

    setLoading(false);
  }

  async function handleCopy() {
    if (!caption) return;
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Gagal menyalin caption. Silakan salin manual.");
    }
  }

  function handleWhatsAppShare() {
    if (!caption) return;
    const publicUrl = `${window.location.origin}/listings/${listingId}`;
    const text = `${caption}\n\nLihat selengkapnya:\n${publicUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="w-full rounded-[var(--radius)] border border-gray-300 px-3 py-1 text-xs font-medium disabled:opacity-60"
        style={{ color: "var(--primary)" }}
      >
        {loading ? "✨ Membuat Caption..." : "✨ Buat Caption Promosi"}
      </button>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      {caption ? (
        <div className="flex flex-col gap-2 rounded-[var(--radius)] border border-blue-200 bg-blue-50 p-3 text-sm">
          <p className="text-xs font-medium text-blue-700">Caption Promosi</p>
          <p className="whitespace-pre-wrap text-sm">{caption}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-[var(--radius)] border border-gray-300 px-3 py-1 text-xs font-medium"
            >
              {copied ? "✓ Disalin" : "Copy Caption"}
            </button>
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="rounded-[var(--radius)] bg-green-600 px-3 py-1 text-xs font-medium text-white"
            >
              Bagikan ke WhatsApp
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
              }
