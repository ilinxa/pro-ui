"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useCardContext } from "../hooks/use-card-context";
import { isDateOnly } from "../lib/time";
import type { TaskEditableField, TaskItem, TaskNode } from "../types";

function isoToDatetimeLocal(iso: string | undefined): string {
  if (!iso) return "";
  // Date-only (all-day) value: seed the input at LOCAL midnight of that
  // calendar day. `new Date("YYYY-MM-DD")` parses as UTC midnight, which
  // renders on the previous local day in negative-UTC offsets.
  if (isDateOnly(iso)) return `${iso}T00:00`;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  // datetime-local expects "YYYY-MM-DDTHH:mm" in local time.
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Serialize an EDITED datetime-local input back to the stored form. When the
 * field's original value was date-only (all-day) and the edited value still
 * sits at a local midnight, the date-only form is representable — keep it
 * (`YYYY-MM-DD`, never `toISOString()` for date-only). Anything else
 * serializes as a full ISO timestamp, as before.
 */
function datetimeLocalToIso(
  local: string,
  original?: string,
): string | undefined {
  if (!local) return undefined;
  const d = new Date(local);
  if (!Number.isFinite(d.getTime())) return undefined;
  if (original !== undefined && isDateOnly(original) && /T00:00(:00)?$/.test(local)) {
    return local.slice(0, 10);
  }
  return d.toISOString();
}

type Draft = {
  name: string;
  description: string;
  status: string;
  active: boolean;
  setAt: string;
  startAt: string;
  expireAt: string;
  duration: string;
};

function itemToDraft(item: TaskItem): Draft {
  return {
    name: item.name,
    description: item.description ?? "",
    status: item.status,
    active: item.active,
    setAt: isoToDatetimeLocal(item.setAt),
    startAt: isoToDatetimeLocal(item.startAt),
    expireAt: isoToDatetimeLocal(item.expireAt),
    duration:
      item.duration != null && Number.isFinite(item.duration)
        ? String(Math.round(item.duration / 1000 / 60))
        : "",
  };
}

export function EditPopup({ node }: { node: TaskNode }) {
  const ctx = useCardContext();
  const isOpen =
    ctx.editState.kind === "popup" && ctx.editState.itemId === node.item.id;
  const [draft, setDraft] = useState<Draft>(() => itemToDraft(node.item));
  const [originalId, setOriginalId] = useState<string>(node.item.id);

  // Reset draft when the dialog reopens for a (possibly different) item.
  if (isOpen && originalId !== node.item.id) {
    setOriginalId(node.item.id);
    setDraft(itemToDraft(node.item));
  }

  function setField<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function applyDraft() {
    const id = node.item.id;
    const item = node.item;

    function emit<K extends TaskEditableField>(
      key: K,
      oldValue: unknown,
      newValue: unknown,
    ) {
      if (Object.is(oldValue, newValue)) return;
      ctx.dispatch({ type: "edit-field", itemId: id, key, value: newValue });
      ctx.fireEvent("fieldEdited", { itemId: id, key, oldValue, newValue });
    }

    emit("name", item.name, draft.name);
    emit("description", item.description ?? "", draft.description);

    if (draft.status !== item.status) {
      const oldStatus = item.status;
      emit("status", oldStatus, draft.status);
      ctx.fireEvent("statusChanged", {
        itemId: id,
        oldStatus,
        newStatus: draft.status,
      });
    }

    if (draft.active !== item.active) {
      emit("active", item.active, draft.active);
      ctx.fireEvent("activeToggled", {
        itemId: id,
        oldActive: item.active,
        newActive: draft.active,
      });
    }

    // Date fields: only emit when the INPUT actually changed. The stored form
    // (date-only / offset timestamp / seconds) doesn't survive the
    // datetime-local round-trip, so re-serializing an untouched field would
    // rewrite the stored value and fire a phantom fieldEdited on a name-only
    // save. Untouched ⇒ skipped ⇒ the stored string stays byte-identical.
    const baseline = itemToDraft(item);
    if (draft.setAt !== baseline.setAt) {
      emit("setAt", item.setAt, datetimeLocalToIso(draft.setAt, item.setAt) ?? item.setAt);
    }
    if (draft.startAt !== baseline.startAt) {
      emit("startAt", item.startAt, datetimeLocalToIso(draft.startAt, item.startAt));
    }
    if (draft.expireAt !== baseline.expireAt) {
      emit("expireAt", item.expireAt, datetimeLocalToIso(draft.expireAt, item.expireAt));
    }

    const durMinutes = draft.duration === "" ? null : Number(draft.duration);
    const durMs =
      durMinutes != null && Number.isFinite(durMinutes) && durMinutes > 0
        ? durMinutes * 60 * 1000
        : undefined;
    emit("duration", item.duration, durMs);

    ctx.dispatch({ type: "close-edit" });
  }

  function handleOpenChange(open: boolean) {
    if (!open) ctx.dispatch({ type: "close-edit" });
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
          <DialogDescription>
            Changes apply when you click Save. Press Escape to discard.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="todo-name">Name</Label>
            <Input
              id="todo-name"
              value={draft.name}
              onChange={(e) => setField("name", e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="todo-description">Description</Label>
            <Textarea
              id="todo-description"
              rows={3}
              value={draft.description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="todo-status">Status</Label>
              {ctx.statusOptions && ctx.statusOptions.length > 0 ? (
                <Select
                  value={draft.status}
                  // Cross-backend: Radix passes `(string)`, Base UI passes
                  // `(string | null, eventDetails)` — keep the nullable guard.
                  onValueChange={(v: string | null) => setField("status", v ?? "")}
                >
                  {/* w-full override per F-cross-13 / shadcn v4 Select w-fit lock */}
                  <SelectTrigger id="todo-status" className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {ctx.statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="todo-status"
                  value={draft.status}
                  onChange={(e) => setField("status", e.target.value)}
                />
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="todo-active" className="flex items-center justify-between">
                <span>Active</span>
                <Switch
                  id="todo-active"
                  checked={draft.active}
                  onCheckedChange={(v) => setField("active", v)}
                />
              </Label>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="todo-setAt">Set at</Label>
              <Input
                id="todo-setAt"
                type="datetime-local"
                value={draft.setAt}
                onChange={(e) => setField("setAt", e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="todo-startAt">Starts at</Label>
              <Input
                id="todo-startAt"
                type="datetime-local"
                value={draft.startAt}
                onChange={(e) => setField("startAt", e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="todo-expireAt">Expires at</Label>
              <Input
                id="todo-expireAt"
                type="datetime-local"
                value={draft.expireAt}
                onChange={(e) => setField("expireAt", e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="todo-duration">Duration (min)</Label>
              <Input
                id="todo-duration"
                type="number"
                min={0}
                placeholder="e.g. 30"
                value={draft.duration}
                onChange={(e) => setField("duration", e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => ctx.dispatch({ type: "close-edit" })}
          >
            Cancel
          </Button>
          <Button onClick={applyDraft}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
