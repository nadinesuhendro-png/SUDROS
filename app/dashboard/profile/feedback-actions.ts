// PATH: app/dashboard/profile/feedback-actions.ts
// AKSI: FILE BARU

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { submitFeedback } from "@/lib/feedback/service";

export async function submitFeedbackAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const message = (formData.get("message") as string) || "";

  const result = await submitFeedback(supabase, user.id, message);

  if (!result.ok) {
    redirect(`/dashboard/profile?feedback_error=${encodeURIComponent(result.error)}`);
  }

  redirect("/dashboard/profile?feedback_success=1");
}

