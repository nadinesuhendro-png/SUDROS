// PATH: app/dashboard/messages/[id]/page.tsx
// AKSI: BUAT FILE BARU

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendMessage } from "../actions";

type ConversationRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  listings: { title: string } | null;
};

type MessageRow = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type ProfileRow = { id: string; username: string };

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("id-ID", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, buyer_id, seller_id, listings(title)")
    .eq("id", id)
    .single<ConversationRow>();

  if (
    !conversation ||
    (conversation.buyer_id !== user.id && conversation.seller_id !== user.id)
  ) {
    notFound();
  }

  const otherId =
    conversation.buyer_id === user.id
      ? conversation.seller_id
      : conversation.buyer_id;

  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("id", otherId)
    .maybeSingle<ProfileRow>();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, content, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .returns<MessageRow[]>();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-3 p-6 pb-24">
      <div>
        <h1
          className="text-base font-semibold"
          style={{ color: "var(--primary-dark)" }}
        >
          {otherProfile?.username || "Pengguna"}
        </h1>
        {conversation.listings?.title ? (
          <p className="text-xs text-[var(--muted-foreground)]">
            Tentang: {conversation.listings.title}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        {(messages || []).map((msg) => {
          const isMine = msg.sender_id === user.id;
          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-0.5 rounded-[var(--radius)] px-3 py-2 text-sm ${
                isMine ? "self-end text-white" : "self-start text-[var(--card-foreground)]"
              }`}
              style={{
                backgroundColor: isMine ? "var(--primary)" : "var(--muted)",
                maxWidth: "80%",
              }}
            >
              <span>{msg.content}</span>
              <span
                className="text-[10px] opacity-70"
                style={{ color: isMine ? "white" : "var(--muted-foreground)" }}
              >
                {formatTime(msg.created_at)}
              </span>
            </div>
          );
        })}

        {(messages || []).length === 0 ? (
          <p className="text-center text-sm text-[var(--muted-foreground)]">
            Belum ada pesan. Mulai percakapan.
          </p>
        ) : null}
      </div>

      <form
        action={sendMessage}
        className="fixed bottom-16 left-0 right-0 mx-auto flex max-w-2xl gap-2 border-t border-[var(--border)] bg-[var(--background)] p-3"
      >
        <input type="hidden" name="conversation_id" value={id} />
        <input
          type="text"
          name="content"
          placeholder="Tulis pesan..."
          required
          className="flex-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm text-[var(--foreground)]"
        />
        <button
          type="submit"
          className="rounded-[var(--radius)] px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--primary)" }}
        >
          Kirim
        </button>
      </form>
    </main>
  );
}
