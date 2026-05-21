"use client";

import {
  forwardRef,
  useCallback,
  useRef,
  useState,
  type Ref,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { TodoRichCard } from "../todo-rich-card/todo-rich-card";
import type { TodoItem } from "../todo-rich-card/types";
import { TodoTree } from "./todo-tree";
import type {
  TodoTreeHandle,
  TodoTreeItemEvent,
  TodoTreeProps,
} from "./types";
import { updateById } from "./lib/tree-mutators";

/**
 * Convenience wrapper that pairs `<TodoTree>` with a `<TodoRichCard>` edit
 * dialog. Clicking a row opens the matching card in a modal; live-saves
 * propagate back into the tree via the tree's imperative handle (Q-P1 lock
 * — wrapper auto-persists).
 *
 * Architecture:
 *   - Wrapper is STATE-TRANSPARENT. Consumer's value / defaultValue /
 *     onChange flow through to TodoTree unmodified. The wrapper owns only
 *     the edit-dialog open state. Controlled-mode consumers stay
 *     authoritative; uncontrolled-mode keeps TodoTree's internal state.
 *   - Edits inside the dialog route through the tree's handle.setValue,
 *     which dispatches SET_ITEMS internally and fires onChange — so
 *     controlled consumers see the change via their normal onChange path.
 *   - Outer ref is forwarded via a callback ref so the consumer's
 *     ref.current stays in sync as the inner handle identity changes
 *     across renders (it changes whenever state.items mutates because
 *     TodoTreeStateValue is rebuilt). useImperativeHandle would freeze
 *     to the initial handle.
 *
 * Consumers that want a stricter integration (confirm dialog before edit,
 * custom editor surface) should compose <TodoTree> + their own dialog
 * using the onItemClick callback.
 */
export const TodoTreeWithEditor = forwardRef<TodoTreeHandle, TodoTreeProps>(
  function TodoTreeWithEditor(props, ref) {
    const { onItemClick: onItemClickProp, ...rest } = props;

    const treeRef = useRef<TodoTreeHandle | null>(null);
    const [editTarget, setEditTarget] = useState<TodoItem | null>(null);

    // Callback ref — fires whenever the inner TodoTree's handle reference
    // changes. Forwards to both internal treeRef and the outer consumer ref.
    const setTreeRef = useCallback(
      (handle: TodoTreeHandle | null) => {
        treeRef.current = handle;
        forwardRefValue(ref, handle);
      },
      [ref],
    );

    const handleRowClick = useCallback(
      (args: TodoTreeItemEvent) => {
        setEditTarget(args.item);
        onItemClickProp?.(args);
      },
      [onItemClickProp],
    );

    const handleEditedItemChange = useCallback((updated: TodoItem) => {
      const handle = treeRef.current;
      if (!handle) return;
      const current = handle.getValue();
      const next = updateById(current, updated.id, () => updated);
      handle.setValue(next);
      // Keep the dialog's local editTarget reference in sync so the title
      // tracks renames. Doesn't re-init TodoRichCard (defaultValue is
      // uncontrolled — already-rendered card ignores the prop change).
      setEditTarget(updated);
    }, []);

    return (
      <>
        <TodoTree
          {...rest}
          ref={setTreeRef}
          onItemClick={handleRowClick}
        />
        <Dialog
          open={!!editTarget}
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogTitle className="sr-only">
              {editTarget ? `Edit ${editTarget.name}` : "Edit task"}
            </DialogTitle>
            {editTarget && (
              <TodoRichCard
                editable
                defaultValue={editTarget}
                onChange={handleEditedItemChange}
              />
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  },
);

function forwardRefValue<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (!ref) return;
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  // RefObject — assign current.
  (ref as { current: T | null }).current = value;
}
