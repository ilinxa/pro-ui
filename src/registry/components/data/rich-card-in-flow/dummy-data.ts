import type { CanvasData } from "@/registry/components/data/flow-canvas-01";
import type { RichCardCanvasNode } from "./types";

// 3 rich-card nodes + 1 custom-json node. Each rich-card node has __rcids
// pre-attached at the root + at every subcard, so subcard-click-to-focus
// works out of the box (F-03 lock — degrades gracefully when __rcid is
// missing, but the happy path is what the demo exercises).

const promptCard: RichCardCanvasNode = {
  __type: "rich-card",
  __rcid: "card-prompt-root",
  title: "User Prompt",
  priority: 1,
  urgency: true,
  createdAt: "2026-05-16T09:14:00Z",
  ports: [
    { id: "p-prompt-out", side: "right", dir: "out", type: "text" },
  ],
  metadata: {
    __rcid: "card-prompt-metadata",
    title: "Metadata",
    sessionId: "sess-7a2c",
    locale: "en-US",
    ports: [
      { id: "p-prompt-meta-out", side: "right", dir: "out", type: "data" },
    ],
  },
};

const llmCard: RichCardCanvasNode = {
  __type: "rich-card",
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
      { id: "p-llm-system-in", side: "left", dir: "in", type: "text", multi: true },
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

const responseCard: RichCardCanvasNode = {
  __type: "rich-card",
  __rcid: "card-response-root",
  title: "Response",
  format: "markdown",
  streaming: false,
  receivedAt: "2026-05-16T09:14:03Z",
  ports: [
    { id: "p-response-in", side: "left", dir: "in", type: "text" },
  ],
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

export const richCardInFlowFixture: CanvasData = {
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
