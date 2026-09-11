// PATH: app/admin/feedback/page.tsx
// AKSI: FILE BARU

import { createClient } from "@/lib/supabase/server";
import { markFeedbackRead } from "./actions";

type FeedbackRow = {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  profiles: { username: string } | null;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminFeedbackPage() {
  const supabase = await createClient();

  const { data: feedbackList } = await supabase
    .from("feedback")
    .select("id, message, is_read, created_at, profiles(username)")
    .order("is_read", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<FeedbackRow[]>();

  const items = feedbackList || [];
  const unreadCount = items.filter((item) => !item.is_read).length;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Saran & Masukan</h1>
        <p className="text-sm text-gray-500">
          {unreadCount > 0
            ? `${unreadCount} masukan belum dibaca`
            : "Semua masukan sudah dibaca"}
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Belum ada masukan masuk.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-[var(--radius)] border border-gray-200 p-4"
              style={
                !item.is_read
                  ? { backgroundColor: "#fefce8", borderColor: "#fde047" }
                  : undefined
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {item.profiles?.username || "User tidak diketahui"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(item.created_at)}
                  </p>
                </div>
                {!item.is_read ? (
                  <form action={markFeedbackRead}>
                    <input type="hidden" name="id" value={item.id} />
                    <button
                      type="submit"
                      className="rounded-[var(--radius)] border px-2 py-1 text-xs font-medium"
                      style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
                    >
                      Tandai dibaca
                    </button>
                  </form>
                ) : (
                  <span className="text-xs text-gray-400">Sudah dibaca</span>
                )}
              </div>
              <p className="mt-2 whitespace-pre-line text-sm">{item.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

