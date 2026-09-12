// PATH: app/admin/listings/actions.ts
// AKSI: GANTI TOTAL (sementara — versi diagnostic: cek jumlah baris ter-update secara eksplisit,
// dan tampilkan alasan gagal lewat query param supaya kelihatan di UI tanpa perlu cek DB manual)

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

  const { data: myProfile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!myProfile) {
    redirect(`/admin/listings?debug=no_profile&detail=${encodeURIComponent(profileError?.message || "")}`);
  }

  if (myProfile.role !== "admin") {
    redirect(`/admin/listings?debug=not_admin&role=${myProfile.role}`);
  }

  // Panggil is_admin() PERSIS lewat sesi login yang sama dengan yang dipakai UPDATE,
  // supaya auth.uid() di dalamnya nyata (beda dengan tes lewat SQL editor yang jalan
  // sebagai role lain, bukan sesi user yang sedang login)
  const { data: isAdminRpc, error: isAdminRpcError } = await supabase.rpc("is_admin");

  const id = formData.get("id") as string;
  const status = formData.get("status") as string;

  const allowedStatuses = ["active", "pending", "rejected", "suspended"];
  if (!id || !allowedStatuses.includes(status)) {
    redirect("/admin/listings?debug=bad_input");
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id, owner_id, title, status")
    .eq("id", id)
    .single();

  if (!listing) {
    redirect("/admin/listings?debug=listing_not_found");
  }

  const oldStatus = listing.status;

  // .select() setelah update supaya kita tahu PASTI berapa baris yang benar-benar
  // berubah — bukan cuma cek `error` (UPDATE yang ke-filter habis oleh RLS
  // biasanya TIDAK melempar error, hasilnya cuma 0 baris tanpa pemberitahuan)
  const { data: updatedRows, error: updateError } = await supabase
    .from("listings")
    .update({ status })
    .eq("id", id)
    .select("id, status");

  if (updateError) {
    redirect(
      `/admin/listings?debug=update_error&detail=${encodeURIComponent(updateError.message)}&is_admin_rpc=${isAdminRpc}&is_admin_rpc_error=${encodeURIComponent(isAdminRpcError?.message || "none")}&my_id=${user.id}&owner_id=${listing.owner_id}`
    );
  }

  if (!updatedRows || updatedRows.length === 0) {
    // Update "sukses" tapi 0 baris kena — ini tanda RLS diam-diam memblokir
    redirect(`/admin/listings?debug=zero_rows_updated&listing_id=${id}`);
  }

  if (oldStatus !== status) {
    const template = STATUS_MESSAGES[status];
    if (template) {
      const { error: notifError } = await supabase.from("notifications").insert({
        recipient_user_id: listing.owner_id,
        type: "listing_status_change",
        title: template.title,
        message: template.message(listing.title),
        reference_type: "listing",
        reference_id: listing.id,
        is_read: false,
      });

      if (notifError) {
        redirect(`/admin/listings?debug=notif_error&detail=${encodeURIComponent(notifError.message)}`);
      }
    }
  }

  redirect("/admin/listings?debug=success");
}
