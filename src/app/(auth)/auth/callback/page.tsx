"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("ログイン処理中...");

  useEffect(() => {
    const supabase = createClient();

    // onAuthStateChangeでセッション確立を待つ（implicit flowのフラグメント処理を含む）
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          subscription.unsubscribe();
          router.replace("/recipes");
          return;
        }
        if (event === "SIGNED_OUT") {
          subscription.unsubscribe();
          router.replace("/login?error=auth_failed");
        }
      }
    );

    // 5秒でタイムアウト
    const timer = setTimeout(() => {
      subscription.unsubscribe();
      setMessage("ログインに失敗しました。もう一度お試しください。");
      setTimeout(() => router.replace("/login?error=auth_failed"), 2000);
    }, 5000);

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
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
