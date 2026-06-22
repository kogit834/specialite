"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LogoutButton } from "./logout-button";
import { HouseholdIdCopy } from "./household-id-copy";
import { LabelsSettings } from "./labels-settings";

type LabelItem = { id: string; name: string; sort_order: number };
type LabelGroupItem = { id: string; name: string; sort_order: number; labels: LabelItem[] };

type Props = {
  displayName: string;
  email: string;
  householdName: string;
  householdId: string;
  labelGroups: LabelGroupItem[];
};

export function SettingsTabs({ displayName, email, householdName, householdId, labelGroups }: Props) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "labels" ? "labels" : "account";
  const [activeTab, setActiveTab] = useState<"account" | "labels">(initialTab);

  return (
    <div>
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab("account")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "account"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          一般
        </button>
        <button
          onClick={() => setActiveTab("labels")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "labels"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          ラベル設定
        </button>
      </div>

      {activeTab === "account" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">アカウント</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">表示名</span>
                <span>{displayName || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">メール</span>
                <span className="text-xs">{email}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">世帯</CardTitle>
              <CardDescription>
                このIDを妻に共有して「世帯に参加する」で入力してもらうと、レシピを共有できます
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">世帯名</span>
                <span>{householdName || "—"}</span>
              </div>
              <Separator />
              <div className="space-y-1">
                <span className="text-muted-foreground">世帯ID（共有用）</span>
                <HouseholdIdCopy householdId={householdId} />
              </div>
            </CardContent>
          </Card>

          <LogoutButton />
        </div>
      )}

      {activeTab === "labels" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            ラベルグループとラベルを管理します。レシピの分類に使用できます。
          </p>
          <LabelsSettings householdId={householdId} initialGroups={labelGroups} />
        </div>
      )}
    </div>
  );
}
