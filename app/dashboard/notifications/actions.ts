// PATH: app/notifications/actions.ts
// AKSI: BUAT FILE BARU

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

  redirect("/notifications");
}
