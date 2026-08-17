/**
 * Shared fixtures for the card-tree-node v0.4.0 block-rendering tests (FU-2).
 *
 * The shapes here mirror card-tree's own payload types (`ImageValue`,
 * `TableValue`, `CodeAreaValue`, `QuoteValue`, `ListValue` in
 * `card-tree/types.ts`) plus two host-registered custom keys — one
 * array-valued (the Plate/editor.js shape that v0.6.0 of card-tree unblocked)
 * and one object-valued.
 */
import type { CardTreeCanvasNode } from "../types";

/** Host registration names, as a consumer would pass them through. */
export const CUSTOM_KEY_NAMES = ["body", "metric"] as const;

/** Array-valued custom block — the shape card-tree v0.6.0 exists to support. */
export const bodyValue = [
  { type: "heading", level: 2, text: "Why arrays matter" },
  { type: "paragraph", text: "Plate Value documents are arrays of blocks." },
];

/** Object-valued custom block. */
export const metricValue = { value: 94, unit: "% task success" };

/**
 * A card carrying every built-in predefined block, both custom blocks, two
 * ordinary scalar fields, and one nested child card. Every one of the block
 * keys rendered as *nothing* before v0.4.0 — that is FU-2.
 */
export const everyBlockCard: CardTreeCanvasNode = {
  __type: "card-tree",
  __rcid: "card-every-block",
  title: "Every block",
  status: "active",
  weight: 12,
  image: { src: "https://example.com/diagram.png", alt: "Architecture diagram" },
  table: { headers: ["a", "b", "c"], rows: [[1, 2, 3], [4, 5, 6]] },
  codearea: { format: "ts", content: "const a = 1;\nconst b = 2;" },
  quote: "A canvas node should not swallow a block.",
  list: ["alpha", "beta", "gamma"],
  body: bodyValue,
  metric: metricValue,
  child: {
    __rcid: "card-every-block-child",
    title: "Child card",
    note: "ordinary nested card",
  },
};

/** No blocks at all — the v0.3.0 shape, used to prove the no-regression path. */
export const plainCard: CardTreeCanvasNode = {
  __type: "card-tree",
  __rcid: "card-plain",
  title: "Plain",
  model: "gpt-4o",
  temperature: 0.7,
  streaming: false,
};
