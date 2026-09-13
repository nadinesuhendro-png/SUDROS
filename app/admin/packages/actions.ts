// PATH: app/admin/packages/actions.ts
// AKSI: GANTI TOTAL (fix: pola sama seperti admin/listings/actions.ts — pakai admin client/service role
// untuk semua mutasi setelah identitas admin divalidasi manual, hindari kemungkinan is_admin() RLS
// gagal saat dievaluasi nested di dalam UPDATE/INSERT/DELETE)

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

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function togglePackageActive(formData: FormData) {
  await requireAdmin();
  const adminSupabase = createAdminClient();

  const id = formData.get("id") as string;
  const isActive = formData.get("is_active") === "true";

  if (!id) {
    redirect("/admin/packages");
  }

  await adminSupabase
    .from("advertising_packages")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);

  redirect("/admin/packages");
}

export async function createPackage(formData: FormData) {
  await requireAdmin();
  const adminSupabase = createAdminClient();

  const name = (formData.get("name") as string || "").trim();
  const description = (formData.get("description") as string || "").trim();
  const price = Number(formData.get("price"));
  const durationDays = Number(formData.get("duration_days"));
  const maxActiveListings = Number(formData.get("max_active_listings"));

  if (!name || Number.isNaN(price) || Number.isNaN(durationDays) || Number.isNaN(maxActiveListings)) {
    redirect("/admin/packages/new?error=1");
  }

  await adminSupabase.from("advertising_packages").insert({
    name,
    slug: slugify(name),
    description,
    price,
    duration_days: durationDays,
    max_active_listings: maxActiveListings,
    is_active: true,
  });

  redirect("/admin/packages");
}

export async function updatePackage(formData: FormData) {
  await requireAdmin();
  const adminSupabase = createAdminClient();

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string || "").trim();
  const description = (formData.get("description") as string || "").trim();
  const price = Number(formData.get("price"));
  const durationDays = Number(formData.get("duration_days"));
  const maxActiveListings = Number(formData.get("max_active_listings"));

  if (!id || !name || Number.isNaN(price) || Number.isNaN(durationDays) || Number.isNaN(maxActiveListings)) {
    redirect(`/admin/packages/${id}/edit?error=1`);
  }

  await adminSupabase
    .from("advertising_packages")
    .update({
      name,
      slug: slugify(name),
      description,
      price,
      duration_days: durationDays,
      max_active_listings: maxActiveListings,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  redirect("/admin/packages");
}

export async function deletePackage(formData: FormData) {
  await requireAdmin();
  const adminSupabase = createAdminClient();

  const id = formData.get("id") as string;

  if (!id) {
    redirect("/admin/packages");
  }

  await adminSupabase.from("advertising_packages").delete().eq("id", id);

  redirect("/admin/packages");
}
