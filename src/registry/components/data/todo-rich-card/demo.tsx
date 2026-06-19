"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TodoRichCard } from "./todo-rich-card";
import { todoRichCardKanbanRenderer } from "./parts/kanban-adapter";
import {
  BLOCKED_TASK,
  DEMO_ITEMS,
  DEMO_LABEL_OPTIONS,
  DEMO_NOW,
  DEMO_PRIORITY_OPTIONS,
  DEMO_STATUS_OPTIONS,
  DEMO_STATUS_OPTIONS_TONED,
  DONE_TASK,
  FRESH_TASK,
  NESTED_FAMILY,
  OVERDUE_TASK,
  PRIORITIZED_TASK,
  URGENT_TASK,
} from "./dummy-data";
import type { TodoColorRampPreset, TodoItem } from "./types";
import {
  KanbanBoard,
  kanbanCardRenderer,
  kanbanNoteRenderer,
  type KanbanData,
} from "@/registry/components/data/kanban-board-01";

const RAMPS: TodoColorRampPreset[] = ["default", "muted", "vivid", "monochrome"];

const KANBAN_INITIAL: KanbanData = {
  swimlanes: [],
  columns: [
    {
      id: "col-todo",
      title: "To do",
      color: "slate",
      items: [
        {
          id: `kanban-${FRESH_TASK.id}`,
          rendererId: "todo-rich-card",
          data: FRESH_TASK satisfies TodoItem,
        },
      ],
    },
    {
      id: "col-doing",
      title: "In progress",
      color: "lime",
      items: [
        {
          id: `kanban-${URGENT_TASK.id}`,
          rendererId: "todo-rich-card",
          data: URGENT_TASK satisfies TodoItem,
        },
        {
          id: "kanban-note-1",
          rendererId: "kanban-note",
          data: {
            title: "Demo note",
            body: "Note + todo renderers co-exist on the same board. Grab a todo card anywhere to drag it (shell-drag), and drop it anywhere in a column. The card body keeps full edit / collapse semantics.",
          },
        },
      ],
    },
    {
      id: "col-done",
      title: "Done",
      color: "emerald",
      items: [
        {
          id: `kanban-${OVERDUE_TASK.id}`,
          rendererId: "todo-rich-card",
          data: OVERDUE_TASK satisfies TodoItem,
        },
      ],
    },
  ],
};

export default function TodoRichCardDemo() {
  const [editable, setEditable] = useState(false);
  const [ramp, setRamp] = useState<TodoColorRampPreset>("default");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-muted/40 p-3 text-sm">
        <Label htmlFor="editable" className="flex items-center gap-2">
          <Switch
            id="editable"
            checked={editable}
            onCheckedChange={setEditable}
          />
          editable (inline-toggle mode)
        </Label>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Ramp:</span>
          <div className="flex gap-1">
            {RAMPS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRamp(r)}
                className={
                  "rounded border px-2 py-0.5 text-xs " +
                  (ramp === r
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card hover:bg-muted")
                }
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Demo clock frozen at {DEMO_NOW.toISOString()} so the border colors
          stay deterministic.
        </p>
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Fresh task — early ramp (green)</h3>
        <TodoRichCard
          defaultValue={FRESH_TASK}
          editable={editable}
          colorRamp={ramp}
          now={DEMO_NOW}
          statusOptions={DEMO_STATUS_OPTIONS}
        />
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Urgent task — late ramp (orange/red)</h3>
        <TodoRichCard
          defaultValue={URGENT_TASK}
          editable={editable}
          colorRamp={ramp}
          now={DEMO_NOW}
          statusOptions={DEMO_STATUS_OPTIONS}
        />
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Overdue — pinned full red, with images</h3>
        <TodoRichCard
          defaultValue={OVERDUE_TASK}
          editable={editable}
          colorRamp={ramp}
          now={DEMO_NOW}
          statusOptions={DEMO_STATUS_OPTIONS}
        />
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">
          Nested 3-level family — independent per-item dates, locked child, custom override
        </h3>
        <TodoRichCard
          defaultValue={NESTED_FAMILY}
          editable={editable}
          colorRamp={ramp}
          now={DEMO_NOW}
          statusOptions={DEMO_STATUS_OPTIONS}
        />
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">
          v0.3 — priority &amp; labels meta row + status tones
        </h3>
        <p className="text-xs text-muted-foreground">
          The header gains a priority badge + label chips (border/text color only). The{" "}
          <code>done</code> / <code>blocked</code> statuses carry a <code>tone</code> so terminal
          cards get a gray border, a dimmed overlay, and auto-collapse. Turn on{" "}
          <strong>editable</strong> above, then use the status badge (or the overlay&apos;s badge)
          to change status — changing a terminal status clears the overlay.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <TodoRichCard
            defaultValue={PRIORITIZED_TASK}
            editable={editable}
            colorRamp={ramp}
            now={DEMO_NOW}
            statusOptions={DEMO_STATUS_OPTIONS_TONED}
            priorityOptions={DEMO_PRIORITY_OPTIONS}
            labelOptions={DEMO_LABEL_OPTIONS}
          />
          <TodoRichCard
            defaultValue={DONE_TASK}
            editable={editable}
            colorRamp={ramp}
            now={DEMO_NOW}
            statusOptions={DEMO_STATUS_OPTIONS_TONED}
            priorityOptions={DEMO_PRIORITY_OPTIONS}
            labelOptions={DEMO_LABEL_OPTIONS}
          />
          <TodoRichCard
            defaultValue={BLOCKED_TASK}
            editable={editable}
            colorRamp={ramp}
            now={DEMO_NOW}
            statusOptions={DEMO_STATUS_OPTIONS_TONED}
            priorityOptions={DEMO_PRIORITY_OPTIONS}
            labelOptions={DEMO_LABEL_OPTIONS}
          />
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        {`${DEMO_ITEMS.length} demos · click the pencil icon (or the action menu) to edit · Cmd/Ctrl+C / Cmd/Ctrl+V on a focused card copies / pastes as child · drag a card onto another's children area to paste.`}
      </p>

      <section className="space-y-2 pt-4">
        <h3 className="text-sm font-semibold">
          Inside <code>kanban-board-01</code>
        </h3>
        <p className="text-xs text-muted-foreground">
          {`The same TodoRichCard slots into a kanban column via the exported `}
          <code>todoRichCardKanbanRenderer</code>
          {`. Grab a card anywhere to drag it across columns and drop it anywhere in a column; the card body keeps full edit / collapse semantics (renderer's dragHandle:"shell" + canDragItem disabled so the two drag systems don't fight).`}
        </p>
        <KanbanBoard
          renderers={[
            kanbanCardRenderer,
            kanbanNoteRenderer,
            todoRichCardKanbanRenderer,
          ]}
          defaultData={KANBAN_INITIAL}
          aria-label="Todo kanban demo"
        />
      </section>
    </div>
  );
}
