"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Loader2 } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      className="w-full text-destructive border-destructive/30"
      onClick={handleLogout}
      disabled={loading}
    >
      {loading ? (
        <Loader2 size={16} className="mr-2 animate-spin" />
      ) : (
        <LogOut size={16} className="mr-2" />
      )}
      ログアウト
    </Button>
  );
}
