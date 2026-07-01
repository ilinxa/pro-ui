"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { useTeamTrophyShelf } from "../hooks/use-team-trophy-shelf";

/**
 * Tier B — the optional header: the shelf title + an earned-count pill
 * ("4 / 9"). The count is "N of THIS team's M", never a rank or comparison.
 */
export function TeamTrophyShelfHeader({ className }: { className?: string }) {
  const { team, title, earnedCount, totalCount } = useTeamTrophyShelf();

  const heading =
    title ?? (team.name ? `${team.name} trophies` : "Team trophies");

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <h3 className="text-sm font-semibold text-foreground">{heading}</h3>
      <Separator orientation="vertical" className="h-4" />
      <Badge variant="secondary" className="font-mono tabular-nums">
        {earnedCount} / {totalCount}
      </Badge>
    </div>
  );
}
