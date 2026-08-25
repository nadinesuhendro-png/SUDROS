// PATH: app/listings/[id]/FavoriteButton.tsx
// AKSI: BUAT FILE BARU

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function FavoriteButton({ listingId }: { listingId: string }) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function checkFavorite() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("listing_id", listingId)
        .maybeSingle();

      setIsFavorited(Boolean(data));
      setLoading(false);
    }

    checkFavorite();
  }, [listingId]);

  async function toggleFavorite() {
    const supabase = createClient();

    if (!userId) {
      window.location.href = "/login";
      return;
    }

    if (isFavorited) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("listing_id", listingId);
      setIsFavorited(false);
    } else {
      await supabase
        .from("favorites")
        .insert({ user_id: userId, listing_id: listingId });
      setIsFavorited(true);
    }
  }

  if (loading) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      className={`rounded-[var(--radius)] border px-4 py-2 text-sm font-medium ${
        isFavorited
          ? "border-red-300 bg-red-50 text-red-600"
          : "border-gray-300 text-gray-700"
      }`}
    >
      {isFavorited ? "♥ Tersimpan" : "♡ Simpan"}
    </button>
  );
}
