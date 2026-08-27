// PATH: app/dashboard/layout.tsx
// AKSI: BUAT FILE BARU (auth check terpusat + bottom nav untuk semua halaman /dashboard/*)

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
    <div className="min-h-screen pb-20">
      {children}
      <DashboardNav unreadCount={unreadCount || 0} />
    </div>
  );
}
