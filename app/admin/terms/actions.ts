// PATH: app/admin/terms/actions.ts
// AKSI: GANTI TOTAL (preventif: pakai admin client untuk mutasi, pola sama seperti fix
// admin/listings & admin/anchor & admin/packages — hindari kemungkinan is_admin() RLS
// gagal nested di dalam INSERT/UPDATE, sudah terbukti nyata terjadi di kasus listings)

"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
}

export async function createTermsVersion(formData: FormData) {
  await requireAdmin();
  const adminSupabase = createAdminClient();

  const version = ((formData.get("version") as string) || "").trim();
  const title = ((formData.get("title") as string) || "").trim();
  const content = ((formData.get("content") as string) || "").trim();

  if (!version || !title || !content) {
    redirect("/admin/terms/new?error=1");
  }

  const { error } = await adminSupabase.from("terms_versions").insert({
    version,
    title,
    content,
    is_active: false,
  });

  if (error) {
    redirect(`/admin/terms/new?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin/terms");
}

export async function activateTermsVersion(formData: FormData) {
  await requireAdmin();
  const adminSupabase = createAdminClient();

  const id = formData.get("id") as string;

  if (!id) {
    redirect("/admin/terms");
  }

  // Nonaktifkan versi aktif saat ini dulu SEBELUM mengaktifkan versi baru
  // — wajib berurutan, bukan paralel, karena ada unique partial index
  // yang cuma mengizinkan satu is_active=true dalam satu waktu.
  const { error: deactivateError } = await adminSupabase
    .from("terms_versions")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("is_active", true);

  if (deactivateError) {
    redirect(`/admin/terms?error=${encodeURIComponent(deactivateError.message)}`);
  }

  const { error: activateError } = await adminSupabase
    .from("terms_versions")
    .update({
      is_active: true,
      effective_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (activateError) {
    redirect(`/admin/terms?error=${encodeURIComponent(activateError.message)}`);
  }

  redirect("/admin/terms");
}
