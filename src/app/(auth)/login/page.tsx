import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🍳</div>
          <CardTitle className="text-xl">得意料理レシピ</CardTitle>
          <CardDescription>メールアドレスを入力してログインリンクを受け取ってください</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            ※ Supabase接続設定後に認証機能が有効になります
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
