// PATH: app/dashboard/messages/actions.ts
// AKSI: GANTI SELURUH ISI FILE (perbaikan query listing_id null)

"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function startConversation(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const sellerId = formData.get("seller_id") as string;
  const listingId = (formData.get("listing_id") as string) || null;

  if (!sellerId || sellerId === user.id) {
    return;
  }

  let existingQuery = supabase
    .from("conversations")
    .select("id")
    .eq("buyer_id", user.id)
    .eq("seller_id", sellerId);

  existingQuery = listingId
    ? existingQuery.eq("listing_id", listingId)
    : existingQuery.is("listing_id", null);

  const { data: existing } = await existingQuery.maybeSingle<{ id: string }>();

  if (existing) {
    redirect(`/dashboard/messages/${existing.id}`);
  }

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({
      buyer_id: user.id,
      seller_id: sellerId,
      listing_id: listingId,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !created) {
    redirect(
      listingId
        ? `/listings/${listingId}?error=${encodeURIComponent(
            "Gagal memulai percakapan"
          )}`
        : "/dashboard/messages"
    );
  }

  redirect(`/dashboard/messages/${created.id}`);
}

export async function sendMessage(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const conversationId = formData.get("conversation_id") as string;
  const content = ((formData.get("content") as string) || "").trim();

  if (!conversationId || !content) {
    return;
  }

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content,
  });

  revalidatePath(`/dashboard/messages/${conversationId}`);
  revalidatePath("/dashboard/messages");
}
