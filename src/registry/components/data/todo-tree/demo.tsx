"use client";

import { TodoTree } from "./todo-tree";
import {
  TODO_TREE_DEMO_ITEMS,
  TODO_TREE_DEMO_STATUS_OPTIONS,
} from "./dummy-data";

export default function TodoTreeDemo() {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-dashed border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">
        <strong>Scaffold preview</strong> — todo-tree is in active
        implementation. The full row layout, toolbar, DnD, virtualization,
        keyboard navigation, and slot props land across commits C2–C8 per the{" "}
        <code>todo-tree-procomp-plan.md</code>.
      </div>
      <TodoTree
        defaultValue={TODO_TREE_DEMO_ITEMS}
        statusOptions={TODO_TREE_DEMO_STATUS_OPTIONS}
        aria-label="Q3 planning tasks"
      />
    </div>
  );
}
