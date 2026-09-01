// PATH: app/dashboard/notifications/page.tsx
// AKSI: GANTI SELURUH ISI FILE (tambah tombol mark-as-read per item)

import { createClient } from "@/lib/supabase/server";
import { markAllAsRead, markAsRead } from "./actions";

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
            className="flex flex-col gap-1 rounded-[var(--radius)] border p-3 text-sm"
            style={
              n.is_read
                ? { borderColor: "var(--border)", backgroundColor: "var(--card)" }
                : { borderColor: "var(--primary)", backgroundColor: "var(--muted)" }
            }
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-[var(--card-foreground)]">{n.title}</p>
              {!n.is_read ? (
                <form action={markAsRead}>
                  <input type="hidden" name="id" value={n.id} />
                  <button
                    type="submit"
                    className="flex-shrink-0 text-xs font-medium"
                    style={{ color: "var(--primary)" }}
                  >
                    Tandai dibaca
                  </button>
                </form>
              ) : null}
            </div>
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
