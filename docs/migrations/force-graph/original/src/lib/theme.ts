import type { ResolvedTheme, ThemeKey } from "../types";

/**
 * Per system decision #37 + plan §8.5: theme colors come from CSS
 * variables in globals.css. Sigma's settings take concrete strings, so
 * we resolve to RGB(A) at runtime via getComputedStyle.
 *
 * The graph's theme is decoupled from the host document's light/dark
 * class — we capture both palettes by reading from hidden helper
 * elements (one with `.dark`, one without). Whichever the caller asks
 * for via the `theme` prop wins. This keeps the canvas + label colors
 * stable across host theme flips.
 *
 * Per system decision #8: missing keys (in `customColors` overrides)
 * fall back to dark-theme defaults regardless of the requested theme.
 */

const VAR_MAP: Record<ThemeKey, string> = {
  background: "--background",
  edgeDefault: "--foreground",
  edgeMuted: "--muted-foreground",
  labelColor: "--foreground",
  hullFill: "--accent",
  hullBorder: "--accent-foreground",
  selectionRing: "--primary",
  hoverGlow: "--ring",
};

const ALL_THEME_KEYS: ThemeKey[] = [
  "background",
  "edgeDefault",
  "edgeMuted",
  "labelColor",
  "hullFill",
  "hullBorder",
  "selectionRing",
  "hoverGlow",
];

const SSR_DARK_FALLBACK: ResolvedTheme = {
  background: "#1f1f23",
  edgeDefault: "#e5e5ea",
  edgeMuted: "#9b9ba1",
  labelColor: "#e5e5ea",
  hullFill: "#2a2a30",
  hullBorder: "#7a7a82",
  selectionRing: "#bfff66",
  hoverGlow: "#bfff66",
};

const SSR_LIGHT_FALLBACK: ResolvedTheme = {
  background: "#f6f6f7",
  edgeDefault: "#1a1a1d",
  edgeMuted: "#6c6e76",
  labelColor: "#1a1a1d",
  hullFill: "#eaeaee",
  hullBorder: "#3a3a3f",
  selectionRing: "#7ad32f",
  hoverGlow: "#7ad32f",
};

let darkPaletteCache: ResolvedTheme | null = null;
let lightPaletteCache: ResolvedTheme | null = null;

function capturePalette(variant: "dark" | "light"): ResolvedTheme {
  if (typeof document === "undefined") {
    return variant === "dark" ? SSR_DARK_FALLBACK : SSR_LIGHT_FALLBACK;
  }
  const helper = document.createElement("div");
  // The light variant is the `:root` scope — no class needed.
  if (variant === "dark") helper.className = "dark";
  helper.style.position = "absolute";
  helper.style.visibility = "hidden";
  helper.style.pointerEvents = "none";
  document.body.appendChild(helper);
  const style = getComputedStyle(helper);
  const ssr = variant === "dark" ? SSR_DARK_FALLBACK : SSR_LIGHT_FALLBACK;
  const pick = (varName: string, defaultHex: string): string =>
    toRenderableColor(style.getPropertyValue(varName).trim() || defaultHex);
  const palette: ResolvedTheme = {
    background: pick(VAR_MAP.background, ssr.background),
    edgeDefault: pick(VAR_MAP.edgeDefault, ssr.edgeDefault),
    edgeMuted: pick(VAR_MAP.edgeMuted, ssr.edgeMuted),
    labelColor: pick(VAR_MAP.labelColor, ssr.labelColor),
    hullFill: pick(VAR_MAP.hullFill, ssr.hullFill),
    hullBorder: pick(VAR_MAP.hullBorder, ssr.hullBorder),
    selectionRing: pick(VAR_MAP.selectionRing, ssr.selectionRing),
    hoverGlow: pick(VAR_MAP.hoverGlow, ssr.hoverGlow),
  };
  document.body.removeChild(helper);
  return palette;
}

