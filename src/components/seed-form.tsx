"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

type Seed = { id: string; title: string; body: string };

export function SeedForm({
  householdId,
  userId,
  seed,
}: {
  householdId: string;
  userId: string;
  seed?: Seed;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(seed?.title ?? "");
  const [body, setBody] = useState(seed?.body ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError("");

    const supabase = createClient();

    try {
      if (seed) {
        const { error: err } = await supabase
          .from("seeds")
          .update({ title, body })
          .eq("id", seed.id);
        if (err) throw err;
        router.push(`/seeds/${seed.id}`);
      } else {
        const { data, error: err } = await supabase
          .from("seeds")
          .insert({ household_id: householdId, title, body, created_by: userId })
          .select("id")
          .single();
        if (err || !data) throw err ?? new Error("保存失敗");
        router.push(`/seeds/${data.id}`);
      }
    } catch (err) {
      setError((err as Error).message ?? "保存に失敗しました");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="title">タイトル *</Label>
        <Input
          id="title"
          placeholder="例: 隠し味のアイデア"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="body">本文</Label>
        <Textarea
          id="body"
          placeholder="アイデアや覚書を入力..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" />
            保存中...
          </>
        ) : (
          seed ? "変更を保存" : "タネを保存"
        )}
      </Button>
    </form>
  );
}
