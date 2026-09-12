// PATH: app/admin/listings/actions.ts
// AKSI: GANTI TOTAL (fix: kolom `link` tidak ada di tabel notifications — pakai type/reference_type/reference_id)

"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const STATUS_MESSAGES: Record<string, { title: string; message: (listingTitle: string) => string }> = {
  active: {
    title: "✅ Listing kamu disetujui",
    message: (t) => `Listing "${t}" kamu sudah disetujui dan sekarang tayang di Explore.`,
  },
  suspended: {
    title: "⏸️ Listing kamu disuspend",
    message: (t) =>
      `Listing "${t}" kamu untuk sementara disuspend oleh admin dan tidak tampil di Explore. Hubungi admin kalau ada pertanyaan.`,
  },
  rejected: {
    title: "❌ Listing kamu ditolak",
    message: (t) =>
      `Listing "${t}" kamu ditolak oleh admin dan tidak akan tampil di Explore. Kamu bisa edit dan ajukan ulang jika diperlukan.`,
  },
  pending: {
    title: "⏳ Listing kamu diperiksa ulang",
    message: (t) => `Listing "${t}" kamu sedang diperiksa ulang oleh admin.`,
  },
};

export async function moderateListing(formData: FormData) {
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

  const id = formData.get("id") as string;
  const status = formData.get("status") as string;

  const allowedStatuses = ["active", "pending", "rejected", "suspended"];
  if (!id || !allowedStatuses.includes(status)) {
    redirect("/admin/listings");
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id, owner_id, title, status")
    .eq("id", id)
    .single();

  if (!listing) {
    redirect("/admin/listings");
  }

  const oldStatus = listing.status;

  const { error: updateError } = await supabase
    .from("listings")
    .update({ status })
    .eq("id", id);

  if (updateError) {
    redirect("/admin/listings");
  }

  if (oldStatus !== status) {
    const template = STATUS_MESSAGES[status];
    if (template) {
      await supabase.from("notifications").insert({
        recipient_user_id: listing.owner_id,
        type: "listing_status_change",
        title: template.title,
        message: template.message(listing.title),
        reference_type: "listing",
        reference_id: listing.id,
        is_read: false,
      });
    }
  }

  redirect("/admin/listings");
}
