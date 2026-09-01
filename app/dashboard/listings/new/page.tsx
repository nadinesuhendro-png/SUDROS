// PATH: app/dashboard/listings/new/page.tsx
// AKSI: GANTI SELURUH ISI FILE (cek kuota sebelum form dibuka, redirect ke halaman Paket kalau penuh)

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NewListingForm from "./NewListingForm";
import { getUserEntitlements } from "@/lib/entitlements/service";

type Category = {
  id: string;
  name: string;
};

export default async function NewListingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Cek kuota SEBELUM form dibuka — kalau sudah penuh, jangan biarkan
  // user mengisi form dulu baru ditolak. Berlaku untuk semua tier
  // (Free/Starter/Growth/Business) karena getUserEntitlements generik.
  const entitlements = await getUserEntitlements(user.id);

  if (!entitlements.canCreateListing) {
    redirect(
      `/dashboard/package?error=${encodeURIComponent(
        "Kuota listing aktif Anda sudah habis. Upgrade paket untuk menambah kuota."
      )}`
    );
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name")
    .returns<Category[]>();

  return (
    <NewListingForm categories={categories || []} errorMessage={params.error} />
  );
}
