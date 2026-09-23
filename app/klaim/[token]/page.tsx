// Taruh file ini di: app/klaim/[token]/page.tsx
"use client";

import { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { claimListing } from "./actions";

export default function KlaimPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await claimListing(params.token, formData);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(res.error);
      }
    });
  }

  if (success) {
    return (
      <div className="max-w-sm mx-auto p-6 text-center">
        <h1 className="text-lg font-semibold mb-2">Berhasil! 🎉</h1>
        <p className="text-sm text-gray-600">Akunmu sudah aktif. Mengarahkan ke halaman login...</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-lg font-semibold mb-1">Klaim Etalase Kamu</h1>
      <p className="text-sm text-gray-500 mb-6">
        Konfirmasi nomor WA & buat password buat mulai kelola listingmu sendiri.
      </p>
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nomor WhatsApp (sesuai yang didaftarkan)</label>
          <input name="whatsapp" required className="w-full border rounded px-3 py-2" placeholder="628xxxxxxxxxx" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Buat Password</label>
          <input name="password" type="password" required minLength={6} className="w-full border rounded px-3 py-2" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-[#1d6fb8] text-white rounded px-4 py-2 font-medium disabled:opacity-50"
        >
          {isPending ? "Memproses..." : "Klaim Sekarang"}
        </button>
      </form>
    </div>
  );
}

