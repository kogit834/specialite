import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RecipesPage() {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">得意料理</h1>
        <Button size="icon" asChild>
          <Link href="/recipes/new">
            <Plus size={20} />
          </Link>
        </Button>
      </div>
      <p className="text-muted-foreground text-sm text-center mt-16">
        まだレシピがありません。<br />＋ボタンから追加してください。
      </p>
    </div>
  );
}
