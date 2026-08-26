// PATH: app/admin/payments/actions.ts
// AKSI: BUAT FILE BARU

"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function confirmPaymentAction(formData: FormData) {
  const supabase = await createClient();

  const orderId = formData.get("order_id") as string;
  if (!orderId) {
    redirect("/admin/payments");
  }

  const { error } = await supabase.rpc("confirm_payment", { p_order_id: orderId });

  if (error) {
    redirect(`/admin/payments?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin/payments");
}

export async function rejectPaymentAction(formData: FormData) {
  const supabase = await createClient();

  const orderId = formData.get("order_id") as string;
  const reason = formData.get("reason") as string;

  if (!orderId || !reason) {
    redirect("/admin/payments");
  }

  const { error } = await supabase.rpc("reject_payment", {
    p_order_id: orderId,
    p_reason: reason,
  });

  if (error) {
    redirect(`/admin/payments?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin/payments");
}
