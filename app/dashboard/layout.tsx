// PATH: app/dashboard/layout.tsx
// AKSI: GANTI SELURUH ISI FILE (sisakan ThemeToggle bar cuma di mobile, tambah padding kiri untuk sidebar desktop)

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
    <div className="min-h-screen pb-20 md:pb-6 md:pl-60">
      <div
        className="flex justify-end border-b px-4 py-2 md:hidden"
        style={{ borderColor: "var(--border)" }}
      >
        <ThemeToggle />
      </div>
      {children}
      <DashboardNav unreadCount={unreadCount || 0} />
    </div>
  );
}
