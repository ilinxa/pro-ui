"use client";

import { Check, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useCardContext } from "../hooks/use-card-context";
import type { TodoNode } from "../types";

/**
 * Status indicator. Read-only `<Badge>` by default; becomes a status-change
 * dropdown when the card is editable, the item's `edit` permission is granted,
 * `statusEditable` is on, and `statusOptions` is non-empty. The dropdown reuses
 * the exact `edit-field` dispatch + events as the inline editor, so a status
 * change here is identical to one made there.
 */
export function StatusBadge({
  node,
  className,
}: {
  node: TodoNode;
  className?: string;
}) {
  const ctx = useCardContext();
  const status = node.item.status;
  if (!status) return null;

  const options = ctx.statusOptions ?? [];
  const match = options.find((o) => o.value === status);
  const label = match?.label ?? status;
  const variant = match?.variant ?? "secondary";

  // Terminal statuses get a fixed green/red tag regardless of `variant`, so the
  // status reads at a glance (pairs with the card.tsx done/blocked overlay).
  const toneClass =
    match?.tone === "done"
      ? "border-transparent bg-emerald-600 text-white hover:bg-emerald-600/90"
      : match?.tone === "blocked"
        ? "border-transparent bg-rose-600 text-white hover:bg-rose-600/90"
        : "";

  const perms = ctx.resolvePermissions(node);
  const canSelect =
    ctx.statusEditable && ctx.editable && perms.edit && options.length > 0;

  if (!canSelect) {
    return (
      <Badge
        variant={variant}
        className={cn("font-medium", toneClass, className)}
        role="status"
      >
        {label}
      </Badge>
    );
  }

  function selectStatus(next: string) {
    if (next === status) return;
    const id = node.item.id;
    ctx.dispatch({ type: "edit-field", itemId: id, key: "status", value: next });
    ctx.fireEvent("fieldEdited", {
      itemId: id,
      key: "status",
      oldValue: status,
      newValue: next,
    });
    ctx.fireEvent("statusChanged", { itemId: id, oldStatus: status, newStatus: next });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* native button + stop-propagation: keeps a click on the badge from
            starting an HTML5/kanban drag or bubbling to the card; data-stop-click
            is honored by the kanban ItemShell's click guard. */}
        <button
          type="button"
          data-stop-click
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={`Status: ${label}. Click to change`}
          className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Badge
            variant={variant}
            className={cn("cursor-pointer gap-1 pe-1.5 font-medium", toneClass, className)}
            role="status"
          >
            {label}
            <ChevronDown className="size-3 opacity-70" />
          </Badge>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-36">
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onSelect={() => selectStatus(opt.value)}
            className="gap-2"
          >
            <Check
              className={cn("size-3.5", opt.value === status ? "opacity-100" : "opacity-0")}
            />
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
