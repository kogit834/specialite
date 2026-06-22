import Link from "next/link";
import { BookOpen, Settings, Sprout } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pb-16">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t flex justify-around items-center h-16 z-50">
        <Link
          href="/recipes"
          className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-2 px-4"
        >
          <BookOpen size={22} />
          <span>レシピ</span>
        </Link>
        <Link
          href="/seeds"
          className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-2 px-4"
        >
          <Sprout size={22} />
          <span>タネ</span>
        </Link>
        <Link
          href="/settings"
          className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-2 px-4"
        >
          <Settings size={22} />
          <span>設定</span>
        </Link>
      </nav>
    </div>
  );
}
