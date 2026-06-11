import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email, redirectTo } = await request.json();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const res = await fetch(`${supabaseUrl}/auth/v1/otp`, {
    method: "POST",
    headers: {
      "apikey": supabaseKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      create_user: true,
      options: { emailRedirectTo: redirectTo },
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: data.error_description || data.msg || "送信失敗" },
      { status: res.status }
    );
  }

  return NextResponse.json({ ok: true });
}
