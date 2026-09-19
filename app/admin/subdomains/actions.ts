// AKSI: BUAT FILE BARU
// PATH: app/admin/subdomains/actions.ts

"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function confirmSubdomain(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = createAdminClient();

  const { data: row } = await supabase
    .from("seller_subdomains")
    .select("period_days")
    .eq("id", id)
    .single<{ period_days: number }>();

  const periodDays = row?.period_days ?? 30;
  const expiresAt = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000).toISOString();

  await supabase
    .from("seller_subdomains")
    .update({ status: "active", activated_at: new Date().toISOString(), expires_at: expiresAt })
    .eq("id", id);

  revalidatePath("/admin/subdomains");
}

export async function rejectSubdomain(formData: FormData) {
  const id = String(formData.get("id"));
  const note = String(formData.get("note") || "");
  const supabase = createAdminClient();

  await supabase
    .from("seller_subdomains")
    .update({ status: "rejected", admin_note: note })
    .eq("id", id);

  revalidatePath("/admin/subdomains");
}
