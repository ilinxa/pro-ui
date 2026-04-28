"use client";

import { createContext, useContext } from "react";
import type { AreaContext } from "../types";

export const AreaContextContext = createContext<AreaContext | null>(null);

export function useAreaContext(): AreaContext {
  const ctx = useContext(AreaContextContext);
  if (!ctx) {
    throw new Error(
      "useAreaContext must be called inside a Workspace area's render() subtree",
    );
  }
  return ctx;
}
