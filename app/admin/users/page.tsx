// PATH: app/admin/users/page.tsx
// AKSI: UPDATE FILE (auth check & AdminNav dipindah ke layout.tsx, jadi tidak dobel)

import { createClient } from "@/lib/supabase/server";

type UserRow = {
  id: string;
  username: string;
  role: string;
  whatsapp: string | null;
  created_at: string;
};

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, username, role, whatsapp, created_at")
    .order("created_at", { ascending: false })
    .returns<UserRow[]>();

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-[var(--muted-foreground)]">
        Users ({(users || []).length})
      </h2>

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
  );
}
