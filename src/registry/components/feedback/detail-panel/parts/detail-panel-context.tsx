"use client";

import { createContext, useContext } from "react";
import type { DetailPanelContextValue } from "../types";

export const DetailPanelContext =
  createContext<DetailPanelContextValue | null>(null);

export function useDetailPanel(): DetailPanelContextValue {
  const ctx = useContext(DetailPanelContext);
  if (!ctx) {
    throw new Error(
      "DetailPanel.Header / .Body / .Actions must be used inside <DetailPanel>.",
    );
  }
  return ctx;
}
