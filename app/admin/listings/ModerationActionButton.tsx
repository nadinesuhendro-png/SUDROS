// PATH: app/admin/listings/ModerationActionButton.tsx
// AKSI: BUAT FILE BARU (tombol dengan feedback visual langsung saat ditap, sebelum halaman reload)

"use client";

import { useFormStatus } from "react-dom";

type Props = {
  status: "active" | "suspended" | "rejected";
  label: string;
  colorClass: string;
};

export default function ModerationActionButton({ status, label, colorClass }: Props) {
  const { pending, data } = useFormStatus();

  // `data` berisi FormData dari submit yang sedang berjalan — cek supaya
  // cuma TOMBOL YANG DITEKAN yang berubah tampilan, bukan semua tombol
  // sekaligus (form ini punya 3 tombol dengan name="status" berbeda)
  const isThisButtonPending = pending && data?.get("status") === status;

  return (
    <button
      type="submit"
      name="status"
      value={status}
      disabled={pending}
      className={`rounded-[var(--radius)] border px-2 py-1 text-xs ${colorClass} ${
        pending && !isThisButtonPending ? "opacity-40" : ""
      }`}
    >
      {isThisButtonPending ? "Memproses..." : label}
    </button>
  );
}

