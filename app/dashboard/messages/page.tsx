import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hideAllConversations, hideConversation } from "./actions";

type ConversationRow = {
  id: string;
  last_message_at: string;
  buyer_id: string;
  seller_id: string;
  listings: { title: string } | null;
};

type ProfileRow = { id: string; username: string };

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("id-ID", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, last_message_at, buyer_id, seller_id, listings(title)")
    .or(
      `and(buyer_id.eq.${user!.id},deleted_by_buyer.eq.false),and(seller_id.eq.${user!.id},deleted_by_seller.eq.false)`
    )
    .order("last_message_at", { ascending: false })
    .returns<ConversationRow[]>();

  const items = conversations || [];

  const otherUserIds = Array.from(
    new Set(items.map((c) => (c.buyer_id === user!.id ? c.seller_id : c.buyer_id)))
  );

  const { data: profiles } = otherUserIds.length
    ? await supabase
        .from("profiles")
        .select("id, username")
        .in("id", otherUserIds)
        .returns<ProfileRow[]>()
    : { data: [] as ProfileRow[] };

  const profileMap = new Map((profiles || []).map((p) => [p.id, p.username]));

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-3 p-6">
      <div className="flex items-center justify-between">
        <h1
          className="text-lg font-semibold"
          style={{ color: "var(--primary-dark)" }}
        >
          Pesan
        </h1>
        {items.length > 0 ? (
          <form action={hideAllConversations}>
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
          Belum ada percakapan. Mulai chat dari halaman listing.
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        {items.map((conv) => {
          const otherId =
            conv.buyer_id === user!.id ? conv.seller_id : conv.buyer_id;
          const otherName = profileMap.get(otherId) || "Pengguna";

          return (
            <div
              key={conv.id}
              className="flex flex-col gap-0.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-3"
            >
              <Link href={`/dashboard/messages/${conv.id}`} className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--card-foreground)]">
                    {otherName}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {formatTime(conv.last_message_at)}
                  </span>
                </div>
                {conv.listings?.title ? (
                  <span className="text-xs text-[var(--muted-foreground)]">
                    Tentang: {conv.listings.title}
                  </span>
                ) : null}
              </Link>
              <div className="flex justify-end">
                <form action={hideConversation}>
                  <input type="hidden" name="conversation_id" value={conv.id} />
                  <button
                    type="submit"
                    className="text-xs text-[var(--muted-foreground)] underline"
                  >
                    Hapus
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
