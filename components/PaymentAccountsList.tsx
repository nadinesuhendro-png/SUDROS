import { createClient } from "@/lib/supabase/server";
import type { PaymentAccount } from "@/lib/payment-accounts/types";

export default async function PaymentAccountsList() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_accounts")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const accounts = (data ?? []) as unknown as PaymentAccount[];

  if (accounts.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="font-medium">Transfer ke salah satu rekening berikut:</p>
      {accounts.map((acc) => (
        <div key={acc.id} className="border rounded-lg p-3">
          <p className="font-semibold">{acc.bank_name}</p>
          <p className="text-lg tracking-wide">{acc.account_number}</p>
          <p className="text-sm text-gray-500">a.n. {acc.account_holder_name}</p>
        </div>
      ))}
    </div>
  );
}
