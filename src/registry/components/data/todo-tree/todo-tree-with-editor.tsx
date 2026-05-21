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
import { Button } from "@/components/ui/button";
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
 * dialog. Two modes the dialog enters:
 *
 *   - EDIT existing item — fired by row click. Live-edit semantics: each
 *     keystroke / field change propagates straight back into the tree via
 *     `handle.setValue`. Closing the dialog (X, overlay, Escape) just
 *     dismisses; changes are already saved.
 *
 *   - CREATE new item — fired by the toolbar "+ New" button (via the
 *     deferred-commit `onCreateRequest` hook). The dialog opens on a
 *     PENDING item that is NOT yet in the tree. Edits inside the dialog
 *     mutate only the local pending state. Submit commits via
 *     `handle.addItem` and closes; Cancel / Escape / overlay discards the
 *     pending item entirely.
 *
 * Architecture:
 *   - Wrapper is STATE-TRANSPARENT. Consumer's value / defaultValue /
 *     onChange flow through to TodoTree unmodified. The wrapper owns only
 *     the dialog's open + pending state.
 *   - The two dialog modes are distinguished by `pending` state. When
 *     `pending` is true, onChange does NOT touch the tree — it only
 *     updates the local `editTarget`. The footer's Submit button is the
 *     single commit point.
 *   - Outer ref is forwarded via a callback ref so the consumer's
 *     ref.current stays in sync as the inner handle identity changes
 *     across renders (it changes whenever state.items mutates because
 *     TodoTreeStateValue is rebuilt). useImperativeHandle would freeze
 *     to the initial handle.
 *
 * Consumers that want a stricter integration (confirm dialog before edit,
 * custom editor surface) should compose <TodoTree> + their own dialog
 * using the onItemClick / onCreateRequest callbacks.
 */
export const TodoTreeWithEditor = forwardRef<TodoTreeHandle, TodoTreeProps>(
  function TodoTreeWithEditor(props, ref) {
    const { onItemClick: onItemClickProp, ...rest } = props;

    const treeRef = useRef<TodoTreeHandle | null>(null);
    const [editTarget, setEditTarget] = useState<TodoItem | null>(null);
    // True when editTarget represents a not-yet-committed new row.
    const [pending, setPending] = useState(false);

    // Callback ref — fires whenever the inner TodoTree's handle reference
    // changes. Forwards to both internal treeRef and the outer consumer ref.
    const setTreeRef = useCallback(
      (handle: TodoTreeHandle | null) => {
        treeRef.current = handle;
        forwardRefValue(ref, handle);
      },
      [ref],
    );

    // Radix Dialog flips `aria-hidden="true"` on the surrounding tree
     // wrapper the instant `open` becomes truthy. If a focused element
     // (the clicked row, the "+ New" button, etc.) is still inside that
     // wrapper at that moment, the browser logs an a11y warning because
     // a focused descendant of an aria-hidden ancestor is illegal. Blur
     // the active element before flipping our open state; Radix's
     // dialog auto-focus then takes over on the next tick.
    const blurActiveElement = useCallback(() => {
      if (typeof document === "undefined") return;
      const el = document.activeElement;
      if (el instanceof HTMLElement) el.blur();
    }, []);

    const handleRowClick = useCallback(
      (args: TodoTreeItemEvent) => {
        blurActiveElement();
        setEditTarget(args.item);
        setPending(false);
        onItemClickProp?.(args);
      },
      [onItemClickProp, blurActiveElement],
    );

    const handleCreateRequest = useCallback(
      (draft: TodoItem) => {
        blurActiveElement();
        // Open the dialog on the pending item; do NOT add to the tree yet —
        // commit happens on Submit.
        setEditTarget(draft);
        setPending(true);
      },
      [blurActiveElement],
    );

    const handleEditedItemChange = useCallback(
      (updated: TodoItem) => {
        // Always track the latest in-dialog state so the title + Submit
        // payload reflect user edits.
        setEditTarget(updated);
        if (pending) {
          // Pending mode — defer tree mutation until Submit.
          return;
        }
        // Edit-existing mode — propagate every change to the tree.
        const handle = treeRef.current;
        if (!handle) return;
        const current = handle.getValue();
        const next = updateById(current, updated.id, () => updated);
        handle.setValue(next);
      },
      [pending],
    );

    const closeDialog = useCallback(() => {
      setEditTarget(null);
      setPending(false);
    }, []);

    const handleSubmitPending = useCallback(() => {
      if (!pending || !editTarget) return;
      const handle = treeRef.current;
      if (!handle) {
        closeDialog();
        return;
      }
      handle.addItem(editTarget);
      // Focus the newly-committed row so arrow-keys continue from it.
      handle.focusItem(editTarget.id);
      closeDialog();
    }, [pending, editTarget, closeDialog]);

    return (
      <>
        <TodoTree
          editable
          {...rest}
          ref={setTreeRef}
          onItemClick={handleRowClick}
          onCreateRequest={handleCreateRequest}
        />
        <Dialog
          open={!!editTarget}
          onOpenChange={(open) => {
            // Any close path (X, Escape, overlay) in pending mode = discard.
            if (!open) closeDialog();
          }}
        >
          <DialogContent
            aria-describedby={undefined}
            className="flex max-h-[calc(100dvh-2rem)] max-w-252 flex-col overflow-hidden"
          >
            <DialogTitle className="sr-only">
              {pending
                ? "New task"
                : editTarget
                  ? `Edit ${editTarget.name}`
                  : "Edit task"}
            </DialogTitle>
            {editTarget && (
              <>
                <div className="-mx-4 -mt-4 min-h-0 flex-1 overflow-y-auto p-4">
                  <TodoRichCard
                    // Remount when the target id changes so TodoRichCard's
                    // uncontrolled defaultValue picks up the new payload.
                    key={editTarget.id}
                    editable
                    defaultValue={editTarget}
                    onChange={handleEditedItemChange}
                  />
                </div>
                {pending && (
                  <div className="-mx-4 -mb-4 flex items-center justify-end gap-2 border-t border-border bg-muted/40 px-4 py-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={closeDialog}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSubmitPending}
                    >
                      Add task
                    </Button>
                  </div>
                )}
              </>
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
