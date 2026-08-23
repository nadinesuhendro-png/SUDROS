import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SUDROS — Temukan. Tawarkan. Terhubung.",
  description:
    "Platform listing lokal Indonesia untuk properti, kendaraan, elektronik, barang, dan jasa.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
