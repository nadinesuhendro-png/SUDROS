// PATH: app/dashboard/notifications/page.tsx
// AKSI: BUAT FILE BARU (pindahan dari app/notifications/page.tsx — Navbar & redirect dihapus karena sudah dihandle app/dashboard/layout.tsx)

import { createClient } from "@/lib/supabase/server";
import { markAllAsRead } from "./actions";

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, message, is_read, created_at")
    .eq("recipient_user_id", user!.id)
    .order("created_at", { ascending: false })
    .returns<NotificationRow[]>();

  const hasUnread = (notifications || []).some((n) => !n.is_read);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold" style={{ color: "var(--primary-dark)" }}>
          Notifikasi
        </h1>
        {hasUnread ? (
          <form action={markAllAsRead}>
            <button
              type="submit"
              className="text-xs text-[var(--muted-foreground)] underline"
            >
              Tandai semua dibaca
            </button>
          </form>
        ) : null}
      </div>

      {(notifications || []).length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          Belum ada notifikasi.
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        {(notifications || []).map((n) => (
          <div
            key={n.id}
            className={`rounded-[var(--radius)] border p-3 text-sm ${
              n.is_read ? "border-gray-200" : "border-blue-300 bg-blue-50"
            }`}
          >
            <p className="font-medium">{n.title}</p>
            <p className="text-[var(--muted-foreground)]">{n.message}</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {formatDate(n.created_at)}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
