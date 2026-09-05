// PATH: components/LocationPicker.tsx
// AKSI: BUAT FILE BARU
//
// PENTING - cara pakai di form (karena Leaflet butuh window/browser):
//   import dynamic from "next/dynamic";
//   const LocationPicker = dynamic(() => import("@/components/LocationPicker"), { ssr: false });
//
// Tambahan yang perlu dilakukan MANUAL sebelum pakai komponen ini:
//   1. Tambah dependency di package.json:
//        "leaflet": "^1.9.4"
//        "react-leaflet": "^5.0.0"
//      lalu commit - Vercel akan install otomatis pas build.
//   2. Import CSS Leaflet di app/globals.css (baris paling atas):
//        @import "leaflet/dist/leaflet.css";

"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { LeafletMouseEvent } from "leaflet";

type LocationPickerProps = {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
};

// Default center: tengah Indonesia (Jakarta), dipakai kalau belum ada titik dipilih
const DEFAULT_CENTER: [number, number] = [-6.2, 106.816666];

// Ikon marker custom (lingkaran biru brand) - menghindari masalah path gambar
// default Leaflet yang sering patah di Next.js/bundler modern.
const markerIcon = L.divIcon({
  className: "",
  html: `<div style="width:20px;height:20px;border-radius:9999px;background:#1d6fb8;border:3px solid #ffffff;box-shadow:0 0 0 1px rgba(0,0,0,0.2);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function ClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  const position: [number, number] =
    latitude !== null && longitude !== null ? [latitude, longitude] : DEFAULT_CENTER;

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocateError("Browser tidak mendukung lokasi otomatis.");
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => {
        setLocateError("Gagal mengambil lokasi. Pastikan izin lokasi diaktifkan.");
        setLocating(false);
      }
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--card-foreground)]">
          Tap pada peta untuk menandai lokasi tempat kamu berjualan
        </p>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--card-foreground)] disabled:opacity-50"
        >
          {locating ? "Mencari..." : "Gunakan lokasi saya"}
        </button>
      </div>

      {locateError ? (
        <p className="text-xs text-[var(--destructive)]">{locateError}</p>
      ) : null}

      <div className="h-64 w-full overflow-hidden rounded-[var(--radius)] border border-[var(--border)]">
        <MapContainer
          center={position}
          zoom={latitude !== null ? 15 : 5}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <ClickHandler onSelect={onChange} />
          {latitude !== null && longitude !== null ? (
            <Marker position={[latitude, longitude]} icon={markerIcon} />
          ) : null}
        </MapContainer>
      </div>

      {latitude !== null && longitude !== null ? (
        <p className="text-xs text-[var(--muted-foreground)]">
          Titik dipilih: {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </p>
      ) : (
        <p className="text-xs text-[var(--muted-foreground)]">Belum ada titik dipilih.</p>
      )}
    </div>
  );
}
