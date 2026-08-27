// PATH: app/dashboard/page.tsx
// AKSI: UPDATE FILE (redesain jadi kartu, bottom nav & auth check dipindah ke layout.tsx)

import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";

type Profile = {
  username: string;
  role: string;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, role")
    .eq("id", user!.id)
    .single<Profile>();

  const { count: listingCount } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", user!.id);

  const { count: activeListingCount } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", user!.id)
    .eq("status", "active");

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--muted-foreground)]">Halo,</p>
          <h1
            className="text-lg font-semibold"
            style={{ color: "var(--primary-dark)" }}
          >
            {profile?.username || user?.email}
          </h1>
        </div>
        <Image
          src="/brand/sudros-logo.png"
          alt="SUDROS"
          width={80}
          height={50}
          priority
          className="h-auto w-16"
        />
      </div>

      {/* Ringkasan singkat */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[var(--radius)] border border-gray-200 p-4">
          <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
            {listingCount || 0}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">Total Listing</p>
        </div>
        <div className="rounded-[var(--radius)] border border-gray-200 p-4">
          <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
            {activeListingCount || 0}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">Listing Aktif</p>
        </div>
      </div>

      {/* CTA utama */}
      <Link
        href="/dashboard/listings/new"
        className="flex items-center justify-center gap-2 rounded-[var(--radius)] py-4 text-sm font-semibold text-white"
        style={{ backgroundColor: "var(--primary)" }}
      >
        + Buat Listing Baru
      </Link>

      {/* Akses cepat */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/dashboard/listings"
          className="flex flex-col gap-1 rounded-[var(--radius)] border border-gray-200 p-4 text-sm font-medium"
        >
          📋 Listing Saya
          <span className="text-xs font-normal text-[var(--muted-foreground)]">
            Kelola listing kamu
          </span>
        </Link>
        <Link
          href="/dashboard/payments"
          className="flex flex-col gap-1 rounded-[var(--radius)] border border-gray-200 p-4 text-sm font-medium"
        >
          💳 Riwayat Pembayaran
          <span className="text-xs font-normal text-[var(--muted-foreground)]">
            Cek status paket iklan
          </span>
        </Link>
      </div>

      <p className="text-center text-sm text-[var(--muted-foreground)]">
        Temukan. Tawarkan. Terhubung.
      </p>

      <form action={logout} className="flex justify-center">
        <button
          type="submit"
          className="text-xs text-[var(--muted-foreground)] underline"
        >
          Keluar
        </button>
      </form>
    </main>
  );
}
