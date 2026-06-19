"use client";

import { ChevronDown, ChevronRight, PanelTop, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useCardContext } from "../hooks/use-card-context";
import type { TodoNode } from "../types";
import { ActionMenu } from "./action-menu";
import { CardMeta } from "./card-meta";
import { StatusBadge } from "./status-badge";

export function CardHeader({
  node,
  onOverrideColor,
}: {
  node: TodoNode;
  onOverrideColor: () => void;
}) {
  const ctx = useCardContext();
  const perms = ctx.resolvePermissions(node);
  const id = node.item.id;
  const isInlineActive = ctx.editState.kind === "inline" && ctx.editState.itemId === id;

  function tryOpenEdit(mode: "popup" | "inline") {
    if (!perms.edit) {
      ctx.reportPermissionDenied("edit", id, perms.reason);
      return;
    }
    // requestEdit consults the veto BEFORE opening (no flash-open-then-close).
    ctx.requestEdit(id, mode);
  }

  function handlePrimaryEdit() {
    if (ctx.editable) {
      // Toggle inline mode.
      if (isInlineActive) {
        ctx.dispatch({ type: "close-edit" });
      } else {
        tryOpenEdit("inline");
      }
    } else {
      tryOpenEdit("popup");
    }
  }

  function handleToggleActive(next: boolean) {
    if (!perms.toggleActive) {
      ctx.reportPermissionDenied("toggleActive", id, perms.reason);
      return;
    }
    if (next === node.item.active) return;
    const oldActive = node.item.active;
    ctx.dispatch({ type: "toggle-active", itemId: id });
    ctx.fireEvent("activeToggled", { itemId: id, oldActive, newActive: next });
    ctx.fireEvent("fieldEdited", {
      itemId: id,
      key: "active",
      oldValue: oldActive,
      newValue: next,
    });
  }

  const collapsed = ctx.isCollapsed(node.item.id);

  function toggleCollapse() {
    ctx.dispatch({ type: "toggle-collapse", itemId: node.item.id });
  }

  return (
    <header className="flex flex-col gap-2">
      {/* row 1 — controls (status + toggles); kept on its own line so the title
          never has to share horizontal space and truncate to nothing. */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="-ms-1 size-6 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label={collapsed ? "Expand card" : "Collapse card"}
            aria-expanded={!collapsed}
            onClick={toggleCollapse}
          >
            {collapsed ? (
              <ChevronRight className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </Button>
          <StatusBadge node={node} className="shrink-0" />
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Switch
            size="sm"
            checked={node.item.active}
            onCheckedChange={handleToggleActive}
            aria-label="Active"
            disabled={!perms.toggleActive}
          />
          {ctx.showEditButton ? (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "size-6",
                isInlineActive && "bg-muted text-foreground",
              )}
              aria-label={ctx.editable ? "Toggle inline edit" : "Edit"}
              aria-haspopup={ctx.editable ? undefined : "dialog"}
              aria-pressed={ctx.editable ? isInlineActive : undefined}
              disabled={!perms.edit}
              onClick={handlePrimaryEdit}
            >
              <Pencil className="size-3.5" />
            </Button>
          ) : null}
          {ctx.showEditButton && ctx.editable ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              aria-label="Edit in dialog"
              disabled={!perms.edit}
              onClick={() => tryOpenEdit("popup")}
            >
              <PanelTop className="size-3.5" />
            </Button>
          ) : null}
          <ActionMenu node={node} onOverrideColor={onOverrideColor} />
        </div>
      </div>
      {/* row 2 — title, always readable (wraps up to 3 lines, never truncates to 0). */}
      <h3 className="line-clamp-3 text-sm font-medium leading-snug text-foreground">
        {node.item.name}
      </h3>
      {/* row 3 — priority + labels (renders nothing when the item has neither). */}
      <CardMeta item={node.item} />
    </header>
  );
}
