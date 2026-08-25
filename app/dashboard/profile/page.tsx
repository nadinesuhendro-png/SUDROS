// PATH: app/dashboard/profile/page.tsx
// AKSI: UPDATE FILE (tambah foto profil)

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditProfileForm from "./EditProfileForm";

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

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, whatsapp, avatar_url")
    .eq("id", user.id)
    .single<Profile>();

  return (
    <EditProfileForm
      profile={profile}
      errorMessage={error}
      successMessage={success}
    />
  );
}
