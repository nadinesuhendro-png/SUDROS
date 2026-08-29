import { generateMarketingContent, generatePlatformContent } from "@/lib/marketing/content-service";

export async function generatePlatformContentAction(formData: FormData) {
  const { supabase, userId } = await requireAdmin();

  const platform = formData.get("platform") as
    | "instagram"
    | "facebook"
    | "tiktok"
    | "whatsapp"
    | "general";
  const campaignId = (formData.get("campaign_id") as string) || null;

  if (!platform) {
    redirect("/admin/marketing/generate/platform");
  }

  const { content, generationMethod } = await generatePlatformContent(SITE_URL, platform);

  const { data: newContent } = await supabase
    .from("marketing_contents")
    .insert({
      listing_id: null,
      campaign_id: campaignId,
      platform,
      headline: content.headline,
      hook: content.hook,
      caption: content.caption,
      short_copy: content.short_copy,
      video_script: content.video_script,
      cta: content.cta,
      hashtags: content.hashtags,
      status: "draft",
      generation_method: generationMethod,
      created_by: userId,
    })
    .select("id")
    .single();

  if (!newContent) {
    redirect("/admin/marketing/generate/platform");
  }

  redirect(`/admin/marketing/content/${newContent.id}`);
}
