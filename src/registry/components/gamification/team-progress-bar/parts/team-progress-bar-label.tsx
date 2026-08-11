"use client";

import { cn } from "@/lib/utils";

import { useTeamProgressBar } from "../hooks/use-team-progress-bar";

/**
 * Tier B — the numeric readout. Reads the resolved progress from context
 * (never re-derives it) and renders `"62%"` or `"5 / 8 milestones"`, optionally
 * prefixed with the team name (`"Team Aurora — 62%"`). The number is the
 * load-bearing value: it uses JetBrains Mono (`font-mono`), `tabular-nums`, and
 * never truncates — only the team name truncates when space is tight.
 */
export function TeamProgressBarLabel({ className }: { className?: string }) {
  const { pct, doneCount, total, team, labelFormat } = useTeamProgressBar();

  const readout =
    labelFormat === "fraction" && total != null
      ? `${doneCount} / ${total} milestones`
      : `${pct}%`;

  return (
    <div className={cn("flex items-baseline gap-1.5 text-sm", className)}>
      {team.name ? (
        <>
          <span className="min-w-0 truncate text-muted-foreground">
            {team.name}
          </span>
          <span className="text-muted-foreground" aria-hidden>
            —
          </span>
        </>
      ) : null}
      <span className="shrink-0 font-mono font-medium tabular-nums text-foreground">
        {readout}
      </span>
    </div>
  );
}
