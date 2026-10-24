"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Players by group name. Shared across instances ON PURPOSE — "at most one player per group
 * plays" is a cross-instance rule. Each entry is that player's own `pause`; an unmounted player
 * removes itself, and an empty group is deleted, so nothing outlives the players that use it.
 */
const groups = new Map<string, Set<() => void>>();

/**
 * Joins `group` (when set) and returns `claim()`: call it when this player starts playing — every
 * other player in the group pauses.
 */
export function useAutoplayGroup(group: string | undefined, pause: () => void): () => void {
  const pauseRef = useRef(pause);
  useEffect(() => {
    pauseRef.current = pause;
  });
  // One stable function per mount, so the Set entry is removable.
  const [member] = useState(() => () => pauseRef.current());

  useEffect(() => {
    if (!group) return;
    let set = groups.get(group);
    if (!set) groups.set(group, (set = new Set()));
    set.add(member);
    return () => {
      set.delete(member);
      if (set.size === 0 && groups.get(group) === set) groups.delete(group);
    };
  }, [group, member]);

  return useCallback(() => {
    if (!group) return;
    for (const other of groups.get(group) ?? []) if (other !== member) other();
  }, [group, member]);
}
