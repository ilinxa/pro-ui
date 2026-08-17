// F-S1 lock — RELATIVE import for cross-procomp types. Same-category alias
// imports get the slug name substituted by shadcn's rewriter; relative paths
// bypass that and translate verbatim.
import { PREDEFINED_KEYS, type CardTreeJsonNode } from "../../card-tree/types";
import type { NodeBlock, BlockKind } from "../types";
import { classifyNodeKey, type NodeKeyOptions } from "./classify-node-key";

/**
 * Collect the card-tree *blocks* on a node, in `Object.entries` order, capped
 * at `max`. A block is a built-in predefined key (`codearea` / `image` /
 * `table` / `quote` / `list`) the consumer has not opted out of, or a key the
 * host registered through `customPredefinedKeys`.
 *
 * This is the v0.4.0 addition that closes FU-2 — before it, blocks matched
 * neither `deriveFlatFields` nor `enumerateSubcards` and vanished silently.
 *
 * Each block carries a compact `summary` string sized for a canvas node, and
 * the raw `value` so an opt-in full render (`renderCustomBlocks`) can hand it
 * back to the host's own `render`.
 */
export function deriveBlocks(
  data: CardTreeJsonNode,
  max: number,
  options: NodeKeyOptions = {},
): NodeBlock[] {
  const out: NodeBlock[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (out.length >= max) break;
    if (classifyNodeKey(key, value, options) !== "block") continue;

    // Built-in FIRST. Deriving the kind from the registration list instead
    // would let a host that registers the name "table" capture the built-in
    // block and route it through its own `render` — card-tree's
    // `resolveCustomKeys` drops such collisions at mount, so the viewer must
    // not honour them either.
    const kind: BlockKind = (PREDEFINED_KEYS as readonly string[]).includes(key)
      ? (key as BlockKind)
      : "custom";

    out.push({ key, kind, value, summary: summarizeBlock(kind, value) });
  }

  return out;
}

/**
 * How many blocks the card carries in total, ignoring any display cap.
 *
 * The viewer needs this to show a truthful "+N" overflow chip. Dropping the
 * surplus silently would reproduce, in miniature, the exact complaint FU-2 was
 * filed about: content present in the data and absent from the node with no
 * indication.
 */
export function countBlocks(data: CardTreeJsonNode, options: NodeKeyOptions = {}): number {
  let n = 0;
  for (const [key, value] of Object.entries(data)) {
    if (classifyNodeKey(key, value, options) === "block") n++;
  }
  return n;
}

/** Longest summary a node chip will show before it is clipped with an ellipsis. */
const MAX_SUMMARY_CHARS = 80;

/**
 * One-line description of a block's payload — what a reader needs to know the
 * block is *there* and roughly how big it is, without painting it. A canvas
 * node is a summary surface (three flat fields, four subcard outlines); a full
 * table or code listing does not belong at this zoom level.
 *
 * Every branch is defensive: canvas JSON is host data and a malformed payload
 * must degrade to a label, never throw inside a node render.
 */
export function summarizeBlock(kind: BlockKind, value: unknown): string {
  switch (kind) {
    case "image":
      return summarizeImage(value);
    case "table":
      return summarizeTable(value);
    case "codearea":
      return summarizeCodearea(value);
    case "quote":
      return typeof value === "string" ? truncate(value) : plural(countOf(value), "item", "field");
    case "list":
      return Array.isArray(value) ? plural(value.length, "item") : "empty";
    case "custom":
    default:
      return summarizeCustom(value);
  }
}

function summarizeImage(value: unknown): string {
  if (!isRecord(value)) return "image";
  const { alt, src } = value;
  if (typeof alt === "string" && alt.trim() !== "") return truncate(alt);
  if (typeof src === "string" && src.trim() !== "") {
    const last = src.split(/[/\\]/).pop();
    return truncate(last && last !== "" ? last : src);
  }
  return "image";
}

function summarizeTable(value: unknown): string {
  if (!isRecord(value)) return "table";
  const rows = Array.isArray(value.rows) ? value.rows.length : 0;
  const headers = Array.isArray(value.headers)
    ? value.headers.length
    : // No header row declared — fall back to the widest data row.
      Array.isArray(value.rows)
      ? value.rows.reduce<number>((w, r) => (Array.isArray(r) ? Math.max(w, r.length) : w), 0)
      : 0;
  return `${rows} x ${headers}`;
}

function summarizeCodearea(value: unknown): string {
  if (!isRecord(value)) return "code";
  const format = typeof value.format === "string" && value.format !== "" ? value.format : "code";
  if (typeof value.content !== "string") return format;
  // An empty string is zero lines, not one.
  const lines = value.content === "" ? 0 : value.content.split("\n").length;
  return `${format}, ${plural(lines, "line")}`;
}

function summarizeCustom(value: unknown): string {
  if (value === null || value === undefined) return "empty";
  if (Array.isArray(value)) return plural(value.length, "item");
  if (typeof value === "string") return value.trim() === "" ? "empty" : truncate(value);
  if (typeof value === "object") return plural(Object.keys(value).length, "field");
  return truncate(String(value));
}

function countOf(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (isRecord(value)) return Object.keys(value).length;
  return 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

function truncate(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > MAX_SUMMARY_CHARS ? `${flat.slice(0, MAX_SUMMARY_CHARS - 1)}…` : flat;
}
