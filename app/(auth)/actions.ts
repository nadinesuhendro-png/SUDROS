// Taruh file ini di: app/(auth)/actions.ts
// PERUBAHAN: login() sekarang terima "identifier" (email ATAU nomor HP), deteksi otomatis
// mana yang diinput, lalu panggil signInWithPassword({email}) atau signInWithPassword({phone})
// sesuai jenisnya. register() dan logout() tidak diubah.
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function isEmail(value: string): boolean {
  return value.includes("@");
}

function toE164(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1); // 0812... -> 62812...
  if (!digits.startsWith("62")) digits = "62" + digits;
  return `+${digits}`;
}

export async function login(formData: FormData) {
  const identifier = (formData.get("identifier") as string || "").trim();
  const password = formData.get("password") as string;

  const supabase = await createClient();

  const { error } = isEmail(identifier)
    ? await supabase.auth.signInWithPassword({ email: identifier, password })
    : await supabase.auth.signInWithPassword({ phone: toE164(identifier), password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function register(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = formData.get("username") as string;

  if (!username || username.length < 3) {
    redirect(
      `/register?error=${encodeURIComponent("Username minimal 3 karakter")}`
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
