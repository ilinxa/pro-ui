// F-S1 lock — RELATIVE import for cross-procomp types. Same-category alias
// imports get the slug name substituted by shadcn's rewriter; relative paths
// bypass that and translate verbatim.
import type { Port, PortSide } from "../../flow-canvas-01/types";

/**
 * 8-char short UUID with non-crypto fallback. Matches the id length used
 * by `makeEdgeId` / `makeNodeId` in flow-canvas-01's `use-canvas-data.ts`
 * (lines 34-45) for visual + diagnostic consistency.
 */
function shortUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Stable port id namespaced under the card's __rcid. v0.2.0 lock per Q5.
 *   `p-{cardRcid ?? "card"}-{shortUuid}`
 *
 * @example
 *   makePortId("card-llm-system") → "p-card-llm-system-a3f2c8d1"
 *   makePortId(undefined)         → "p-card-a3f2c8d1"
 */
export function makePortId(cardRcid: string | undefined): string {
  const base = cardRcid ?? "card";
  return `p-${base}-${shortUuid()}`;
}

/**
 * Create an in/out pair of ports sharing the same type / side / multi / label
 * at create time. Both share a `{p-cardRcid-shortUuid}` base id with `-in`
 * and `-out` suffixes for traceability. Used by `<PortEditorAddPopover>`
 * when the user checks both `[✓in] [✓out]` checkboxes.
 *
 * Per Q3 lock: after save, the two ports are fully independent rows in the
 * editor. No auto-grouping at re-render time.
 */
export function makeInOutPair(
  cardRcid: string | undefined,
  type: string,
  side: PortSide,
  multi: boolean,
  label?: string,
): [Port, Port] {
  const base = `p-${cardRcid ?? "card"}-${shortUuid()}`;
  const inPort: Port = { id: `${base}-in`, side, dir: "in", type, multi, label };
  const outPort: Port = { id: `${base}-out`, side, dir: "out", type, multi, label };
  return [inPort, outPort];
}

export function addPort(existing: Port[], port: Port): Port[] {
  return [...existing, port];
}

export function updatePort(
  existing: Port[],
  portId: string,
  mut: Partial<Port>,
): Port[] {
  return existing.map((p) => (p.id === portId ? { ...p, ...mut } : p));
}

export function removePort(existing: Port[], portId: string): Port[] {
  return existing.filter((p) => p.id !== portId);
}

/**
 * Returns true when `id` is already used by another port in `existing`.
 * `excludePortId` skips a specific port (used during inline-rename — the
 * port being renamed shouldn't fail its own dup check).
 */
export function isDuplicateId(
  existing: Port[],
  id: string,
  excludePortId?: string,
): boolean {
  return existing.some((p) => p.id === id && p.id !== excludePortId);
}
