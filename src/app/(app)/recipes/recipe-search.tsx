"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

type LabelItem = { id: string; name: string };
type LabelGroup = { id: string; name: string; labels: LabelItem[] };

export function RecipeSearch({
  labelGroups,
  currentLabel,
  currentQ,
}: {
  labelGroups: LabelGroup[];
  currentLabel?: string;
  currentQ?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParam = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.push(`/recipes?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const hasLabels = labelGroups.some((g) => g.labels.length > 0);

  return (
    <div className="space-y-3 mb-4">
      <div className="relative">
        {isPending ? (
          <Loader2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary animate-spin" />
        ) : (
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          placeholder="料理名で検索..."
          defaultValue={currentQ}
          className="pl-9"
          onChange={(e) => {
            const val = e.target.value;
            clearTimeout((window as Window & { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer);
            (window as Window & { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer = setTimeout(
              () => updateParam("q", val || undefined),
              400
            );
          }}
        />
      </div>

      {hasLabels && (
        <div className="space-y-2">
          <div
            className={`flex gap-2 overflow-x-auto pb-1 no-scrollbar transition-opacity ${
              isPending ? "opacity-50" : ""
            }`}
          >
            <Button
              variant={!currentLabel ? "default" : "outline"}
              size="sm"
              className="shrink-0 h-8"
              disabled={isPending}
              onClick={() => updateParam("label", undefined)}
            >
              すべて
            </Button>
            {labelGroups.map((group) =>
              group.labels.map((label) => (
                <Button
                  key={label.id}
                  variant={currentLabel === label.id ? "default" : "outline"}
                  size="sm"
                  className="shrink-0 h-8"
                  disabled={isPending}
                  onClick={() => updateParam("label", label.id)}
                >
                  <span className="text-muted-foreground mr-1 text-xs">{group.name}/</span>
                  {label.name}
                </Button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
