// PATH: app/dashboard/profile/FeedbackForm.tsx
// AKSI: FILE BARU

import { submitFeedbackAction } from "./feedback-actions";

export default function FeedbackForm({
  errorMessage,
  successMessage,
}: {
  errorMessage?: string;
  successMessage?: string;
}) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
        Saran & Masukan
      </p>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Nemu bug atau ada ide buat SUDROS? Kirim di sini, langsung masuk ke admin.
      </p>

      {successMessage ? (
        <p className="mt-3 rounded-[var(--radius)] bg-green-50 p-2 text-xs text-green-700">
          Terima kasih, masukan kamu sudah terkirim!
        </p>
      ) : null}

      {errorMessage ? (
        <p className="mt-3 rounded-[var(--radius)] bg-red-50 p-2 text-xs text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <form action={submitFeedbackAction} className="mt-3 flex flex-col gap-2">
        <textarea
          name="message"
          required
          maxLength={1000}
          rows={4}
          placeholder="Tulis saran, masukan, atau bug yang kamu temukan..."
          className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] p-3 text-sm text-[var(--foreground)]"
        />
        <button
          type="submit"
          className="w-full rounded-[var(--radius)] py-2.5 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--primary)" }}
        >
          Kirim Masukan
        </button>
      </form>
    </div>
  );
}

