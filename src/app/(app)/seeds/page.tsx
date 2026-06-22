import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Sprout } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function SeedsPage() {
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

  const { data: seeds } = await supabase
    .from("seeds")
    .select("id, title, body, created_at, updated_at")
    .eq("household_id", profile.household_id)
    .order("updated_at", { ascending: false });

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">タネ</h1>
        <Button size="icon" asChild>
          <Link href="/seeds/new">
            <Plus size={20} />
          </Link>
        </Button>
      </div>

      {!seeds || seeds.length === 0 ? (
        <div className="text-center mt-16 space-y-2">
          <Sprout size={48} className="mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">
            タネがありません。<br />＋ボタンからアイデアを追加してください。
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {seeds.map((seed) => (
            <Link
              key={seed.id}
              href={`/seeds/${seed.id}`}
              className="block rounded-lg border bg-card p-4 active:scale-95 transition-transform"
            >
              <p className="font-medium text-sm leading-tight">{seed.title}</p>
              {seed.body && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{seed.body}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(seed.updated_at).toLocaleDateString("ja-JP")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
