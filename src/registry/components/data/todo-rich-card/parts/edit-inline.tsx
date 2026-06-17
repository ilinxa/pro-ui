"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCardContext } from "../hooks/use-card-context";
import type { TodoEditableField, TodoItem, TodoNode } from "../types";

/**
 * Inline editor. Each field commits on blur (or Enter for text fields) via
 * edit-field dispatch — no Save button. Escape (handled at the card level)
 * closes inline mode without rollback.
 *
 * Images / links are read-only in inline mode (per plan §6.3); consumers
 * needing to edit those use the popup.
 */
export function EditInline({ node }: { node: TodoNode }) {
  const ctx = useCardContext();
  const id = node.item.id;

  function commit<K extends TodoEditableField>(
    key: K,
    oldValue: unknown,
    newValue: unknown,
  ) {
    if (Object.is(oldValue, newValue)) return;
    ctx.dispatch({ type: "edit-field", itemId: id, key, value: newValue });
    ctx.fireEvent("fieldEdited", { itemId: id, key, oldValue, newValue });
    if (key === "status") {
      ctx.fireEvent("statusChanged", {
        itemId: id,
        oldStatus: oldValue as string,
        newStatus: newValue as string,
      });
    }
  }

  return (
    <div className="space-y-2 rounded-md border border-dashed border-border bg-muted/30 p-3">
      <NameField item={node.item} commit={commit} />
      <DescriptionField item={node.item} commit={commit} />
      <StatusField item={node.item} commit={commit} />
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={() => ctx.dispatch({ type: "close-edit" })}
        >
          <X className="size-3.5" />
          Done editing
        </Button>
      </div>
    </div>
  );
}

function NameField({
  item,
  commit,
}: {
  item: TodoItem;
  commit: <K extends TodoEditableField>(key: K, oldValue: unknown, newValue: unknown) => void;
}) {
  const [value, setValue] = useState(item.name);

  return (
    <div className="flex items-center gap-1">
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => commit("name", item.name, value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.currentTarget as HTMLInputElement).blur();
          }
        }}
        className="font-medium"
        aria-label="Name"
      />
    </div>
  );
}

function DescriptionField({
  item,
  commit,
}: {
  item: TodoItem;
  commit: <K extends TodoEditableField>(key: K, oldValue: unknown, newValue: unknown) => void;
}) {
  const [value, setValue] = useState(item.description ?? "");

  return (
    <Textarea
      rows={2}
      placeholder="Description"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => commit("description", item.description ?? "", value)}
      className="resize-none"
      aria-label="Description"
    />
  );
}

function StatusField({
  item,
  commit,
}: {
  item: TodoItem;
  commit: <K extends TodoEditableField>(key: K, oldValue: unknown, newValue: unknown) => void;
}) {
  const ctx = useCardContext();
  const [value, setValue] = useState(item.status);
  const opts = ctx.statusOptions;

  if (opts && opts.length > 0) {
    return (
      <Select
        value={value}
        onValueChange={(next: string) => {
          setValue(next);
          commit("status", item.status, next);
        }}
      >
        {/* w-full override per F-cross-13 / shadcn v4 Select w-fit lock */}
        <SelectTrigger className="w-full" aria-label="Status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {opts.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        placeholder="Status"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => commit("status", item.status, value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.currentTarget as HTMLInputElement).blur();
          }
        }}
        aria-label="Status"
      />
      <Check className="size-3.5 text-muted-foreground" />
    </div>
  );
}
