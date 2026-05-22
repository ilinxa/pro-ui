"use client";

import { createContext, useContext } from "react";
import type { SidebarReducerAction, SidebarReducerState } from "../lib/sidebar-reducer";
import type { RichSidebarHandle } from "../types";

/**
 * Context shape consumed by <RichSidebarTrigger> (C7), prefab parts
 * (<NavBrand>, <NavUser>, <NavBadge>) (C6/C9), and any consumer-rendered
 * descendant that wants to read sidebar state without prop drilling.
 *
 * L40: each <RichSidebar> creates its own provider scoped to its subtree,
 * so multi-instance pages get isolated contexts automatically. <Trigger>
 * reads the NEAREST provider (standard React context behavior).
 *
 * The context value is `null` when there's no provider above — descendants
 * MUST handle this (e.g., <Trigger> falls back to disabled + dev warn;
 * <NavBadge> falls back to position="inline-end" per L46).
 */
export interface RichSidebarContextValue {
  // Latest reducer state — descendants read here, not via prop drilling
  state: SidebarReducerState;

  // Dispatch — descendants use this to mutate (e.g., <Trigger> dispatches TOGGLE_MOBILE)
  dispatch: React.Dispatch<SidebarReducerAction>;

  // Imperative handle — same surface as the <RichSidebar ref={...}>
  // (descendants like <Trigger> use this when they're given an explicit `controls` prop)
  handle: RichSidebarHandle;

  // Element id of the sidebar — `<Trigger aria-controls>` hooks into this
  sidebarId: string;
}

export const RichSidebarContext = createContext<RichSidebarContextValue | null>(null);
RichSidebarContext.displayName = "RichSidebarContext";

/** Internal helper — returns the context value or null. Used by prefab parts + trigger. */
export function useRichSidebarContextOrNull(): RichSidebarContextValue | null {
  return useContext(RichSidebarContext);
}
