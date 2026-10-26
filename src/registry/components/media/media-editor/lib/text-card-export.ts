import type { FontOption, GradientPreset, TextOnlyState } from "../types";

export interface TextCardExportOptions {
  textOnly: TextOnlyState;
  /** Resolved background preset for `textOnly.gradientId` (null: the default). */
  background: GradientPreset | null;
  /** Font list used to resolve `textOnly.fontFamily` to a CSS family. */
  fonts: FontOption[];
  /** Card size in CSS px (the on-screen text surface). */
  width: number;
  height: number;
  /** Output px per CSS px. Default 2. */
  pixelRatio?: number;
  /** Default "image/png". */
  mimeType?: "image/jpeg" | "image/png" | "image/webp";
  /** 0..1, jpeg / webp only. Default 0.9. */
  quality?: number;
  /**
   * The live on-screen font size in CSS px. When given it replaces the
   * 7 %-of-card-width estimate, so the export matches the preview.
   */
  fontSizePx?: number;
  /**
   * The live text box width in CSS px (what the on-screen textarea wraps at).
   * Replaces the fixed 320 px wrap width.
   */
  textBoxWidth?: number;
  /** Text direction of the on-screen surface; sets `ctx.direction`. */
  direction?: "ltr" | "rtl";
}

// Layout constants mirror `parts/text-only-canvas.tsx`:
//   container `px-8` (32px each side), textarea `w-full max-w-[20rem]`,
//   `rows={3}`, font-size clamp(1.5rem, 7vw, 3rem), line-height 1.2,
//   font-weight 600, text-shadow 0 2px 8px rgba(0,0,0,0.25), centred text.
const PAD_X = 32;
const MAX_TEXT_WIDTH = 320;
const MIN_FONT = 24;
const MAX_FONT = 48;
const LINE_HEIGHT = 1.2;
const ROWS = 3;
const FONT_WEIGHT = 600;

// ─── CSS resolution helpers ───────────────────────────────────────────

/**
 * Resolve a CSS value through a temporary element's computed style, so
 * `var(--x)`, `oklch(...)` and friends reach canvas as concrete values.
 */
function resolveViaStyle(
  prop: "color" | "backgroundColor" | "fontFamily",
  value: string,
): string {
  if (typeof document === "undefined" || !document.body) return value;
  const el = document.createElement("span");
  el.style.position = "absolute";
  el.style.visibility = "hidden";
  el.style.pointerEvents = "none";
  el.style[prop] = value;
  document.body.appendChild(el);
  try {
    const computed = window.getComputedStyle(el)[prop];
    return computed && computed.length > 0 ? computed : value;
  } finally {
    el.remove();
  }
}

const TRANSPARENT = /^(transparent|rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)|rgb\(\s*0\s+0\s+0\s*\/\s*0\s*\))$/i;
const COLOR_TOKEN =
  /#[0-9a-f]{3,8}\b|(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^)]*\)/i;

function isTransparent(color: string): boolean {
  return TRANSPARENT.test(color.trim());
}

function resolveColor(value: string): string {
  return resolveViaStyle("color", value);
}

/** Split `a, b(c, d), e` on top-level commas. */
function splitTopLevel(input: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of input) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

// ─── Gradient parsing ────────────────────────────────────────────────

interface ParsedStop {
  color: string;
  /** Raw position as written (`"40%"`, `"12px"`) or null. */
  position: string | null;
}

interface ParsedGradient {
  /** CSS angle in degrees, or a corner (sx, sy: -1 / +1 in screen axes). */
  direction: { angle: number } | { corner: { sx: number; sy: number } };
  stops: ParsedStop[];
}

const SIDE_ANGLE: Record<string, number> = {
  top: 0,
  right: 90,
  bottom: 180,
  left: 270,
};

function parseDirection(arg: string): ParsedGradient["direction"] | null {
  const angle = /^(-?\d*\.?\d+)(deg|grad|rad|turn)$/i.exec(arg);
  if (angle) {
    const n = Number(angle[1]);
    const unit = angle[2].toLowerCase();
    const deg =
      unit === "deg"
        ? n
        : unit === "grad"
          ? n * 0.9
          : unit === "rad"
            ? (n * 180) / Math.PI
            : n * 360;
    return { angle: deg };
  }
  const to = /^to\s+(.+)$/i.exec(arg);
  if (!to) return null;
  const words = to[1].toLowerCase().split(/\s+/);
  if (words.length === 1 && words[0] in SIDE_ANGLE) {
    return { angle: SIDE_ANGLE[words[0]] };
  }
  if (words.length === 2) {
    const sx = words.includes("right") ? 1 : words.includes("left") ? -1 : 0;
    const sy = words.includes("bottom") ? 1 : words.includes("top") ? -1 : 0;
    if (sx !== 0 && sy !== 0) return { corner: { sx, sy } };
  }
  return null;
}

