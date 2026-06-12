"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("ログイン処理中...");

  useEffect(() => {
    async function handleCallback() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any;

      // URLフラグメント（#access_token=...）を処理
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setMessage("ログインに失敗しました。もう一度お試しください。");
        setTimeout(() => router.replace("/login?error=auth_failed"), 2000);
        return;
      }

      if (data.session) {
        router.replace("/recipes");
        return;
      }

      // フラグメントからセッションを取得（Supabase implicit flow）
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken) {
          const { error: setErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken ?? "",
          });

          if (!setErr) {
            router.replace("/recipes");
            return;
          }
        }
      }

      // クエリパラメータのcode（PKCE flow）を処理
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");
      if (code) {
        const { error: exchErr } = await supabase.auth.exchangeCodeForSession(code);
        if (!exchErr) {
          router.replace("/recipes");
          return;
        }
      }

      setMessage("ログインに失敗しました。もう一度お試しください。");
      setTimeout(() => router.replace("/login?error=auth_failed"), 2000);
    }

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}
