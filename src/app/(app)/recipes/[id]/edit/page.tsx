import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { RecipeForm } from "@/components/recipe-form";

export default async function EditRecipePage({ params }: { params: { id: string } }) {
  const { userId, householdId } = getAuthContext();
  if (!householdId) redirect("/setup");

  const supabase = createClient();

  const [{ data: recipe }, { data: labelGroupsRaw }, { data: recipeLabels }, { data: photos }] =
    await Promise.all([
      supabase.from("recipes").select("id, title, body").eq("id", params.id).single(),
      supabase
        .from("label_groups")
        .select("id, name, sort_order, labels(id, name, sort_order)")
        .eq("household_id", householdId)
        .order("sort_order"),
      supabase.from("recipe_labels").select("label_id").eq("recipe_id", params.id),
      supabase
        .from("recipe_photos")
        .select("id, storage_path, caption, taken_on")
        .eq("recipe_id", params.id)
        .order("created_at"),
    ]);

  if (!recipe) notFound();

  const labelGroups = (labelGroupsRaw ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    labels: (Array.isArray(g.labels) ? g.labels : []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    ),
  }));

  // 署名付きURLを1リクエストでまとめて生成
  const photoList = photos ?? [];
  const signedMap = new Map<string, string>();
  if (photoList.length > 0) {
    const { data: signed } = await supabase.storage
      .from("recipe-photos")
      .createSignedUrls(
        photoList.map((p) => p.storage_path),
        3600
      );
    signed?.forEach((s) => {
      if (s.path && s.signedUrl) signedMap.set(s.path, s.signedUrl);
    });
  }
  const signedPhotos = photoList.map((p) => ({ ...p, url: signedMap.get(p.storage_path) ?? "" }));

  const initialLabelIds = (recipeLabels ?? []).map((rl) => rl.label_id);

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/recipes/${params.id}`}>
            <ArrowLeft size={20} />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">レシピを編集</h1>
      </div>
      <RecipeForm
        householdId={householdId}
        userId={userId}
        labelGroups={labelGroups}
        recipe={recipe}
        initialLabelIds={initialLabelIds}
        existingPhotos={signedPhotos}
      />
    </div>
  );
}
