import type { FontOption } from "../types";

// ─── Gradient presets for text-only mode ────────────────────────────────

export interface GradientPreset {
  id: string;
  label: string;
  /** CSS background value — used directly on the text-only canvas. */
  background: string;
}

export const DEFAULT_TEXT_GRADIENTS: GradientPreset[] = [
  {
    id: "lime",
    label: "Lime",
    background:
      "linear-gradient(135deg, oklch(0.86 0.18 132) 0%, oklch(0.62 0.16 145) 100%)",
  },
  {
    id: "sunset",
    label: "Sunset",
    background:
      "linear-gradient(135deg, oklch(0.78 0.18 35) 0%, oklch(0.58 0.22 15) 100%)",
  },
  {
    id: "lavender",
    label: "Lavender",
    background:
      "linear-gradient(135deg, oklch(0.78 0.14 290) 0%, oklch(0.56 0.18 305) 100%)",
  },
  {
    id: "ocean",
    label: "Ocean",
    background:
      "linear-gradient(135deg, oklch(0.72 0.14 220) 0%, oklch(0.45 0.18 245) 100%)",
  },
  {
    id: "mono",
    label: "Mono",
    background:
      "linear-gradient(135deg, oklch(0.30 0.005 250) 0%, oklch(0.13 0.006 250) 100%)",
  },
  {
    id: "fire",
    label: "Fire",
    background:
      "linear-gradient(135deg, oklch(0.82 0.20 60) 0%, oklch(0.55 0.22 25) 100%)",
  },
  {
    id: "rose",
    label: "Rose",
    background:
      "linear-gradient(135deg, oklch(0.80 0.16 10) 0%, oklch(0.58 0.20 350) 100%)",
  },
  {
    id: "midnight",
    label: "Midnight",
    background:
      "linear-gradient(135deg, oklch(0.32 0.10 270) 0%, oklch(0.18 0.04 250) 100%)",
  },
];

// ─── Default fonts (Onest + JetBrains Mono first per design system) ─────

export const DEFAULT_FONTS: FontOption[] = [
  { id: "onest", label: "Onest", family: "var(--font-onest, Onest, sans-serif)" },
  {
    id: "mono",
    label: "Mono",
    family: "var(--font-mono, 'JetBrains Mono', monospace)",
  },
  { id: "serif", label: "Serif", family: "Georgia, 'Times New Roman', serif" },
  { id: "display", label: "Display", family: "'Playfair Display', Georgia, serif" },
  { id: "rounded", label: "Rounded", family: "system-ui, -apple-system, sans-serif" },
  { id: "handwriting", label: "Handwriting", family: "'Comic Sans MS', cursive" },
  { id: "impact", label: "Impact", family: "Impact, 'Arial Black', sans-serif" },
  { id: "courier", label: "Courier", family: "'Courier New', monospace" },
];

// ─── Default color palette ──────────────────────────────────────────────

export const DEFAULT_COLOR_PRESETS: string[] = [
  "#ffffff",
  "#000000",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
  "#6366f1",
  "#a855f7",
  "#ec4899",
];
