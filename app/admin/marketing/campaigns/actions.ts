// PATH: app/admin/marketing/campaigns/actions.ts
// AKSI: BUAT FILE BARU

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  return { supabase, userId: user.id };
}

export async function createCampaign(formData: FormData) {
  const { supabase, userId } = await requireAdmin();

  const name = (formData.get("name") as string || "").trim();
  const description = (formData.get("description") as string || "").trim();
  const startDate = (formData.get("start_date") as string) || null;
  const endDate = (formData.get("end_date") as string) || null;

  if (!name) {
    redirect("/admin/marketing/campaigns/new?error=1");
  }

  const { data: newCampaign } = await supabase
    .from("marketing_campaigns")
    .insert({
      name,
      description,
      start_date: startDate,
      end_date: endDate,
      status: "draft",
      created_by: userId,
    })
    .select("id")
    .single();

  if (!newCampaign) {
    redirect("/admin/marketing/campaigns/new?error=1");
  }

  redirect(`/admin/marketing/campaigns/${newCampaign.id}`);
}

export async function updateCampaign(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string || "").trim();
  const description = (formData.get("description") as string || "").trim();
  const startDate = (formData.get("start_date") as string) || null;
  const endDate = (formData.get("end_date") as string) || null;
  const status = formData.get("status") as string;

  if (!id || !name) {
    redirect(`/admin/marketing/campaigns/${id}/edit?error=1`);
  }

  await supabase
    .from("marketing_campaigns")
    .update({
      name,
      description,
      start_date: startDate,
      end_date: endDate,
      status,
    })
    .eq("id", id);

  redirect(`/admin/marketing/campaigns/${id}`);
}

export async function archiveCampaign(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = formData.get("id") as string;

  await supabase.from("marketing_campaigns").update({ status: "archived" }).eq("id", id);

  redirect("/admin/marketing/campaigns");
}

export async function assignContentToCampaign(formData: FormData) {
  const { supabase } = await requireAdmin();

  const contentId = formData.get("content_id") as string;
  const campaignId = (formData.get("campaign_id") as string) || null;

  if (!contentId) {
    redirect("/admin/marketing/content");
  }

  await supabase
    .from("marketing_contents")
    .update({ campaign_id: campaignId || null })
    .eq("id", contentId);

  redirect(`/admin/marketing/content/${contentId}`);
    }
