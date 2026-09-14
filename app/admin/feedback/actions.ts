"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return user;
}

export async function markFeedbackRead(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return;

  const adminSupabase = createAdminClient();
  await adminSupabase.from("feedback").update({ is_read: true }).eq("id", id);

  revalidatePath("/admin/feedback");
}

export async function deleteFeedback(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return;

  const adminSupabase = createAdminClient();
  // Soft-delete: is_deleted = true, bukan DELETE beneran, supaya audit trail tetap ada
  await adminSupabase.from("feedback").update({ is_deleted: true }).eq("id", id);

  revalidatePath("/admin/feedback");
}

export async function deleteAllFeedback() {
  await requireAdmin();

  const adminSupabase = createAdminClient();
  await adminSupabase
    .from("feedback")
    .update({ is_deleted: true })
    .eq("is_deleted", false);

  revalidatePath("/admin/feedback");
}
