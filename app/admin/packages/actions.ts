// PATH: app/admin/packages/actions.ts
// AKSI: BUAT FILE BARU

"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function togglePackageActive(formData: FormData) {
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

  const id = formData.get("id") as string;
  const isActive = formData.get("is_active") === "true";

  if (!id) {
    redirect("/admin/packages");
  }

  await supabase
    .from("advertising_packages")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);

  redirect("/admin/packages");
}
