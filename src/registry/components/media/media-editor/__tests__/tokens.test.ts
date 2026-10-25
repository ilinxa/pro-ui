/**
 * media-editor 0.5.0 (ME2) - colour classes in the shipped base + capture slice are tokens.
 *
 * Source scan (the gate `validate-contract` allows black and white over media; this pins the
 * stricter 0.5.0 rule): no palette class, no `bg-black/N` scrim, no `text-white` /
 * `bg-white` / `border-white` / `ring-white` family. Documented exceptions:
 *   - the opaque black stage behind the live camera preview (`bg-black`, editor-camera.tsx x2);
 *   - dark ink (`text-black`) on a `bg-media-overlay-foreground` chip - there is no
 *     "ink over media" token.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..");
const SKIP_DIRS = new Set(["__tests__"]);
const SKIP_FILES = new Set(["demo.tsx", "usage.tsx", "meta.ts", "dummy-data.ts"]);

function shipped(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(name)) out.push(...shipped(full));
    } else if (/\.(tsx?)$/.test(name) && !SKIP_FILES.has(name)) {
      out.push(full);
    }
  }
  return out;
}

/** Drop `//` and block comments so prose never counts. */
function code(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const FILES = shipped(ROOT).map((f) => ({
  rel: relative(ROOT, f).replace(/\\/g, "/"),
  src: code(readFileSync(f, "utf8")),
}));

const PALETTE =
  /(?<![\w-])(?:[\w:[\]&>-]*:)?(?:bg|text|border|ring|fill|stroke|from|via|to|outline|shadow|divide|decoration|accent|caret)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}(?:\/\d+)?(?![\w-])/g;

function hits(re: RegExp): string[] {
  const out: string[] = [];
  for (const { rel, src } of FILES) {
    src.split("\n").forEach((line, i) => {
      for (const m of line.matchAll(re)) out.push(`${rel}:${i + 1} ${m[0]}`);
    });
  }
  return out;
}

