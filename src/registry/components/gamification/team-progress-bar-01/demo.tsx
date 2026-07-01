"use client";

import { TeamProgressBar01 } from "./team-progress-bar-01";
import { TeamProgressBarRoot } from "./parts/team-progress-bar-root";
import { TeamProgressBarTrack } from "./parts/team-progress-bar-track";
import {
  EMPTY_MILESTONES,
  TEAM_AURORA,
  TEAM_AURORA_MILESTONES,
} from "./dummy-data";

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

export default function TeamProgressBar01Demo() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-5">
      <Section
        title="From milestones, with ticks"
        hint="% = done / total · per-milestone notches · fraction readout · emits progress-bar.checked on first view"
      >
        <TeamProgressBar01
          team={TEAM_AURORA}
          milestones={TEAM_AURORA_MILESTONES}
          showTicks
          labelFormat="fraction"
          onEvent={(e) => console.info("[demo] gamification event", e)}
        />
      </Section>

      <Section
        title="Standalone, direct value"
        hint="The simplest drop-in — a 0–100 number, no milestone infrastructure."
      >
        <TeamProgressBar01 team={TEAM_AURORA} value={62} />
      </Section>

      <Section
        title="Composed / lighter (bar only, no label)"
        hint="Hand-assembled Root + Track — drop the Label and it tree-shakes away."
      >
        <TeamProgressBarRoot team={TEAM_AURORA} milestones={TEAM_AURORA_MILESTONES}>
          <TeamProgressBarTrack showTicks />
        </TeamProgressBarRoot>
      </Section>

      <Section
        title="Edge cases"
        hint="Always visible — empty renders 0%, never nothing; 0% and 100%; no team name."
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              No milestones yet (total === 0)
            </span>
            <TeamProgressBar01 team={TEAM_AURORA} milestones={EMPTY_MILESTONES} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Just started (0%)</span>
            <TeamProgressBar01 team={TEAM_AURORA} value={0} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Complete (100%)</span>
            <TeamProgressBar01 team={TEAM_AURORA} value={100} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">No team name</span>
            <TeamProgressBar01 team={{ id: "T-099" }} value={45} />
          </div>
        </div>
      </Section>
    </div>
  );
}