function parseStop(arg: string): ParsedStop {
  const m = /^(.*\S)\s+(-?\d*\.?\d+(?:%|px))$/.exec(arg);
  if (m) return { color: m[1], position: m[2] };
  return { color: arg, position: null };
}

/** Parse `linear-gradient(...)`; null when the value is anything else. */
function parseLinearGradient(css: string): ParsedGradient | null {
  const m = /^\s*(?:repeating-)?linear-gradient\(([\s\S]*)\)\s*$/i.exec(css);
  if (!m) return null;
  const args = splitTopLevel(m[1]);
  if (args.length < 2) return null;
  let direction: ParsedGradient["direction"] = { angle: 180 };
  let stopArgs = args;
  const dir = parseDirection(args[0]);
  if (dir) {
    direction = dir;
    stopArgs = args.slice(1);
  }
  if (stopArgs.length < 1) return null;
  const stops = stopArgs.map(parseStop);
  return { direction, stops };
}

/** Fill positions: explicit ones (as fractions), the rest spread evenly. */
function stopOffsets(stops: ParsedStop[], lineLength: number): number[] {
  const offsets: Array<number | null> = stops.map((s) => {
    if (!s.position) return null;
    const n = parseFloat(s.position);
    if (s.position.endsWith("%")) return n / 100;
    return lineLength > 0 ? n / lineLength : 0;
  });
  if (offsets[0] === null) offsets[0] = 0;
  const last = offsets.length - 1;
  if (offsets[last] === null) offsets[last] = 1;
  let prev = 0;
  for (let i = 1; i <= last; i++) {
    if (offsets[i] === null) {
      let next = i;
      while (offsets[next] === null) next++;
      const a = offsets[prev] as number;
      const b = offsets[next] as number;
      for (let j = prev + 1; j < next; j++) {
        offsets[j] = a + ((b - a) * (j - prev)) / (next - prev);
      }
      i = next;
    }
    prev = i;
  }
  let running = -Infinity;
  return offsets.map((o) => {
    running = Math.max(running, o as number);
    return Math.min(1, Math.max(0, running));
  });
}

function buildGradient(
  ctx: CanvasRenderingContext2D,
  g: ParsedGradient,
  w: number,
  h: number,
): CanvasGradient {
  let dx: number;
  let dy: number;
  if ("angle" in g.direction) {
    const rad = (g.direction.angle * Math.PI) / 180;
    dx = Math.sin(rad);
    dy = -Math.cos(rad);
  } else {
    const { sx, sy } = g.direction.corner;
    const nx = sx * h;
    const ny = sy * w;
    const len = Math.hypot(nx, ny) || 1;
    dx = nx / len;
    dy = ny / len;
  }
  const length = Math.abs(w * dx) + Math.abs(h * dy);
  const cx = w / 2;
  const cy = h / 2;
  const gradient = ctx.createLinearGradient(
    cx - (dx * length) / 2,
    cy - (dy * length) / 2,
    cx + (dx * length) / 2,
    cy + (dy * length) / 2,
  );
  const offsets = stopOffsets(g.stops, length);
  g.stops.forEach((s, i) => {
    gradient.addColorStop(offsets[i], resolveColor(s.color));
  });
  return gradient;
}

