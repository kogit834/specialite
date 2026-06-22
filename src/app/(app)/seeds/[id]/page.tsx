import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { DeleteSeedButton } from "./delete-seed-button";

export default async function SeedDetailPage({ params }: { params: { id: string } }) {
  // 認証は middleware で検証済み。データは RLS で保護される。
  const supabase = createClient();

  const { data: seed } = await supabase
    .from("seeds")
    .select("id, title, body, created_at, updated_at")
    .eq("id", params.id)
    .single();

  if (!seed) notFound();

  return (
    <div className="pb-4">
      <div className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/seeds">
            <ArrowLeft size={20} />
          </Link>
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/seeds/${params.id}/edit`}>
            <Pencil size={20} />
          </Link>
        </Button>
      </div>

      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">{seed.title}</h1>

        <div className="whitespace-pre-wrap text-sm leading-relaxed border-t pt-4">
          {seed.body || <span className="text-muted-foreground">本文がありません</span>}
        </div>

        <div className="text-xs text-muted-foreground border-t pt-3">
          最終更新: {new Date(seed.updated_at).toLocaleDateString("ja-JP")}
        </div>

        <DeleteSeedButton seedId={params.id} />
      </div>
    </div>
  );
}
