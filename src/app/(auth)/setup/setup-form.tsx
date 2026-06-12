"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export function SetupForm({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [displayName, setDisplayName] = useState("");
  const [householdName, setHouseholdName] = useState("我が家");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const householdId = crypto.randomUUID();
    const { error: hErr } = await supabase
      .from("households")
      .insert({ id: householdId, name: householdName });

    if (hErr) {
      setError("世帯の作成に失敗しました: " + hErr.message);
      setLoading(false);
      return;
    }

    const { error: pErr } = await supabase
      .from("profiles")
      .upsert({ id: user.id, display_name: displayName, household_id: householdId });

    if (pErr) {
      setError("プロフィールの作成に失敗しました: " + (pErr?.message ?? "不明"));
      setLoading(false);
      return;
    }

    router.push("/recipes");
    router.refresh();
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: household } = await supabase
      .from("households")
      .select("id")
      .eq("id", inviteCode.trim())
      .single();

    if (!household) {
      setError("世帯IDが見つかりません。ご確認ください。");
      setLoading(false);
      return;
    }

    const { error: pErr } = await supabase
      .from("profiles")
      .upsert({ id: user.id, display_name: displayName, household_id: household.id });

    if (pErr) {
      setError("参加に失敗しました");
      setLoading(false);
      return;
    }

    router.push("/recipes");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="text-4xl mb-2">🏠</div>
        <CardTitle>はじめての設定</CardTitle>
        <CardDescription>{userEmail}</CardDescription>
      </CardHeader>
      <CardContent>
        {mode === "choose" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center mb-4">
              新しい世帯を作るか、既存の世帯に参加してください
            </p>
            <Button className="w-full" onClick={() => setMode("create")}>
              新しい世帯を作る
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setMode("join")}>
              既存の世帯に参加する
            </Button>
          </div>
        )}

        {mode === "create" && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label>表示名</Label>
              <Input
                placeholder="例: たろう"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>世帯名</Label>
              <Input
                placeholder="例: 我が家"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : "世帯を作成する"}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setMode("choose")}>
              戻る
            </Button>
          </form>
        )}

        {mode === "join" && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-1.5">
              <Label>表示名</Label>
              <Input
                placeholder="例: はなこ"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>世帯ID</Label>
              <Input
                placeholder="設定画面から共有してもらったIDを入力"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : "世帯に参加する"}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setMode("choose")}>
              戻る
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
