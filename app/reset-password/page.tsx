// PATH: app/reset-password/page.tsx
// AKSI: BUAT FILE BARU

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase otomatis menukar token di URL jadi session recovery
    // saat client dimuat (detectSessionInUrl default true). Kita cukup
    // tunggu event PASSWORD_RECOVERY sebelum menampilkan form, supaya
    // tidak muncul form kosong sebelum session siap.
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });

    // Fallback: kalau event sudah lewat sebelum listener terpasang,
    // cek session yang ada sekarang
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }

    setSubmitting(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    setSubmitting(false);

    if (updateError) {
      setError("Gagal mengubah password: " + updateError.message);
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  if (done) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-green-700 dark:text-green-400">
          Password berhasil diubah. Mengarahkan ke halaman login...
        </p>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          Memverifikasi tautan reset password...
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1
        className="text-center text-lg font-semibold"
        style={{ color: "var(--primary-dark)" }}
      >
        Buat Password Baru
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {error ? (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        ) : null}
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--foreground)]">
            Password Baru
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm text-[var(--foreground)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--foreground)]">
            Konfirmasi Password Baru
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm text-[var(--foreground)]"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-[var(--radius)] py-2 text-sm font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: "var(--primary)" }}
        >
          {submitting ? "Menyimpan..." : "Simpan Password Baru"}
        </button>
      </form>
    </main>
  );
      }
