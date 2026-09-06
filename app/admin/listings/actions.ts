// PATH: app/admin/listings/actions.ts
// AKSI: GANTI TOTAL

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

  // Ambil data listing dulu (untuk owner id, judul, dan status lama)
  // supaya kita tahu siapa yang harus dinotifikasi dan apakah status benar-benar berubah.
  const { data: listing } = await supabase
    .from("listings")
    .select("id, user_id, title, status")
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

  // Kirim notifikasi ke pemilik listing hanya kalau status benar-benar berubah
  // dan bukan admin sendiri yang jadi pemilik (jaga-jaga aksi admin di listing sendiri, opsional).
  if (oldStatus !== status) {
    const template = STATUS_MESSAGES[status];
    if (template) {
      await supabase.from("notifications").insert({
        user_id: listing.user_id,
        title: template.title,
        message: template.message(listing.title),
        link: `/dashboard/listings`,
        is_read: false,
      });
    }
  }

  redirect("/admin/listings");
  }
