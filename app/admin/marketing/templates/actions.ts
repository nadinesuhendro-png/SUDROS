// PATH: app/admin/marketing/templates/actions.ts
// AKSI: BUAT FILE BARU (CRUD template promosi)

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

  return { supabase };
}

export async function createTemplate(formData: FormData) {
  const { supabase } = await requireAdmin();

  const name = (formData.get("name") as string || "").trim();
  const description = (formData.get("description") as string || "").trim();
  const platform = (formData.get("platform") as string) || null;
  const contentType = (formData.get("content_type") as string) || null;
  const templateBody = (formData.get("template_body") as string || "").trim();

  if (!name || !templateBody) {
    redirect("/admin/marketing/templates/new?error=1");
  }

  await supabase.from("marketing_templates").insert({
    name,
    description,
    platform,
    content_type: contentType,
    template_body: templateBody,
    is_active: true,
  });

  redirect("/admin/marketing/templates");
}

export async function updateTemplate(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string || "").trim();
  const description = (formData.get("description") as string || "").trim();
  const platform = (formData.get("platform") as string) || null;
  const contentType = (formData.get("content_type") as string) || null;
  const templateBody = (formData.get("template_body") as string || "").trim();

  if (!id || !name || !templateBody) {
    redirect(`/admin/marketing/templates/${id}/edit?error=1`);
  }

  await supabase
    .from("marketing_templates")
    .update({
      name,
      description,
      platform,
      content_type: contentType,
      template_body: templateBody,
    })
    .eq("id", id);

  redirect("/admin/marketing/templates");
}

export async function toggleTemplateActive(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = formData.get("id") as string;
  const isActive = formData.get("is_active") === "true";

  await supabase.from("marketing_templates").update({ is_active: isActive }).eq("id", id);

  redirect("/admin/marketing/templates");
}

export async function deleteTemplate(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = formData.get("id") as string;

  await supabase.from("marketing_templates").delete().eq("id", id);

  redirect("/admin/marketing/templates");
      }
