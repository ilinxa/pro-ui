import type { SwitcherItem } from "./types";

// Real fixtures land at C5 — minimal stub for C1 compile-clean.
export const ACCOUNT_SWITCHER_01_DUMMY_ITEMS: ReadonlyArray<SwitcherItem> = [
  { key: "personal", label: "Personal" },
];

export const ACCOUNT_SWITCHER_01_DUMMY_ACTIVE_KEY: string | null = "personal";
