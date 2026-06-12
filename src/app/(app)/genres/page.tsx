"use client";

import { useState, useEffect } from "react";
import { Tag, Plus, Trash2, Loader2, GripVertical } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Genre = { id: string; name: string; sort_order: number };

export default function GenresPage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [householdId, setHouseholdId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("household_id")
        .eq("id", user.id)
        .single();

      if (!profile?.household_id) return;
      setHouseholdId(profile.household_id);

      const { data } = await supabase
        .from("genres")
        .select("id, name, sort_order")
        .eq("household_id", profile.household_id)
        .order("sort_order");

      setGenres(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !householdId) return;
    setAdding(true);

    const supabase = createClient();
    const sort_order =
      genres.length > 0 ? Math.max(...genres.map((g) => g.sort_order)) + 1 : 0;

    const { data } = await supabase
      .from("genres")
      .insert({ household_id: householdId, name: newName.trim(), sort_order })
      .select("id, name, sort_order")
      .single();

    if (data) {
      setGenres((prev) => [...prev, data]);
      setNewName("");
    }
    setAdding(false);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("genres").delete().eq("id", id);
    setGenres((prev) => prev.filter((g) => g.id !== id));
  }

  if (loading) {
    return (
      <div className="p-4 flex justify-center mt-16">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-6">
        <Tag size={20} />
        <h1 className="text-xl font-bold">ジャンル設定</h1>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <Input
          placeholder="ジャンル名を入力"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <Button type="submit" disabled={adding || !newName.trim()}>
          {adding ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
        </Button>
      </form>

      {genres.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center mt-8">
          ジャンルがありません。上のフォームから追加してください。
        </p>
      ) : (
        <ul className="space-y-2">
          {genres.map((g) => (
            <li
              key={g.id}
              className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg"
            >
              <GripVertical
                size={16}
                className="text-muted-foreground shrink-0"
              />
              <span className="flex-1 text-sm">{g.name}</span>
              <button
                type="button"
                onClick={() => handleDelete(g.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
