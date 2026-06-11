import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="text-5xl mb-2">🍳</div>
          <CardTitle className="text-xl">得意料理レシピ</CardTitle>
          <CardDescription>
            メールアドレスを入力してください。<br />ログインリンクをお送りします。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {searchParams.message && (
            <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md mb-4 text-center">
              {searchParams.message}
            </p>
          )}
          {searchParams.error && (
            <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-4 text-center">
              エラーが発生しました。もう一度お試しください。
            </p>
          )}
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
