"use client";

import {
  ClipboardPaste,
  Copy,
  Edit3,
  Lock,
  MoreHorizontal,
  Palette,
  PanelTop,
  PowerOff,
  Trash2,
  Unlock,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCardContext } from "../hooks/use-card-context";
import { copyToClipboard, readFromClipboard, serialize } from "../lib/json-io";
import type { TodoNode } from "../types";

export function ActionMenu({
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

  async function handleCopy() {
    try {
      await copyToClipboard(node.item);
      ctx.fireEvent("copy", { itemId: id, payload: node.item });
    } catch (err) {
      // Clipboard rejected (permissions, browser). Fall back to a text/plain write attempt.
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(serialize(node.item));
        ctx.fireEvent("copy", { itemId: id, payload: node.item });
      } else {
        console.warn("[todo-rich-card] copy failed", err);
      }
    }
  }

  async function handlePaste() {
    if (!perms.addChildren) {
      ctx.reportPermissionDenied("addChildren", id, perms.reason);
      return;
    }
    const payload = await readFromClipboard();
    if (!payload) return;
    ctx.dispatch({ type: "add-child", parentId: id, item: payload });
    ctx.fireEvent("paste", { parentId: id, payload });
    ctx.fireEvent("itemAdded", { parentId: id, item: payload });
  }

  function handleToggleActive() {
    if (!perms.toggleActive) {
      ctx.reportPermissionDenied("toggleActive", id, perms.reason);
      return;
    }
    const oldActive = node.item.active;
    ctx.dispatch({ type: "toggle-active", itemId: id });
    ctx.fireEvent("activeToggled", {
      itemId: id,
      oldActive,
      newActive: !oldActive,
    });
    ctx.fireEvent("fieldEdited", {
      itemId: id,
      key: "active",
      oldValue: oldActive,
      newValue: !oldActive,
    });
  }

  function handleToggleLocked() {
    const oldLocked = Boolean(node.item.locked);
    ctx.dispatch({ type: "set-locked", itemId: id, locked: !oldLocked });
    ctx.fireEvent("lockedToggled", {
      itemId: id,
      oldLocked,
      newLocked: !oldLocked,
    });
  }

  function handleRemove() {
    if (!perms.remove) {
      ctx.reportPermissionDenied("remove", id, perms.reason);
      return;
    }
    ctx.dispatch({ type: "remove-item", itemId: id });
    ctx.fireEvent("itemRemoved", {
      itemId: id,
      removed: node.item,
      parentId: node.parentId ?? id,
    });
  }

  function handleOverrideColor() {
    if (!perms.overrideColor) {
      ctx.reportPermissionDenied("overrideColor", id, perms.reason);
      return;
    }
    onOverrideColor();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          aria-label="Card actions"
        >
          <MoreHorizontal className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          disabled={!perms.edit}
          onClick={() => tryOpenEdit(ctx.editable ? "inline" : "popup")}
        >
          <Edit3 className="mr-2 size-4" />
          {ctx.editable && isInlineActive ? "Close inline edit" : "Edit"}
        </DropdownMenuItem>
        {ctx.editable ? (
          <DropdownMenuItem
            disabled={!perms.edit}
            onClick={() => tryOpenEdit("popup")}
          >
            <PanelTop className="mr-2 size-4" />
            Edit in dialog…
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopy}>
          <Copy className="mr-2 size-4" />
          Copy
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!perms.addChildren}
          onClick={handlePaste}
        >
          <ClipboardPaste className="mr-2 size-4" />
          Paste as child
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!perms.toggleActive}
          onClick={handleToggleActive}
        >
          {node.item.active ? (
            <>
              <PowerOff className="mr-2 size-4" />
              Deactivate
            </>
          ) : (
            <>
              <Zap className="mr-2 size-4" />
              Activate
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleToggleLocked}>
          {node.item.locked ? (
            <>
              <Unlock className="mr-2 size-4" />
              Unlock
            </>
          ) : (
            <>
              <Lock className="mr-2 size-4" />
              Lock
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!perms.overrideColor}
          onClick={handleOverrideColor}
        >
          <Palette className="mr-2 size-4" />
          Override color…
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!perms.remove}
          onClick={handleRemove}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 size-4" />
          Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
