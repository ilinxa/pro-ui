"use client";

import * as React from "react";

import { CooperativeChallenge01 } from "./cooperative-challenge-01";
import { OptInToggle } from "./parts/cooperative-challenge-optin";
import { TeamMemberStack } from "./parts/team-member-stack";
import { CooperativeChallengeSkeleton } from "./parts/cooperative-challenge-skeleton";
import {
  CHALLENGE_ACTIVE,
  CHALLENGE_COMPLETE,
  CHALLENGE_JOINABLE,
  CHALLENGE_LONG_LABEL,
  CHALLENGE_NO_REWARD,
  CHALLENGE_TARGET_ZERO,
  TEAM_AURORA,
  TEAM_LARGE,
  TEAM_SOLO,
} from "./dummy-data";
import type { Challenge } from "./types";

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

/** Controlled host — proves the opt-in echo + the penalty-free join/leave loop. */
function InteractiveChallenge() {
  const [optedIn, setOptedIn] = React.useState(false);
  const challenge: Challenge = { ...CHALLENGE_JOINABLE, optedIn };
  return (
    <CooperativeChallenge01
      challenge={challenge}
      team={TEAM_AURORA}
      onOptInChange={setOptedIn}
      onEvent={(e) => console.info("[demo] gamification event", e)}
    />
  );
}

export default function CooperativeChallenge01Demo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-8">
      <Section
        title="Interactive — join / leave (penalty-free)"
        hint="Controlled opt-in: joining is a prominent invite, leaving is one click with no guilt. Emits challenge.opened + challenge.opt-in."
      >
        <InteractiveChallenge />
      </Section>

      <Section
        title="Joinable (opted-out)"
        hint="A neutral, first-class invitation — the goal + reward shown as available if you join, never greyed-as-failure."
      >
        <CooperativeChallenge01
          challenge={CHALLENGE_JOINABLE}
          team={TEAM_AURORA}
          onOptInChange={() => {}}
        />
      </Section>

      <Section
        title="Active + Completed"
        hint="Opted-in and in motion → whole-team earned treatment on done (lightweight inline ack, no modal)."
      >
        <div className="flex flex-col gap-4">
          <CooperativeChallenge01
            challenge={CHALLENGE_ACTIVE}
            team={TEAM_AURORA}
            onOptInChange={() => {}}
          />
          <CooperativeChallenge01
            challenge={CHALLENGE_COMPLETE}
            team={TEAM_AURORA}
            onOptInChange={() => {}}
          />
        </div>
      </Section>

      <Section
        title="Read-only (omit onOptInChange)"
        hint="Capability-gating — with no handler the opt-in control hides; a pure progress + reward card falls out for free."
      >
        <CooperativeChallenge01 challenge={CHALLENGE_ACTIVE} team={TEAM_AURORA} />
      </Section>

      <Section
        title="Composed / lighter (bare parts, no card chrome)"
        hint="Just the penalty-free toggle + the avatar pile — the compound tree-shakes to a subset (no Root, no card)."
      >
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
          <TeamMemberStack members={TEAM_AURORA.members} />
          <OptInToggle optedIn={false} onOptInChange={() => {}} />
        </div>
      </Section>

      <Section
        title="Team sizes"
        hint="Single-member (no +N) ↔ overflowing stack (+N chip)."
      >
        <div className="flex flex-col gap-4">
          <CooperativeChallenge01
            challenge={{ ...CHALLENGE_ACTIVE, id: "solo" }}
            team={TEAM_SOLO}
            onOptInChange={() => {}}
          />
          <CooperativeChallenge01
            challenge={{ ...CHALLENGE_JOINABLE, id: "large" }}
            team={TEAM_LARGE}
            onOptInChange={() => {}}
          />
        </div>
      </Section>

      <Section
        title="Edge cases"
        hint="No reward (chip hides) · target 0 (0 / 0, never NaN) · long label (truncates) · loading skeleton."
      >
        <div className="flex flex-col gap-4">
          <CooperativeChallenge01
            challenge={CHALLENGE_NO_REWARD}
            team={TEAM_AURORA}
            onOptInChange={() => {}}
          />
          <CooperativeChallenge01
            challenge={CHALLENGE_TARGET_ZERO}
            team={TEAM_AURORA}
            onOptInChange={() => {}}
          />
          <CooperativeChallenge01
            challenge={CHALLENGE_LONG_LABEL}
            team={TEAM_LARGE}
            onOptInChange={() => {}}
          />
          <CooperativeChallengeSkeleton />
        </div>
      </Section>
    </div>
  );
}
