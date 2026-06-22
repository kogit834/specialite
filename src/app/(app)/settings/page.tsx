import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth";
import { Settings } from "lucide-react";
import { SettingsTabs } from "./settings-tabs";

export default async function SettingsPage() {
  const { userId, email, householdId } = getAuthContext();
  if (!householdId) redirect("/setup");

  const supabase = createClient();

  const [{ data: profile }, { data: labelGroupsRaw }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, households(name)")
      .eq("id", userId)
      .single(),
    supabase
      .from("label_groups")
      .select("id, name, sort_order, labels(id, name, sort_order)")
      .eq("household_id", householdId)
      .order("sort_order"),
  ]);

  const labelGroups = (labelGroupsRaw ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    sort_order: g.sort_order,
    labels: (Array.isArray(g.labels) ? g.labels : []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    ),
  }));

  const householdName = (profile?.households as unknown as { name: string } | null)?.name ?? "";

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Settings size={20} />
        <h1 className="text-xl font-bold">設定</h1>
      </div>

      <Suspense>
        <SettingsTabs
          displayName={profile?.display_name ?? ""}
          email={email}
          householdName={householdName}
          householdId={householdId}
          labelGroups={labelGroups}
        />
      </Suspense>
    </div>
  );
}
