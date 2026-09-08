// AKSI: BUAT FILE BARU
// PATH: components/share-button.tsx

"use client";

import { useState } from "react";
import { track } from "@/lib/analytics/track";

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

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="rounded-[var(--radius)] border px-4 py-2.5 text-sm font-medium"
      style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
    >
      {copied ? "Link disalin" : "Bagikan"}
    </button>
  );
}

