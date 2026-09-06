// PATH: lib/agents/anchor-agent.ts
// AKSI: BUAT FILE BARU

import { createClient } from "@supabase/supabase-js";

// Pakai service role langsung (bukan client server biasa) karena cron
// tidak punya session user, dan fungsi deactivate_inactive_anchor_sellers()
// memang di-grant khusus ke service_role di migration.
export async function runAnchorAgent() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return { success: false, error: "missing_service_role_env" };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { error } = await supabase.rpc("deactivate_inactive_anchor_sellers");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
