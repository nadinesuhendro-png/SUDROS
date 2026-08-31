// PATH: app/dashboard/layout.tsx
// AKSI: UPDATE FILE (tambah header slim berisi ThemeToggle di atas semua halaman dashboard)

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardNav from "./DashboardNav";
import ThemeToggle from "@/components/ThemeToggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("recipient_user_id", user.id)
    .eq("is_read", false);

  return (
    <div className="min-h-screen pb-20">
      <div
        className="flex justify-end border-b px-4 py-2"
        style={{ borderColor: "var(--border)" }}
      >
        <ThemeToggle />
      </div>
      {children}
      <DashboardNav unreadCount={unreadCount || 0} />
    </div>
  );
}
