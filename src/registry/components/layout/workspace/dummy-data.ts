import type { AreaTree, WorkspacePreset } from "./types";

export type DemoTableRow = {
  id: string;
  task: string;
  status: "Done" | "In progress" | "Blocked";
  owner: string;
};

export const DEMO_TABLE_ROWS: DemoTableRow[] = [
  { id: "t_01", task: "Onboarding flow", status: "Done", owner: "Aria" },
  { id: "t_02", task: "Pricing page rewrite", status: "In progress", owner: "Bilal" },
  { id: "t_03", task: "API rate-limit policy", status: "Blocked", owner: "Camille" },
  { id: "t_04", task: "Mobile menu polish", status: "In progress", owner: "Dimitri" },
  { id: "t_05", task: "Audit log retention", status: "Done", owner: "Esme" },
];

export const DEMO_INITIAL_LAYOUT: AreaTree = {
  kind: "split",
  orientation: "vertical",
  ratio: 0.45,
  a: { kind: "leaf", id: "demo-left", componentId: "notes" },
  b: {
    kind: "split",
    orientation: "horizontal",
    ratio: 0.5,
    a: { kind: "leaf", id: "demo-tr", componentId: "clock" },
    b: { kind: "leaf", id: "demo-br", componentId: "counter" },
  },
};

export const DEMO_PRESETS_LAYOUTS: Record<string, AreaTree> = {
  focus: { kind: "leaf", id: "preset-focus-1", componentId: "notes" },
  split: {
    kind: "split",
    orientation: "vertical",
    ratio: 0.5,
    a: { kind: "leaf", id: "preset-split-l", componentId: "notes" },
    b: { kind: "leaf", id: "preset-split-r", componentId: "data-table" },
  },
  grid: {
    kind: "split",
    orientation: "horizontal",
    ratio: 0.5,
    a: {
      kind: "split",
      orientation: "vertical",
      ratio: 0.5,
      a: { kind: "leaf", id: "preset-grid-tl", componentId: "clock" },
      b: { kind: "leaf", id: "preset-grid-tr", componentId: "counter" },
    },
    b: {
      kind: "split",
      orientation: "vertical",
      ratio: 0.5,
      a: { kind: "leaf", id: "preset-grid-bl", componentId: "notes" },
      b: { kind: "leaf", id: "preset-grid-br", componentId: "data-table" },
    },
  },
};

export const DEMO_PRESETS: WorkspacePreset[] = [
  { id: "focus", name: "Focus", layout: DEMO_PRESETS_LAYOUTS.focus! },
  { id: "split", name: "Split", layout: DEMO_PRESETS_LAYOUTS.split! },
  { id: "grid", name: "Grid", layout: DEMO_PRESETS_LAYOUTS.grid! },
];
