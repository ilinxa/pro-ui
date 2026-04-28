"use client";

import { useEffect, useState } from "react";
import {
  ClockIcon,
  HashIcon,
  NotebookIcon,
  TableIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAreaContext } from "./hooks/use-area-context";
import { Workspace } from "./workspace";
import {
  DEMO_INITIAL_LAYOUT,
  DEMO_PRESETS,
  DEMO_TABLE_ROWS,
  type DemoTableRow,
} from "./dummy-data";
import type { WorkspaceComponent } from "./types";

function NotesPanel() {
  const [text, setText] = useState(
    "Take notes here. State persists across resize and split — try resizing the area or splitting it from a corner.",
  );
  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-0 flex-1 resize-none rounded-md border border-border bg-background p-2 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <p className="text-[10px] text-muted-foreground">
        {text.length} characters
      </p>
    </div>
  );
}

function ClockPanel() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const ctx = useAreaContext();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-3">
      <span className="font-mono text-3xl tabular-nums text-foreground">
        {now.toLocaleTimeString()}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {ctx.width.toFixed(0)} × {ctx.height.toFixed(0)} px
      </span>
    </div>
  );
}

function CounterPanel() {
  const [count, setCount] = useState(0);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-3">
      <span className="font-mono text-4xl tabular-nums text-foreground">
        {count}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setCount((c) => c - 1)}
          className="rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => setCount(0)}
          className="rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          reset
        </button>
        <button
          type="button"
          onClick={() => setCount((c) => c + 1)}
          className="rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          +
        </button>
      </div>
      <p className="max-w-56 text-center text-[10px] text-muted-foreground">
        Increment, then split this area from a corner — the original keeps its
        count, the new sibling starts at 0.
      </p>
    </div>
  );
}

function statusVariant(
  status: DemoTableRow["status"],
): "default" | "secondary" | "destructive" {
  if (status === "Done") return "default";
  if (status === "In progress") return "secondary";
  return "destructive";
}

function TablePanel() {
  return (
    <div className="flex h-full flex-col p-3">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-1 pr-2 font-medium">Task</th>
            <th className="py-1 pr-2 font-medium">Owner</th>
            <th className="py-1 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {DEMO_TABLE_ROWS.map((row) => (
            <tr key={row.id} className="border-b border-border/60 last:border-0">
              <td className="py-1.5 pr-2 text-foreground">{row.task}</td>
              <td className="py-1.5 pr-2 text-muted-foreground">{row.owner}</td>
              <td className="py-1.5">
                <Badge variant={statusVariant(row.status)} className="text-[10px]">
                  {row.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const components: WorkspaceComponent[] = [
  {
    id: "notes",
    name: "Notes",
    category: "Tools",
    icon: <NotebookIcon className="size-3" />,
    render: () => <NotesPanel />,
  },
  {
    id: "clock",
    name: "Clock",
    category: "Tools",
    icon: <ClockIcon className="size-3" />,
    render: () => <ClockPanel />,
  },
  {
    id: "counter",
    name: "Counter",
    category: "Tools",
    icon: <HashIcon className="size-3" />,
    render: () => <CounterPanel />,
  },
  {
    id: "data-table",
    name: "Data Table",
    category: "Data",
    icon: <TableIcon className="size-3" />,
    render: () => <TablePanel />,
  },
];

export default function WorkspaceDemo() {
  return (
    <div className="h-140 w-full">
      <Workspace
        components={components}
        defaultComponentId="notes"
        defaultLayout={DEMO_INITIAL_LAYOUT}
        presets={DEMO_PRESETS}
        aria-label="Workspace demo"
      />
    </div>
  );
}
