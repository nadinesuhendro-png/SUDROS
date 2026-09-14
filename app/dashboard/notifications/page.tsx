import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteAllNotifications, deleteNotification } from "./actions";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  reference_type: string | null;
  reference_id: string | null;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getTargetHref(n: NotificationRow): string | null {
  if (n.reference_type === "conversation" && n.reference_id) {
    return `/dashboard/messages/${n.reference_id}`;
  }

  if (n.reference_type === "listing" && n.reference_id) {
    if (n.type === "moderation_flag") {
      return `/admin/listings?highlight=${n.reference_id}`;
    }
    if (n.type === "listing_status_change") {
      return `/listings/${n.reference_id}`;
    }
  }

  return null;
}

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, title, message, is_read, created_at, reference_type, reference_id")
    .eq("recipient_user_id", user!.id)
    .order("created_at", { ascending: false })
    .returns<NotificationRow[]>();

  // Membuka halaman ini = "sudah dibaca". Tandai semua yang belum dibaca
  // supaya badge di nav langsung hilang di kunjungan berikutnya.
  const unreadIds = (notifications || [])
    .filter((n) => !n.is_read)
    .map((n) => n.id);

  if (unreadIds.length > 0) {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);
  }

  const items = notifications || [];

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold" style={{ color: "var(--primary-dark)" }}>
          Notifikasi
        </h1>
        {items.length > 0 ? (
          <form action={deleteAllNotifications}>
            <button
              type="submit"
              className="text-xs text-[var(--muted-foreground)] underline"
            >
              Hapus semua
            </button>
          </form>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          Belum ada notifikasi.
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        {items.map((n) => {
          const href = getTargetHref(n);

          // is_read di sini adalah status SEBELUM auto-mark di atas, jadi item
          // yang baru saja jadi "read" tetap kelihatan menonjol saat kunjungan ini.
          const wasUnread = !n.is_read;
          const cardStyle = wasUnread
            ? { borderColor: "var(--primary)", backgroundColor: "var(--muted)" }
            : { borderColor: "var(--border)", backgroundColor: "var(--card)" };

          const deleteButton = (
            <form action={deleteNotification}>
              <input type="hidden" name="id" value={n.id} />
              <button
                type="submit"
                className="flex-shrink-0 text-xs text-[var(--muted-foreground)] underline"
              >
                Hapus
              </button>
            </form>
          );

          const content = (
            <>
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-[var(--card-foreground)]">{n.title}</p>
                {deleteButton}
              </div>
              <p className="text-[var(--muted-foreground)]">{n.message}</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {formatDate(n.created_at)}
              </p>
            </>
          );

          if (href) {
            return (
              <div
                key={n.id}
                className="flex flex-col gap-1 rounded-[var(--radius)] border p-3 text-sm"
                style={cardStyle}
              >
                <Link href={href} className="flex flex-col gap-1">
                  <p className="font-medium text-[var(--card-foreground)]">{n.title}</p>
                  <p className="text-[var(--muted-foreground)]">{n.message}</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {formatDate(n.created_at)}
                  </p>
                </Link>
                <div className="flex justify-end">{deleteButton}</div>
              </div>
            );
          }

          return (
            <div
              key={n.id}
              className="flex flex-col gap-1 rounded-[var(--radius)] border p-3 text-sm"
              style={cardStyle}
            >
              {content}
            </div>
          );
        })}
      </div>
    </main>
  );
}
