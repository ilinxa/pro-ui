import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "rich-card-in-flow",
  name: "Rich Card in Flow",
  category: "data",

  description:
    "Read-only RichCardViewer renderer for flow-canvas-01 + consumer-owned-dialog pattern for editing rich-card content inside canvas nodes. Canonical implementation of the popup-edit renderer convention from flow-canvas-01@v0.2.0 perf description Q33.",
  context:
    "Use rich-card-in-flow when each flow-canvas-01 node should carry a rich-card tree as its data (agent workflow editor, schema/config canvas, decision/runbook map). The viewer paints a read-only summary (title + first 3 flat fields + nested-card outlines with their own ports + selectability); clicking fires ctx.onEditRequest(subPath?) which the consumer routes to a dialog mounting <RichCard editable> with the same JSON. At most one rich-card editor instance is mounted at any time regardless of node count.",
  features: [
    "RichCardViewer NodeRenderer<RichCardCanvasNode> — drop-in for flow-canvas-01's renderer registry",
    "Subcard-level click-to-focus — clicking a nested card pre-focuses the dialog on that subcard via RichCardHandle.focusCard",
    "Subcard ports + selectability — subcards carry their own port handles + visual selection state",
    "Graceful degradation when __rcid is missing — subcard click bubbles to root + dev-mode warning",
    "n8n-style multi-select supported via flow-canvas-01's marquee + shift-click (bulk-edit-via-dialog deferred to v0.3)",
    "Consumer-owned dialog pattern (no shipped dialog chrome) — documented in procomp guide",
    "v0.2 PortEditorStrip — opt-in port editor (id / type / side / dir / multi / label) per card or subcard; live-save; [✓in][✓out] create-flow splits to atomic rows; doc-type forces bottom side editor-side; orphan-doc-target tooltip until doc files ship",
  ],
  tags: [
    "rich-card-in-flow",
    "flow-canvas-01",
    "rich-card",
    "popup-edit",
    "renderer",
    "json-canvas",
    "agent-workflow",
    "config-canvas",
  ],

  version: "0.2.0",
  status: "alpha",
  createdAt: "2026-05-16",
  updatedAt: "2026-05-17",

  author: { name: "ilinxa" },

  dependencies: {
    // v0.1: renderer itself uses no shadcn primitives directly — the title-
    // strip and subcard blocks are native <button>+<div>.
    // v0.2: PortEditorStrip + PortEditorAddPopover + PortEditorRow need six
    // shadcn primitives. F-13 lock; consumer registry-install brings them.
    // The consumer-owned dialog (Dialog, Drawer, Sheet, etc.) is still the
    // consumer's choice and doesn't get auto-installed via this procomp.
    shadcn: ["popover", "select", "checkbox", "input", "tooltip", "label", "button"],
    npm: {},
    internal: ["rich-card", "flow-canvas-01"], // F-V3 lock; cross-registry deps
  },

  related: ["flow-canvas-01", "rich-card"],
};
