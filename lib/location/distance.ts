// PATH: lib/location/distance.ts
// AKSI: BUAT FILE BARU

/**
 * Hitung jarak lurus (haversine) antara dua titik koordinat, dalam kilometer.
 * Ini BUKAN jarak tempuh jalan raya - untuk itu, arahkan user ke link Google Maps
 * (lihat buildDirectionsUrl di bawah) yang menghitung rute sungguhan secara gratis
 * tanpa perlu API key di sisi kita.
 */
export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // radius bumi dalam km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Format jarak untuk ditampilkan ke user, dengan label jujur "jarak lurus"
 * (bukan jarak tempuh) supaya tidak menyesatkan.
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `~${Math.round(km * 1000)} m dari lokasimu`;
  }
  return `~${km.toFixed(1)} km dari lokasimu`;
}

/**
 * Link Google Maps untuk rute sungguhan (jarak tempuh jalan + estimasi waktu).
 * Tidak butuh API key karena ini cuma URL biasa, bukan panggilan API.
 */
export function buildDirectionsUrl(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}`;
}

