// PATH: app/admin/listings/ModerationButton.tsx
// AKSI: BUAT FILE BARU

"use client";

import { useState } from "react";
import { analyzeListingModeration, ModerationResult } from "./ai-actions";

const riskStyle: Record<
  ModerationResult["riskLevel"],
  { label: string; className: string }
> = {
  aman: {
    label: "✅ Aman",
    className: "border-green-300 bg-green-50 text-green-700",
  },
  perlu_ditinjau: {
    label: "⚠️ Perlu Ditinjau",
    className: "border-yellow-300 bg-yellow-50 text-yellow-700",
  },
  berisiko_tinggi: {
    label: "🚩 Berisiko Tinggi",
    className: "border-red-300 bg-red-50 text-red-700",
  },
};

export default function ModerationButton({ listingId }: { listingId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ModerationResult | null>(null);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    setLoading(true);
    setError("");
    setResult(null);

    const response = await analyzeListingModeration(listingId);

    if (response.ok && response.data) {
      setResult(response.data);
    } else {
      setError(
        response.error || "Analisis AI belum berhasil. Silakan coba lagi."
      );
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleAnalyze}
        disabled={loading}
        className="rounded-[var(--radius)] border border-gray-300 px-2 py-1 text-xs font-medium disabled:opacity-60"
        style={{ color: "var(--primary)" }}
      >
        {loading ? "Menganalisis..." : "🔍 Analisis AI"}
      </button>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      {result ? (
        <div
          className={`flex flex-col gap-1 rounded-[var(--radius)] border p-2 text-xs ${riskStyle[result.riskLevel].className}`}
        >
          <span className="font-medium">{riskStyle[result.riskLevel].label}</span>
          <span>{result.summary}</span>
          {result.reasons.length > 0 ? (
            <ul className="list-disc pl-4">
              {result.reasons.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          ) : null}
          <span className="italic text-[var(--muted-foreground)]">
            Rekomendasi AI — keputusan tetap di tangan admin.
          </span>
        </div>
      ) : null}
    </div>
  );
}
