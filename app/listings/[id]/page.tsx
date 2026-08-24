// PATH: app/listings/[id]/page.tsx
// AKSI: UPDATE FILE (versi debug sementara)

import { createClient } from "@/lib/supabase/server";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listing, error } = await supabase
    .from("listings")
    .select(
      "id, title, description, price, location_city, location_area, owner_id, listing_images(image_url, sort_order), categories(name), profiles(username)"
    )
    .eq("id", id)
    .single();

  return (
    <pre style={{ padding: 16, fontSize: 12, whiteSpace: "pre-wrap" }}>
      {JSON.stringify({ id, listing, error }, null, 2)}
    </pre>
  );
}
