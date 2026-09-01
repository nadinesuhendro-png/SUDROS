// PATH: app/dashboard/settings/page.tsx
// AKSI: BUAT FILE BARU

import { changePassword, deleteAccount } from "./actions";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 p-6">
      <h1
        className="text-lg font-semibold"
        style={{ color: "var(--primary-dark)" }}
      >
        Pengaturan Akun
      </h1>

      {error ? (
        <div className="rounded-[var(--radius)] bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-[var(--radius)] bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
          {success}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4">
        <p className="text-sm font-semibold text-[var(--card-foreground)]">
          Ubah Password
        </p>

        <form action={changePassword} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--foreground)]">
              Password Saat Ini
            </label>
            <input
              type="password"
              name="current_password"
              required
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--foreground)]">
              Password Baru
            </label>
            <input
              type="password"
              name="new_password"
              required
              minLength={8}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--foreground)]">
              Konfirmasi Password Baru
            </label>
            <input
              type="password"
              name="confirm_password"
              required
              minLength={8}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
            />
          </div>
          <button
            type="submit"
            className="rounded-[var(--radius)] py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--primary)" }}
          >
            Simpan Password Baru
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-3 rounded-[var(--radius)] border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
        <p className="text-sm font-semibold text-red-700 dark:text-red-400">
          Hapus Akun
        </p>
        <p className="text-xs text-red-600 dark:text-red-400">
          Tindakan ini permanen dan tidak dapat dibatalkan. Semua listing,
          pesan, dan data akun Anda akan dihapus.
        </p>

        <form action={deleteAccount} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-red-700 dark:text-red-400">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full rounded-[var(--radius)] border border-red-300 bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] dark:border-red-900/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-red-700 dark:text-red-400">
              Ketik &quot;HAPUS&quot; untuk konfirmasi
            </label>
            <input
              type="text"
              name="confirm_text"
              required
              placeholder="HAPUS"
              className="w-full rounded-[var(--radius)] border border-red-300 bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] dark:border-red-900/50"
            />
          </div>
          <button
            type="submit"
            className="rounded-[var(--radius)] bg-red-600 py-2 text-sm font-medium text-white"
          >
            Hapus Akun Saya Secara Permanen
          </button>
        </form>
      </div>
    </main>
  );
}
