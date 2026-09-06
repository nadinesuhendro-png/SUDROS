// PATH: lib/anchor/track-visit.ts
// AKSI: GANTI TOTAL

import { createClient } from "@/lib/supabase/server";

// Panggil sekali di dashboard layout supaya kunjungan Penjual Jangkar
// tercatat. userId opsional (kalau caller sudah punya, hindari query auth
// dua kali) — fungsi RPC di DB sendiri yang cuma update kalau user itu
// memang berstatus is_anchor_seller.
export async function trackAnchorVisit(userId?: string) {
  const supabase = await createClient();

  let uid = userId;
  if (!uid) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    uid = user?.id;
  }

  if (!uid) return;

  await supabase.rpc("record_anchor_visit");
}
