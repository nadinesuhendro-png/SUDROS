// PATH: components/ListingDistanceBadge.tsx
// AKSI: BUAT FILE BARU

"use client";

import { useState } from "react";
import { calculateDistanceKm, formatDistance, buildDirectionsUrl } from "@/lib/location/distance";

export default function ListingDistanceBadge({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) {
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (latitude === null || longitude === null) {
    return null;
  }

  function handleCheckDistance() {
    if (!navigator.geolocation) {
      setError("Browser tidak mendukung lokasi otomatis.");
      return;
    }

    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDistanceKm(
          calculateDistanceKm(pos.coords.latitude, pos.coords.longitude, latitude, longitude)
        );
        setLoading(false);
      },
      () => {
        setError("Gagal mengambil lokasi. Pastikan izin lokasi diaktifkan.");
        setLoading(false);
      }
    );
  }

  if (distanceKm !== null) {
    return (
      <div className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm">
        <span className="font-medium" style={{ color: "var(--primary)" }}>
          {formatDistance(distanceKm)}
        </span>
        <a
          href={buildDirectionsUrl(0, 0, latitude, longitude).replace("origin=0,0", "")}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs underline text-[var(--muted-foreground)]"
        >
          Lihat rute
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleCheckDistance}
        disabled={loading}
        className="rounded-[var(--radius)] border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--card-foreground)] disabled:opacity-60"
      >
        {loading ? "Mencari lokasimu..." : "Lihat jarak dari lokasimu"}
      </button>
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
