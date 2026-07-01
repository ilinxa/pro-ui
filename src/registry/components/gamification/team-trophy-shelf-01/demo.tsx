"use client";

import * as React from "react";

import { TeamTrophyShelf01 } from "./team-trophy-shelf-01";
import { TeamMilestoneBadge } from "./parts/team-milestone-badge";
import { TeamTrophyShelfGrid } from "./parts/team-trophy-shelf-grid";
import { TeamTrophyShelfRoot } from "./parts/team-trophy-shelf-root";
import {
  EMPTY_BADGES,
  TEAM_AURORA,
  TEAM_AURORA_ALL_EARNED,
  TEAM_AURORA_BADGES,
} from "./dummy-data";
import type { Badge } from "./types";

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
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** Flips a locked badge → earned at runtime so the in-place reveal plays. */
function AwardRevealDemo() {
  const [badges, setBadges] = React.useState<Badge[]>(() =>
    TEAM_AURORA_BADGES.map((b) => ({ ...b })),
  );
  const [animate, setAnimate] = React.useState(true);

  const nextLocked = badges.find((b) => b.awardedAt == null);
  const award = () => {
    if (!nextLocked) return;
    setBadges((prev) =>
      prev.map((b) =>
        b.id === nextLocked.id ? { ...b, awardedAt: "2026-04-01T12:00:00Z" } : b,
      ),
    );
  };
  const reset = () =>
    setBadges(TEAM_AURORA_BADGES.map((b) => ({ ...b })));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={award}
          disabled={!nextLocked}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          Award next milestone
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground"
        >
          Reset
        </button>
        <label className="ml-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={animate}
            onChange={(e) => setAnimate(e.target.checked)}
          />
          animateAward
        </label>
      </div>
      <TeamTrophyShelf01 team={TEAM_AURORA} badges={badges} animateAward={animate} />
    </div>
  );
}

export default function TeamTrophyShelf01Demo() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-5">
      <Section
        title="The trophy shelf"
        hint="Earned + locked slots, header count, awarded-date on hover. Emits badges.viewed on first view."
      >
        <TeamTrophyShelf01
          team={TEAM_AURORA}
          badges={TEAM_AURORA_BADGES}
          onEvent={(e) => console.info("[demo] gamification event", e)}
          onBadgeOpen={(b) => console.info("[demo] open badge", b.id)}
        />
      </Section>

      <Section
        title="Award reveal (diff-driven, non-blocking)"
        hint="Flip a locked badge → earned to play the < 1s in-place reveal. Toggle animateAward or your OS reduced-motion setting to suppress it."
      >
        <AwardRevealDemo />
      </Section>

      <Section title="States" hint="Empty · all-earned · earned-only (showLocked=false)">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Empty (no badges)</span>
            <TeamTrophyShelf01 team={TEAM_AURORA} badges={EMPTY_BADGES} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">All earned</span>
            <TeamTrophyShelf01 team={TEAM_AURORA} badges={TEAM_AURORA_ALL_EARNED} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Earned only (showLocked=false)</span>
            <TeamTrophyShelf01
              team={TEAM_AURORA}
              badges={TEAM_AURORA_BADGES}
              showLocked={false}
              size="sm"
            />
          </div>
        </div>
      </Section>

      <Section
        title="Bare token, inline"
        hint="TeamMilestoneBadge alone — no shelf chrome, no award overlay in the bundle."
      >
        <ul className="flex flex-col gap-2">
          {TEAM_AURORA_BADGES.slice(0, 3).map((badge) => (
            <li key={badge.id} className="flex items-center gap-3">
              <TeamMilestoneBadge badge={badge} size="sm" />
              <span className="text-sm text-muted-foreground">{badge.label}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Composed / lighter (custom layout, no header)"
        hint="Hand-assembled Root + Grid with animateAward={false} — the lazy award chunk never loads."
      >
        <TeamTrophyShelfRoot
          team={TEAM_AURORA}
          badges={TEAM_AURORA_BADGES}
          animateAward={false}
        >
          <div className="rounded-xl border border-border p-4">
            <h4 className="mb-3 font-mono text-xs uppercase tracking-wide text-muted-foreground">
              Team trophies
            </h4>
            <TeamTrophyShelfGrid />
          </div>
        </TeamTrophyShelfRoot>
      </Section>
    </div>
  );
}
