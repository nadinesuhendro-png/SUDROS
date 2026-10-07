// AKSI: BUAT FILE BARU
// PATH: lib/landing/helpers.ts
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export type LandingPage = {
  id: string;
  owner_id: string | null;
  subdomain: string;
  status: "pending" | "approved" | "rejected" | "disabled";
  title: string;
  tagline: string | null;
  about: string | null;
  whatsapp: string | null;
  contact_name: string | null;
  theme_color: string;
  show_seller_link: boolean;
  admin_note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export const STATUS_LIST: string[] = ["pending", "approved", "rejected", "disabled"];

export const RESERVED_SUBDOMAINS: string[] = [
  "www", "admin", "api", "app", "mail", "email", "smtp", "ftp", "dashboard",
  "login", "daftar", "register", "static", "assets", "cdn", "blog", "help",
  "support", "status", "dev", "test", "staging", "sudros", "my", "ns1", "ns2",
  "webmail", "panel", "billing", "pay", "sites",
];

export function cleanSubdomain(v: string): string {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

export function subdomainError(sub: string): string | null {
  if (sub.length < 3) return "Subdomain minimal 3 karakter";
  if (!/^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])$/.test(sub)) return "Format subdomain tidak valid";
  if (RESERVED_SUBDOMAINS.includes(sub)) return "Nama subdomain ini tidak boleh dipakai";
  return null;
}

export function cleanWhatsapp(v: string): string {
  let d = v.replace(/[^0-9]/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  if (d.length < 9 || d.length > 15) return "";
  return d;
}

export function cleanColor(v: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : "#1d6fb8";
}

export function getAdminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function getCurrentUserId(): Promise<string | null> {
  const store = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll() {
          return store.getAll();
        },
        setAll() {},
      },
    }
  );
  const { data } = await supabase.auth.getUser();
  return data.user ? data.user.id : null;
}

export async function getAdminUserId(): Promise<string | null> {
  const uid = await getCurrentUserId();
  if (!uid) return null;
  const db = getAdminDb();
  const { data } = await db
    .from("profiles")
    .select("role")
    .eq("id", uid)
    .maybeSingle<{ role: string }>();
  return data && data.role === "admin" ? uid : null;
}
