"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { TodoTree } from "./todo-tree";
import { TodoTreeWithEditor } from "./todo-tree-with-editor";
import {
  TODO_TREE_DEMO_ITEMS,
  TODO_TREE_DEMO_STATUS_OPTIONS,
} from "./dummy-data";
import type { TodoItem } from "../todo-rich-card/types";
import type { TodoTreeHandle } from "./types";

export default function TodoTreeDemo() {
  return (
    <div className="space-y-10">
      <DemoSection
        title="1 — Default tree"
        description="Out-of-the-box behaviour: toolbar (search + sort + filter + bulk), recursive children, dot status indicator, click to select, Cmd-A to select all visible, Cmd/Ctrl-click to toggle, Shift-click to range-select, drag-from-grip to reorder, Delete to remove the focused row."
      >
        <div className="h-105 overflow-hidden rounded-md border border-border bg-card">
          <TodoTree
            defaultValue={TODO_TREE_DEMO_ITEMS}
            statusOptions={TODO_TREE_DEMO_STATUS_OPTIONS}
            aria-label="Q3 planning tasks"
          />
        </div>
      </DemoSection>

      <DemoSection
        title="2 — With editor (TodoTreeWithEditor)"
        description="Convenience wrapper. Clicking a row opens a Dialog containing the matching TodoRichCard in editable mode; live-saves propagate back into the tree."
      >
        <div className="h-105 overflow-hidden rounded-md border border-border bg-card">
          <TodoTreeWithEditor
            defaultValue={TODO_TREE_DEMO_ITEMS}
            statusOptions={TODO_TREE_DEMO_STATUS_OPTIONS}
            aria-label="Q3 planning tasks (editor)"
          />
        </div>
      </DemoSection>

      <DemoSection
        title="3 — Strip status indicator + larger indent"
        description="The status indicator can render as a left-edge color strip (variant=strip) instead of the default dot. Combined with a wider indent for hierarchical scanning."
      >
        <div className="h-105 overflow-hidden rounded-md border border-border bg-card">
          <TodoTree
            defaultValue={TODO_TREE_DEMO_ITEMS}
            statusOptions={TODO_TREE_DEMO_STATUS_OPTIONS}
            statusIndicator="strip"
            indentSize={28}
          />
        </div>
      </DemoSection>

      <DemoSection
        title="4 — Filter mode: hide (VSCode-style)"
        description="When filterMode='hide', non-matching rows are omitted entirely; ancestors-of-match still render so the result keeps tree context. Try the search input."
      >
        <div className="h-105 overflow-hidden rounded-md border border-border bg-card">
          <TodoTree
            defaultValue={TODO_TREE_DEMO_ITEMS}
            statusOptions={TODO_TREE_DEMO_STATUS_OPTIONS}
            filterMode="hide"
          />
        </div>
      </DemoSection>

      <DemoSection
        title="5 — Controlled + onChange logger"
        description="The tree is controlled via `value` + `onChange`. Every mutation routes through the consumer's reducer. Watch the live log for each event's `reason` field."
      >
        <ControlledLoggerDemo />
      </DemoSection>

      <DemoSection
        title="6 — Imperative handle"
        description="Programmatic access via ref. Buttons drive the tree from outside its UI."
      >
        <ImperativeHandleDemo />
      </DemoSection>

      <DemoSection
        title="7 — Custom row renderer"
        description="Slot prop replaces the default row paint while keeping all DnD + click + drop-indicator wiring intact. `defaultRender` is available if you want to wrap rather than replace."
      >
        <div className="h-105 overflow-hidden rounded-md border border-border bg-card">
          <TodoTree
            defaultValue={TODO_TREE_DEMO_ITEMS}
            statusOptions={TODO_TREE_DEMO_STATUS_OPTIONS}
            renderRow={({ item, level, isSelected }) => (
              <div
                className={`flex items-center gap-2 px-3 py-2 text-sm ${
                  isSelected ? "bg-primary/10" : ""
                }`}
                style={{ paddingInlineStart: 8 + level * 20 }}
              >
                <span className="font-mono text-xs text-muted-foreground">
                  #{level}
                </span>
                <span className="font-medium">{item.name}</span>
                {item.targetPerson && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {item.targetPerson.name}
                  </span>
                )}
              </div>
            )}
          />
        </div>
      </DemoSection>
    </div>
  );
}

function DemoSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      {children}
    </section>
  );
}

function ControlledLoggerDemo() {
  const [items, setItems] = useState<TodoItem[]>(TODO_TREE_DEMO_ITEMS);
  const [log, setLog] = useState<string[]>([]);

  const append = (line: string) => {
    setLog((prev) => [line, ...prev].slice(0, 8));
  };

  return (
    <div className="grid gap-3 md:grid-cols-[1fr_280px]">
      <div className="h-105 overflow-hidden rounded-md border border-border bg-card">
        <TodoTree
          value={items}
          onChange={(args) => {
            setItems(args.items);
            append(`onChange · reason=${args.reason}`);
          }}
          statusOptions={TODO_TREE_DEMO_STATUS_OPTIONS}
          onActiveToggled={({ item, nextActive }) =>
            append(`active · ${item.name} → ${nextActive ? "on" : "off"}`)
          }
          onItemMoved={({ item, to }) =>
            append(`moved · ${item.name} → ${to.parentId ?? "root"}/${to.index}`)
          }
        />
      </div>
      <div className="rounded-md border border-border bg-card p-3 text-xs">
        <div className="mb-2 font-semibold text-foreground">Event log</div>
        {log.length === 0 ? (
          <div className="text-muted-foreground">
            Interact with the tree to see events here.
          </div>
        ) : (
          <ul className="space-y-1 font-mono text-[11px]">
            {log.map((line, i) => (
              <li key={i} className="text-muted-foreground">
                {line}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ImperativeHandleDemo() {
  const ref = useRef<TodoTreeHandle>(null);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => ref.current?.expandAll()}>
          Expand all
        </Button>
        <Button size="sm" onClick={() => ref.current?.collapseAll()}>
          Collapse all
        </Button>
        <Button size="sm" onClick={() => ref.current?.selectAll()}>
          Select all visible
        </Button>
        <Button size="sm" onClick={() => ref.current?.clearSelection()}>
          Clear selection
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => ref.current?.setQuery("review")}
        >
          Search &ldquo;review&rdquo;
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => ref.current?.clearAllFilters()}
        >
          Clear search + filter
        </Button>
      </div>
      <div className="h-105 overflow-hidden rounded-md border border-border bg-card">
        <TodoTree
          ref={ref}
          defaultValue={TODO_TREE_DEMO_ITEMS}
          statusOptions={TODO_TREE_DEMO_STATUS_OPTIONS}
        />
      </div>
    </div>
  );
}
