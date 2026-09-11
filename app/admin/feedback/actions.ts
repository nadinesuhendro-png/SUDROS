// PATH: app/admin/feedback/actions.ts
// AKSI: FILE BARU

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

export async function markFeedbackRead(formData: FormData) {
  const supabase = await requireAdmin();

  const id = formData.get("id") as string;

  if (!id) {
    redirect("/admin/feedback");
  }

  await supabase.from("feedback").update({ is_read: true }).eq("id", id);

  redirect("/admin/feedback");
}
