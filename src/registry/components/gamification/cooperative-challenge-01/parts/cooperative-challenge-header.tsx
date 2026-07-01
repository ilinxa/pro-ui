"use client";

import * as React from "react";
import { CircleCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { useCooperativeChallenge } from "../hooks/use-cooperative-challenge";
import { TeamMemberStack } from "./team-member-stack";

/**
 * Tier B — the card header: challenge `label` (truncated, full text on `title`)
 * + the state indicator + the optional team name + the `TeamMemberStack`.
 *
 * The state indicator makes opted-out read as *Optional* (an invitation), never
 * *failure* (§6.1). On `done` it becomes the **lightweight inline earned
 * acknowledgement** (§6.4): a "Completed together" pill (glyph + text, not color
 * alone) with a `.reveal-up` micro-entrance (globally reduced-motion-safe) and
 * `aria-live="polite"` so the transition to done is announced once without
 * stealing focus or blocking — the heavy celebration is E6's job, never built
 * here (no modal, no overlay).
 */
export function CooperativeChallengeHeader({
  showMemberStack = true,
}: {
  showMemberStack?: boolean;
}) {
  const { challenge, team, derived } = useCooperativeChallenge();

  const stateIndicator = derived.isComplete ? (
    // aria-live only on the earned pill → the transition to done is announced
    // once (§6.4); Optional/Active are silent (a plain badge, no live region).
    <span
      aria-live="polite"
      className="reveal-up inline-flex items-center gap-1 rounded-4xl bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground"
    >
      <CircleCheck aria-hidden className="size-3" /> Completed together
    </span>
  ) : derived.isActive ? (
    <Badge variant="secondary">Active</Badge>
  ) : (
    <Badge variant="outline">Optional</Badge>
  );

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2">{stateIndicator}</div>
        <h3
          title={challenge.label}
          className="truncate text-sm font-semibold text-foreground"
        >
          {challenge.label}
        </h3>
        {team.name ? (
          <p className="truncate text-xs text-muted-foreground">{team.name}</p>
        ) : null}
      </div>
      {showMemberStack ? (
        <TeamMemberStack members={team.members} className="shrink-0 pt-0.5" />
      ) : null}
    </div>
  );
}
