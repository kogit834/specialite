import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-7 w-24" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      {/* 検索バー */}
      <div className="space-y-3 mb-4">
        <Skeleton className="h-10 w-full" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-16 shrink-0" />
          ))}
        </div>
      </div>

      {/* 表示切替 */}
      <div className="flex justify-end mb-3 gap-1">
        <Skeleton className="h-7 w-7" />
        <Skeleton className="h-7 w-7" />
      </div>

      {/* レシピグリッド */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card overflow-hidden">
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="p-2 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
