"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <Button variant="outline" className="w-full text-destructive border-destructive/30" onClick={handleLogout}>
      <LogOut size={16} className="mr-2" />
      ログアウト
    </Button>
  );
}
