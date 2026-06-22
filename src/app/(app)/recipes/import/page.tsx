import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ImportForm } from "./import-form";

export default async function ImportRecipesPage() {
  const { userId, householdId } = getAuthContext();
  if (!householdId) redirect("/setup");

  const supabase = createClient();

  const { data: labelGroupsRaw } = await supabase
    .from("label_groups")
    .select("id, name, sort_order, labels(id, name, sort_order)")
    .eq("household_id", householdId)
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
        <h1 className="text-xl font-bold">一括取り込み</h1>
      </div>
      <ImportForm
        householdId={householdId}
        userId={userId}
        labelGroups={labelGroups}
      />
    </div>
  );
}
