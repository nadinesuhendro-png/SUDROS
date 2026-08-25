// PATH: app/admin/listings/actions.ts
// AKSI: BUAT FILE BARU

"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function moderateListing(formData: FormData) {
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

  const allowedStatuses = ["active", "pending", "rejected", "suspended"];
  if (!id || !allowedStatuses.includes(status)) {
    redirect("/admin/listings");
  }

  await supabase.from("listings").update({ status }).eq("id", id);

  redirect("/admin/listings");
}
