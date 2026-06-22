import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { RecipeForm } from "@/components/recipe-form";

export default async function NewRecipePage() {
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

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/recipes">
            <ArrowLeft size={20} />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">レシピを追加</h1>
      </div>
      <RecipeForm
        householdId={profile.household_id}
        userId={user.id}
        labelGroups={labelGroups}
      />
    </div>
  );
}
