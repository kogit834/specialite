import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  // マジックリンク（token_hash方式）
  if (token_hash && type) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const res = await fetch(`${supabaseUrl}/auth/v1/verify`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token_hash, type }),
    });

    if (res.ok) {
      const data = await res.json();
      const accessToken = data.access_token;
      const refreshToken = data.refresh_token;

      if (accessToken) {
        // クライアント側でセッションをセットするページにリダイレクト
        const url = new URL(`${origin}/auth/set-session`);
        url.searchParams.set("access_token", accessToken);
        url.searchParams.set("refresh_token", refreshToken ?? "");
        return NextResponse.redirect(url.toString());
      }
    }
  }

  // PKCE code方式（フォールバック）
  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=pkce`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ auth_code: code }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.access_token) {
        const url = new URL(`${origin}/auth/set-session`);
        url.searchParams.set("access_token", data.access_token);
        url.searchParams.set("refresh_token", data.refresh_token ?? "");
        return NextResponse.redirect(url.toString());
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
