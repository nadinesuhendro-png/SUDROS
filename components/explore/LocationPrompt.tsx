// PATH: components/explore/LocationPrompt.tsx
// AKSI: BUAT FILE BARU

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LocationPrompt() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleClick() {
    if (!navigator.geolocation) {
      setError("Browser tidak mendukung lokasi otomatis.");
      return;
    }

    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("lat", String(pos.coords.latitude));
        params.set("lng", String(pos.coords.longitude));
        router.push(`/dashboard/explore?${params.toString()}`);
        setLoading(false);
      },
      () => {
        setError("Gagal mengambil lokasi. Pastikan izin lokasi diaktifkan di browser.");
        setLoading(false);
      }
    );
  }

  return (
    <div className="flex flex-col gap-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-3 text-xs">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[var(--muted-foreground)]">
          Aktifkan lokasi untuk lihat jarak ke setiap listing dan urutkan dari yang terdekat.
        </p>
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="shrink-0 rounded-[var(--radius)] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: "var(--primary)" }}
        >
          {loading ? "Mencari..." : "Aktifkan Lokasi"}
        </button>
      </div>
      {error ? <p className="text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}

