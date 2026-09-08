// AKSI: GANTI SELURUH ISI FILE (tambah tracking whatsapp_clicked)
// PATH: app/listings/[id]/WhatsAppButton.tsx

"use client";

import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics/track";

export default function WhatsAppButton({
  listingId,
  waLink,
}: {
  listingId: string;
  waLink: string;
}) {
  async function handleClick() {
    const supabase = createClient();
    await supabase.rpc("increment_whatsapp_click", { p_listing_id: listingId });
    track("whatsapp_clicked", { listing_id: listingId });
    window.open(waLink, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-[var(--radius)] bg-green-600 px-4 py-3 text-center text-sm font-medium text-white"
    >
      Hubungi via WhatsApp
    </button>
  );
}
