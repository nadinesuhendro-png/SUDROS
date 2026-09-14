"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function deleteNotification(formData: FormData) {
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
    .delete()
    .eq("id", id)
    .eq("recipient_user_id", user.id);

  redirect("/dashboard/notifications");
}

export async function deleteAllNotifications() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase
    .from("notifications")
    .delete()
    .eq("recipient_user_id", user.id);

  redirect("/dashboard/notifications");
}
