"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChefHat, LayoutGrid, List } from "lucide-react";

type Recipe = {
  id: string;
  title: string;
  created_at: string;
  thumbnail_url: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recipe_labels: any[];
};

function getLabelNames(recipeLabels: unknown[]): string[] {
  if (!Array.isArray(recipeLabels)) return [];
  return recipeLabels
    .map((rl: unknown) => {
      if (rl && typeof rl === "object" && "labels" in rl) {
        const labels = (rl as { labels: unknown }).labels;
        if (labels && typeof labels === "object" && "name" in labels) {
          return String((labels as { name: string }).name);
        }
      }
      return null;
    })
    .filter(Boolean) as string[];
}

export function RecipeList({
  recipes,
}: {
  recipes: Recipe[];
  householdId: string;
}) {
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const saved = localStorage.getItem("recipeView");
    if (saved === "list" || saved === "grid") setView(saved);
  }, []);

  function toggleView(next: "grid" | "list") {
    setView(next);
    localStorage.setItem("recipeView", next);
  }

  if (recipes.length === 0) {
    return (
      <div className="text-center mt-16 space-y-2">
        <ChefHat size={48} className="mx-auto text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">
          レシピがありません。<br />＋ボタンから追加してください。
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-3 gap-1">
        <button
          onClick={() => toggleView("grid")}
          className={`p-1.5 rounded transition-colors ${view === "grid" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
          aria-label="サムネ表示"
        >
          <LayoutGrid size={18} />
        </button>
        <button
          onClick={() => toggleView("list")}
          className={`p-1.5 rounded transition-colors ${view === "list" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
          aria-label="リスト表示"
        >
          <List size={18} />
        </button>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-2 gap-3">
          {recipes.map((recipe) => {
            const labelNames = getLabelNames(recipe.recipe_labels);
            return (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="rounded-lg border bg-card overflow-hidden active:scale-95 transition-transform"
              >
                <div className="aspect-square bg-muted relative">
                  {recipe.thumbnail_url ? (
                    <Image
                      src={recipe.thumbnail_url}
                      alt={recipe.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 200px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ChefHat size={32} className="text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="font-medium text-sm leading-tight line-clamp-2">{recipe.title}</p>
                  {labelNames.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {labelNames.join(" · ")}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="divide-y border rounded-lg overflow-hidden">
          {recipes.map((recipe) => {
            const labelNames = getLabelNames(recipe.recipe_labels);
            return (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="flex items-center gap-3 p-3 bg-card hover:bg-muted/30 active:bg-muted/50 transition-colors"
              >
                <div className="w-14 h-14 rounded-md bg-muted relative shrink-0 overflow-hidden">
                  {recipe.thumbnail_url ? (
                    <Image
                      src={recipe.thumbnail_url}
                      alt={recipe.title}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ChefHat size={20} className="text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm leading-tight line-clamp-2">{recipe.title}</p>
                  {labelNames.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {labelNames.map((name) => (
                        <span
                          key={name}
                          className="inline-block text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
