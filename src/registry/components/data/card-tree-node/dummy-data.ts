// F-S1 lock — RELATIVE import for cross-procomp types. Same-category alias
// imports get the slug name substituted by shadcn's rewriter; relative paths
// bypass that and translate verbatim.
import type { CanvasData } from "../flow-canvas/types";
import type { CardTreeCanvasNode } from "./types";

// 3 card-tree nodes + 1 custom-json node. Each card-tree node has __rcids
// pre-attached at the root + at every subcard, so subcard-click-to-focus
// works out of the box (F-03 lock — degrades gracefully when __rcid is
// missing, but the happy path is what the demo exercises).

const promptCard: CardTreeCanvasNode = {
  __type: "card-tree",
  __rcid: "card-prompt-root",
  title: "User Prompt",
  priority: 1,
  urgency: true,
  createdAt: "2026-05-16T09:14:00Z",
  // v0.4.0 — a table block. Renders as a "1 x 3" chip on the canvas.
  table: {
    headers: ["role", "tokens", "cached"],
    rows: [["user", 128, false]],
  },
  ports: [
    { id: "p-prompt-out", side: "right", dir: "out", type: "text" },
  ],
  metadata: {
    __rcid: "card-prompt-metadata",
    title: "Metadata",
    sessionId: "sess-7a2c",
    locale: "en-US",
    ports: [
      // Type "text" matches the target (p-llm-system-in) so typed-port
      // validation passes; the metadata stream is text-shaped to LLM.
      { id: "p-prompt-meta-out", side: "right", dir: "out", type: "text" },
    ],
  },
};

const llmCard: CardTreeCanvasNode = {
  __type: "card-tree",
  __rcid: "card-llm-root",
  title: "GPT-4 Inference",
  model: "gpt-4o-2026-04",
  temperature: 0.7,
  maxTokens: 2048,
  ports: [
    { id: "p-llm-in", side: "left", dir: "in", type: "text" },
    { id: "p-llm-out", side: "right", dir: "out", type: "text" },
  ],
  system: {
    __rcid: "card-llm-system",
    title: "System message",
    content: "You are a helpful agent. Always cite sources.",
    ports: [
      // Dropped `multi: true` (was inconsistent with p-llm-user-in which
      // has no multi). The multi field is not passed through to xyflow's
      // <Handle> by PortHandle — it's a flow-canvas-only field for the
      // typed-edge validator. Default (multi: false) is fine for v0.1.
      { id: "p-llm-system-in", side: "left", dir: "in", type: "text" },
    ],
  },
  user: {
    __rcid: "card-llm-user",
    title: "User message",
    content: "{{prompt}}",
    ports: [
      { id: "p-llm-user-in", side: "left", dir: "in", type: "text" },
    ],
  },
};

// v0.4.0 — this card carries BLOCKS, the surface FU-2 was about. Through
// v0.3 every one of `codearea` / `table` / `quote` / `list` / `image` and any
// host-registered key rendered as nothing here, silently. The demo mounting
// them is half the regression guard (the other half is __tests__/).
const responseCard: CardTreeCanvasNode = {
  __type: "card-tree",
  __rcid: "card-response-root",
  title: "Response",
  format: "markdown",
  streaming: false,
  receivedAt: "2026-05-16T09:14:03Z",
  ports: [
    { id: "p-response-in", side: "left", dir: "in", type: "text" },
  ],
  // Built-in predefined blocks — card-tree owns their full presentation; the
  // canvas node shows a summary chip and the edit dialog shows the real thing.
  codearea: {
    format: "json",
    content: '{\n  "answer": "42",\n  "sources": ["doc-7", "doc-12"]\n}',
  },
  quote: "The canvas node and the edit dialog must agree about what exists.",
  // A host-registered custom block, array-valued — the shape card-tree v0.6.0
  // exists to support (Plate Value, editor.js).
  body: [
    { type: "heading", level: 2, text: "Summary" },
    { type: "paragraph", text: "Three sources agreed; one dissented." },
  ],
  // Deliberately the FOURTH block, one past the default cap of 3 — so this
  // card also demonstrates the "+1" overflow chip. A card must never hide
  // content without saying so; that is the failure FU-2 was about.
  list: ["doc-7", "doc-12", "doc-31"],
  metadata: {
    __rcid: "card-response-metadata",
    title: "Metadata",
    finishReason: "stop",
    totalTokens: 412,
  },
};

const auditNode = {
  __type: "audit-log",
  _label: "Audit Log",
  // Demonstrates the renderer-mixed pattern — falls back to customJsonRenderer.
  events: [
    { ts: "2026-05-16T09:14:03Z", kind: "tool-call", name: "search" },
    { ts: "2026-05-16T09:14:04Z", kind: "tool-result", status: "ok" },
  ],
};

export const cardTreeNodeFixture: CanvasData = {
  version: 1,
  nodes: [
    {
      id: "n-prompt",
      position: { x: 40, y: 40 },
      data: promptCard,
    },
    {
      id: "n-llm",
      position: { x: 380, y: 40 },
      data: llmCard,
    },
    {
      id: "n-response",
      position: { x: 740, y: 40 },
      data: responseCard,
    },
    {
      id: "n-audit",
      position: { x: 380, y: 360 },
      data: auditNode,
    },
  ],
  edges: [
    {
      id: "e-prompt-to-llm-user",
      source: "n-prompt:p-prompt-out",
      target: "n-llm:p-llm-user-in",
    },
    {
      id: "e-llm-to-response",
      source: "n-llm:p-llm-out",
      target: "n-response:p-response-in",
    },
    {
      id: "e-prompt-meta-to-llm-system",
      source: "n-prompt:p-prompt-meta-out",
      target: "n-llm:p-llm-system-in",
    },
  ],
  viewport: { x: 0, y: 0, zoom: 0.85 },
};
