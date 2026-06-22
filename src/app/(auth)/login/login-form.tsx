"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // サーバー側APIルート経由でOTPを送信（ブラウザfetchのヘッダー制限を回避）
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          redirectTo: `${location.origin}/auth/callback`,
        }),
      });

      let data: { ok?: boolean; error?: string } = {};
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch {
        // レスポンスが空またはJSON以外の場合
      }

      if (!res.ok) {
        setError(data.error || `エラー (HTTP ${res.status})`);
        return;
      }

      setSent(true);
    } catch (err) {
      setError((err as Error).message || "ネットワークエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center space-y-3 py-4">
        <Mail size={40} className="mx-auto text-primary" />
        <p className="font-medium">メールを送信しました</p>
        <p className="text-sm text-muted-foreground">
          <span className="font-mono text-foreground">{email}</span> に<br />
          ログインリンクを送りました。<br />
          メールをご確認ください。
        </p>
        <Button variant="ghost" size="sm" onClick={() => setSent(false)}>
          メールアドレスを変更する
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">メールアドレス</Label>
        <Input
          id="email"
          type="email"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          inputMode="email"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" />
            送信中...
          </>
        ) : (
          "ログインリンクを送る"
        )}
      </Button>
    </form>
  );
}
