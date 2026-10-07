// AKSI: BUAT FILE BARU
// PATH: components/landing/ShareButtons.tsx
"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // lanjut ke cara cadangan
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 15V3" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </svg>
  );
}

type ShareProps = {
  url: string;
  title: string;
  text: string;
  style: CSSProperties;
};

export function ShareButton({ url, title, text, style }: ShareProps) {
  const [msg, setMsg] = useState("");

  async function onShare() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: title, text: text, url: url });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    const ok = await copyText(url);
    setMsg(ok ? "Link disalin" : "Gagal menyalin");
    setTimeout(() => setMsg(""), 2200);
  }

  return (
    <button type="button" onClick={onShare} style={style}>
      <ShareIcon />
      <span>{msg || "Bagikan Toko"}</span>
    </button>
  );
}

type CopyProps = {
  url: string;
  style: CSSProperties;
};

export function CopyLinkButton({ url, style }: CopyProps) {
  const [done, setDone] = useState(false);

  async function onCopy() {
    const ok = await copyText(url);
    if (ok) {
      setDone(true);
      setTimeout(() => setDone(false), 2200);
    }
  }

  return (
    <button type="button" onClick={onCopy} style={style}>
      <CopyIcon />
      <span>{done ? "Tersalin" : "Salin Link"}</span>
    </button>
  );
    }
