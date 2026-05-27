"use client";

import { useMemo } from "react";
import { Bot, FileText, GripVertical, Sparkles, Wrench } from "lucide-react";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { ProjectCard01 } from "../project-card-01";
import type { ProjectCardItem } from "../project-card-01/types";
import { FlowCanvas } from "./flow-canvas-01";
import { FLOW_CANVAS_RICH, makeStressData } from "./dummy-data";
import { emitSubObjectDrag } from "./lib/emit-sub-object-drag";
import { PortsAt } from "./parts/ports-at";
import type { NodeRenderer } from "./types";

// ─────────────────────────────────────────────────────────────────────
// Custom renderers — defined at module scope (CRITICAL — see the
// xyflow-react-pro skill: recreating renderer maps in render triggers
// teardown + remount on every render).
// ─────────────────────────────────────────────────────────────────────

const promptRenderer: NodeRenderer = {
  type: "prompt",
  label: "Prompt",
  defaultPorts: () => [
    { id: "out", side: "right", dir: "out", type: "text" },
  ],
  render: (data) => {
    const template = (data as { template?: string }).template ?? "";
    return (
      <div className="relative w-56 rounded-md border border-border bg-card p-3 text-card-foreground shadow-sm">
        <header className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <FileText aria-hidden className="h-3.5 w-3.5" />
          Prompt
        </header>
        <div className="rounded-sm bg-muted px-2 py-1 font-mono text-[11px] leading-snug">
          {template}
        </div>
        <PortsAt ports={data.ports} position="right" />
      </div>
    );
  },
};

type ToolItem = { __type?: string; name: string; description?: string };

const llmRenderer: NodeRenderer = {
  type: "llm",
  label: "LLM",
  defaultPorts: () => [
    { id: "in", side: "left", dir: "in", type: "text" },
    { id: "out", side: "right", dir: "out", type: "text", multi: true },
  ],
  // Each tool chip is independently extractable as a standalone node.
  // The right-click menu adds "Extract tools[N]" entries for keyboard
  // accessibility; HTML5 drag-out works for mouse + touch (long-press).
  extractablePaths: (data) => {
    const tools = (data as unknown as { tools?: ToolItem[] }).tools;
    return Array.isArray(tools) ? tools.map((_, i) => `tools[${i}]`) : [];
  },
  render: (data, ctx) => {
    const model = (data as { model?: string }).model ?? "claude-opus-4";
    const tools = ((data as { tools?: ToolItem[] }).tools ?? []);
    return (
      <div className="relative w-56 rounded-md border-2 border-primary/40 bg-card p-3 text-card-foreground shadow-sm">
        <header className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
          <Sparkles aria-hidden className="h-3.5 w-3.5 text-primary" />
          LLM
        </header>
        <div className="font-mono text-[11px] text-muted-foreground">{model}</div>
        {tools.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tools.map((tool, i) => (
              <div
                key={`${tool.name}-${i}`}
                data-draggable-subobject={`tools[${i}]`}
                draggable
                onDragStart={(e) =>
                  emitSubObjectDrag(e, tool, `tools[${i}]`, ctx.nodeId)
                }
                className="group flex cursor-grab items-center gap-1 rounded-sm bg-muted px-1.5 py-0.5 text-[10px] hover:bg-accent active:cursor-grabbing"
                title="Drag out to extract — Alt+drag to move"
              >
                <GripVertical
                  aria-hidden
                  className="h-2.5 w-2.5 text-muted-foreground opacity-60 group-hover:opacity-100"
                />
                {tool.name}
              </div>
            ))}
          </div>
        )}
        <PortsAt ports={data.ports} position="left" />
        <PortsAt ports={data.ports} position="right" />
      </div>
    );
  },
};

const toolRenderer: NodeRenderer = {
  type: "tool",
  label: "Tool",
  defaultPorts: () => [{ id: "in", side: "left", dir: "in", type: "text" }],
  render: (data) => {
    const name = (data as { name?: string }).name ?? "Tool";
    const description = (data as { description?: string }).description;
    return (
      <div className="relative w-44 rounded-md border border-border bg-card p-2 text-card-foreground shadow-sm">
        <header className="mb-1 flex items-center gap-2 text-[11px] font-medium text-foreground">
          <Wrench aria-hidden className="h-3 w-3 text-muted-foreground" />
          {name}
        </header>
        {description && (
          <div className="text-[10px] text-muted-foreground">{description}</div>
        )}
        <PortsAt ports={data.ports} position="left" />
      </div>
    );
  },
};

