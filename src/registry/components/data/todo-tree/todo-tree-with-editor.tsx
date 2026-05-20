"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
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
  TodoTreeChangeArgs,
  TodoTreeHandle,
  TodoTreeItemEvent,
  TodoTreeProps,
} from "./types";
import { updateById } from "./lib/tree-mutators";

/**
 * Convenience wrapper that pairs `<TodoTree>` with a `<TodoRichCard>` edit
 * dialog. Clicking a row opens the matching card in a modal; live-saves
 * propagate back into the tree (Q-P1 lock — wrapper auto-persists).
 *
 * Composition rules:
 *   - Owns its own `items` state seeded from value/defaultValue. The outer
 *     <TodoTree> is rendered in controlled mode.
 *   - Forwards the consumer's onChange (post-mutation, including edits).
 *   - Forwards the consumer's onItemClick AFTER opening the dialog so the
 *     consumer can still react to row clicks (e.g., analytics).
 *   - Forwards the imperative handle ref so consumer code can drive the
 *     wrapped tree directly.
 *
 * Consumers that want a stricter integration (e.g., gate edits with a
 * confirm dialog) should compose <TodoTree> + their own dialog instead.
 */
export const TodoTreeWithEditor = forwardRef<TodoTreeHandle, TodoTreeProps>(
  function TodoTreeWithEditor(props, ref) {
    // Destructure the callbacks we wrap, then keep the rest for `{...rest}`
    // pass-through. Avoids the "useCallback depends on props" lint hit.
    const {
      value: propValue,
      defaultValue: propDefaultValue,
      onChange: onChangeProp,
      onItemClick: onItemClickProp,
      ...rest
    } = props;

    const initialItems = propValue ?? propDefaultValue ?? [];
    const [items, setItems] = useState<TodoItem[]>(initialItems);
    const [editTarget, setEditTarget] = useState<TodoItem | null>(null);
    const treeRef = useRef<TodoTreeHandle | null>(null);

    useImperativeHandle(ref, () => treeRef.current as TodoTreeHandle, []);

    const handleTreeChange = useCallback(
      (args: TodoTreeChangeArgs) => {
        setItems(args.items);
        onChangeProp?.(args);
      },
      [onChangeProp],
    );

    const handleRowClick = useCallback(
      (args: TodoTreeItemEvent) => {
        setEditTarget(args.item);
        onItemClickProp?.(args);
      },
      [onItemClickProp],
    );

    const handleEditedItemChange = useCallback(
      (updated: TodoItem) => {
        setItems((prev) => updateById(prev, updated.id, () => updated));
        setEditTarget(updated);
      },
      [],
    );

    return (
      <>
        <TodoTree
          {...rest}
          ref={treeRef}
          value={items}
          onChange={handleTreeChange}
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
              {editTarget ? `Edit "${editTarget.name}"` : "Edit task"}
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
