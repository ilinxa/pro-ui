import type { ResolvedTheme, ThemeKey } from "../types";

/**
 * Per system decision #37 + plan §8.5: theme colors come from CSS
 * variables in globals.css. Sigma's settings take concrete strings, so
 * we resolve to RGB(A) at runtime via getComputedStyle.
 *
 * Per system decision #8: missing keys (in `customColors` overrides)
 * fall back to dark-theme defaults regardless of the current document
 * theme. Q-P9 lock: capture defaults once at module-init via temporary
 * `.dark` element so we don't depend on the document state at runtime.
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

let darkFallbacksCache: ResolvedTheme | null = null;

function captureDarkFallbacks(): ResolvedTheme {
  if (darkFallbacksCache) return darkFallbacksCache;
  if (typeof document === "undefined") {
    // SSR — return neutral hex fallbacks; first client-side resolve
    // will overwrite via computed styles.
    darkFallbacksCache = {
      background: "#1f1f23",
      edgeDefault: "#e5e5ea",
      edgeMuted: "#9b9ba1",
      labelColor: "#e5e5ea",
      hullFill: "#2a2a30",
      hullBorder: "#7a7a82",
      selectionRing: "#bfff66",
      hoverGlow: "#bfff66",
    };
    return darkFallbacksCache;
  }
  const helper = document.createElement("div");
  helper.className = "dark";
  helper.style.position = "absolute";
  helper.style.visibility = "hidden";
  helper.style.pointerEvents = "none";
  document.body.appendChild(helper);
  const style = getComputedStyle(helper);
  const fallback: ResolvedTheme = {
    background: style.getPropertyValue(VAR_MAP.background).trim() || "#1f1f23",
    edgeDefault: style.getPropertyValue(VAR_MAP.edgeDefault).trim() || "#e5e5ea",
    edgeMuted: style.getPropertyValue(VAR_MAP.edgeMuted).trim() || "#9b9ba1",
    labelColor: style.getPropertyValue(VAR_MAP.labelColor).trim() || "#e5e5ea",
    hullFill: style.getPropertyValue(VAR_MAP.hullFill).trim() || "#2a2a30",
    hullBorder:
      style.getPropertyValue(VAR_MAP.hullBorder).trim() || "#7a7a82",
    selectionRing:
      style.getPropertyValue(VAR_MAP.selectionRing).trim() || "#bfff66",
    hoverGlow: style.getPropertyValue(VAR_MAP.hoverGlow).trim() || "#bfff66",
  };
  document.body.removeChild(helper);
  darkFallbacksCache = fallback;
  return fallback;
}

export function resolveTheme(
  theme: "dark" | "light" | "custom",
  customColors?: Partial<Record<ThemeKey, string>>,
): ResolvedTheme {
  const fallbacks = captureDarkFallbacks();

  if (typeof document === "undefined") {
    // SSR — return fallbacks merged with overrides
    return mergeOverrides(fallbacks, customColors);
  }

  // Read current document theme regardless of theme prop — the prop
  // selects the CSS variable scope (light/dark) but the document already
  // has the right class set by next-themes.
  const root = document.documentElement;
  const computed = getComputedStyle(root);

  const resolved: ResolvedTheme = {
    background:
      computed.getPropertyValue(VAR_MAP.background).trim() || fallbacks.background,
    edgeDefault:
      computed.getPropertyValue(VAR_MAP.edgeDefault).trim() || fallbacks.edgeDefault,
    edgeMuted:
      computed.getPropertyValue(VAR_MAP.edgeMuted).trim() || fallbacks.edgeMuted,
    labelColor:
      computed.getPropertyValue(VAR_MAP.labelColor).trim() || fallbacks.labelColor,
    hullFill:
      computed.getPropertyValue(VAR_MAP.hullFill).trim() || fallbacks.hullFill,
    hullBorder:
      computed.getPropertyValue(VAR_MAP.hullBorder).trim() || fallbacks.hullBorder,
    selectionRing:
      computed.getPropertyValue(VAR_MAP.selectionRing).trim() ||
      fallbacks.selectionRing,
    hoverGlow:
      computed.getPropertyValue(VAR_MAP.hoverGlow).trim() || fallbacks.hoverGlow,
  };

  // Wrap any oklch(...) values from globals.css into a renderable form.
  // Sigma's WebGL renderer needs hex/rgb/rgba; oklch is supported by
  // modern Chromium but not all WebGL contexts. We pass the raw string
  // and let the browser parse it — if that ever breaks, switch to
  // CSS.parseColor or a small oklch→rgb shim here.

  if (theme === "custom") {
    return mergeOverrides(resolved, customColors);
  }

  return resolved;
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
