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

  const { data: labelGroupsRaw } = await supabase
    .from("label_groups")
    .select("id, name, sort_order, labels(id, name, sort_order)")
    .eq("household_id", profile.household_id)
    .order("sort_order");

  const labelGroups = (labelGroupsRaw ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    labels: (Array.isArray(g.labels) ? g.labels : []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    ),
  }));

  let query = supabase
    .from("recipes")
    .select(
      `id, title, label_id, created_at,
       labels(name),
       recipe_photos(storage_path)`
    )
    .eq("household_id", profile.household_id)
    .order("created_at", { ascending: false });

  if (searchParams.label) {
    query = query.eq("label_id", searchParams.label);
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

      <RecipeSearch
        labelGroups={labelGroups}
        currentLabel={searchParams.label}
        currentQ={searchParams.q}
      />

      <RecipeList
        recipes={recipes ?? []}
        householdId={profile.household_id}
        supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
      />
    </div>
  );
}
