import type { ComposerDraft, ComposerStepValue, ContentStatus } from "../types";

/**
 * Draft reducer — owns the SERIALIZABLE draft only (never the ephemeral FSM
 * phase, which lives in `phase-reducer.ts`). Mirrors kanban-board-01's reducer
 * shape: a `replace` arm for full hydration/restore + targeted mutations.
 */
export type ComposerAction =
  // hydration / loadDraft / fromContentItem re-seed / autosave restore (kanban `replace` arm)
  | { type: "replace"; draft: ComposerDraft }
  // per-mutation (T4)
  | { type: "set-step-value"; stepId: string; value: ComposerStepValue }
  // cursor-under-editing (gated forward, enforced by the shell before dispatch)
  | { type: "set-cursor"; cursor: number }
  // persisted-status projection (T9/T13/T14)
  | { type: "set-status"; status: ContentStatus }
  | { type: "set-scheduled-for"; scheduledFor: string | undefined }
  | { type: "set-content-id"; contentId: string };

export function composerReducer(
  state: ComposerDraft,
  action: ComposerAction,
): ComposerDraft {
  switch (action.type) {
    case "replace":
      // full swap — no merge (kanban semantics)
      return action.draft;
    case "set-step-value":
      return {
        ...state,
        steps: { ...state.steps, [action.stepId]: action.value },
      };
    case "set-cursor":
      return state.cursor === action.cursor
        ? state
        : { ...state, cursor: action.cursor };
    case "set-status":
      return state.status === action.status
        ? state
        : { ...state, status: action.status };
    case "set-scheduled-for":
      return { ...state, scheduledFor: action.scheduledFor };
    case "set-content-id":
      return { ...state, contentId: action.contentId };
    default: {
      const _exhaustive: never = action;
      return _exhaustive ?? state;
    }
  }
}

/** kanban EMPTY analog — the uncontrolled-mode seed. */
export function makeEmptyDraft(contentType: string): ComposerDraft {
  return { contentType, steps: {}, status: "draft", cursor: 0 };
}
