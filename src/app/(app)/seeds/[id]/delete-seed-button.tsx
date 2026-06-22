"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteSeedButton({ seedId }: { seedId: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("seeds").delete().eq("id", seedId);
    router.push("/seeds");
  }

  if (confirm) {
    return (
      <div className="flex gap-2">
        <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : "削除する"}
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => setConfirm(false)}>
          キャンセル
        </Button>
      </div>
    );
  }

  return (
    <Button variant="ghost" className="w-full text-destructive" onClick={() => setConfirm(true)}>
      <Trash2 size={16} className="mr-2" />
      このタネを削除
    </Button>
  );
}
