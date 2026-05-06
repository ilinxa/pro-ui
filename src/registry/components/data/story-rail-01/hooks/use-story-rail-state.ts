"use client";

import { useEffect, useReducer, useRef } from "react";
import type {
  StoryRailDelta,
  StoryRailItem,
  StoryRailLocalAction,
  Subscribe,
} from "../types";

// ─── Pure helpers ────────────────────────────────────────────────────────────

function insertAtPosition(
  state: StoryRailItem[],
  item: StoryRailItem,
  position: "start" | "end" | undefined,
): StoryRailItem[] {
  if (position === "end") return [...state, item];
  return [item, ...state]; // default "start"
}

function removeById(state: StoryRailItem[], id: string): StoryRailItem[] {
  const next = state.filter((i) => i.id !== id);
  return next.length === state.length ? state : next;
}

function patchById(
  state: StoryRailItem[],
  id: string,
  patch: Partial<StoryRailItem>,
): StoryRailItem[] {
  let mutated = false;
  const next = state.map((i) => {
    if (i.id !== id) return i;
    mutated = true;
    return { ...i, ...patch };
  });
  return mutated ? next : state;
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

/** Pure reducer — exported for hosts driving their own state. */
export function storyRailReducer(
  state: StoryRailItem[],
  action: StoryRailLocalAction,
): StoryRailItem[] {
  switch (action.kind) {
    case "add":
      return insertAtPosition(state, action.item, action.position);
    case "remove":
      return removeById(state, action.itemId);
    case "viewed":
      return patchById(state, action.itemId, { hasUnread: false });
    case "update":
      return patchById(state, action.itemId, action.partial);
    case "subscribe-delta": {
      const d = action.delta;
      switch (d.kind) {
        case "added":
          return insertAtPosition(state, d.item, d.position);
        case "removed":
          return removeById(state, d.itemId);
        case "viewed":
          return patchById(state, d.itemId, { hasUnread: false });
        case "updated":
          return patchById(state, d.itemId, d.partial);
      }
      return state;
    }
    case "reset":
      return action.next;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface UseStoryRailStateOptions {
  /** Captured ON MOUNT only — subsequent prop changes are ignored. */
  initialItems: StoryRailItem[];
  subscribe?: Subscribe<StoryRailDelta>;
  onSubscribeDelta?: (delta: StoryRailDelta) => void;
}

export interface UseStoryRailStateResult {
  items: StoryRailItem[];
  dispatch: React.Dispatch<StoryRailLocalAction>;
}

export function useStoryRailState(
  opts: UseStoryRailStateOptions,
): UseStoryRailStateResult {
  const [items, dispatch] = useReducer(storyRailReducer, opts.initialItems);

  const onSubscribeDeltaRef = useRef(opts.onSubscribeDelta);
  useEffect(() => {
    onSubscribeDeltaRef.current = opts.onSubscribeDelta;
  });

  const subscribe = opts.subscribe;
  useEffect(() => {
    if (!subscribe) return;
    const unsub = subscribe((delta) => {
      onSubscribeDeltaRef.current?.(delta);
      dispatch({ kind: "subscribe-delta", delta });
    });
    return unsub;
  }, [subscribe]);

  return { items, dispatch };
}
