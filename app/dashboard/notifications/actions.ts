// PATH: app/dashboard/notifications/actions.ts
// AKSI: GANTI SELURUH ISI FILE (perbaiki redirect path lama + tambah markAsRead per-item)

"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function markAllAsRead() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_user_id", user.id)
    .eq("is_read", false);

  redirect("/dashboard/notifications");
}

export async function markAsRead(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const id = formData.get("id") as string;
  if (!id) {
    return;
  }

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("recipient_user_id", user.id);

  redirect("/dashboard/notifications");
}
