import type { RichCardState } from "../lib/reducer";

/**
 * Pure selector for dirty state. Counter-based (every commit-action increments
 * `version`; mark-clean snapshots `cleanVersion`). Cheap and predictable.
 *
 * v0.4 will upgrade to structural-diff dirty tracking once undo/redo lands.
 */
export function isDirty(state: RichCardState): boolean {
  return state.version !== state.cleanVersion;
}
