// AKSI: GANTI SELURUH ISI FILE (tambah proteksi role admin + rewrite subdomain seller)
// PATH: middleware.ts

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

const ROOT_DOMAIN = "sudros.id";

function extractSubdomain(host: string): string | null {
  const hostname = host.split(":")[0].toLowerCase();
  if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) return null;
  if (!hostname.endsWith(`.${ROOT_DOMAIN}`)) return null;
  const sub = hostname.slice(0, -(`.${ROOT_DOMAIN}`.length + 1));
  if (!sub || sub === "www") return null;
  return sub;
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase env vars belum di-set di Vercel");
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options as never)
        );
      },
    },
  });

  // ---- Rewrite subdomain toko seller (namatoko.sudros.id) ----
  const host = request.headers.get("host") || "";
  const subdomain = extractSubdomain(host);

  if (subdomain) {
    const { data: sub } = await supabase
      .from("seller_subdomains")
      .select("owner_id")
      .eq("subdomain", subdomain)
      .in("status", ["active", "grace_period"])
      .maybeSingle<{ owner_id: string }>();

    if (sub) {
      const url = request.nextUrl.clone();
      url.pathname = `/sellers/${sub.owner_id}`;
      return NextResponse.rewrite(url);
    }

    // Subdomain tidak ditemukan/tidak aktif — arahkan ke domain utama
    return NextResponse.redirect(`https://${ROOT_DOMAIN}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const protectedPaths = ["/dashboard", "/admin"];
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (request.nextUrl.pathname.startsWith("/admin") && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
