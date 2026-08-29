// PATH: app/admin/marketing/actions.ts
// AKSI: BUAT FILE BARU (server actions lengkap: generate listing, generate platform, update, duplicate, archive, delete, publish)

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateMarketingContent, generatePlatformContent } from "@/lib/marketing/content-service";
import type { MarketingListingFacts } from "@/lib/marketing/fallback";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sudros-chi.vercel.app";

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

type ListingForGeneration = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  location_city: string;
  location_area: string | null;
  categories: { name: string } | null;
};

export async function generateContent(formData: FormData) {
  const { supabase, userId } = await requireAdmin();

  const listingId = formData.get("listing_id") as string;
  const platform = formData.get("platform") as
    | "instagram"
    | "facebook"
    | "tiktok"
    | "whatsapp"
    | "general";
  const campaignId = (formData.get("campaign_id") as string) || null;

  if (!listingId || !platform) {
    redirect("/admin/marketing/generate");
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id, title, description, price, location_city, location_area, categories(name)")
    .eq("id", listingId)
    .maybeSingle<ListingForGeneration>();

  if (!listing) {
    redirect("/admin/marketing/generate");
  }

  const facts: MarketingListingFacts = {
    title: listing.title,
    description: listing.description || "",
    price: listing.price,
    locationCity: listing.location_city,
    locationArea: listing.location_area || "",
    categoryName: listing.categories?.name || "",
    listingUrl: `${SITE_URL}/listings/${listing.id}`,
  };

  const { content, generationMethod } = await generateMarketingContent(facts, platform);

  const { data: newContent } = await supabase
    .from("marketing_contents")
    .insert({
      listing_id: listing.id,
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
    redirect("/admin/marketing/generate");
  }

  redirect(`/admin/marketing/content/${newContent.id}`);
}

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

export async function updateContent(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = formData.get("id") as string;
  const headline = formData.get("headline") as string;
  const hook = formData.get("hook") as string;
  const caption = formData.get("caption") as string;
  const shortCopy = formData.get("short_copy") as string;
  const videoScript = formData.get("video_script") as string;
  const cta = formData.get("cta") as string;
  const hashtagsRaw = formData.get("hashtags") as string;
  const status = formData.get("status") as string;

  const hashtags = hashtagsRaw
    ? hashtagsRaw.split(",").map((h) => h.trim()).filter(Boolean)
    : [];

  if (!id) {
    redirect("/admin/marketing/content");
  }

  await supabase
    .from("marketing_contents")
    .update({
      headline,
      hook,
      caption,
      short_copy: shortCopy,
      video_script: videoScript,
      cta,
      hashtags,
      status,
    })
    .eq("id", id);

  redirect(`/admin/marketing/content/${id}`);
}

export async function duplicateContent(formData: FormData) {
  const { supabase, userId } = await requireAdmin();

  const id = formData.get("id") as string;

  const { data: original } = await supabase
    .from("marketing_contents")
    .select(
      "listing_id, campaign_id, platform, headline, hook, caption, short_copy, video_script, cta, hashtags, generation_method"
    )
    .eq("id", id)
    .maybeSingle();

  if (!original) {
    redirect("/admin/marketing/content");
  }

  const { data: newContent } = await supabase
    .from("marketing_contents")
    .insert({
      ...original,
      status: "draft",
      created_by: userId,
    })
    .select("id")
    .single();

  redirect(`/admin/marketing/content/${newContent?.id || ""}`);
}

export async function archiveContent(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = formData.get("id") as string;

  await supabase.from("marketing_contents").update({ status: "archived" }).eq("id", id);

  redirect("/admin/marketing/content");
}

export async function deleteContent(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = formData.get("id") as string;

  await supabase.from("marketing_contents").delete().eq("id", id);

  redirect("/admin/marketing/content");
}

export async function markPublished(formData: FormData) {
  const { supabase, userId } = await requireAdmin();

  const id = formData.get("id") as string;
  const platform = formData.get("platform") as string;
  const publishedUrl = (formData.get("published_url") as string) || null;

  await supabase.from("marketing_publications").insert({
    content_id: id,
    platform,
    published_url: publishedUrl,
    created_by: userId,
  });

  await supabase.from("marketing_contents").update({ status: "published" }).eq("id", id);

  redirect(`/admin/marketing/content/${id}`);
    }
