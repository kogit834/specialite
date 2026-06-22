"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("ログイン処理中...");

  useEffect(() => {
    async function handleCallback() {
      // URLフラグメント (#) からトークンを直接取得
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const errorParam = params.get("error");
      const errorDescription = params.get("error_description");

      if (errorParam) {
        setMessage(`エラー: ${errorDescription ?? errorParam}`);
        setTimeout(() => router.replace("/login?error=auth_failed"), 2000);
        return;
      }

      if (!accessToken) {
        // フラグメントなし → 既存セッション確認
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace("/recipes");
          return;
        }
        setMessage("ログインリンクが無効です。もう一度お試しください。");
        setTimeout(() => router.replace("/login?error=auth_failed"), 2000);
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken ?? "",
      });

      if (error) {
        setMessage("ログインに失敗しました。もう一度お試しください。");
        setTimeout(() => router.replace("/login?error=auth_failed"), 2000);
        return;
      }

      router.replace("/recipes");
    }

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}
