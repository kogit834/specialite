import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { SeedForm } from "@/components/seed-form";

export default async function EditSeedPage({ params }: { params: { id: string } }) {
  const { userId, householdId } = getAuthContext();
  if (!householdId) redirect("/setup");

  const supabase = createClient();

  const { data: seed } = await supabase
    .from("seeds")
    .select("id, title, body")
    .eq("id", params.id)
    .single();

  if (!seed) notFound();

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/seeds/${params.id}`}>
            <ArrowLeft size={20} />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">タネを編集</h1>
      </div>
      <SeedForm householdId={householdId} userId={userId} seed={seed} />
    </div>
  );
}
