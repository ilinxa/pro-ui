"use client";

import { createContext, useContext } from "react";
import type { SidebarReducerAction, SidebarReducerState } from "../lib/sidebar-reducer";
import type { SidebarNav01Handle } from "../types";

/**
 * Context shape consumed by <SidebarNav01Trigger> (C7), prefab parts
 * (<NavBrand>, <NavUser>, <NavBadge>) (C6/C9), and any consumer-rendered
 * descendant that wants to read sidebar state without prop drilling.
 *
 * L40: each <SidebarNav01> creates its own provider scoped to its subtree,
 * so multi-instance pages get isolated contexts automatically. <Trigger>
 * reads the NEAREST provider (standard React context behavior).
 *
 * The context value is `null` when there's no provider above — descendants
 * MUST handle this (e.g., <Trigger> falls back to disabled + dev warn;
 * <NavBadge> falls back to position="inline-end" per L46).
 */
export interface SidebarNav01ContextValue {
  // Latest reducer state — descendants read here, not via prop drilling
  state: SidebarReducerState;

  // Dispatch — descendants use this to mutate (e.g., <Trigger> dispatches TOGGLE_MOBILE)
  dispatch: React.Dispatch<SidebarReducerAction>;

  // Imperative handle — same surface as the <SidebarNav01 ref={...}>
  // (descendants like <Trigger> use this when they're given an explicit `controls` prop)
  handle: SidebarNav01Handle;

  // Element id of the sidebar — `<Trigger aria-controls>` hooks into this
  sidebarId: string;
}

export const SidebarNav01Context = createContext<SidebarNav01ContextValue | null>(null);
SidebarNav01Context.displayName = "SidebarNav01Context";

/** Internal helper — returns the context value or null. Used by prefab parts + trigger. */
export function useSidebarNav01ContextOrNull(): SidebarNav01ContextValue | null {
  return useContext(SidebarNav01Context);
}
