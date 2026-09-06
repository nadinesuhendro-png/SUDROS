// PATH: lib/anchor/track-visit.ts
// AKSI: BUAT FILE BARU

import { createClient } from "@/lib/supabase/server";

// Panggil sekali di dashboard layout (server component) supaya kunjungan
// Penjual Jangkar tercatat. Aman dipanggil untuk semua user — fungsi DB-nya
// sendiri yang cuma update kalau user itu memang is_anchor_seller.
export async function trackAnchorVisit() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.rpc("record_anchor_visit");
}
