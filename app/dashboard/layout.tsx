// PATH: app/dashboard/layout.tsx
// AKSI: GANTI TOTAL (tambah tracking kunjungan Penjual Jangkar)

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardNav from "./DashboardNav";
import { trackAnchorVisit } from "@/lib/anchor/track-visit";

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

  await trackAnchorVisit(user.id);

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
