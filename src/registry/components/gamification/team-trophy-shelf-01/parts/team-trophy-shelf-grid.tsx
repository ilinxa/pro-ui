"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import { useTeamTrophyShelf } from "../hooks/use-team-trophy-shelf";
import { TeamMilestoneBadge } from "./team-milestone-badge";

// The ONLY reference to the overlay is this lazy import — its chunk loads solely
// when a newly-earned badge renders (never for the bare-token path or
// `animateAward={false}`). See the compound rule's lazy-boundary requirement.
const BadgeAwardOverlay = React.lazy(() => import("./badge-award-overlay"));

/**
 * Tier B — the responsive shelf grid (`role="list"`). Reads the resolved slots +
 * per-badge new-award flags from context, staggers a `reveal-up` entrance across
 * tokens, applies a cheap CSS "pop" to newly-earned tokens (works without the
 * lazy chunk), and wraps them in the lazy `BadgeAwardOverlay` for the richer burst.
 */
export function TeamTrophyShelfGrid({ className }: { className?: string }) {
  const {
    slots,
    size,
    showLocked,
    animateAward,
    newAwards,
    isInteractive,
    openBadge,
    onAwardDone,
    renderBadgeIcon,
  } = useTeamTrophyShelf();

  return (
    <ul role="list" className={cn("flex flex-wrap gap-4", className)}>
      {slots.map((badge, i) => {
        const isNew = animateAward && newAwards.has(badge.id);
        const token = (
          <TeamMilestoneBadge
            badge={badge}
            size={size}
            showLocked={showLocked}
            onOpen={isInteractive ? openBadge : undefined}
            renderIcon={renderBadgeIcon}
            className={
              isNew
                ? "motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-500"
                : undefined
            }
          />
        );

        return (
          <li
            key={badge.id}
            role="listitem"
            className="reveal-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {isNew ? (
              <React.Suspense fallback={token}>
                <BadgeAwardOverlay active onDone={() => onAwardDone(badge.id)}>
                  {token}
                </BadgeAwardOverlay>
              </React.Suspense>
            ) : (
              token
            )}
          </li>
        );
      })}
    </ul>
  );
}