function getPalette(variant: "dark" | "light"): ResolvedTheme {
  if (variant === "dark") {
    if (!darkPaletteCache) darkPaletteCache = capturePalette("dark");
    return darkPaletteCache;
  }
  if (!lightPaletteCache) lightPaletteCache = capturePalette("light");
  return lightPaletteCache;
}

export function resolveTheme(
  theme: "dark" | "light" | "custom",
  customColors?: Partial<Record<ThemeKey, string>>,
): ResolvedTheme {
  // `"custom"` means start from the dark palette (per decision #8) and
  // overlay `customColors`. `"dark"` and `"light"` pick the matching
  // palette directly.
  const base =
    theme === "light" ? getPalette("light") : getPalette("dark");

  if (theme === "custom" || customColors) {
    return mergeOverrides(base, customColors);
  }
  return base;
}

/**
 * Pure-JS variant that never touches the DOM — returns the static
 * fallback palette. Used for SSR + the initial client render so that
 * both produce identical markup; `resolveTheme` runs in a post-mount
 * effect to upgrade to the actual computed-style colors.
 */
export function resolveThemeStatic(
  theme: "dark" | "light" | "custom",
  customColors?: Partial<Record<ThemeKey, string>>,
): ResolvedTheme {
  const base =
    theme === "light" ? SSR_LIGHT_FALLBACK : SSR_DARK_FALLBACK;
  if (theme === "custom" || customColors) {
    return mergeOverrides(base, customColors);
  }
  return base;
}

/**
 * Sigma's WebGL renderer parses colors via a small hex/rgb parser and
 * does NOT understand `lab(...)`, `oklch(...)`, or other modern color
 * spaces. Browsers convert custom-property `oklch(...)` values to
 * `lab(...)` when read via `getComputedStyle`. Modern Chromium accepts
 * `lab(...)` as a canvas `fillStyle` but re-serializes back to
 * `lab(...)` rather than `rgb(...)`, so a fillStyle round-trip is
 * insufficient. Instead we paint a 1×1 pixel and read its rasterized
 * RGB values back via `getImageData` — that forces concrete conversion
 * regardless of input color space.
 */
let canvasContext: CanvasRenderingContext2D | null | undefined;

function getCanvasContext(): CanvasRenderingContext2D | null {
  if (canvasContext !== undefined) return canvasContext;
  if (typeof document === "undefined") {
    canvasContext = null;
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  canvasContext = canvas.getContext("2d", { willReadFrequently: true });
  return canvasContext;
}

export function toRenderableColor(value: string): string {
  if (!value) return value;
  const trimmed = value.trim();
  // Hex / rgb / rgba pass through unchanged — Sigma's parser handles
  // them directly, no need for a canvas hop.
  if (
    trimmed.startsWith("#") ||
    trimmed.startsWith("rgb(") ||
    trimmed.startsWith("rgba(")
  ) {
    return trimmed;
  }
  const ctx = getCanvasContext();
  if (!ctx) return trimmed;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = "#000";
  ctx.fillStyle = trimmed;
  ctx.fillRect(0, 0, 1, 1);
  try {
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    if (a === 255) return `rgb(${r}, ${g}, ${b})`;
    return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
  } catch {
    // Tainted canvas (shouldn't happen for synthetic fills, but guard
    // anyway) — fall back to the input.
    return trimmed;
  }
}

function mergeOverrides(
  base: ResolvedTheme,
  overrides: Partial<Record<ThemeKey, string>> | undefined,
): ResolvedTheme {
  if (!overrides) return base;
  const out: ResolvedTheme = { ...base };
  for (const key of ALL_THEME_KEYS) {
    const v = overrides[key];
    if (typeof v === "string" && v.length > 0 && isValidColor(v)) {
      out[key] = v;
    }
  }
  return out;
}

function isValidColor(value: string): boolean {
  // Plan-stage tightening per §13/§14 edge-cases: validate via
  // CSS.supports("color", value); invalid values silently fall back to
  // the base theme value (logged in dev but not thrown).
  if (typeof CSS === "undefined" || typeof CSS.supports !== "function") {
    return true;
  }
  return CSS.supports("color", value);
}
