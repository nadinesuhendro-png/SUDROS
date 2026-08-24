import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-lg font-semibold" style={{ color: "var(--primary-dark)" }}>
        Dashboard SUDROS
      </h1>
      <p className="text-sm text-[var(--muted-foreground)]">{user?.email}</p>
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
