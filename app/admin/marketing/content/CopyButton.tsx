// PATH: app/admin/marketing/content/CopyButton.tsx
// AKSI: BUAT FILE BARU

"use client";

import { useState } from "react";

export default function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent fail
    }
  }

  if (!text) return null;

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-[var(--radius)] border border-gray-300 px-2 py-1 text-xs font-medium"
    >
      {copied ? "✓ Disalin" : `Copy${label ? ` ${label}` : ""}`}
    </button>
  );
}
