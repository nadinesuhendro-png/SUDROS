// AKSI: BUAT FILE BARU
// PATH: app/dashboard/subdomain/actions.ts

"use server";

import { createClient } from "@/lib/supabase/server";
import { isValidSubdomain } from "@/lib/subdomains/reserved";
import { revalidatePath } from "next/cache";

type RequestResult = { error?: string; success?: boolean };

export async function requestSubdomain(
  _prev: RequestResult,
  formData: FormData
): Promise<RequestResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Harus login" };

  const raw = String(formData.get("subdomain") || "").trim().toLowerCase();
  const proofUrl = String(formData.get("proof_url") || "").trim();

  if (!isValidSubdomain(raw)) {
    return { error: "Nama subdomain tidak valid (3-30 karakter huruf/angka/strip, tidak boleh nama umum yang dipakai sistem)" };
  }
  if (!proofUrl) {
    return { error: "Bukti transfer wajib diunggah" };
  }

  const { data: existing } = await supabase
    .from("seller_subdomains")
    .select("id, status, owner_id")
    .eq("subdomain", raw)
    .maybeSingle<{ id: string; status: string; owner_id: string }>();

  if (existing && existing.status !== "expired" && existing.status !== "rejected") {
    return { error: "Subdomain ini sudah dipakai atau sedang diproses" };
  }

  if (existing && (existing.status === "expired" || existing.status === "rejected") && existing.owner_id === user.id) {
    const { error } = await supabase
      .from("seller_subdomains")
      .update({ status: "pending_payment", proof_image_url: proofUrl, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) return { error: "Gagal mengirim pengajuan" };
  } else if (existing) {
    return { error: "Subdomain ini sudah dipakai" };
  } else {
    const { error } = await supabase.from("seller_subdomains").insert({
      owner_id: user.id,
      subdomain: raw,
      proof_image_url: proofUrl,
      status: "pending_payment",
    });
    if (error) return { error: "Gagal mengirim pengajuan" };
  }

  revalidatePath("/dashboard/subdomain");
  return { success: true };
}
