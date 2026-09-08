// AKSI: BUAT FILE BARU
// PATH: app/opengraph-image.tsx

import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0b2a52, #1d6fb8)",
          color: "white",
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -1 }}>SUDROS</div>
        <div style={{ fontSize: 30, marginTop: 20, color: "#cfe4f5" }}>
          Temukan. Tawarkan. Terhubung.
        </div>
        <div style={{ fontSize: 20, marginTop: 30, color: "#9fc4e2", maxWidth: 700, textAlign: "center" }}>
          Platform listing lokal Indonesia untuk usaha, produk, jasa, dan tempat di sekitarmu.
        </div>
      </div>
    ),
    { ...size }
  );
}

