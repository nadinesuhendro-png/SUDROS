"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

type SubdomainRow = {
  period_days: number;
  expires_at: string | null;
};

export async function confirmSubdomain(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = createAdminClient();

  const { data: row } = await supabase
    .from("seller_subdomains")
    .select("period_days, expires_at")
    .eq("id", id)
    .single<SubdomainRow>();

  const periodDays = row?.period_days ?? 30;
  const now = new Date();

  // Kalau masih ada sisa waktu aktif (belum lewat expires_at), tambahkan
  // periode baru di atas sisa waktu itu. Kalau sudah lewat (expired total),
  // mulai dari sekarang.
  const currentExpiry = row?.expires_at ? new Date(row.expires_at) : null;
  const base = currentExpiry && currentExpiry > now ? currentExpiry : now;
  const expiresAt = new Date(
    base.getTime() + periodDays * 24 * 60 * 60 * 1000
  ).toISOString();

  await supabase
    .from("seller_subdomains")
    .update({
      status: "active",
      activated_at: now.toISOString(),
      expires_at: expiresAt,
      grace_started_at: null,
      last_notice_date: null,
    })
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
