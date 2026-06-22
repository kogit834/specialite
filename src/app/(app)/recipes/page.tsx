import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, FileUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { RecipeList } from "./recipe-list";
import { RecipeSearch } from "./recipe-search";

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: { label?: string; q?: string };
}) {
  const { householdId } = getAuthContext();
  if (!householdId) redirect("/setup");

  const supabase = createClient();

  const [{ data: labelGroupsRaw }, recipesResult] = await Promise.all([
    supabase
      .from("label_groups")
      .select("id, name, sort_order, labels(id, name, sort_order)")
      .eq("household_id", householdId)
      .order("sort_order"),
    (async () => {
      let query = supabase
        .from("recipes")
        .select(
          `id, title, created_at,
           recipe_labels(label_id, labels(name, label_groups(name))),
           recipe_photos(storage_path)`
        )
        .eq("household_id", householdId)
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

  // サムネイル用の署名付きURLを1リクエストでまとめて生成（件数ぶんの往復を1回に）
  const recipesData = recipesResult.data ?? [];
  const photoPaths = recipesData
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((r) => (r.recipe_photos as any[])?.[0]?.storage_path as string | undefined)
    .filter((p): p is string => Boolean(p));

  const urlMap = new Map<string, string>();
  if (photoPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("recipe-photos")
      .createSignedUrls(photoPaths, 3600);
    signed?.forEach((s) => {
      if (s.path && s.signedUrl) urlMap.set(s.path, s.signedUrl);
    });
  }

  const recipesWithThumbnails = recipesData.map((recipe) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const path = (recipe.recipe_photos as any[])?.[0]?.storage_path as string | undefined;
    return { ...recipe, thumbnail_url: path ? urlMap.get(path) ?? null : null };
  });

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
        householdId={householdId}
      />
    </div>
  );
}
