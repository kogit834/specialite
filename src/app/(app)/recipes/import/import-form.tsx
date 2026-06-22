"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Trash2, ChevronDown, ChevronUp } from "lucide-react";

type LabelItem = { id: string; name: string };
type LabelGroup = { id: string; name: string; labels: LabelItem[] };

type DraftRecipe = {
  title: string;
  body: string;
  include: boolean;
  expanded: boolean;
};

export function ImportForm({
  householdId,
  userId,
  labelGroups,
}: {
  householdId: string;
  userId: string;
  labelGroups: LabelGroup[];
}) {
  const router = useRouter();

  const [rawText, setRawText] = useState("");
  const [drafts, setDrafts] = useState<DraftRecipe[] | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoLabel, setAutoLabel] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  const allLabels = labelGroups.flatMap((g) =>
    g.labels.map((l) => ({ id: l.id, name: `${g.name}: ${l.name}` }))
  );
  const selectedCount = drafts?.filter((d) => d.include).length ?? 0;

  async function handleParse() {
    if (!rawText.trim()) return;
    setParsing(true);
    setError("");
    try {
      const res = await fetch("/api/parse-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "解析に失敗しました");
      const recipes: { title: string; body: string }[] = data.recipes ?? [];
      if (recipes.length === 0) {
        setError("レシピを抽出できませんでした。テキストを確認してください。");
        setDrafts(null);
        return;
      }
      setDrafts(
        recipes.map((r) => ({
          title: r.title,
          body: r.body,
          include: true,
          expanded: false,
        }))
      );
    } catch (err) {
      setError((err as Error).message ?? "解析に失敗しました");
    } finally {
      setParsing(false);
    }
  }

  function updateDraft(index: number, patch: Partial<DraftRecipe>) {
    setDrafts((prev) =>
      prev ? prev.map((d, i) => (i === index ? { ...d, ...patch } : d)) : prev
    );
  }

  async function classifyLabel(title: string, body: string): Promise<string | null> {
    try {
      const res = await fetch("/api/classify-genre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, labels: allLabels }),
      });
      const data = await res.json();
      return data.labelId ?? null;
    } catch {
      return null;
    }
  }

  async function handleSave() {
    if (!drafts) return;
    const targets = drafts.filter((d) => d.include && d.title.trim());
    if (targets.length === 0) {
      setError("取り込むレシピを選択してください。");
      return;
    }
    setSaving(true);
    setError("");

    const supabase = createClient();

    try {
      let labelMap: (string | null)[] = targets.map(() => null);
      if (autoLabel && allLabels.length > 0) {
        setProgress("ラベルを判定中...");
        labelMap = await Promise.all(
          targets.map((t) => classifyLabel(t.title, t.body))
        );
      }

      setProgress(`${targets.length}件を登録中...`);
      // idをクライアント生成し、ラベルとの対応を確実にする
      const rows = targets.map((t) => ({
        id: crypto.randomUUID(),
        household_id: householdId,
        title: t.title.trim(),
        body: t.body,
        created_by: userId,
      }));

      const { error: insertErr } = await supabase.from("recipes").insert(rows);
      if (insertErr) throw new Error("登録に失敗しました");

      // ラベルを recipe_labels に登録
      const labelRows = rows
        .map((r, i) => ({ recipe_id: r.id, label_id: labelMap[i] }))
        .filter((row): row is { recipe_id: string; label_id: string } => Boolean(row.label_id));
      if (labelRows.length > 0) {
        await supabase.from("recipe_labels").insert(labelRows);
      }

      router.push("/recipes");
      router.refresh();
    } catch (err) {
      setError((err as Error).message ?? "登録に失敗しました");
      setSaving(false);
      setProgress("");
    }
  }

  // ステップ1: テキスト貼り付け
  if (!drafts) {
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="raw">メモ帳のレシピを貼り付け</Label>
          <p className="text-xs text-muted-foreground">
            複数のレシピをまとめて貼り付けできます。料理名・材料・手順をそのままどうぞ。
          </p>
          <Textarea
            id="raw"
            placeholder={"肉じゃが\n材料: じゃがいも3個...\n手順: ...\n\n---\n\nカレー\n材料: ..."}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={14}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="button"
          className="w-full"
          onClick={handleParse}
          disabled={parsing || !rawText.trim()}
        >
          {parsing ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              解析中...
            </>
          ) : (
            <>
              <Sparkles size={16} className="mr-2" />
              AIで解析する
            </>
          )}
        </Button>
      </div>
    );
  }

  // ステップ2: プレビュー・編集
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {drafts.length}件を抽出 / {selectedCount}件を取り込み
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setDrafts(null);
            setError("");
          }}
          disabled={saving}
        >
          やり直す
        </Button>
      </div>

      <div className="space-y-3">
        {drafts.map((d, i) => (
          <div
            key={i}
            className={`rounded-lg border p-3 space-y-2 transition-opacity ${
              d.include ? "" : "opacity-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={d.include}
                onChange={(e) => updateDraft(i, { include: e.target.checked })}
                className="h-4 w-4 shrink-0"
                aria-label="取り込む"
              />
              <Input
                value={d.title}
                onChange={(e) => updateDraft(i, { title: e.target.value })}
                placeholder="料理名"
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => updateDraft(i, { expanded: !d.expanded })}
                aria-label="本文を編集"
              >
                {d.expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground"
                onClick={() =>
                  setDrafts((prev) => prev?.filter((_, j) => j !== i) ?? prev)
                }
                aria-label="削除"
              >
                <Trash2 size={16} />
              </Button>
            </div>

            {d.expanded ? (
              <Textarea
                value={d.body}
                onChange={(e) => updateDraft(i, { body: e.target.value })}
                rows={6}
                placeholder="材料・手順"
              />
            ) : (
              <p className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-wrap pl-6">
                {d.body || "（本文なし）"}
              </p>
            )}
          </div>
        ))}
      </div>

      {allLabels.length > 0 && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoLabel}
            onChange={(e) => setAutoLabel(e.target.checked)}
            className="h-4 w-4"
          />
          <span>ラベルもAIで自動判定する</span>
        </label>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="button"
        className="w-full"
        onClick={handleSave}
        disabled={saving || selectedCount === 0}
      >
        {saving ? (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" />
            {progress || "登録中..."}
          </>
        ) : (
          `${selectedCount}件を取り込む`
        )}
      </Button>
    </div>
  );
}
