"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import { useLatestRef } from "../../_shared/gamification-kit";
import { TeamTrophyShelfContext } from "../hooks/use-team-trophy-shelf";
import { indexById, newlyEarned } from "../lib/diff";
import { earnedCount, resolveSlots, totalCount } from "../lib/resolve";
import type {
  Badge,
  TeamTrophyShelfContextValue,
  TeamTrophyShelfRootProps,
} from "../types";

const EMPTY_AWARDS: ReadonlySet<string> = new Set();

/**
 * Tier B — headless provider. Owns ALL state: the resolved slot list, the
 * **newly-earned diff** (SSR-safe), the `badges.viewed` telemetry, and the
 * open-badge callback path. Renders `children`. No layout opinion.
 *
 * The diff uses React's "storing information from previous renders" pattern
 * (setState **during render**, not in an effect): `prevBadges` is seeded from the
 * first render's `badges`, so the initial/hydration render sees `prev === current`
 * → no award animates on load. A later controlled `badges` update that flips a
 * badge's `awardedAt` on computes exactly one fresh award set. This avoids a
 * `set-state-in-effect` mounted flag (forbidden by the repo lint rule) and never
 * reads a ref during render.
 */
export function TeamTrophyShelfRoot({
  badges,
  team,
  showLocked = true,
  title,
  size = "md",
  animateAward = true,
  onEvent,
  onBadgeOpen,
  renderBadgeIcon,
  className,
  "aria-label": ariaLabel,
  children,
}: TeamTrophyShelfRootProps) {
  // --- SSR-safe newly-earned diff (setState during render) ---
  const [prevBadges, setPrevBadges] = React.useState<Badge[]>(badges);
  const [newAwards, setNewAwards] = React.useState<ReadonlySet<string>>(EMPTY_AWARDS);

  if (badges !== prevBadges) {
    setPrevBadges(badges);
    if (!animateAward) {
      setNewAwards(EMPTY_AWARDS);
    } else {
      // v0.1.2 (review §6 medium) — UNION the fresh diff with the ids still
      // mid-reveal instead of replacing wholesale: a second `badges` update
      // during a reveal (e.g. two awards landing in quick succession) used to
      // cancel the first badge's animation. `onAwardDone` retires each id
      // individually, so still-pending ids simply finish their reveal.
      const fresh = newlyEarned(badges, indexById(prevBadges));
      setNewAwards((pending) => {
        if (fresh.size === 0) return pending;
        const next = new Set(pending);
        for (const id of fresh) next.add(id);
        return next;
      });
    }
  }

  // --- Derived (pure) ---
  const slots = React.useMemo(
    () => resolveSlots(badges, showLocked),
    [badges, showLocked],
  );
  const earned = React.useMemo(() => earnedCount(badges), [badges]);
  const total = React.useMemo(() => totalCount(badges), [badges]);

  // --- Telemetry: badges.viewed (no id) once on first view ---
  const firedView = React.useRef(false);
  const onEventRef = useLatestRef(onEvent);
  const hasEventHandler = Boolean(onEvent);
  React.useEffect(() => {
    if (firedView.current || !hasEventHandler) return;
    firedView.current = true;
    onEventRef.current?.({ type: "badges.viewed", teamId: team.id });
    // `onEventRef` is a stable ref object — listed for exhaustive-deps only.
  }, [team.id, hasEventHandler, onEventRef]);

  // --- Interaction ---
  const onBadgeOpenRef = useLatestRef(onBadgeOpen);
  const isInteractive = Boolean(onBadgeOpen);

  const openBadge = React.useCallback(
    (badge: Badge) => {
      onEventRef.current?.({
        type: "badges.viewed",
        teamId: team.id,
        badgeId: badge.id,
      });
      onBadgeOpenRef.current?.(badge);
    },
    // `onBadgeOpenRef`/`onEventRef` are stable ref objects — listed for
    // exhaustive-deps only.
    [team.id, onBadgeOpenRef, onEventRef],
  );

  const onAwardDone = React.useCallback((badgeId: string) => {
    setNewAwards((prev) => {
      if (!prev.has(badgeId)) return prev;
      const next = new Set(prev);
      next.delete(badgeId);
      return next;
    });
  }, []);

  const contextValue = React.useMemo<TeamTrophyShelfContextValue>(
    () => ({
      slots,
      team,
      title,
      size,
      showLocked,
      animateAward,
      newAwards,
      earnedCount: earned,
      totalCount: total,
      isInteractive,
      openBadge,
      onAwardDone,
      renderBadgeIcon,
    }),
    [
      slots,
      team,
      title,
      size,
      showLocked,
      animateAward,
      newAwards,
      earned,
      total,
      isInteractive,
      openBadge,
      onAwardDone,
      renderBadgeIcon,
    ],
  );

  return (
    <TeamTrophyShelfContext.Provider value={contextValue}>
      <section
        className={cn("flex w-full flex-col gap-3", className)}
        aria-label={ariaLabel ?? "Team trophies"}
      >
        {children}
      </section>
    </TeamTrophyShelfContext.Provider>
  );
}