describe("media chrome colours are tokens", () => {
  it("scans the base and the capture slice", () => {
    const rels = FILES.map((f) => f.rel);
    expect(rels).toContain("media-editor.tsx");
    expect(rels).toContain("features/capture/parts/editor-camera.tsx");
    expect(rels).toContain("parts/tool-text-input.tsx");
    expect(FILES.length).toBeGreaterThan(30);
  });

  it("has no Tailwind palette class", () => {
    expect(hits(PALETTE)).toEqual([]);
  });

  it("has no bg-black/N scrim, text-white, bg-white, border-white or ring-white", () => {
    expect(hits(/(?<![\w-])(?:[\w:[\]&>-]*:)?bg-black\/\d+(?![\w-])/g)).toEqual([]);
    expect(hits(/(?<![\w-])(?:[\w:[\]&>-]*:)?(?:text|bg|border|ring|from|via|to)-white(?:\/\d+)?(?![\w-])/g)).toEqual(
      [],
    );
    expect(hits(/scrollbar-(?:thumb|track)-white/g)).toEqual([]);
  });

  it("puts no /N on media-overlay (it would multiply the 0.55 alpha)", () => {
    expect(hits(/(?<![\w-])(?:[\w:[\]&>-]*:)?bg-media-overlay\/\d+/g)).toEqual([]);
  });

  it("keeps bg-black only as the opaque stage behind the live camera preview", () => {
    expect(hits(/(?<![\w-/])(?:[\w:[\]&>-]*:)?bg-black(?![\w/-])/g)).toEqual([
      expect.stringMatching(/^features\/capture\/parts\/editor-camera\.tsx:\d+ bg-black$/),
      expect.stringMatching(/^features\/capture\/parts\/editor-camera\.tsx:\d+ bg-black$/),
    ]);
  });

  it("uses text-black only as ink on a bg-media-overlay-foreground chip", () => {
    const stray: string[] = [];
    for (const { rel, src } of FILES) {
      src.split("\n").forEach((line, i) => {
        if (/(?<![\w-])(?:[\w:[\]&>-]*:)?text-black(?![\w-])/.test(line) && !line.includes("bg-media-overlay-foreground")) {
          stray.push(`${rel}:${i + 1}`);
        }
      });
    }
    expect(stray).toEqual([]);
  });

  it("the former palette sites use the semantic tokens", () => {
    const src = (rel: string) => FILES.find((f) => f.rel === rel)!.src;
    expect(src("features/capture/parts/camera-permission-prompt.tsx")).toContain("text-warning");
    expect(src("features/capture/parts/editor-camera.tsx")).toContain("bg-destructive");
    expect(src("features/capture/parts/shutter-button.tsx")).toContain("bg-destructive");
    expect(src("parts/tool-text-input.tsx")).toContain("hover:bg-destructive/15");
  });

  it("every raw var(--x) in a shipped class string has a fallback or names a default shadcn token", () => {
    // `--media-overlay*` only exist in this repo's globals.css; a consumer install ships just
    // `--color-media-overlay*` (with fallbacks), so a raw var(--media-overlay-foreground) is undefined there.
    const SHADCN = new Set([
      "--background", "--foreground", "--card", "--card-foreground", "--popover", "--popover-foreground",
      "--primary", "--primary-foreground", "--secondary", "--secondary-foreground", "--muted",
      "--muted-foreground", "--accent", "--accent-foreground", "--destructive", "--border", "--input", "--ring",
    ]);
    const bad: string[] = [];
    for (const { rel, src } of FILES) {
      src.split(/\r?\n/).forEach((line, i) => {
        for (const m of line.matchAll(/var\((--[\w-]+)(,)?/g)) {
          if (!m[2] && !SHADCN.has(m[1]!)) bad.push(`${rel}:${i + 1} ${m[1]}`);
        }
      });
    }
    expect(bad).toEqual([]);
  });

  it("no hover: background/border utility is identical to its base utility (a lost hover affordance)", () => {
    const dead: string[] = [];
    for (const { rel, src } of FILES) {
      src.split(/\r?\n/).forEach((line, i) => {
        const tokens = line.split(/[\s"'`]+/);
        for (const t of tokens) {
          const m = /^hover:((?:bg|border)-[\w/.[\]-]+)$/.exec(t);
          if (m && tokens.includes(m[1]!)) dead.push(`${rel}:${i + 1} ${t}`);
        }
      });
    }
    expect(dead).toEqual([]);
  });

  it("small text over the scrim is not thinner than /75 (contrast), and the crop hint is not /70", () => {
    expect(hits(/text-media-overlay-foreground\/(?:[1-6]\d)(?![\d])/g)).toEqual([]);
    expect(FILES.find((f) => f.rel === "media-editor.tsx")!.src).not.toMatch(/text-\[10px\] text-muted-foreground\/70/);
  });

  it("fixed-size controls cannot be squeezed, and small targets are >= 24px", () => {
    const src = (rel: string) => FILES.find((f) => f.rel === rel)!.src;
    expect(src("parts/color-swatch-picker.tsx")).toMatch(/inline-grid shrink-0 place-items-center size-7/);
    expect(src("parts/tool-text-input.tsx")).toMatch(/min-h-6 min-w-6/);
    expect(src("parts/tool-crop-overlay.tsx")).toMatch(/"min-h-6 rounded-full/);
    // The crop-aspect chips the editor itself mounts (not the exported ToolCropOverlay).
    expect(src("media-editor.tsx")).toMatch(/"min-h-6 min-w-6 rounded px-2 py-0\.5 text-xs/);
    expect(src("parts/tool-sticker-picker.tsx")).toMatch(/"min-h-6 flex-none/);
    const canvas = src("parts/editor-canvas.tsx");
    expect(Number(/const HANDLE_HIT = (\d+)/.exec(canvas)![1])).toBeGreaterThanOrEqual(24);
    expect(canvas).toMatch(/width: HANDLE_HIT/);
  });
});
