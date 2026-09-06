// PATH: app/admin/anchor/actions.ts
// AKSI: GANTI TOTAL

"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!myProfile || myProfile.role !== "admin") redirect("/dashboard");

  return { supabase, adminId: user.id };
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createAnchorInvite() {
  const { supabase, adminId } = await requireAdmin();

  const token = randomUUID().replace(/-/g, "");

  const { error } = await supabase.from("anchor_invites").insert({
    token,
    created_by: adminId,
  });

  if (error) {
    redirect("/admin/anchor?error=generate_failed");
  }

  redirect(`/admin/anchor?generated=${token}`);
}

export async function upgradeUserToAnchor(formData: FormData) {
  const { supabase } = await requireAdmin();

  const query = (formData.get("query") as string)?.trim();
  if (!query) {
    redirect("/admin/anchor?error=empty_query");
  }

  let profile: { id: string } | null = null;

  if (UUID_REGEX.test(query)) {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", query)
      .maybeSingle();
    profile = data;
  } else {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .ilike("whatsapp", `%${query}%`)
      .limit(1)
      .maybeSingle();
    profile = data;
  }

  if (!profile) {
    redirect("/admin/anchor?error=user_not_found");
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      is_anchor_seller: true,
      anchor_activated_at: new Date().toISOString(),
      anchor_last_active_at: new Date().toISOString(),
    })
    .eq("id", profile!.id);

  if (updateError) {
    redirect("/admin/anchor?error=upgrade_failed");
  }

  await supabase.from("notifications").insert({
    user_id: profile!.id,
    title: "🎉 Kamu resmi jadi Penjual Jangkar",
    message:
      "Admin baru saja mengaktifkan status Penjual Jangkar di akun kamu. Sekarang listing kamu tanpa batas dan gratis biaya paket.",
    link: "/dashboard/package",
    is_read: false,
  });

  redirect("/admin/anchor?upgraded=1");
}

export async function revokeAnchor(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = formData.get("id") as string;
  if (!id) redirect("/admin/anchor");

  await supabase.from("profiles").update({ is_anchor_seller: false }).eq("id", id);

  await supabase.from("notifications").insert({
    user_id: id,
    title: "Status Penjual Jangkar dicabut",
    message: "Status Penjual Jangkar di akun kamu dicabut oleh admin.",
    link: "/dashboard/package",
    is_read: false,
  });

  redirect("/admin/anchor");
}
