"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

type Genre = { id: string; name: string };

export function RecipeSearch({
  genres,
  currentGenre,
  currentQ,
}: {
  genres: Genre[];
  currentGenre?: string;
  currentQ?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/recipes?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-3 mb-4">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="料理名で検索..."
          defaultValue={currentQ}
          className="pl-9"
          onChange={(e) => {
            const val = e.target.value;
            clearTimeout((window as Window & { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer);
            (window as Window & { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer = setTimeout(() => updateParam("q", val || undefined), 400);
          }}
        />
      </div>

      {genres.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <Button
            variant={!currentGenre ? "default" : "outline"}
            size="sm"
            className="shrink-0 h-8"
            onClick={() => updateParam("genre", undefined)}
          >
            すべて
          </Button>
          {genres.map((g) => (
            <Button
              key={g.id}
              variant={currentGenre === g.id ? "default" : "outline"}
              size="sm"
              className="shrink-0 h-8"
              onClick={() => updateParam("genre", g.id)}
            >
              {g.name}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
