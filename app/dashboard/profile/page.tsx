// PATH: app/dashboard/profile/page.tsx
// AKSI: GANTI SELURUH ISI FILE (tambah section Tampilan berisi ThemeToggle)

import { createClient } from "@/lib/supabase/server";
import EditProfileForm from "./EditProfileForm";
import ThemeToggle from "@/components/ThemeToggle";

type Profile = {
  username: string;
  whatsapp: string | null;
  avatar_url: string | null;
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, whatsapp, avatar_url")
    .eq("id", user!.id)
    .single<Profile>();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6 md:max-w-3xl md:gap-6 md:p-8">
      <EditProfileForm
        profile={profile}
        errorMessage={error}
        successMessage={success}
      />

      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
          Tampilan
        </p>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-[var(--card-foreground)]">Tema aplikasi</p>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
