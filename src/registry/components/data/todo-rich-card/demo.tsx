"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TodoRichCard } from "./todo-rich-card";
import {
  DEMO_ITEMS,
  DEMO_NOW,
  DEMO_STATUS_OPTIONS,
  FRESH_TASK,
  NESTED_FAMILY,
  OVERDUE_TASK,
  URGENT_TASK,
} from "./dummy-data";
import type { TodoColorRampPreset } from "./types";

const RAMPS: TodoColorRampPreset[] = ["default", "muted", "vivid", "monochrome"];

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

      <p className="text-xs text-muted-foreground">
        {`${DEMO_ITEMS.length} demos · click the pencil icon (or the action menu) to edit · Cmd/Ctrl+C / Cmd/Ctrl+V on a focused card copies / pastes as child · drag a card onto another's children area to paste.`}
      </p>
    </div>
  );
}
