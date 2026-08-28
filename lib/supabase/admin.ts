// PATH: lib/supabase/admin.ts
// AKSI: BUAT FILE BARU (service role client — HANYA untuk operasi server-side yang perlu bypass RLS, seperti ai_cache)

import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
