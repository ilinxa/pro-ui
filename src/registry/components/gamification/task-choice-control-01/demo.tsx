"use client";

import * as React from "react";

import { TaskChoiceControl01 } from "./task-choice-control-01";
import { AssigneeChip } from "./parts/assignee-chip";
import { ClaimButton } from "./parts/claim-button";
import { OpenForAnyoneToggle } from "./parts/open-for-anyone-toggle";
import {
  CHOICE_ASSIGNED_AND_OPEN,
  CHOICE_CLAIMED,
  CHOICE_OPEN,
  CHOICE_STALE_ASSIGNEE,
  CHOICE_UNASSIGNED,
  CURRENT_MEMBER_ID,
  TASK_TEAM,
} from "./dummy-data";
import type { TaskChoiceControlProps, TaskChoiceState } from "./types";

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** A controlled host — wires the callbacks so the never-forced loop is live. */
function LiveControl({
  initial,
  density,
}: {
  initial: TaskChoiceState;
  density?: TaskChoiceControlProps["density"];
}) {
  const [value, setValue] = React.useState<TaskChoiceState>(initial);
  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-[border-color,box-shadow] duration-200 hover:border-primary/40 hover:shadow-md">
      <TaskChoiceControl01
        teamId="design-team"
        members={TASK_TEAM}
        value={value}
        currentMemberId={CURRENT_MEMBER_ID}
        density={density}
        onOpenForAnyoneChange={(open) =>
          setValue((v) => ({ ...v, openForAnyone: open }))
        }
        onClaim={(memberId) =>
          setValue((v) => ({ ...v, assigneeId: memberId, openForAnyone: false }))
        }
        onAssigneeChange={(memberId) =>
          setValue((v) => ({ ...v, assigneeId: memberId }))
        }
        onEvent={(e) => console.info("[demo] gamification event", e)}
      />
    </div>
  );
}

export default function TaskChoiceControl01Demo() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-8">
      <Section
        title="Three states — live"
        hint="Open (invite + I'll take this) · Claimed (chip + neutral Release + Reassign) · Unassigned (volunteer + open together). Try claiming, releasing, reassigning — nothing penalizes anyone."
      >
        <div className="flex flex-col gap-4">
          <LiveControl initial={CHOICE_OPEN} />
          <LiveControl initial={CHOICE_CLAIMED} />
          <LiveControl initial={CHOICE_UNASSIGNED} />
        </div>
      </Section>

      <Section
        title="Legal edge — assigned AND open"
        hint="Resolves to claimed; the open-for-anyone flag stays visible and toggleable alongside the chip."
      >
        <LiveControl initial={CHOICE_ASSIGNED_AND_OPEN} />
      </Section>

      <Section
        title="Density — compact (kanban) vs comfortable (rich card)"
        hint="Compact collapses labels to icons + truncates the assignee name (avatar floor)."
      >
        <div className="flex flex-col gap-4">
          <LiveControl initial={CHOICE_CLAIMED} density="compact" />
          <LiveControl initial={CHOICE_CLAIMED} density="comfortable" />
        </div>
      </Section>

      <Section
        title="Read-only (display-only)"
        hint="Omit the callbacks (or pass readOnly) → all actions hide; the state still shows. No dead buttons."
      >
        <div className="rounded-lg border border-border bg-card p-4 transition-[border-color,box-shadow] duration-200 hover:border-primary/40 hover:shadow-md">
          <TaskChoiceControl01
            teamId="design-team"
            members={TASK_TEAM}
            value={CHOICE_CLAIMED}
            readOnly
          />
        </div>
      </Section>

      <Section
        title="À-la-carte sub-parts (no assembly)"
        hint="Each flat export mounts standalone — the toggle, the claim action, and the assignee chip on their own."
      >
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-[border-color,box-shadow] duration-200 hover:border-primary/40 hover:shadow-md">
          <OpenForAnyoneToggle open onOpenChange={() => {}} />
          <ClaimButton memberId={CURRENT_MEMBER_ID} onClaim={() => {}} />
          <AssigneeChip
            value={CHOICE_STALE_ASSIGNEE}
            members={TASK_TEAM}
            onAssigneeChange={() => {}}
          />
        </div>
      </Section>
    </div>
  );
}
