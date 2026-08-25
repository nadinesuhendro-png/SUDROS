// PATH: app/dashboard/profile/actions.ts
// AKSI: BUAT FILE BARU

"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const whatsappRaw = ((formData.get("whatsapp") as string) || "").trim();
  const whatsapp = whatsappRaw.replace(/[^0-9]/g, "");

  const { error } = await supabase
    .from("profiles")
    .update({ whatsapp: whatsapp || null })
    .eq("id", user.id);

  if (error) {
    redirect(
      `/dashboard/profile?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect("/dashboard/profile?success=1");
                                    }
