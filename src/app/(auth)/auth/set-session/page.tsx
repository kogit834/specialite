"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function SetSession() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function setSession() {
      const accessToken = searchParams.get("access_token");
      const refreshToken = searchParams.get("refresh_token");

      if (!accessToken) {
        router.replace("/login?error=auth_failed");
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any;
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken ?? "",
      });

      if (error) {
        router.replace("/login?error=auth_failed");
        return;
      }

      router.replace("/recipes");
    }

    setSession();
  }, [router, searchParams]);

  return <p className="text-muted-foreground text-sm">ログイン中...</p>;
}

export default function SetSessionPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Suspense fallback={<p className="text-muted-foreground text-sm">読み込み中...</p>}>
        <SetSession />
      </Suspense>
    </div>
  );
}
