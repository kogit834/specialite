import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ImportForm } from "./import-form";

export default async function ImportRecipesPage() {
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

  const { data: genres } = await supabase
    .from("genres")
    .select("id, name")
    .eq("household_id", profile.household_id)
    .order("sort_order");

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/recipes">
            <ArrowLeft size={20} />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">一括取り込み</h1>
      </div>
      <ImportForm
        householdId={profile.household_id}
        userId={user.id}
        genres={genres ?? []}
      />
    </div>
  );
}
