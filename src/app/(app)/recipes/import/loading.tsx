import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-7 w-32" />
      </div>
      <div className="space-y-5">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
