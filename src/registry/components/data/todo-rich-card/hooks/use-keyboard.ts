"use client";

/**
 * Root-level keyboard bindings:
 *   - Cmd/Ctrl + C  → copy focused card
 *   - Cmd/Ctrl + V  → paste from clipboard as child of focused card
 *   - Enter / Space → open default edit affordance on focused card
 *   - Escape        → close edit
 *
 * Attached to the root section via onKeyDown.
 */

import { useCallback } from "react";
import { copyToClipboard, readFromClipboard } from "../lib/json-io";
import { findNode } from "../lib/normalize";
import type {
  Action,
  EditState,
  ResolvedPermissions,
  TodoNode,
  TodoPermissionReason,
  TodoPermissionRule,
} from "../types";

type Args = {
  rootNode: TodoNode;
  focusedId: string | null;
  editState: EditState;
  editable: boolean;
  dispatch: (action: Action) => void;
  resolvePermissions: (node: TodoNode) => ResolvedPermissions;
  fireCopy: (payload: { itemId: string; payload: import("../types").TodoItem }) => void;
  firePaste: (payload: { parentId: string; payload: import("../types").TodoItem }) => void;
  fireItemAdded: (payload: { parentId: string; item: import("../types").TodoItem }) => void;
  fireEditRequest: (payload: { itemId: string; mode: "popup" | "inline" }) => void;
  reportPermissionDenied: (
    action: keyof TodoPermissionRule,
    itemId: string,
    reason: TodoPermissionReason,
  ) => void;
};

export function useKeyboard(args: Args) {
  const handler = useCallback(
    async (e: React.KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName;
      const editingInForm =
        targetTag === "INPUT" ||
        targetTag === "TEXTAREA" ||
        (e.target as HTMLElement)?.isContentEditable;

      // Escape always works to close edit, even from within a form field.
      if (e.key === "Escape" && args.editState.kind !== "view") {
        args.dispatch({ type: "close-edit" });
        e.stopPropagation();
        return;
      }

      // Don't intercept other shortcuts when typing in a form.
      if (editingInForm) return;

      const focusedNode = args.focusedId
        ? findNode(args.rootNode, args.focusedId)
        : null;
      if (!focusedNode) return;

      const mod = e.ctrlKey || e.metaKey;

      // Cmd/Ctrl + C
      if (mod && (e.key === "c" || e.key === "C")) {
        try {
          await copyToClipboard(focusedNode.item);
          args.fireCopy({ itemId: focusedNode.item.id, payload: focusedNode.item });
        } catch {
          // browser blocked or unavailable — swallow
        }
        return;
      }

      // Cmd/Ctrl + V
      if (mod && (e.key === "v" || e.key === "V")) {
        const perms = args.resolvePermissions(focusedNode);
        if (!perms.addChildren) {
          args.reportPermissionDenied("addChildren", focusedNode.item.id, perms.reason);
          return;
        }
        const payload = await readFromClipboard();
        if (!payload) return;
        args.dispatch({
          type: "add-child",
          parentId: focusedNode.item.id,
          item: payload,
        });
        args.firePaste({ parentId: focusedNode.item.id, payload });
        args.fireItemAdded({ parentId: focusedNode.item.id, item: payload });
        return;
      }

      // Enter / Space → open edit
      if (e.key === "Enter" || e.key === " ") {
        const perms = args.resolvePermissions(focusedNode);
        if (!perms.edit) {
          args.reportPermissionDenied("edit", focusedNode.item.id, perms.reason);
          return;
        }
        e.preventDefault();
        const mode: "popup" | "inline" = args.editable ? "inline" : "popup";
        args.dispatch({ type: "open-edit", itemId: focusedNode.item.id, mode });
        args.fireEditRequest({ itemId: focusedNode.item.id, mode });
      }
    },
    [args],
  );

  return handler;
}
