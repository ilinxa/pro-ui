"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";

import { TeamFeedbackLoop01 } from "./team-feedback-loop-01";
import { TeamFeedbackLoopRoot } from "./parts/team-feedback-loop-root";
import { TeamFeedbackNudge } from "./parts/team-feedback-nudge";
import {
  FEEDBACK_EVENTS,
  LONG_NEXT_TASK,
  LONG_TITLE_EVENT,
  NEXT_TASK,
} from "./dummy-data";
import type { FeedbackEvent, TeamFeedbackLoopHandle } from "./types";

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
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function TeamFeedbackLoop01Demo() {
  const ref = React.useRef<TeamFeedbackLoopHandle>(null);
  const [confetti, setConfetti] = React.useState(true);
  const [placement, setPlacement] = React.useState<"inline" | "corner">("inline");
  const [showNudge, setShowNudge] = React.useState(true);

  const fire = (event: FeedbackEvent) => ref.current?.celebrate(event);
  const rapid = () => {
    // Newest wins — no stacking, single timer.
    fire(FEEDBACK_EVENTS["task-complete"]);
    window.setTimeout(() => fire(FEEDBACK_EVENTS.badge), 120);
    window.setTimeout(() => fire(FEEDBACK_EVENTS.milestone), 240);
  };

  return (
    <div className="flex w-full max-w-2xl flex-col gap-5">
      <Section
        title="Fire a celebration"
        hint="Imperative celebrate() — a brief (<1s), skippable, NON-BLOCKING band at the bottom. Click behind it: the page stays fully interactive. Press Esc or ✕ to skip."
      >
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => fire(FEEDBACK_EVENTS.milestone)}>
            Milestone
          </Button>
          <Button size="sm" onClick={() => fire(FEEDBACK_EVENTS.badge)}>
            Badge
          </Button>
          <Button size="sm" onClick={() => fire(FEEDBACK_EVENTS["task-complete"])}>
            Task complete
          </Button>
          <Button size="sm" variant="outline" onClick={() => fire(LONG_TITLE_EVENT)}>
            Long title
          </Button>
          <Button size="sm" variant="outline" onClick={rapid}>
            Rapid ×3 (newest wins)
          </Button>
        </div>
      </Section>

      <Section
        title="Options"
        hint="Confetti is opt-in + lazy (milestone/badge only, never under reduced motion). Toggle your OS reduced-motion setting to see the static branch."
      >
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={confetti}
              onChange={(e) => setConfetti(e.target.checked)}
            />
            enableConfetti
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={showNudge}
              onChange={(e) => setShowNudge(e.target.checked)}
            />
            show nudge
          </label>
          <label className="flex items-center gap-1.5">
            nudge placement:
            <select
              value={placement}
              onChange={(e) =>
                setPlacement(e.target.value as "inline" | "corner")
              }
              className="rounded border border-border bg-background px-1.5 py-0.5"
            >
              <option value="inline">inline</option>
              <option value="corner">corner</option>
            </select>
          </label>
        </div>
      </Section>

      <Section
        title="Live loop (celebration + nudge)"
        hint="The inline nudge renders here; accept/dismiss are penalty-free. Watch the console for callbacks."
      >
        <div className="rounded-lg border border-dashed border-border p-4">
          <TeamFeedbackLoop01
            ref={ref}
            teamId="T-001"
            enableConfetti={confetti}
            nextTask={
              showNudge
                ? placement === "corner"
                  ? LONG_NEXT_TASK
                  : NEXT_TASK
                : undefined
            }
            nudgePlacement={placement}
            onNextTask={(s) => console.info("[demo] accept next task", s.taskId)}
            onNudgeDismiss={(s) => console.info("[demo] dismiss nudge", s.taskId)}
            onCelebrationDismiss={(e, reason) =>
              console.info("[demo] celebration dismissed", e.kind, reason)
            }
          />
        </div>
      </Section>

      <Section
        title="Composed / lighter (nudge only)"
        hint="Hand-assembled Root + only TeamFeedbackNudge — no celebration, and the confetti chunk never loads."
      >
        <TeamFeedbackLoopRoot
          teamId="T-001"
          nextTask={NEXT_TASK}
          onNextTask={(s) => console.info("[demo] accept", s.taskId)}
        >
          {/* Only the nudge is mounted — no celebration part, no confetti chunk. */}
          <TeamFeedbackNudge />
        </TeamFeedbackLoopRoot>
      </Section>
    </div>
  );
}
