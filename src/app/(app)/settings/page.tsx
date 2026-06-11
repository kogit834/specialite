import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Settings size={20} />
        <h1 className="text-xl font-bold">設定</h1>
      </div>
      <p className="text-sm text-muted-foreground text-center mt-16">
        ※ Supabase接続設定後にアカウント管理が有効になります
      </p>
    </div>
  );
}
