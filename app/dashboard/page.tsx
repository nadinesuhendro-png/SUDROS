// PATH: app/dashboard/page.tsx
// AKSI: UPDATE FILE (hilangkan tulisan "Dashboard SUDROS")

import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";
import { redirect } from "next/navigation";

type Profile = {
  username: string;
  role: string;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, role")
    .eq("id", user.id)
    .single<Profile>();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <Image
        src="/brand/sudros-logo.png"
        alt="SUDROS"
        width={220}
        height={140}
        priority
        className="h-auto w-40"
      />
      <h2
        className="text-lg font-semibold"
        style={{ color: "var(--primary-dark)" }}
      >
        Temukan. Tawarkan. Terhubung.
      </h2>

      <p className="mt-2 text-sm text-[var(--muted-foreground)]">{user.email}</p>
      {profile ? (
        <div className="text-sm text-[var(--muted-foreground)]">
          <p>Username: {profile.username}</p>
          <p>Role: {profile.role}</p>
        </div>
      ) : (
        <p className="text-sm text-red-500">Profil belum ditemukan</p>
      )}
      <Link
        href="/dashboard/listings/new"
        className="rounded-[var(--radius)] px-4 py-2 text-sm font-medium text-white"
        style={{ backgroundColor: "var(--primary)" }}
      >
        Buat Listing Baru
      </Link>
      <Link
        href="/dashboard/listings"
        className="rounded-[var(--radius)] px-4 py-2 text-sm font-medium text-white"
        style={{ backgroundColor: "var(--primary)" }}
      >
        Listing Saya
      </Link>
      <Link
        href="/dashboard/profile"
        className="rounded-[var(--radius)] px-4 py-2 text-sm font-medium text-white"
        style={{ backgroundColor: "var(--primary)" }}
      >
        Edit Profil
      </Link>
      <form action={logout}>
        <button
          type="submit"
          className="rounded-[var(--radius)] px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--primary)" }}
        >
          Keluar
        </button>
      </form>
    </main>
  );
          }
