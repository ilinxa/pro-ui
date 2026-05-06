"use client";

import { memo, useState } from "react";
import { cn } from "@/lib/utils";
import type { NodeData, NodeRenderer } from "../types";

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
  const summary = JSON.stringify(data, null, expanded ? 2 : 0);

  // Selection ring + focus + lock chip belong to <NodeShell> upstream.
  // This renderer is purely content + an expand/collapse header.
  return (
    <div
      className={cn(
        "min-w-45 max-w-90 rounded-md border border-border bg-card text-card-foreground shadow-sm",
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 px-3 py-2",
          "border-b border-border text-left text-xs font-medium",
        )}
      >
        <span className="truncate font-mono text-muted-foreground">
          {label}
        </span>
        <span aria-hidden className="text-muted-foreground">
          {expanded ? "−" : "+"}
        </span>
      </button>
      <pre
        className={cn(
          "overflow-hidden p-3 font-mono text-[11px] leading-snug text-muted-foreground",
          expanded ? "max-h-80 overflow-auto whitespace-pre" : "truncate",
        )}
      >
        <code>{summary}</code>
      </pre>
    </div>
  );
}

export const CustomJsonNode = memo(CustomJsonNodeImpl);

export const customJsonRenderer: NodeRenderer<CustomJsonData> = {
  type: "custom-json",
  label: "Custom JSON",
  render: (data) => <CustomJsonNode data={data} />,
};
