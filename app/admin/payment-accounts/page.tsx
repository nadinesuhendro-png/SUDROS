import { createClient } from "@/lib/supabase/server";
import type { PaymentAccount } from "@/lib/payment-accounts/types";
import PaymentAccountsAdminClient from "./PaymentAccountsAdminClient";

export default async function PaymentAccountsAdminPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_accounts")
    .select("*")
    .order("sort_order", { ascending: true });

  const accounts = (data ?? []) as unknown as PaymentAccount[];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Rekening Pembayaran</h1>
      <PaymentAccountsAdminClient initialAccounts={accounts} />
    </div>
  );
}
