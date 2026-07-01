"use client";

import { Trophy } from "lucide-react";

import { cn } from "@/lib/utils";

import { useTeamTrophyShelf } from "../hooks/use-team-trophy-shelf";

/**
 * Tier B — the designed empty state (no badges defined, or none earned with
 * `showLocked={false}`). Encouraging, Competence-positive — never an error or a
 * dead panel. Renders only when the resolved slot list is empty.
 */
export function TeamTrophyShelfEmpty({ className }: { className?: string }) {
  // Subscribe so the part throws if mis-mounted outside a Root (consistency).
  useTeamTrophyShelf();

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center",
        className,
      )}
    >
      <Trophy className="size-8 text-muted-foreground/60" aria-hidden />
      <p className="text-sm font-medium text-foreground">No trophies yet</p>
      <p className="max-w-xs text-xs text-muted-foreground">
        Milestones your team completes will land here.
      </p>
    </div>
  );
}
