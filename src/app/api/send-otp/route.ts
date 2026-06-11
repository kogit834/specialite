import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, redirectTo } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "環境変数が設定されていません" }, { status: 500 });
    }

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

    // Supabase OTPは成功時に空ボディ(204)を返すこともある
    const text = await res.text();
    let data: Record<string, string> = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error_description || data.msg || data.error || `HTTP ${res.status}` },
        { status: res.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("send-otp error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
