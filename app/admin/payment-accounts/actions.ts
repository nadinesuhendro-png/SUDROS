"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { PaymentAccountInput } from "@/lib/payment-accounts/types";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") throw new Error("Unauthorized");
}

export async function createPaymentAccount(input: PaymentAccountInput) {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("payment_accounts").insert({
    bank_name: input.bank_name,
    account_number: input.account_number,
    account_holder_name: input.account_holder_name,
    sort_order: input.sort_order ?? 0,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/payment-accounts");
}

export async function updatePaymentAccount(id: string, input: PaymentAccountInput) {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("payment_accounts")
    .update({
      bank_name: input.bank_name,
      account_number: input.account_number,
      account_holder_name: input.account_holder_name,
      sort_order: input.sort_order ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/payment-accounts");
}

export async function togglePaymentAccountActive(id: string, isActive: boolean) {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("payment_accounts")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/payment-accounts");
}

export async function deletePaymentAccount(id: string) {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("payment_accounts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/payment-accounts");
    }
