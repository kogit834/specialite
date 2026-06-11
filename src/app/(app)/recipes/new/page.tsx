import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewRecipePage() {
  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/recipes">
            <ArrowLeft size={20} />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">レシピを追加</h1>
      </div>
      <p className="text-sm text-muted-foreground text-center mt-8">
        ※ Supabase接続設定後に登録機能が有効になります
      </p>
      <form className="space-y-4 mt-4 opacity-50 pointer-events-none">
        <div className="space-y-1.5">
          <Label htmlFor="title">料理名</Label>
          <Input id="title" placeholder="例: 肉じゃが" disabled />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="body">レシピ本文</Label>
          <Textarea id="body" placeholder="材料・手順を入力..." rows={8} disabled />
        </div>
        <Button className="w-full" disabled>保存する</Button>
      </form>
    </div>
  );
}
