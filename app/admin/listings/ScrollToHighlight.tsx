// PATH: app/admin/listings/ScrollToHighlight.tsx
// AKSI: BUAT FILE BARU

"use client";

import { useEffect } from "react";

export default function ScrollToHighlight({ id }: { id: string | null }) {
  useEffect(() => {
    if (!id) return;

    const el = document.getElementById(`listing-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [id]);

  return null;
}
