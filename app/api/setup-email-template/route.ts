import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (key !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectRef = process.env.SUPABASE_PROJECT_REF;
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mailer_subjects_confirmation: "Kode verifikasi SUDROS kamu",
        mailer_templates_confirmation_content:
          "<h2>Konfirmasi akun SUDROS kamu</h2><p>Kode verifikasi kamu:</p><h1>{{ .Token }}</h1><p>Masukkan kode ini di halaman verifikasi. Kode berlaku beberapa menit.</p>",
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json({ success: false, error: data }, { status: res.status });
  }

  return NextResponse.json({ success: true, data });
}
