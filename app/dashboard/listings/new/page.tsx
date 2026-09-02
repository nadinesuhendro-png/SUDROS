// PATH: app/dashboard/listings/new/page.tsx
// AKSI: GANTI SELURUH ISI FILE (tambah Terms Consent Gate)

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NewListingForm from "./NewListingForm";
import { getUserEntitlements } from "@/lib/entitlements/service";
import { getActiveTermsVersion, hasUserAgreedToActiveTerms } from "@/lib/terms/service";
import TermsConsentGate from "@/components/TermsConsentGate";

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

  // Cek kuota SEBELUM form dibuka
  const entitlements = await getUserEntitlements(user.id);

  if (!entitlements.canCreateListing) {
    redirect(
      `/dashboard/package?error=${encodeURIComponent(
        "Kuota listing aktif Anda sudah habis. Upgrade paket untuk menambah kuota."
      )}`
    );
  }

  // Terms Consent Gate — FAIL CLOSED kalau versi aktif tidak ditemukan
  const activeTerms = await getActiveTermsVersion();

  if (!activeTerms) {
    return (
      <main className="mx-auto flex max-w-lg flex-col gap-4 p-6">
        <div className="rounded-[var(--radius)] border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          Terjadi masalah saat memuat Syarat & Ketentuan. Pembuatan listing
          untuk sementara tidak tersedia. Silakan coba lagi nanti.
        </div>
      </main>
    );
  }

  const hasAgreed = await hasUserAgreedToActiveTerms(user.id, activeTerms.id);

  if (!hasAgreed) {
    return <TermsConsentGate termsVersion={activeTerms.version} />;
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
