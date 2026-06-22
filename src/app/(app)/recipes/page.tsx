import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, FileUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { RecipeList } from "./recipe-list";
import { RecipeSearch } from "./recipe-search";

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: { genre?: string; q?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile?.household_id) redirect("/setup");

  // ジャンル一覧
  const { data: genres } = await supabase
    .from("genres")
    .select("id, name")
    .eq("household_id", profile.household_id)
    .order("sort_order");

  // レシピ一覧（フィルタ付き）
  let query = supabase
    .from("recipes")
    .select(
      `id, title, genre_id, created_at,
       genres(name),
       recipe_photos(storage_path)`
    )
    .eq("household_id", profile.household_id)
    .order("created_at", { ascending: false });

  if (searchParams.genre) {
    query = query.eq("genre_id", searchParams.genre);
  }
  if (searchParams.q) {
    query = query.ilike("title", `%${searchParams.q}%`);
  }

  const { data: recipes } = await query;

  // サムネイル用署名付きURLを生成
  const recipesWithThumbnails = await Promise.all(
    (recipes ?? []).map(async (recipe) => {
      const firstPhoto = recipe.recipe_photos?.[0];
      if (!firstPhoto) return { ...recipe, thumbnail_url: null };
      const { data } = await supabase.storage
        .from("recipe-photos")
        .createSignedUrl(firstPhoto.storage_path, 3600);
      return { ...recipe, thumbnail_url: data?.signedUrl ?? null };
    })
  );

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">得意料理</h1>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" asChild>
            <Link href="/recipes/import" aria-label="一括取り込み">
              <FileUp size={20} />
            </Link>
          </Button>
          <Button size="icon" asChild>
            <Link href="/recipes/new" aria-label="レシピを追加">
              <Plus size={20} />
            </Link>
          </Button>
        </div>
      </div>

      <RecipeSearch genres={genres ?? []} currentGenre={searchParams.genre} currentQ={searchParams.q} />

      <RecipeList
        recipes={recipesWithThumbnails}
        householdId={profile.household_id}
      />
    </div>
  );
}
