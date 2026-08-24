// PATH: app/dashboard/page.tsx
// AKSI: GANTI SELURUH ISI FILE

import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";
import { redirect } from "next/navigation";
import Link from "next/link";

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
      <h1 className="text-lg font-semibold" style={{ color: "var(--primary-dark)" }}>
        Dashboard SUDROS
      </h1>
      <p className="text-sm text-[var(--muted-foreground)]">{user.email}</p>
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