const displayRenderer: NodeRenderer = {
  type: "display",
  label: "Display",
  defaultPorts: () => [{ id: "in", side: "left", dir: "in", type: "text" }],
  render: (data) => {
    const label = (data as { label?: string }).label ?? "Output";
    return (
      <div className="relative w-44 rounded-md border border-dashed border-border bg-background/60 p-3 text-foreground shadow-sm">
        <header className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Bot aria-hidden className="h-3.5 w-3.5" />
          {label}
        </header>
        <div className="text-[11px] text-muted-foreground">
          Renders the upstream value.
        </div>
        <PortsAt ports={data.ports} position="left" />
      </div>
    );
  },
};

// Adapter — wraps the existing ProjectCard01 registry component as a node.
// The canonical "use any rich card from the registry as a node" pattern.
const projectCardRenderer: NodeRenderer = {
  type: "project-card-01",
  label: "Project",
  defaultPorts: () => [
    { id: "in", side: "left", dir: "in", type: "text" },
    { id: "out", side: "right", dir: "out", type: "card" },
  ],
  render: (data) => {
    const project = (data as unknown as { project: ProjectCardItem }).project;
    return (
      <div className="relative w-72">
        <ProjectCard01 project={project} variant="grid" loading="eager" />
        <PortsAt ports={data.ports} position="left" />
        <PortsAt ports={data.ports} position="right" />
      </div>
    );
  },
};

const RICH_RENDERERS = [
  promptRenderer,
  llmRenderer,
  toolRenderer,
  displayRenderer,
  projectCardRenderer,
];

// Empty starter — just the built-in custom-json fallback. Drop or paste
// any JSON to spawn a node.
const EMPTY_DATA = { version: 1 as const, nodes: [], edges: [] };

export default function FlowCanvasDemo() {
  // Stress fixture is created once, never recreated on tab switch.
  const stressData = useMemo(() => makeStressData(200), []);

  return (
    <Tabs defaultValue="workflow" className="w-full">
      <SwipeTabsList>
        <TabsTrigger value="workflow">Workflow</TabsTrigger>
        <TabsTrigger value="readonly">Read-only viewer</TabsTrigger>
        <TabsTrigger value="custom-json">Custom JSON only</TabsTrigger>
        <TabsTrigger value="stress">Stress (200 nodes)</TabsTrigger>
      </SwipeTabsList>

      <TabsContent value="workflow" className="mt-4">
        <p className="mb-2 text-xs text-muted-foreground">
          Five renderers — Prompt, LLM (with extractable tool chips), Display,
          Project card adapter, and the custom-JSON fallback. Drag handles to
          connect; the LLM&apos;s output has <code>multi: true</code> so it fans
          out. Drag a tool chip onto empty canvas to extract it as a node;
          Alt-drag to move.
        </p>
        <div className="h-140 w-full">
          <FlowCanvas renderers={RICH_RENDERERS} defaultData={FLOW_CANVAS_RICH} />
        </div>
      </TabsContent>

      <TabsContent value="readonly" className="mt-4">
        <p className="mb-2 text-xs text-muted-foreground">
          Same data, <code>readOnly={"{true}"}</code>. Pan, zoom, select,
          and the right-click view-only menu still work; drag, connect, paste,
          delete, and mutation menu items are suppressed. The use-case: audit /
          share-link views of a saved graph.
        </p>
        <div className="h-140 w-full">
          <FlowCanvas
            renderers={RICH_RENDERERS}
            defaultData={FLOW_CANVAS_RICH}
            readOnly
          />
        </div>
      </TabsContent>

      <TabsContent value="custom-json" className="mt-4">
        <p className="mb-2 text-xs text-muted-foreground">
          No consumer renderers registered — only the built-in custom-JSON
          fallback. Drag a <code>.json</code> file from your desktop, drag JSON
          from another draggable, paste with <kbd>Ctrl/Cmd-V</kbd>, or
          right-click → &quot;Paste JSON…&quot;. Every shape becomes a node.
        </p>
        <div className="h-140 w-full">
          <FlowCanvas defaultData={EMPTY_DATA} />
        </div>
      </TabsContent>

      <TabsContent value="stress" className="mt-4">
        <p className="mb-2 text-xs text-muted-foreground">
          200 custom-JSON nodes laid out in a 20-column grid with sparse
          right-and-down edges. <code>onlyRenderVisibleElements</code> is on, so
          xyflow culls off-screen nodes/edges before rendering. Pan + zoom
          should stay smooth; click a node to select; Backspace deletes.
        </p>
        <div className="h-140 w-full">
          <FlowCanvas
            defaultData={stressData}
            onlyRenderVisibleElements
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
