// AKSI: GANTI SELURUH ISI FILE
// PATH: components/share-button.tsx

"use client";

import { useState } from "react";
import { track } from "@/lib/analytics/track";
import { copyToClipboard } from "@/lib/utils/copy-to-clipboard";

export function ShareButton({
  listingId,
  title,
  url,
}: {
  listingId: string;
  title: string;
  url: string;
}) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  async function handleShare() {
    track("social_share_clicked", { listing_id: listingId, title });

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Dibatalkan pengguna atau gagal - lanjut ke fallback copy link
      }
    }

    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setCopyFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="rounded-[var(--radius)] border px-4 py-2.5 text-sm font-medium"
      style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
    >
      {copied ? "Link disalin" : copyFailed ? "Gagal menyalin" : "Bagikan"}
    </button>
  );
}
