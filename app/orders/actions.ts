// PATH: app/orders/actions.ts
// AKSI: BUAT FILE BARU

"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function generateOrderNumber() {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SUD-${Date.now()}-${random}`;
}

export async function createOrder(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const packageId = formData.get("package_id") as string;
  const amount = Number(formData.get("amount"));

  if (!packageId || !Number.isFinite(amount)) {
    redirect("/pricing");
  }

  const { data: order, error } = await supabase
    .from("advertising_orders")
    .insert({
      user_id: user.id,
      package_id: packageId,
      amount,
      order_number: generateOrderNumber(),
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !order) {
    redirect("/pricing");
  }

  redirect(`/orders/${order.id}`);
}

export async function submitProof(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const orderId = formData.get("order_id") as string;
  const proofUrl = formData.get("proof_url") as string;

  if (!orderId || !proofUrl) {
    return;
  }

  await supabase
    .from("advertising_orders")
    .update({ proof_url: proofUrl, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("user_id", user.id);

  redirect(`/orders/${orderId}`);
}
