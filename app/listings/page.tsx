// PATH: app/dashboard/page.tsx
// AKSI: UPDATE FILE

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1
        className="text-2xl font-semibold"
        style={{ color: "var(--primary-dark)" }}
      >
        Dashboard SUDROS
      </h1>

      <p className="text-[var(--muted-foreground)]">{user.email}</p>

      {profile ? (
        <p className="text-[var(--muted-foreground)]">
          Username: {profile.username}
          <br />
          Role: {profile.role}
        </p>
      ) : null}

      <div className="mt-2 flex flex-col gap-3">
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

        <form action={signOut}>
          <button
            type="submit"
            className="rounded-[var(--radius)] px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--primary)" }}
          >
            Keluar
          </button>
        </form>
      </div>
    </main>
  );
}
