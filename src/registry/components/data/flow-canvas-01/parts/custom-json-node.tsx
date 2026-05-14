"use client";

import { memo, useState } from "react";
import { cn } from "@/lib/utils";
import type { NodeData, NodeRenderer } from "../types";
import { PortsAt } from "./ports-at";

type CustomJsonData = NodeData & { _label?: string };

function deriveLabel(data: CustomJsonData): string {
  if (typeof data._label === "string" && data._label.length > 0) {
    return data._label;
  }
  if (data.__type === "custom-json") return "Custom JSON";
  return data.__type;
}

function CustomJsonNodeImpl({ data }: { data: CustomJsonData }) {
  const [expanded, setExpanded] = useState(false);
  const label = deriveLabel(data);

  // Collapsed mode is the hot path — at 200 nodes, the prior implementation
  // ran JSON.stringify on every node + rendered a CSS-truncated <pre> + the
  // whole card carried a box-shadow. Skip all three when collapsed: render
  // the label only, no <pre>, no shadow. Expanded mode keeps the full
  // stringified payload (only one node is expanded at a time in practice).
  return (
    <div
      className={cn(
        "relative min-w-45 max-w-90 rounded-md border border-border bg-card text-card-foreground",
        expanded && "shadow-sm",
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 px-3 py-2",
          "text-left text-xs font-medium",
          expanded && "border-b border-border",
        )}
      >
        <span className="truncate font-mono text-muted-foreground">
          {label}
        </span>
        <span aria-hidden className="text-muted-foreground">
          {expanded ? "−" : "+"}
        </span>
      </button>
      {expanded && (
        <pre className="max-h-80 overflow-auto whitespace-pre p-3 font-mono text-[11px] leading-snug text-muted-foreground">
          <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
      )}
      {/* Render port handles for any ports declared in data.ports. Without
       * these, xyflow's edge layer fails getEdgePosition() for every edge
       * referencing this node and logs hundreds of warnings per frame.
       * Discovered via 2026-05-14 baseline measurement — the cliff at
       * N≥100 in vis-off was warning-spam CPU cost, not React reconciliation
       * cost. v0.1.4 patch. */}
      <PortsAt ports={data.ports} position="left" />
      <PortsAt ports={data.ports} position="right" />
      <PortsAt ports={data.ports} position="top" />
      <PortsAt ports={data.ports} position="bottom" />
    </div>
  );
}

export const CustomJsonNode = memo(CustomJsonNodeImpl);

export const customJsonRenderer: NodeRenderer<CustomJsonData> = {
  type: "custom-json",
  label: "Custom JSON",
  render: (data) => <CustomJsonNode data={data} />,
};
