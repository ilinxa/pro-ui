import type { ComposerPhase, PublishMode } from "../types";

export interface PublishCtaArm {
  mode: PublishMode;
  label: string;
  variant: "default" | "outline" | "secondary";
  disabled: boolean;
  busy: boolean;
}

export interface ResolvePublishCtaArgs {
  publishModes: PublishMode[];
  phase: ComposerPhase;
  /** affordance-gates: only show an arm whose lifecycle callback is wired */
  hasOnSaveDraft: boolean;
  hasOnPublish: boolean;
  hasOnSchedule: boolean;
  /** a future scheduledFor is picked (the schedule arm stays disabled until then) */
  scheduleReady: boolean;
}

/**
 * Map `config.publishModes` → the publish-bar arms. Each arm is shown only when
 * its lifecycle callback is wired (affordance-gate), disabled while a conflicting
 * phase is in flight, and `busy` while its own action runs. The schedule arm
 * also waits on a future `scheduledFor`.
 */
export function resolvePublishCtaArms({
  publishModes,
  phase,
  hasOnSaveDraft,
  hasOnPublish,
  hasOnSchedule,
  scheduleReady,
}: ResolvePublishCtaArgs): PublishCtaArm[] {
  const inFlight =
    phase === "validating" ||
    phase === "publishing" ||
    phase === "scheduling" ||
    phase === "autosaving";
  const arms: PublishCtaArm[] = [];

  if (publishModes.includes("draft") && hasOnSaveDraft) {
    arms.push({
      mode: "draft",
      label: "Save draft",
      variant: "outline",
      disabled: inFlight,
      busy: phase === "draft-saved",
    });
  }
  if (publishModes.includes("schedule") && hasOnSchedule) {
    arms.push({
      mode: "schedule",
      label: "Schedule",
      variant: "secondary",
      disabled: inFlight || !scheduleReady,
      busy: phase === "scheduling",
    });
  }
  if (publishModes.includes("publish") && hasOnPublish) {
    arms.push({
      mode: "publish",
      label: "Publish",
      variant: "default",
      disabled: inFlight,
      busy: phase === "publishing",
    });
  }
  return arms;
}
