"use client";

import * as React from "react";
import { Gift } from "lucide-react";

import { cn } from "@/lib/utils";

import { useCooperativeChallenge } from "../hooks/use-cooperative-challenge";
import type { ChallengeRewardChipProps } from "../types";

/**
 * Tier C — dumb reward chip. Copy frames the reward as the team's **collectively**
 * (system D-08): *"The team earns: …"* (available) → *"The team earned: …"*
 * (`earned`). **Never** first-person ("you'll get") — a first-person framing
 * violates D-08, and there is no per-member reward path in the type system.
 * Token-based (signal-lime on earned via `--primary`), never an ad-hoc green.
 */
export function ChallengeRewardChip({
  reward,
  earned = false,
  className,
}: ChallengeRewardChipProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
        earned
          ? "border-primary/40 bg-primary/10 text-foreground"
          : "border-border bg-muted/50 text-muted-foreground",
        className,
      )}
    >
      <Gift
        aria-hidden
        className={cn("size-4 shrink-0", earned && "text-primary")}
      />
      <span className="min-w-0">
        <span className="font-medium text-foreground">
          {earned ? "The team earned:" : "The team earns:"}
        </span>{" "}
        <span className="break-words">{reward}</span>
      </span>
    </div>
  );
}

/**
 * Tier B — context wrapper: reads `reward` + `isComplete`; auto-hides when there
 * is no reward (§5.3). The assembly further gates it with `showReward`.
 */
export function CooperativeChallengeReward() {
  const { challenge, derived } = useCooperativeChallenge();
  if (!derived.hasReward || challenge.reward == null) return null;
  return (
    <ChallengeRewardChip reward={challenge.reward} earned={derived.isComplete} />
  );
}
