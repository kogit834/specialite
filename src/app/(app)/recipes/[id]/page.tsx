import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { PhotoGallery } from "./photo-gallery";
import { DeleteRecipeButton } from "./delete-recipe-button";

export default async function RecipeDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: recipe }, { data: photos }] = await Promise.all([
    supabase
      .from("recipes")
      .select(`id, title, body, created_at, updated_at, recipe_labels(label_id, labels(name))`)
      .eq("id", params.id)
      .single(),
    supabase
      .from("recipe_photos")
      .select("id, storage_path, caption, taken_on")
      .eq("recipe_id", params.id)
      .order("created_at"),
  ]);

  if (!recipe) notFound();

  const signedPhotos = await Promise.all(
    (photos ?? []).map(async (p) => {
      const { data } = await supabase.storage
        .from("recipe-photos")
        .createSignedUrl(p.storage_path, 3600);
      return { ...p, url: data?.signedUrl ?? "" };
    })
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const labelNames = ((recipe.recipe_labels ?? []) as any[])
    .map((rl) => rl.labels?.name)
    .filter(Boolean) as string[];

  return (
    <div className="pb-4">
      <div className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/recipes">
            <ArrowLeft size={20} />
          </Link>
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/recipes/${params.id}/edit`}>
            <Pencil size={20} />
          </Link>
        </Button>
      </div>

      {signedPhotos.length > 0 && <PhotoGallery photos={signedPhotos} title={recipe.title} />}

      <div className="p-4 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">{recipe.title}</h1>
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

        <div className="whitespace-pre-wrap text-sm leading-relaxed border-t pt-4">
          {recipe.body || <span className="text-muted-foreground">レシピ本文がありません</span>}
        </div>

        <div className="text-xs text-muted-foreground border-t pt-3">
          最終更新: {new Date(recipe.updated_at).toLocaleDateString("ja-JP")}
        </div>

        <DeleteRecipeButton recipeId={params.id} />
      </div>
    </div>
  );
}
