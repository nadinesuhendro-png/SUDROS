// PATH: app/dashboard/settings/actions.ts
// AKSI: BUAT FILE BARU

"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export async function changePassword(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  const currentPassword = (formData.get("current_password") as string) || "";
  const newPassword = (formData.get("new_password") as string) || "";
  const confirmPassword = (formData.get("confirm_password") as string) || "";

  if (!currentPassword || !newPassword) {
    redirect(
      `/dashboard/settings?error=${encodeURIComponent("Semua kolom wajib diisi")}`
    );
  }

  if (newPassword.length < 8) {
    redirect(
      `/dashboard/settings?error=${encodeURIComponent(
        "Password baru minimal 8 karakter"
      )}`
    );
  }

  if (newPassword !== confirmPassword) {
    redirect(
      `/dashboard/settings?error=${encodeURIComponent(
        "Konfirmasi password tidak cocok"
      )}`
    );
  }

  // Verifikasi password lama dengan mencoba sign-in ulang
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (verifyError) {
    redirect(
      `/dashboard/settings?error=${encodeURIComponent("Password lama salah")}`
    );
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    redirect(
      `/dashboard/settings?error=${encodeURIComponent(
        "Gagal mengubah password: " + updateError.message
      )}`
    );
  }

  redirect(
    `/dashboard/settings?success=${encodeURIComponent("Password berhasil diubah")}`
  );
}

export async function deleteAccount(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  const password = (formData.get("password") as string) || "";
  const confirmText = (formData.get("confirm_text") as string) || "";

  if (confirmText !== "HAPUS") {
    redirect(
      `/dashboard/settings?error=${encodeURIComponent(
        'Ketik "HAPUS" untuk konfirmasi'
      )}`
    );
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });

  if (verifyError) {
    redirect(
      `/dashboard/settings?error=${encodeURIComponent("Password salah")}`
    );
  }

  const adminClient = createAdminClient();
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(
    user.id
  );

  if (deleteError) {
    redirect(
      `/dashboard/settings?error=${encodeURIComponent(
        "Gagal menghapus akun: " + deleteError.message
      )}`
    );
  }

  await supabase.auth.signOut();
  redirect("/");
}
