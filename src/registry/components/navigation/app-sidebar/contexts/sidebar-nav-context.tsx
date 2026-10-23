"use client";

import { createContext, useContext } from "react";
import type { SidebarReducerAction, SidebarReducerState } from "../lib/sidebar-reducer";
import type { AppSidebarHandle, AppSidebarLabels, AppSidebarMode } from "../types";

/**
 * Context shape consumed by <AppSidebarTrigger> (C7), prefab parts
 * (<NavBrand>, <NavUser>, <NavBadge>) (C6/C9), and any consumer-rendered
 * descendant that wants to read sidebar state without prop drilling.
 *
 * L40: each <AppSidebar> creates its own provider scoped to its subtree,
 * so multi-instance pages get isolated contexts automatically. <Trigger>
 * reads the NEAREST provider (standard React context behavior).
 *
 * The context value is `null` when there's no provider above — descendants
 * MUST handle this (e.g., <Trigger> falls back to disabled + dev warn;
 * <NavBadge> falls back to position="inline-end" per L46).
 *
 * v0.5.0 — the drawer renders its chrome inside a NESTED provider whose
 * `state.collapsed` is `false` and `mode` is `"mobile"`, so parts never draw
 * their collapsed (icon-only) variant inside the drawer.
 */
export interface AppSidebarContextValue {
  // Latest reducer state — descendants read here, not via prop drilling
  state: SidebarReducerState;

  // Dispatch — descendants use this to mutate (e.g., <Trigger> dispatches TOGGLE_MOBILE)
  dispatch: React.Dispatch<SidebarReducerAction>;

  // Imperative handle — same surface as the <AppSidebar ref={...}>
  // (descendants like <Trigger> use this when they're given an explicit `controls` prop)
  handle: AppSidebarHandle;

  // Element id of the sidebar — `<Trigger aria-controls>` hooks into this
  sidebarId: string;

  /** v0.5.0 — resolved labels (defaults merged with the `labels` prop). */
  labels: AppSidebarLabels;
  /** v0.5.0 — which render of the chrome this subtree is in. */
  mode: AppSidebarMode;
  /** v0.5.0 — resolved text direction. */
  dir: "ltr" | "rtl";
  /** v0.5.0 — physical edge the rail sits on (resolved from `side` + `dir`); tooltips open away from it. */
  physicalSide: "left" | "right";
  /** v0.5.0 — badge count formatter (C3); undefined = built-in. */
  formatBadgeCount?: (value: number, max: number) => string;
}

export const AppSidebarContext = createContext<AppSidebarContextValue | null>(null);
AppSidebarContext.displayName = "AppSidebarContext";

/** Internal helper — returns the context value or null. Used by prefab parts + trigger. */
export function useAppSidebarContextOrNull(): AppSidebarContextValue | null {
  return useContext(AppSidebarContext);
}

/**
 * Which render of the sidebar the calling component is in: `"desktop"`,
 * `"mobile"` (the drawer), or `null` outside an `<AppSidebar>`. Lets a
 * `topSlot` / `footerSlot` occupant adapt to the drawer.
 */
export function useAppSidebarMode(): AppSidebarMode | null {
  return useContext(AppSidebarContext)?.mode ?? null;
}
