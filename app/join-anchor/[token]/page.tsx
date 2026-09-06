// PATH: app/join-anchor/[token]/page.tsx
// AKSI: BUAT FILE BARU

import { createClient } from "@/lib/supabase/server";
import { redeemAnchorInvite } from "./actions";

const STATUS_TEXT: Record<string, string> = {
  invalid: "Link undangan tidak valid.",
  used: "Link undangan ini sudah pernah dipakai.",
  expired: "Link undangan ini sudah kedaluwarsa.",
  error: "Terjadi kesalahan, coba lagi.",
};

export default async function JoinAnchorPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { token } = await params;
  const { status } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const redeemWithToken = redeemAnchorInvite.bind(null, token);

  return (
    <div className="max-w-md mx-auto p-6 text-center space-y-4">
      <h1 className="text-xl font-semibold">Undangan Penjual Jangkar SUDROS</h1>
      <p className="text-sm text-gray-600">
        Kamu diundang jadi Penjual Jangkar — listing tanpa batas dan gratis biaya paket.
      </p>

      {status && STATUS_TEXT[status] && (
        <p className="text-sm text-red-600">{STATUS_TEXT[status]}</p>
      )}

      {!user ? (
        <div className="space-y-2">
          <p className="text-sm">Login atau daftar dulu, lalu buka kembali link ini.</p>
          <a href="/login" className="inline-block px-4 py-2 rounded bg-blue-600 text-white text-sm">
            Login / Daftar
          </a>
        </div>
      ) : (
        <form action={redeemWithToken}>
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white text-sm">
            Aktifkan Status Penjual Jangkar
          </button>
        </form>
      )}
    </div>
  );
}
