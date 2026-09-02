// PATH: app/(auth)/forgot-password/page.tsx
// AKSI: BUAT FILE BARU

"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const supabase = createClient();

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    setSubmitting(false);

    if (resetError) {
      setError("Gagal mengirim tautan reset. Silakan coba lagi.");
      return;
    }

    // Sengaja tidak membedakan pesan "email terdaftar" vs "tidak
    // terdaftar" — mencegah orang mengecek email siapa saja yang punya
    // akun SUDROS lewat halaman ini (enumeration).
    setSent(true);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1
        className="text-center text-lg font-semibold"
        style={{ color: "var(--primary-dark)" }}
      >
        Lupa Password
      </h1>

      {sent ? (
        <div className="rounded-[var(--radius)] bg-green-50 px-4 py-3 text-center text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
          Kalau email tersebut terdaftar, tautan reset password sudah
          dikirim. Silakan cek inbox (dan folder spam).
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {error ? (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--foreground)]">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm text-[var(--foreground)]"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-[var(--radius)] py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: "var(--primary)" }}
          >
            {submitting ? "Mengirim..." : "Kirim Tautan Reset"}
          </button>
        </form>
      )}

      <Link
        href="/login"
        className="text-center text-xs text-[var(--muted-foreground)] underline"
      >
        Kembali ke Login
      </Link>
    </main>
  );
}
