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
  searchParams: { label?: string; q?: string };
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

  const [{ data: labelGroupsRaw }, recipesResult] = await Promise.all([
    supabase
      .from("label_groups")
      .select("id, name, sort_order, labels(id, name, sort_order)")
      .eq("household_id", profile.household_id)
      .order("sort_order"),
    (async () => {
      let query = supabase
        .from("recipes")
        .select(
          `id, title, created_at,
           recipe_labels(label_id, labels(name, label_groups(name))),
           recipe_photos(storage_path)`
        )
        .eq("household_id", profile.household_id)
        .order("created_at", { ascending: false });

      if (searchParams.label) {
        const { data: rl } = await supabase
          .from("recipe_labels")
          .select("recipe_id")
          .eq("label_id", searchParams.label);
        const ids = rl?.map((r) => r.recipe_id) ?? [];
        if (ids.length === 0) return { data: [] };
        query = query.in("id", ids);
      }
      if (searchParams.q) {
        query = query.ilike("title", `%${searchParams.q}%`);
      }
      return query;
    })(),
  ]);

  const labelGroups = (labelGroupsRaw ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    labels: (Array.isArray(g.labels) ? g.labels : []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    ),
  }));

  // サムネイル用署名付きURLを生成
  const recipesWithThumbnails = await Promise.all(
    (recipesResult.data ?? []).map(async (recipe) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const firstPhoto = (recipe.recipe_photos as any[])?.[0];
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

      <RecipeSearch
        labelGroups={labelGroups}
        currentLabel={searchParams.label}
        currentQ={searchParams.q}
      />

      <RecipeList
        recipes={recipesWithThumbnails}
        householdId={profile.household_id}
      />
    </div>
  );
}
