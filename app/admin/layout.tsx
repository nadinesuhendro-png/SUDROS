import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "./AdminNav";
import { getAdminNavCounts } from "@/lib/admin/nav-counts";

export default async function AdminLayout({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const counts = await getAdminNavCounts();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
      <h1
        className="text-lg font-semibold"
        style={{ color: "var(--primary-dark)" }}
      >
        Admin Panel
      </h1>
      <AdminNav counts={counts} />
      {children}
    </div>
  );
}
