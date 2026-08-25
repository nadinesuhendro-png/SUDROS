// PATH: app/admin/reports/actions.ts
// AKSI: BUAT FILE BARU

"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function resolveReport(formData: FormData) {
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
  const status = formData.get("status") as string;

  if (!id || !["resolved", "dismissed"].includes(status)) {
    redirect("/admin/reports");
  }

  await supabase
    .from("reports")
    .update({ status, resolved_at: new Date().toISOString(), resolved_by: user.id })
    .eq("id", id);

  redirect("/admin/reports");
}
