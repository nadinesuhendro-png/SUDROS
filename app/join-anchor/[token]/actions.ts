// PATH: app/join-anchor/[token]/actions.ts
// AKSI: BUAT FILE BARU

"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function redeemAnchorInvite(token: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/join-anchor/${token}`);
  }

  const { data, error } = await supabase.rpc("redeem_anchor_invite", {
    p_token: token,
  });

  if (error || !data?.success) {
    const reason = data?.reason ?? "error";
    redirect(`/join-anchor/${token}?status=${reason}`);
  }

  redirect("/dashboard/package?anchor=activated");
}
