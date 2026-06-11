"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export function HouseholdIdCopy({ householdId }: { householdId: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(householdId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 text-xs bg-muted p-2 rounded break-all">{householdId}</code>
      <Button size="icon" variant="ghost" onClick={handleCopy} className="shrink-0">
        {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
      </Button>
    </div>
  );
}
