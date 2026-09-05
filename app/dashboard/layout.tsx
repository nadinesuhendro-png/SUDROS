// PATH: app/dashboard/layout.tsx
// AKSI: GANTI SELURUH ISI FILE (hapus bar toggle tema mengambang, ThemeToggle pindah ke halaman Profil)

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardNav from "./DashboardNav";

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
      {children}
      <DashboardNav unreadCount={unreadCount || 0} />
    </div>
  );
}
