export type PaymentAccount = {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PaymentAccountInput = {
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  sort_order?: number;
};
