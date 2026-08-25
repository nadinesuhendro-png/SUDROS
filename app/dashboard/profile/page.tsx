// PATH: app/dashboard/profile/page.tsx
// AKSI: BUAT FILE BARU

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "./actions";

type Profile = {
  username: string;
  whatsapp: string | null;
};

export default async function EditProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, whatsapp")
    .eq("id", user.id)
    .single<Profile>();

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <h1
        className="text-lg font-semibold text-center"
        style={{ color: "var(--primary-dark)" }}
      >
        Edit Profil
      </h1>

      {error ? (
        <div className="rounded-[var(--radius)] bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-[var(--radius)] bg-green-50 px-4 py-3 text-sm text-green-600">
          Profil berhasil diperbarui
        </div>
      ) : null}

      <form action={updateProfile} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="whatsapp">
            Nomor WhatsApp
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            defaultValue={profile?.whatsapp || ""}
            placeholder="Contoh: 6281234567890"
            className="w-full rounded-[var(--radius)] border border-gray-300 px-4 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Gunakan format 62 di awal, tanpa spasi atau tanda +
          </p>
        </div>

        <button
          type="submit"
          className="rounded-[var(--radius)] px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--primary)" }}
        >
          Simpan
        </button>
      </form>
    </main>
  );
    }
