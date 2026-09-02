// PATH: app/admin/terms/actions.ts
// AKSI: BUAT FILE BARU

"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!myProfile || myProfile.role !== "admin") {
    redirect("/dashboard");
  }

  return supabase;
}

export async function createTermsVersion(formData: FormData) {
  const supabase = await requireAdmin();

  const version = ((formData.get("version") as string) || "").trim();
  const title = ((formData.get("title") as string) || "").trim();
  const content = ((formData.get("content") as string) || "").trim();

  if (!version || !title || !content) {
    redirect("/admin/terms/new?error=1");
  }

  const { error } = await supabase.from("terms_versions").insert({
    version,
    title,
    content,
    is_active: false,
  });

  if (error) {
    redirect(
      `/admin/terms/new?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect("/admin/terms");
}

export async function activateTermsVersion(formData: FormData) {
  const supabase = await requireAdmin();

  const id = formData.get("id") as string;

  if (!id) {
    redirect("/admin/terms");
  }

  // Nonaktifkan versi aktif saat ini dulu SEBELUM mengaktifkan versi baru
  // — wajib berurutan, bukan paralel, karena ada unique partial index
  // yang cuma mengizinkan satu is_active=true dalam satu waktu.
  await supabase
    .from("terms_versions")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("is_active", true);

  await supabase
    .from("terms_versions")
    .update({
      is_active: true,
      effective_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  redirect("/admin/terms");
        }
