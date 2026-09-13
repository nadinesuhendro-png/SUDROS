// PATH: app/admin/anchor/actions.ts
// AKSI: GANTI TOTAL (fix: pola sama seperti admin/listings/actions.ts — pakai admin client/service role
// untuk semua mutasi setelah identitas admin divalidasi manual, hindari kemungkinan is_admin() RLS
// gagal saat dievaluasi nested di dalam UPDATE/INSERT)

"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  return { adminId: user.id };
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createAnchorInvite() {
  const { adminId } = await requireAdmin();
  const adminSupabase = createAdminClient();

  const token = randomUUID().replace(/-/g, "");

  const { error } = await adminSupabase.from("anchor_invites").insert({
    token,
    created_by: adminId,
  });

  if (error) {
    redirect("/admin/anchor?error=generate_failed");
  }

  redirect(`/admin/anchor?generated=${token}`);
}

export async function upgradeUserToAnchor(formData: FormData) {
  await requireAdmin();
  const adminSupabase = createAdminClient();

  const query = (formData.get("query") as string)?.trim();
  if (!query) {
    redirect("/admin/anchor?error=empty_query");
  }

  let profile: { id: string } | null = null;

  if (UUID_REGEX.test(query)) {
    const { data } = await adminSupabase
      .from("profiles")
      .select("id")
      .eq("id", query)
      .maybeSingle();
    profile = data;
  } else {
    const { data } = await adminSupabase
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

  const { error: updateError } = await adminSupabase
    .from("profiles")
    .update({
      is_anchor_seller: true,
      anchor_activated_at: new Date().toISOString(),
      anchor_last_active_at: new Date().toISOString(),
      anchor_last_visit_at: new Date().toISOString(),
    })
    .eq("id", profile!.id);

  if (updateError) {
    redirect("/admin/anchor?error=upgrade_failed");
  }

  await adminSupabase.from("notifications").insert({
    recipient_user_id: profile!.id,
    type: "anchor_upgraded",
    title: "🎉 Kamu resmi jadi Penjual Jangkar",
    message:
      "Admin baru saja mengaktifkan status Penjual Jangkar di akun kamu. Sekarang listing kamu tanpa batas dan gratis biaya paket.",
    reference_type: "package",
    reference_id: null,
    is_read: false,
  });

  redirect("/admin/anchor?upgraded=1");
}

export async function revokeAnchor(formData: FormData) {
  await requireAdmin();
  const adminSupabase = createAdminClient();

  const id = formData.get("id") as string;
  if (!id) redirect("/admin/anchor");

  await adminSupabase.from("profiles").update({ is_anchor_seller: false }).eq("id", id);

  await adminSupabase.from("notifications").insert({
    recipient_user_id: id,
    type: "anchor_revoked",
    title: "Status Penjual Jangkar dicabut",
    message: "Status Penjual Jangkar di akun kamu dicabut oleh admin.",
    reference_type: "package",
    reference_id: null,
    is_read: false,
  });

  redirect("/admin/anchor");
}
