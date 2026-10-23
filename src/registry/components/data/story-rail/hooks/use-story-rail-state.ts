"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type {
  StoryRailDelta,
  StoryRailItem,
  StoryRailLocalAction,
  Subscribe,
} from "../types";

// useLayoutEffect warns during SSR; the effect is only needed in the browser.
const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const EMPTY: StoryRailItem[] = [];

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
  /** Uncontrolled seed — captured ON MOUNT only. Ignored while controlled. */
  initialItems?: StoryRailItem[];
  /**
   * Controlled value — controlled only when `onItemsChange` is ALSO passed;
   * then it wins on every render and mutations are reported instead of applied.
   */
  items?: StoryRailItem[];
  /**
   * Receives the next list for every mutation. With `items` it makes the rail
   * controlled; without `items` the rail stays uncontrolled and just notifies.
   */
  onItemsChange?: (next: StoryRailItem[]) => void;
  subscribe?: Subscribe<StoryRailDelta>;
  onSubscribeDelta?: (delta: StoryRailDelta) => void;
}

export interface UseStoryRailStateResult {
  items: StoryRailItem[];
  /**
   * Stable identity. Computes the next list from the latest one, applies it
   * when uncontrolled, and reports it through `onItemsChange` either way.
   */
  dispatch: React.Dispatch<StoryRailLocalAction>;
  /** True when both `items` and `onItemsChange` are passed. */
  isControlled: boolean;
}

export function useStoryRailState(
  opts: UseStoryRailStateOptions,
): UseStoryRailStateResult {
  const [internalItems, setInternalItems] = useState<StoryRailItem[]>(
    () => opts.initialItems ?? EMPTY,
  );

  const isControlled =
    opts.items !== undefined && opts.onItemsChange !== undefined;
  const items = isControlled ? (opts.items ?? EMPTY) : internalItems;

  // Mutations compute from the latest list. Between a mutation and the next
  // render that carries it, a second mutation (a burst of realtime deltas)
  // must build on the first — so the computed list is kept here and replaced
  // only when the list the rail renders CHANGES IDENTITY (a new prop / new
  // internal state). Unrelated rail commits (scroll state) never reset it, so
  // a host that applies updates asynchronously loses nothing. A controlled
  // host that rejects a change re-renders with a fresh array to discard it.
  const latestRef = useRef(items);
  useIsoLayoutEffect(() => {
    latestRef.current = items;
  }, [items]);

  const isControlledRef = useRef(isControlled);
  const onItemsChangeRef = useRef(opts.onItemsChange);
  const onSubscribeDeltaRef = useRef(opts.onSubscribeDelta);
  useIsoLayoutEffect(() => {
    isControlledRef.current = isControlled;
    onItemsChangeRef.current = opts.onItemsChange;
    onSubscribeDeltaRef.current = opts.onSubscribeDelta;
  });

  const dispatch = useCallback((action: StoryRailLocalAction) => {
    const prev = latestRef.current;
    const next = storyRailReducer(prev, action);
    if (next === prev) return;
    latestRef.current = next;
    if (!isControlledRef.current) setInternalItems(next);
    onItemsChangeRef.current?.(next);
  }, []);

  const subscribe = opts.subscribe;
  useEffect(() => {
    if (!subscribe) return;
    const unsub = subscribe((delta) => {
      onSubscribeDeltaRef.current?.(delta);
      dispatch({ kind: "subscribe-delta", delta });
    });
    return unsub;
  }, [subscribe, dispatch]);

  return { items, dispatch, isControlled };
}
