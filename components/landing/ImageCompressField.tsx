// AKSI: BUAT FILE BARU
// PATH: components/landing/ImageCompressField.tsx
"use client";

import { useState } from "react";
import type { ChangeEvent, CSSProperties } from "react";

type Props = {
  name: string;
  label: string;
  maxSide?: number;
  currentUrl?: string | null;
};

const MAX_CHARS = 760000;

function compress(file: File, maxSide: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const objUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * ratio));
      const h = Math.max(1, Math.round(img.height * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objUrl);
        reject(new Error("canvas"));
        return;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(objUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objUrl);
      reject(new Error("load"));
    };
    img.src = objUrl;
  });
}

const wrap: CSSProperties = { marginTop: 14 };
const labelStyle: CSSProperties = { display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 };
const fileInput: CSSProperties = { width: "100%", fontSize: 14 };
const previewStyle: CSSProperties = { width: 96, height: 96, objectFit: "cover", borderRadius: 12, border: "1px solid rgba(128,128,128,0.4)", marginTop: 8, display: "block" };
const infoStyle: CSSProperties = { fontSize: 12, opacity: 0.7, marginTop: 6 };
const errStyle: CSSProperties = { fontSize: 13, color: "#dc2626", marginTop: 6 };

export default function ImageCompressField({ name, label, maxSide = 800, currentUrl }: Props) {
  const [dataUrl, setDataUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const out = await compress(file, maxSide);
      if (out.length > MAX_CHARS) {
        setDataUrl("");
        setError("Gambar masih terlalu besar, coba foto lain");
      } else {
        setDataUrl(out);
      }
    } catch {
      setDataUrl("");
      setError("Gagal memproses gambar");
    }
    setBusy(false);
  }

  const shown = dataUrl || currentUrl || "";

  return (
    <div style={wrap}>
      <label style={labelStyle}>{label}</label>
      <input type="file" accept="image/*" onChange={onPick} style={fileInput} />
      <input type="hidden" name={name} value={dataUrl} />
      {busy ? <div style={infoStyle}>Memproses gambar...</div> : null}
      {error ? <div style={errStyle}>{error}</div> : null}
      {shown ? <img src={shown} alt="Pratinjau" style={previewStyle} /> : null}
      {dataUrl ? <div style={infoStyle}>Gambar siap diunggah, tekan tombol simpan.</div> : null}
    </div>
  );
      }
