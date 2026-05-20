"use client";

import { ChevronDown, ChevronRight, PanelTop, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useCardContext } from "../hooks/use-card-context";
import type { TodoNode } from "../types";
import { ActionMenu } from "./action-menu";
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
    ctx.dispatch({ type: "open-edit", itemId: id, mode });
    ctx.fireEvent("editRequest", { itemId: id, mode });
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
    <header className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
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
        <h3 className="truncate font-medium text-foreground">{node.item.name}</h3>
        <StatusBadge status={node.item.status} />
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Switch
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
              "size-7",
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
            className="size-7"
            aria-label="Edit in dialog"
            disabled={!perms.edit}
            onClick={() => tryOpenEdit("popup")}
          >
            <PanelTop className="size-3.5" />
          </Button>
        ) : null}
        <ActionMenu node={node} onOverrideColor={onOverrideColor} />
      </div>
    </header>
  );
}
