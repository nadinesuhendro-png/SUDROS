// PATH: app/go/[contentId]/route.ts
// AKSI: BUAT FILE BARU (public tracking redirect: catat social_click lalu redirect ke listing/homepage)

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const { contentId } = await params;
  const supabase = createAdminClient();

  const { data: content } = await supabase
    .from("marketing_contents")
    .select("id, listing_id, campaign_id, platform")
    .eq("id", contentId)
    .maybeSingle();

  if (!content) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  await supabase.from("marketing_events").insert({
    content_id: content.id,
    campaign_id: content.campaign_id,
    listing_id: content.listing_id,
    event_type: "social_click",
    utm_source: content.platform,
    utm_medium: "social",
    utm_campaign: content.campaign_id || null,
    utm_content: content.id,
  });

  const destination = content.listing_id
    ? new URL(`/listings/${content.listing_id}`, request.url)
    : new URL("/", request.url);

  destination.searchParams.set("utm_source", content.platform);
  destination.searchParams.set("utm_medium", "social");
  if (content.campaign_id) {
    destination.searchParams.set("utm_campaign", content.campaign_id);
  }
  destination.searchParams.set("utm_content", content.id);

  return NextResponse.redirect(destination);
}
