/**
 * Per v0.2 plan §9.1: source-of-truth for which actions push history
 * entries. Action implementations enforce the rules directly; this
 * module documents the table and exports a helper predicate so future
 * audits can grep for the canonical list.
 *
 * v0.2 records:
 *   - `setNodePositions` (unless `options.silent === true`)
 *   - `pinNode` (single-node pin/unpin)
 *   - drag-to-pin (coalesced into a single entry by the interaction
 *     layer in A3 — usually `setNodePosition + pinNode` together)
 *
 * v0.2 explicitly does NOT record (mode-of-operation, not data):
 *   - `select`, `clearSelection`, `hover`
 *   - `enterLinkingMode`, `exitLinkingMode`
 *   - `setLayoutEnabled`, `rerunLayout`, `pinAllPositions`
 *   - `importSnapshot` (clears history instead — plan §9.4)
 *   - source-adapter `subscribe` deltas (decision #22)
 *
 * v0.3 expands the recorded set with full CRUD (every node / edge /
 * group / type mutation = one entry, with composite cascade entries
 * for delete fan-out).
 */

export type RecordedActionId = "setNodePositions" | "pinNode" | "dragToPin";

export const RECORDED_ACTIONS: ReadonlySet<RecordedActionId> = new Set([
  "setNodePositions",
  "pinNode",
  "dragToPin",
]);

export function isRecordedAction(id: string): id is RecordedActionId {
  return RECORDED_ACTIONS.has(id as RecordedActionId);
}
