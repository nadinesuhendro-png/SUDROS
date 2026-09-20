"use client";

import { useState } from "react";
import {
  createPaymentAccount,
  updatePaymentAccount,
  togglePaymentAccountActive,
  deletePaymentAccount,
} from "./actions";
import type { PaymentAccount, PaymentAccountInput } from "@/lib/payment-accounts/types";

const emptyForm: PaymentAccountInput = {
  bank_name: "",
  account_number: "",
  account_holder_name: "",
  sort_order: 0,
};

export default function PaymentAccountsAdminClient({
  initialAccounts,
}: {
  initialAccounts: PaymentAccount[];
}) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [form, setForm] = useState<PaymentAccountInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    window.location.reload();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updatePaymentAccount(editingId, form);
      } else {
        await createPaymentAccount(form);
      }
      setForm(emptyForm);
      setEditingId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(acc: PaymentAccount) {
    setEditingId(acc.id);
    setForm({
      bank_name: acc.bank_name,
      account_number: acc.account_number,
      account_holder_name: acc.account_holder_name,
      sort_order: acc.sort_order,
    });
  }

  async function handleToggle(acc: PaymentAccount) {
    setAccounts((prev) =>
      prev.map((a) => (a.id === acc.id ? { ...a, is_active: !a.is_active } : a))
    );
    try {
      await togglePaymentAccountActive(acc.id, !acc.is_active);
    } catch {
      await refresh();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus rekening ini?")) return;
    try {
      await deletePaymentAccount(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus");
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-3 border rounded-lg p-4">
        <h2 className="font-medium">{editingId ? "Edit Rekening" : "Tambah Rekening"}</h2>
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Nama Bank (mis. BCA)"
          value={form.bank_name}
          onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
          required
        />
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Nomor Rekening"
          value={form.account_number}
          onChange={(e) => setForm({ ...form, account_number: e.target.value })}
          required
        />
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Nama Pemilik Rekening"
          value={form.account_holder_name}
          onChange={(e) => setForm({ ...form, account_holder_name: e.target.value })}
          required
        />
        <input
          className="w-full border rounded px-3 py-2"
          type="number"
          placeholder="Urutan tampil (0, 1, 2, ...)"
          value={form.sort_order ?? 0}
          onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded text-white"
            style={{ backgroundColor: "#1d6fb8" }}
          >
            {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="px-4 py-2 rounded border"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      <div className="space-y-2">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="border rounded-lg p-4 flex justify-between items-center"
          >
            <div>
              <p className="font-medium">
                {acc.bank_name} — {acc.account_number}
              </p>
              <p className="text-sm text-gray-500">a.n. {acc.account_holder_name}</p>
              <p className="text-xs text-gray-400">
                {acc.is_active ? "Aktif" : "Nonaktif"} · urutan {acc.sort_order}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(acc)} className="text-sm underline">
                Edit
              </button>
              <button onClick={() => handleToggle(acc)} className="text-sm underline">
                {acc.is_active ? "Nonaktifkan" : "Aktifkan"}
              </button>
              <button
                onClick={() => handleDelete(acc.id)}
                className="text-sm text-red-600 underline"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
        {accounts.length === 0 && (
          <p className="text-gray-500 text-sm">Belum ada rekening.</p>
        )}
      </div>
    </div>
  );
                                    }
