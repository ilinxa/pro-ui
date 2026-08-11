import type { ComposerPhase, PublishIntent } from "../types";

/**
 * Phase reducer — the EPHEMERAL FSM phase, deliberately kept OUT of the
 * serializable `ComposerDraft` (§6 "ONE JSON-serializable draft"). Orthogonal
 * to the draft's persisted `status` axis and to the step `cursor`.
 *
 * `schedule` is NOT a separate terminal machine: one `intent-accepted` action
 * fans out to `publishing` vs `scheduling` by `PublishIntent.mode`.
 */
export type PhaseAction =
  | { type: "start" }
  | { type: "autosave-begin" }
  | { type: "autosave-end" }
  | { type: "validate-begin" }
  | { type: "gate-fail" }
  | { type: "intent-accepted"; intent: PublishIntent }
  | { type: "draft-ack" }
  | { type: "publish-resolved" }
  | { type: "schedule-resolved" }
  | { type: "publish-rejected" }
  | { type: "retry" }
  | { type: "dismiss-error" };

export function phaseReducer(
  phase: ComposerPhase,
  action: PhaseAction,
): ComposerPhase {
  switch (action.type) {
    case "start":
      return phase === "idle" ? "editing" : phase;
    case "autosave-begin":
      return phase === "editing" ? "autosaving" : phase;
    case "autosave-end":
      return phase === "autosaving" ? "editing" : phase;
    case "validate-begin":
      return phase === "editing" || phase === "publish-error"
        ? "validating"
        : phase;
    case "gate-fail":
      return phase === "validating" ? "editing" : phase;
    case "intent-accepted": {
      if (phase !== "validating") return phase;
      // schedule = publish + future publishAt; ONE action fans out — NOT a separate terminal machine.
      return action.intent.mode === "draft"
        ? "draft-saved"
        : action.intent.mode === "publish"
          ? "publishing"
          : "scheduling";
    }
    case "draft-ack":
      return phase === "draft-saved" ? "editing" : phase;
    case "publish-resolved":
      return phase === "publishing" ? "published" : phase;
    case "schedule-resolved":
      return phase === "scheduling" ? "scheduled" : phase;
    case "publish-rejected":
      return phase === "publishing" || phase === "scheduling"
        ? "publish-error"
        : phase;
    case "retry":
      return phase === "publish-error" ? "validating" : phase;
    case "dismiss-error":
      return phase === "publish-error" ? "editing" : phase;
    default: {
      const _exhaustive: never = action;
      return _exhaustive ?? phase;
    }
  }
}
