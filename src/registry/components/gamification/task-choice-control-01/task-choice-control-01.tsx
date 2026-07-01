"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import { AssigneeChip } from "./parts/assignee-chip";
import { ClaimButton } from "./parts/claim-button";
import { OpenForAnyoneToggle } from "./parts/open-for-anyone-toggle";
import { resolveMember } from "./lib/members";
import { resolveTaskChoiceState } from "./lib/state";
import type { TaskChoiceControlProps } from "./types";

/**
 * The single-unit assembly — a **logic-free fan-out**. It resolves the three-
 * state slice once (`resolveTaskChoiceState`, exported) and renders the relevant
 * flat sub-parts for that state, passing each only what it needs. It owns **no**
 * state (the picker-open flag lives in `AssigneeChip`); a hand-assembly using
 * the resolver + parts behaves identically. **No `Root`, no context** (D-06 —
 * nothing cross-cutting to hold).
 *
 * Autonomy affordance (E4): choice is always available, never forced;
 * release/reassign never penalizes the prior assignee (§6). Telemetry fires on
 * meaningful committed interactions only (§8.3).
 */
export function TaskChoiceControl01({
  teamId,
  members,
  value,
  currentMemberId,
  onOpenForAnyoneChange,
  onClaim,
  onAssigneeChange,
  onEvent,
  readOnly = false,
  density = "comfortable",
  labels,
  className,
  "aria-label": ariaLabel,
}: TaskChoiceControlProps) {
  const state = resolveTaskChoiceState(value);

  const emit = React.useCallback(() => {
    onEvent?.({ type: "task-choice.interaction", teamId, taskId: value.taskId });
  }, [onEvent, teamId, value.taskId]);

  // Wrap the host callbacks so telemetry fires after a committed interaction.
  // An omitted base callback ⇒ omitted wrapper ⇒ the affordance capability-gates off.
  const handleOpenChange = onOpenForAnyoneChange
    ? (open: boolean) => {
        onOpenForAnyoneChange(open);
        emit();
      }
    : undefined;

  const handleClaim = onClaim
    ? (memberId: string) => {
        onClaim(memberId);
        emit();
      }
    : undefined;

  const handleAssigneeChange = onAssigneeChange
    ? (memberId: string | undefined) => {
        onAssigneeChange(memberId);
        emit();
      }
    : undefined;

  // Neutral state sentence for the polite live region (never a negative frame).
  const assignee = resolveMember(value.assigneeId, members);
  const stateSentence =
    state === "claimed"
      ? `Assigned to ${assignee?.displayName ?? value.assigneeId ?? "a teammate"}`
      : state === "open"
        ? "Open for anyone"
        : "Unassigned";

  return (
    <div
      role="group"
      aria-label={ariaLabel ?? "Task assignment choice"}
      className={cn(
        "reveal-up flex flex-wrap items-center gap-x-3 gap-y-2",
        density === "compact" ? "text-xs" : "text-sm",
        className,
      )}
    >
      {/* The open-flag is always renderable (stays visible + toggleable in "claimed"). */}
      <OpenForAnyoneToggle
        open={value.openForAnyone}
        onOpenChange={handleOpenChange}
        label={labels?.openForAnyone}
        readOnly={readOnly}
        density={density}
      />

      {state === "claimed" ? (
        <AssigneeChip
          value={value}
          members={members}
          onAssigneeChange={handleAssigneeChange}
          readOnly={readOnly}
          density={density}
          releaseLabel={labels?.release}
          reassignLabel={labels?.reassign}
        />
      ) : (
        <ClaimButton
          memberId={currentMemberId}
          onClaim={handleClaim}
          label={labels?.claim}
          readOnly={readOnly}
          density={density}
        />
      )}

      <span aria-live="polite" className="sr-only">
        {stateSentence}
      </span>
    </div>
  );
}
