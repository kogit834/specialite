import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 世帯IDのキャッシュCookie（値は `${userId}:${householdId}`）
const HID_COOKIE = "hid";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getClaims: 非対称鍵(ES/RS)ならJWKSをキャッシュしてローカル検証 → 認証サーバーへの
  // ネットワーク往復なし。対称鍵(HS256)の場合は内部で getUser() にフォールバックする（＝従来同等）。
  // いずれも内部で getSession() を経由するため、期限切れトークンの自動リフレッシュは維持される。
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub ?? null;
  const email = claimsData?.claims?.email ?? "";

  const { pathname } = request.nextUrl;
  const isPublicRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/setup") ||
    pathname.startsWith("/api/");

  if (!userId && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 世帯IDを取得。Cookie にキャッシュして profiles のDB往復を回避する。
  // 世帯IDは初回設定後に変わらない（setup は設定済みなら /recipes へ戻す）ため安全。
  // 別ユーザーに切り替わった場合は userId 不一致で自動的に再取得・上書きする。
  let householdId: string | null = null;
  let refreshCache = false;
  if (userId && !isPublicRoute) {
    const cached = request.cookies.get(HID_COOKIE)?.value;
    if (cached) {
      const sep = cached.indexOf(":");
      const cachedUid = sep >= 0 ? cached.slice(0, sep) : "";
      const cachedHid = sep >= 0 ? cached.slice(sep + 1) : "";
      if (cachedUid === userId && cachedHid) householdId = cachedHid;
    }

    if (!householdId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("household_id")
        .eq("id", userId)
        .single();
      householdId = profile?.household_id ?? null;
      if (!householdId) {
        const url = request.nextUrl.clone();
        url.pathname = "/setup";
        return NextResponse.redirect(url);
      }
      refreshCache = true;
    }
  }

  if (userId && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/recipes";
    return NextResponse.redirect(url);
  }

  // 検証済みの認証情報を Server Component へ受け渡す（各ページでの getClaims/profiles 再取得を不要に）。
  // クライアントが偽装した値は必ず削除/上書きする（セキュリティ）。
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-user-id");
  requestHeaders.delete("x-user-email");
  requestHeaders.delete("x-household-id");
  if (userId) {
    requestHeaders.set("x-user-id", userId);
    requestHeaders.set("x-user-email", email);
    if (householdId) requestHeaders.set("x-household-id", householdId);
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  // リフレッシュされた認証クッキーを引き継ぐ
  supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  // 世帯IDをキャッシュ（次回以降 profiles を省略）
  if (refreshCache && userId && householdId) {
    response.cookies.set(HID_COOKIE, `${userId}:${householdId}`, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }
  return response;
}
