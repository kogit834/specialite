import { headers } from "next/headers";

/**
 * middleware (updateSession) がリクエストヘッダに付与した「検証済み」認証情報を読み取る。
 *
 * middleware 側で getUser() による検証とプロフィール取得を一度だけ行い、その結果を
 * x-user-id / x-user-email / x-household-id ヘッダで受け渡している。これにより各
 * Server Component で getUser() / profiles を再取得するネットワーク往復を不要にする。
 *
 * 値は middleware が必ず上書き/削除しているためクライアントから偽装できない。
 * またデータ取得は引き続き Cookie の JWT による RLS で保護される。
 */
export function getAuthContext() {
  const h = headers();
  return {
    userId: h.get("x-user-id") ?? "",
    email: h.get("x-user-email") ?? "",
    householdId: h.get("x-household-id") || null,
  };
}
