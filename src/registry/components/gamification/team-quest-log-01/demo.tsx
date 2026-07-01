"use client";

import * as React from "react";

import { TeamQuestLog01 } from "./team-quest-log-01";
import { TeamQuestLogRoot } from "./parts/team-quest-log-root";
import { TeamQuestChapters } from "./parts/team-quest-chapters";
import { TeamQuestNameEditor } from "./parts/team-quest-name-editor";
import {
  CHAPTERS,
  CHAPTERS_WITH_UNRESOLVED,
  MILESTONES,
  MILESTONES_ALL_DONE,
  MILESTONES_NONE_DONE,
  TEAM_AURORA,
  TEAM_AURORA_DEFAULT,
} from "./dummy-data";
import type { Team } from "./types";

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
      <div className="rounded-lg border border-border bg-card p-5">{children}</div>
    </section>
  );
}

/** Controlled host — proves the skippable quest-name loop (clear → revert). */
function LiveQuestLog() {
  const [team, setTeam] = React.useState<Team>(TEAM_AURORA_DEFAULT);
  return (
    <TeamQuestLog01
      team={team}
      milestones={MILESTONES}
      chapters={CHAPTERS}
      onQuestNameChange={(questName) =>
        setTeam((t) => ({ ...t, questName: questName || undefined }))
      }
      onChapterClick={(c) => console.info("[demo] chapter clicked", c.id)}
      onEvent={(e) => console.info("[demo] gamification event", e)}
    />
  );
}

export default function TeamQuestLog01Demo() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-8">
      <Section
        title="Full overlay — live (name your quest)"
        hint="Starts on the default team name. Name it, edit it, or clear it to revert — never forced. Beats emit narrative.chapter-viewed once when scrolled into view."
      >
        <LiveQuestLog />
      </Section>

      <Section
        title="Custom quest name + in-progress narrative"
        hint="done · done · current (you are here) · upcoming — each visually distinct (icon + color)."
      >
        <TeamQuestLog01
          team={TEAM_AURORA}
          milestones={MILESTONES}
          chapters={CHAPTERS}
          onQuestNameChange={() => {}}
        />
      </Section>

      <Section
        title="All done vs none done"
        hint="All done → every beat completed, no 'current'. None done → the first beat is 'current'."
      >
        <div className="flex flex-col gap-6">
          <TeamQuestLog01
            team={TEAM_AURORA}
            milestones={MILESTONES_ALL_DONE}
            chapters={CHAPTERS}
            editableName={false}
          />
          <TeamQuestLog01
            team={{ ...TEAM_AURORA, questName: "Fresh Start" }}
            milestones={MILESTONES_NONE_DONE}
            chapters={CHAPTERS}
            editableName={false}
          />
        </div>
      </Section>

      <Section
        title="Edge cases"
        hint="Empty narrative (quiet placeholder) · an unresolved-milestone beat (renders gracefully)."
      >
        <div className="flex flex-col gap-6">
          <TeamQuestLog01
            team={TEAM_AURORA}
            milestones={MILESTONES}
            chapters={[]}
            editableName={false}
          />
          <TeamQuestLog01
            team={TEAM_AURORA}
            milestones={MILESTONES}
            chapters={CHAPTERS_WITH_UNRESOLVED}
            editableName={false}
          />
        </div>
      </Section>

      <Section
        title="Composed / lighter — timeline-only + name-only subsets"
        hint="Hand-assembled from Root + one part each — the compound tree-shakes to a subset."
      >
        <div className="flex flex-col gap-6">
          <TeamQuestLogRoot team={TEAM_AURORA} milestones={MILESTONES} chapters={CHAPTERS}>
            <TeamQuestChapters />
          </TeamQuestLogRoot>
          <TeamQuestLogRoot
            team={TEAM_AURORA_DEFAULT}
            milestones={[]}
            chapters={[]}
            onQuestNameChange={() => {}}
          >
            <TeamQuestNameEditor />
          </TeamQuestLogRoot>
        </div>
      </Section>
    </div>
  );
}
