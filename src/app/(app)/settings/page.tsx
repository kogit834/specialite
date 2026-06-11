import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LogoutButton } from "./logout-button";
import { HouseholdIdCopy } from "./household-id-copy";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, household_id, households(name)")
    .eq("id", user.id)
    .single();

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Settings size={20} />
        <h1 className="text-xl font-bold">設定</h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">アカウント</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">表示名</span>
            <span>{profile?.display_name ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">メール</span>
            <span className="text-xs">{user.email}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">世帯</CardTitle>
          <CardDescription>
            このIDを妻に共有して「世帯に参加する」で入力してもらうと、レシピを共有できます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">世帯名</span>
            <span>{(profile?.households as unknown as { name: string } | null)?.name ?? "—"}</span>
          </div>
          <Separator />
          <div className="space-y-1">
            <span className="text-muted-foreground">世帯ID（共有用）</span>
            <HouseholdIdCopy householdId={profile?.household_id ?? ""} />
          </div>
        </CardContent>
      </Card>

      <LogoutButton />
    </div>
  );
}
