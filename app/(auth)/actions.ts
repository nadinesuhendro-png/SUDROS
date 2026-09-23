// Taruh file ini di: app/(auth)/actions.ts
// PERUBAHAN: login() sekarang terima "identifier" (email ATAU nomor HP). Kalau nomor HP,
// dikonversi ke email sintetis yang SAMA PERSIS dengan yang dibuat saat klaim
// (lihat canonicalPhoneDigits di app/klaim/[token]/actions.ts — logic harus identik).
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function isEmail(value: string): boolean {
  return value.includes("@");
}

// HARUS identik dengan canonicalPhoneDigits di app/klaim/[token]/actions.ts
function canonicalPhoneDigits(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  if (!digits.startsWith("62")) digits = "62" + digits;
  return digits;
}

function phoneToSyntheticEmail(phoneDigits: string): string {
  return `${phoneDigits}@wa.sudros.id`;
}

export async function login(formData: FormData) {
  const identifier = (formData.get("identifier") as string || "").trim();
  const password = formData.get("password") as string;

  const supabase = await createClient();

  const email = isEmail(identifier)
    ? identifier
    : phoneToSyntheticEmail(canonicalPhoneDigits(identifier));

  const { error } = await supabase.auth.signInWithPassword({ email, password });

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
