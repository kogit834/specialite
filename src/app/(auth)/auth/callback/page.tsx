"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("ログイン処理中...");

  useEffect(() => {
    async function handleCallback() {
      const supabase = createClient();

      // createBrowserClientはURLフラグメント(#access_token=...)を自動検出してCookieに保存する
      // 少し待ってセッションが確立されるのを待つ
      await new Promise((resolve) => setTimeout(resolve, 500));

      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        // フラグメントからのセッション確立を再試行
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
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}
