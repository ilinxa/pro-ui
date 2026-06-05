"use client";

import {
  FlowCanvas,
  PortsAt,
} from "@/registry/components/data/flow-canvas-01";
import type {
  CanvasData,
  NodeRenderer,
} from "@/registry/components/data/flow-canvas-01";
import {
  STARTER_CANVAS,
  validateCanvasData,
} from "../_lib/flow-canvas-schema";
import { JsonPlayground } from "./json-playground";

// ── Module-scope renderers (CRITICAL — xyflow-react-pro: recreating the
//    renderer map in render triggers teardown + remount every frame). The
//    built-in custom-JSON fallback auto-merges, so any unknown `__type` still
//    renders. ──────────────────────────────────────────────────────────────
const cardRenderer: NodeRenderer = {
  type: "card",
  label: "Card",
  defaultPorts: () => [
    { id: "in", side: "left", dir: "in", type: "text" },
    { id: "out", side: "right", dir: "out", type: "text" },
  ],
  render: (data) => {
    const d = data as { title?: string; body?: string };
    return (
      <div className="relative w-52 rounded-md border border-border bg-card p-3 text-card-foreground shadow-sm">
        <div className="mb-1 text-xs font-semibold text-foreground">
          {d.title ?? "Card"}
        </div>
        {d.body ? (
          <div className="text-[11px] leading-snug text-muted-foreground">
            {d.body}
          </div>
        ) : null}
        <PortsAt ports={data.ports} position="left" />
        <PortsAt ports={data.ports} position="right" />
      </div>
    );
  },
};

const FLOW_RENDERERS: NodeRenderer[] = [cardRenderer];

export function FlowCanvasPlayground() {
  return (
    <JsonPlayground<CanvasData>
      starter={STARTER_CANVAS}
      editorLabel="CanvasData · JSON"
      validate={validateCanvasData}
      renderPreview={(data) => (
        // xyflow needs an explicitly-sized parent.
        <div className="h-[28rem] w-full overflow-hidden rounded-lg border border-border">
          <FlowCanvas renderers={FLOW_RENDERERS} defaultData={data} />
        </div>
      )}
    />
  );
}
