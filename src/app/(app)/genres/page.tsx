import { Tag } from "lucide-react";

export default function GenresPage() {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Tag size={20} />
        <h1 className="text-xl font-bold">ジャンル設定</h1>
      </div>
      <p className="text-sm text-muted-foreground text-center mt-16">
        ※ Supabase接続設定後にジャンル管理が有効になります
      </p>
    </div>
  );
}
