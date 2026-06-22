"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronRight } from "lucide-react";

type LabelItem = { id: string; name: string; sort_order: number };
type LabelGroupItem = { id: string; name: string; sort_order: number; labels: LabelItem[] };

export function LabelsSettings({
  householdId,
  initialGroups,
}: {
  householdId: string;
  initialGroups: LabelGroupItem[];
}) {
  const supabase = createClient();
  const [groups, setGroups] = useState<LabelGroupItem[]>(initialGroups);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(initialGroups.map((g) => g.id)));

  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");

  const [addingLabelForGroup, setAddingLabelForGroup] = useState<string | null>(null);
  const [newLabelName, setNewLabelName] = useState("");
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingLabelName, setEditingLabelName] = useState("");

  function toggleExpand(groupId: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  async function saveNewGroup() {
    const name = newGroupName.trim();
    if (!name) return;
    const sort_order = groups.length;
    const { data, error } = await supabase
      .from("label_groups")
      .insert({ household_id: householdId, name, sort_order })
      .select("id, name, sort_order")
      .single();
    if (error || !data) return;
    setGroups((prev) => [...prev, { ...data, labels: [] }]);
    setExpandedGroups((prev) => new Set(prev).add(data.id));
    setNewGroupName("");
    setAddingGroup(false);
  }

  async function saveEditGroup(groupId: string) {
    const name = editingGroupName.trim();
    if (!name) return;
    const { error } = await supabase.from("label_groups").update({ name }).eq("id", groupId);
    if (error) return;
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, name } : g)));
    setEditingGroupId(null);
  }

  async function deleteGroup(groupId: string) {
    const { error } = await supabase.from("label_groups").delete().eq("id", groupId);
    if (error) return;
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  }

  async function saveNewLabel(groupId: string) {
    const name = newLabelName.trim();
    if (!name) return;
    const group = groups.find((g) => g.id === groupId);
    const sort_order = group?.labels.length ?? 0;
    const { data, error } = await supabase
      .from("labels")
      .insert({ label_group_id: groupId, household_id: householdId, name, sort_order })
      .select("id, name, sort_order")
      .single();
    if (error || !data) return;
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, labels: [...g.labels, data] } : g))
    );
    setNewLabelName("");
    setAddingLabelForGroup(null);
  }

  async function saveEditLabel(labelId: string, groupId: string) {
    const name = editingLabelName.trim();
    if (!name) return;
    const { error } = await supabase.from("labels").update({ name }).eq("id", labelId);
    if (error) return;
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, labels: g.labels.map((l) => (l.id === labelId ? { ...l, name } : l)) }
          : g
      )
    );
    setEditingLabelId(null);
  }

  async function deleteLabel(labelId: string, groupId: string) {
    const { error } = await supabase.from("labels").delete().eq("id", labelId);
    if (error) return;
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, labels: g.labels.filter((l) => l.id !== labelId) } : g
      )
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div key={group.id} className="border rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 p-3 bg-muted/30">
            <button
              onClick={() => toggleExpand(group.id)}
              className="text-muted-foreground shrink-0"
            >
              {expandedGroups.has(group.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {editingGroupId === group.id ? (
              <>
                <Input
                  value={editingGroupName}
                  onChange={(e) => setEditingGroupName(e.target.value)}
                  className="h-7 text-sm flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEditGroup(group.id);
                    if (e.key === "Escape") setEditingGroupId(null);
                  }}
                  autoFocus
                />
                <button onClick={() => saveEditGroup(group.id)} className="text-primary shrink-0">
                  <Check size={16} />
                </button>
                <button onClick={() => setEditingGroupId(null)} className="text-muted-foreground shrink-0">
                  <X size={16} />
                </button>
              </>
            ) : (
              <>
                <span className="font-medium text-sm flex-1">{group.name}</span>
                <button
                  onClick={() => {
                    setEditingGroupId(group.id);
                    setEditingGroupName(group.name);
                  }}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => deleteGroup(group.id)}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>

          {expandedGroups.has(group.id) && (
            <div className="p-2 space-y-1">
              {group.labels.map((label) => (
                <div key={label.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/40">
                  {editingLabelId === label.id ? (
                    <>
                      <Input
                        value={editingLabelName}
                        onChange={(e) => setEditingLabelName(e.target.value)}
                        className="h-7 text-sm flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEditLabel(label.id, group.id);
                          if (e.key === "Escape") setEditingLabelId(null);
                        }}
                        autoFocus
                      />
                      <button onClick={() => saveEditLabel(label.id, group.id)} className="text-primary shrink-0">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditingLabelId(null)} className="text-muted-foreground shrink-0">
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm flex-1">{label.name}</span>
                      <button
                        onClick={() => {
                          setEditingLabelId(label.id);
                          setEditingLabelName(label.name);
                        }}
                        className="text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => deleteLabel(label.id, group.id)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              ))}

              {addingLabelForGroup === group.id ? (
                <div className="flex items-center gap-2 px-2 py-1">
                  <Input
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="ラベル名"
                    className="h-7 text-sm flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveNewLabel(group.id);
                      if (e.key === "Escape") {
                        setAddingLabelForGroup(null);
                        setNewLabelName("");
                      }
                    }}
                    autoFocus
                  />
                  <button onClick={() => saveNewLabel(group.id)} className="text-primary shrink-0">
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setAddingLabelForGroup(null);
                      setNewLabelName("");
                    }}
                    className="text-muted-foreground shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingLabelForGroup(group.id)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground w-full"
                >
                  <Plus size={12} />
                  ラベルを追加
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {addingGroup ? (
        <div className="flex items-center gap-2 border rounded-lg p-3">
          <Input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="グループ名"
            className="h-8 text-sm flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") saveNewGroup();
              if (e.key === "Escape") {
                setAddingGroup(false);
                setNewGroupName("");
              }
            }}
            autoFocus
          />
          <button onClick={saveNewGroup} className="text-primary shrink-0">
            <Check size={16} />
          </button>
          <button
            onClick={() => {
              setAddingGroup(false);
              setNewGroupName("");
            }}
            className="text-muted-foreground shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1"
          onClick={() => setAddingGroup(true)}
        >
          <Plus size={14} />
          ラベルグループを追加
        </Button>
      )}
    </div>
  );
}
