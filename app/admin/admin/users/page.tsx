// PATH: app/admin/users/page.tsx
// AKSI: BUAT FILE BARU

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "../AdminNav";

type UserRow = {
  id: string;
  username: string;
  role: string;
  whatsapp: string | null;
  created_at: string;
};

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!myProfile || myProfile.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: users } = await supabase
    .from("profiles")
    .select("id, username, role, whatsapp, created_at")
    .order("created_at", { ascending: false })
    .returns<UserRow[]>();

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
      <h1 className="text-lg font-semibold" style={{ color: "var(--primary-dark)" }}>
        Users
      </h1>

      <AdminNav />

      <div className="flex flex-col gap-2">
        {(users || []).map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between rounded-[var(--radius)] border border-gray-200 p-3 text-sm"
          >
            <div>
              <p className="font-medium">{u.username}</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {u.whatsapp || "Tanpa WhatsApp"}
              </p>
            </div>
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                u.role === "admin"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {u.role}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
