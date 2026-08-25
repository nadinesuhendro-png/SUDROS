// PATH: app/listings/[id]/ReportButton.tsx
// AKSI: BUAT FILE BARU

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const reasons = [
  "Penipuan",
  "Listing palsu",
  "Spam",
  "Harga menyesatkan",
  "Konten terlarang",
  "Duplikat",
  "Lainnya",
];

export default function ReportButton({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!reason) {
      setError("Pilih alasan laporan");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { error: insertError } = await supabase.from("reports").insert({
        listing_id: listingId,
        reporter_id: user.id,
        reason,
        detail: detail || null,
      });

      if (insertError) {
        throw new Error(insertError.message);
      }

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim laporan");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-[var(--muted-foreground)] underline"
      >
        Laporkan listing ini
      </button>
    );
  }

  if (done) {
    return (
      <p className="rounded-[var(--radius)] bg-green-50 px-3 py-2 text-xs text-green-700">
        Laporan terkirim. Terima kasih.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius)] border border-gray-200 p-3">
      <p className="text-sm font-medium">Laporkan listing ini</p>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="">Pilih alasan</option>
        {reasons.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <textarea
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        placeholder="Detail tambahan (opsional)"
        rows={2}
        className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-sm"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 rounded-[var(--radius)] bg-red-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
        >
          {submitting ? "Mengirim..." : "Kirim Laporan"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-[var(--radius)] border border-gray-300 px-3 py-2 text-xs"
        >
          Batal
        </button>
      </div>
    </div>
  );
          }
