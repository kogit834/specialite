"use client";

import Link from "next/link";
import Image from "next/image";
import { ChefHat } from "lucide-react";

type Recipe = {
  id: string;
  title: string;
  genre_id: string | null;
  created_at: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  genres: any;
  recipe_photos: { signedUrl: string | null }[];
};

export function RecipeList({
  recipes,
}: {
  recipes: Recipe[];
  householdId: string;
  supabaseUrl: string;
}) {
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
    <div className="grid grid-cols-2 gap-3">
      {recipes.map((recipe) => {
        const photo = recipe.recipe_photos?.[0];
        return (
          <Link
            key={recipe.id}
            href={`/recipes/${recipe.id}`}
            className="rounded-lg border bg-card overflow-hidden active:scale-95 transition-transform"
          >
            <div className="aspect-square bg-muted relative">
              {photo?.signedUrl ? (
                <Image
                  src={photo.signedUrl}
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
              {recipe.genres?.name && (
                <p className="text-xs text-muted-foreground mt-1">{String(recipe.genres.name)}</p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