/** A fill style for any `GradientPreset.background` value. */
function backgroundFill(
  ctx: CanvasRenderingContext2D,
  css: string,
  w: number,
  h: number,
): string | CanvasGradient {
  const parsed = parseLinearGradient(css);
  if (parsed) return buildGradient(ctx, parsed, w, h);
  // Plain colour, or anything else (radial / conic / layered / var(...)).
  const resolved = resolveViaStyle("backgroundColor", css);
  if (
    resolved.trim() !== "" &&
    !isTransparent(resolved) &&
    !/gradient\(|url\(|var\(/i.test(resolved)
  ) {
    return resolved;
  }
  const token = COLOR_TOKEN.exec(css);
  if (token) return resolveColor(token[0]);
  return "black";
}

// ─── Text layout ─────────────────────────────────────────────────────

/** Wrap one paragraph to `maxWidth`, breaking over-long words by character. */
function wrapParagraph(
  ctx: CanvasRenderingContext2D,
  paragraph: string,
  maxWidth: number,
): string[] {
  if (paragraph === "") return [""];
  const lines: string[] = [];
  let line = "";
  const fits = (s: string) => ctx.measureText(s).width <= maxWidth;
  for (const word of (paragraph.match(/\S+\s*|\s+/g) ?? [])) {
    const candidate = line + word;
    if (fits(candidate.trimEnd())) {
      line = candidate;
      continue;
    }
    if (line !== "") {
      lines.push(line.trimEnd());
      line = "";
    }
    if (fits(word.trimEnd())) {
      line = word;
      continue;
    }
    for (const ch of word) {
      if (line !== "" && !fits(line + ch)) {
        lines.push(line);
        line = "";
      }
      line += ch;
    }
  }
  lines.push(line.trimEnd());
  return lines;
}

function resolveFamily(textOnly: TextOnlyState, fonts: FontOption[]): string {
  const match = fonts.find(
    (f) => f.family === textOnly.fontFamily || f.id === textOnly.fontFamily,
  );
  const family = match ? match.family : textOnly.fontFamily;
  if (!family) return "sans-serif";
  return resolveViaStyle("fontFamily", family);
}

/**
 * Draw a text card with Canvas 2D (no DOM clone, no SVG foreignObject): the
 * background (solid colour or CSS linear-gradient parsed into a canvas
 * gradient) and the wrapped, centred text laid out like `TextOnlyCanvas`.
 * Waits for the font (`document.fonts.load`) before drawing.
 *
 * Layout note: the on-screen textarea is `rows={3}` and scrolls beyond that;
 * an export must not lose text, so more than three lines are laid out as one
 * block centred on the card instead.
 */
export async function exportTextCardBlob(
  opts: TextCardExportOptions,
): Promise<{ blob: Blob; width: number; height: number }> {
  const {
    textOnly,
    background,
    fonts,
    width,
    height,
    pixelRatio = 2,
    mimeType = "image/png",
    quality = 0.9,
    fontSizePx,
    textBoxWidth,
    direction,
  } = opts;

  const family = resolveFamily(textOnly, fonts);
  // The live size wins; else the on-screen `7vw` is estimated from the card's
  // own width (the closest stand-in).
  const fontSize =
    typeof fontSizePx === "number" && Number.isFinite(fontSizePx) && fontSizePx > 0
      ? fontSizePx
      : Math.round(Math.min(MAX_FONT, Math.max(MIN_FONT, width * 0.07)) * 100) / 100;
  const font = `${FONT_WEIGHT} ${fontSize}px ${family}`;

  try {
    await document.fonts?.load(font, textOnly.text || undefined);
  } catch {
    // An unavailable font falls back to the next family in the stack.
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * pixelRatio));
  canvas.height = Math.max(1, Math.round(height * pixelRatio));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("media-editor: 2D canvas context unavailable");
  ctx.scale(pixelRatio, pixelRatio);

  // Background (the on-screen surface falls back to black).
  ctx.fillStyle = backgroundFill(ctx, background?.background ?? "black", width, height);
  ctx.fillRect(0, 0, width, height);

  // Text.
  ctx.font = font;
  if (direction) ctx.direction = direction;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = resolveColor(textOnly.textColor);
  ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
  ctx.shadowBlur = 8 * pixelRatio;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2 * pixelRatio;

  const boxWidth =
    typeof textBoxWidth === "number" && Number.isFinite(textBoxWidth) && textBoxWidth > 0
      ? Math.max(1, Math.min(textBoxWidth, width))
      : Math.max(1, Math.min(MAX_TEXT_WIDTH, width - PAD_X * 2));
  const lineHeight = fontSize * LINE_HEIGHT;
  const lines = textOnly.text
    .split("\n")
    .flatMap((p) => wrapParagraph(ctx, p, boxWidth));
  const blockLines = Math.max(lines.length, ROWS);
  const top = (height - blockLines * lineHeight) / 2;
  // Fewer than 3 lines sit at the top of the 3-row textarea; more are centred.
  lines.forEach((line, i) => {
    if (line === "") return;
    ctx.fillText(line, width / 2, top + (i + 0.5) * lineHeight);
  });

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) =>
        b ? resolve(b) : reject(new Error("media-editor: canvas.toBlob returned null")),
      mimeType,
      mimeType === "image/png" ? undefined : quality,
    );
  });
  return { blob, width: canvas.width, height: canvas.height };
}
