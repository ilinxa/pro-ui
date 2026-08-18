import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "card-tree-node",
  name: "Card Tree Node",
  category: "data",

  description:
    "Card-tree renderer for flow canvas nodes — read-only viewer, a consumer-owned edit dialog pattern, and a typed port editor strip.",
  context:
    "Use card-tree-node when each flow-canvas node should carry a card-tree tree as its data (agent workflow editor, schema/config canvas, decision/runbook map). The viewer paints a read-only summary (title + first 3 flat fields + block chips + nested-card outlines with their own ports + selectability); clicking fires ctx.onEditRequest(subPath?) which the consumer routes to a dialog mounting <CardTree editable> with the same JSON. At most one card-tree editor instance is mounted at any time regardless of node count. Pass the same customPredefinedKeys array to createCardTreeViewerRenderer() and to <CardTree> so the node and the dialog agree about which keys are blocks.",
  features: [
    "CardTreeViewer NodeRenderer<CardTreeCanvasNode> — drop-in for flow-canvas's renderer registry",
    "Subcard-level click-to-focus — clicking a nested card pre-focuses the dialog on that subcard via CardTreeHandle.focusCard",
    "Subcard ports + selectability — subcards carry their own port handles + visual selection state",
    "Graceful degradation when __rcid is missing — subcard click bubbles to root + dev-mode warning",
    "n8n-style multi-select supported via flow-canvas's marquee + shift-click (bulk-edit-via-dialog is not implemented)",
    "Consumer-owned dialog pattern (no shipped dialog chrome) — documented in procomp guide",
    "v0.2 PortEditorStrip — opt-in port editor (id / type / side / dir / multi / label) per card or subcard; live-save; [✓in][✓out] create-flow splits to atomic rows; doc-type forces bottom side editor-side; orphan-doc-target tooltip until doc files ship",
    "v0.2.1 — F-cross-13 path-b sweep: PortEditorAddPopover trigger drops `asChild`; PortEditorRow id-field Tooltip (an <Input> can't nest inside the trigger <button> either backend renders) replaced with a native `title` hint; dead TooltipProvider + `tooltip` dep dropped. Zero public-API change.",
    "v0.4 BlockStrip — card-tree blocks finally render on the canvas (FU-2). The five built-in predefined keys and every host-registered custom key paint as compact summary chips (`table  2 x 3`, `body  2 items`); through v0.3 all of them rendered as nothing and `quote` leaked into the flat-field strip as an ordinary string.",
    "v0.4 createCardTreeViewerRenderer() — configurable renderer factory: customPredefinedKeys, opt-in host `render()` for custom blocks (error-boundaried), disabledPredefinedKeys, and the maxFlatFields / maxBlocks / maxSubcards caps Q6 kept hardcoded through v0.3. `cardTreeViewerRenderer` stays as the zero-config default.",
    "v0.4 key-first classification — one router (classifyNodeKey) mirroring card-tree's own precedence (reserved → built-in → custom → scalar → object/array) replaces two independent value-shape heuristics that disagreed with the editor the dialog mounts.",
    "v0.5 PortEditorStrip takes customPredefinedKeys / disabledPredefinedKeys (FU-A) — the port walker now classifies keys through the same router as the viewer instead of its own private isCardLike copy. Closes the last surface where the port editor and the canvas disagreed about what a card is: a child card with no __rcid was drawn but unreachable, and a block whose payload carried `ports` could be written into.",
  ],
  tags: [
    "card-tree-node",
    "flow-canvas",
    "card-tree",
    "popup-edit",
    "renderer",
    "json-canvas",
    "agent-workflow",
    "config-canvas",
  ],

  version: "0.5.1",
  status: "alpha",
  // Raised 65 -> 95 at v0.4.0. The block-rendering slice (classifier, block
  // deriver, BlockStrip, host boundary, the widened type surface) is a genuine
  // ~22KB of new shipped source, so 65 was no longer an honest target. Set
  // with real headroom deliberately: card-tree sits at 4.7% of its budget and
  // that tightness is itself a logged follow-up (FU-5) — not a state worth
  // reproducing here.
  artifactBudgetKB: 95,
  createdAt: "2026-05-16",
  updatedAt: "2026-08-18",

  author: { name: "ilinxa" },

  dependencies: {
    // v0.1: renderer itself uses no shadcn primitives directly — the title-
    // strip and subcard blocks are native <button>+<div>.
    // v0.2: PortEditorStrip + PortEditorAddPopover + PortEditorRow need these
    // shadcn primitives. F-13 lock; consumer registry-install brings them.
    // (v0.2.1 dropped `tooltip` — id-field hint is a native `title` now.)
    // The consumer-owned dialog (Dialog, Drawer, Sheet, etc.) is still the
    // consumer's choice and doesn't get auto-installed via this procomp.
    shadcn: ["popover", "select", "checkbox", "input", "label", "button"],
    npm: {
      "lucide-react": "^1.11.0",
    },
    internal: ["card-tree", "flow-canvas"], // F-V3 lock; cross-registry deps
  },

  related: ["flow-canvas", "card-tree"],
};
