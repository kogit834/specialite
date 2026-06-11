import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
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

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">得意料理</h1>
        <Button size="icon" asChild>
          <Link href="/recipes/new">
            <Plus size={20} />
          </Link>
        </Button>
      </div>

      <RecipeSearch genres={genres ?? []} currentGenre={searchParams.genre} currentQ={searchParams.q} />

      <RecipeList
        recipes={recipes ?? []}
        householdId={profile.household_id}
        supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
      />
    </div>
  );
}
