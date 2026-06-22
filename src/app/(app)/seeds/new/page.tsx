import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { SeedForm } from "@/components/seed-form";

export default async function NewSeedPage() {
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

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/seeds">
            <ArrowLeft size={20} />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">タネを追加</h1>
      </div>
      <SeedForm householdId={profile.household_id} userId={user.id} />
    </div>
  );
}
