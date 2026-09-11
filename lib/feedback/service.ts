// PATH: lib/feedback/service.ts
// AKSI: FILE BARU

import { SupabaseClient } from "@supabase/supabase-js";

const MAX_MESSAGE_LENGTH = 1000;

export async function submitFeedback(
  supabase: SupabaseClient,
  userId: string,
  rawMessage: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const message = rawMessage.trim();

  if (!message) {
    return { ok: false, error: "Pesan tidak boleh kosong" };
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: `Pesan maksimal ${MAX_MESSAGE_LENGTH} karakter` };
  }

  const { error } = await supabase.from("feedback").insert({
    user_id: userId,
    message,
  });

  if (error) {
    return { ok: false, error: "Gagal mengirim, coba lagi" };
  }

  return { ok: true };
}

