import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-7 w-16" />
      </div>

      {/* タブ */}
      <div className="flex gap-4 border-b pb-2">
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-6 w-20" />
      </div>

      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-44 w-full rounded-xl" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
