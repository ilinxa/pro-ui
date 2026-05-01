# Theme and styling

## CSS variables + OKLCH integration

Tailwind v4 [defines theme tokens as `@theme` CSS custom properties](https://tailwindcss.com/docs/theme), and the modern stack ships them in OKLCH:

```css
/* src/app/globals.css (excerpt) */
:root {
  --background: oklch(0.975 0.003 250);
  --foreground: oklch(0.13 0.006 250);
  --primary: oklch(0.80 0.20 132);  /* signal-lime */
  /* ... */
}
.dark {
  --background: oklch(0.13 0.006 250);
  --foreground: oklch(0.86 0.18 132);
  /* ... */
}
```

You read these from JavaScript via `getComputedStyle(el).getPropertyValue('--background')`. **Modern Chromium and Firefox return the value in `lab(...)` notation, not the original `oklch(...)`.** Sigma's WebGL color parser only knows `#hex`, `rgb(...)`, and `rgba(...)`. Pass `lab(...)` or `oklch(...)` and the parser silently falls back to black — every node, edge, and label renders as a black void.

## The Canvas2D rasterization round-trip fix

Round-trip every CSS-variable color through a 1×1 Canvas2D pixel and read the rasterized RGB back via `getImageData`. The browser does the color-space conversion at rasterization, regardless of input notation.

```ts
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
  // Hex / rgb / rgba pass through unchanged.
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
  ctx.fillStyle = "#000";  // reset
  ctx.fillStyle = trimmed; // browser parses any color space here
  ctx.fillRect(0, 0, 1, 1);
  try {
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    if (a === 255) return `rgb(${r}, ${g}, ${b})`;
    return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
  } catch {
    return trimmed; // tainted canvas — fall back
  }
}
```

Why a 1×1 pixel and not a fillStyle round-trip? Modern Chromium accepts `lab(...)` as `fillStyle` but re-serializes it back to `lab(...)` rather than `rgb(...)`. The `getImageData` rasterization is what forces the concrete RGB output.

Reference: [`force-graph/lib/theme.ts`](../../src/registry/components/data/force-graph/lib/theme.ts).

This is the same class of bug that affects [html2canvas with Tailwind v4 OKLCH](https://github.com/niklasvh/html2canvas/issues/3269) — any library that ships its own color parser instead of letting the browser do the work hits it.

## Decoupled theme: the hidden-helper-element pattern

Sigma instances do not subscribe to documentElement class flips. If the host document toggles `.dark`, the graph keeps whatever palette it captured at construction. This is sometimes desirable (the graph keeps its visual identity regardless of host theme) and sometimes annoying (the graph fights the surrounding UI).

The force-graph procomp's posture: **decoupled by default; the consumer pipes their resolved document theme into a `theme` prop if they want coupling.**

The implementation captures both palettes by reading from hidden helper elements at module init:

```ts
function capturePalette(variant: "dark" | "light"): ResolvedTheme {
  if (typeof document === "undefined") return SSR_FALLBACK[variant];

  const helper = document.createElement("div");
  // Light is the :root scope — no class needed. Dark needs the `.dark` class.
  if (variant === "dark") helper.className = "dark";
  helper.style.position = "absolute";
  helper.style.visibility = "hidden";
  helper.style.pointerEvents = "none";
  document.body.appendChild(helper);

  const style = getComputedStyle(helper);
  const palette = {
    background: toRenderableColor(style.getPropertyValue("--background").trim()),
    foreground: toRenderableColor(style.getPropertyValue("--foreground").trim()),
    // ... other tokens
  };

  document.body.removeChild(helper);
  return palette;
}

let darkCache: ResolvedTheme | null = null;
let lightCache: ResolvedTheme | null = null;

export function getPalette(variant: "dark" | "light") {
  if (variant === "dark") return darkCache ??= capturePalette("dark");
  return lightCache ??= capturePalette("light");
}
```

Caching is safe because globals.css doesn't change at runtime. If your app supports user-customizable themes, invalidate the caches on the customization event.

Reference: [`force-graph/lib/theme.ts`](../../src/registry/components/data/force-graph/lib/theme.ts).

## SSR/hydration posture

Two-stage resolution to avoid hydration mismatch:

1. **SSR + initial client render** — return a static fallback palette (hex literals). Pure JS, no DOM access, identical markup on both sides.
2. **Post-hydration** — upgrade to `getComputedStyle`-derived values via `useSyncExternalStore` flipping a mounted flag.

```tsx
const noopSubscribe = () => () => {};
const getMountedSnapshot = () => true;
const getServerSnapshot = () => false;

export function useThemeResolution(theme: "dark" | "light" | "custom") {
  const isMounted = useSyncExternalStore(
    noopSubscribe,
    getMountedSnapshot,
    getServerSnapshot,
  );

  return useMemo(
    () => isMounted ? resolveTheme(theme) : resolveThemeStatic(theme),
    [theme, isMounted],
  );
}
```

`useSyncExternalStore` returns `false` during SSR and the initial render, then switches to `true` post-mount — without a setState-in-effect that the React Compiler-aware lint flags. Reference: [`use-theme-resolution.ts`](../../src/registry/components/data/force-graph/hooks/use-theme-resolution.ts).

## Custom `defaultDrawNodeHover` for dark canvas readability

Sigma's stock implementation hardcodes `fillStyle = "white"` and `shadowColor = "black"`. On a dark canvas the result is a glowing white rectangle with an unreadable label. Replace it.

```ts
import type { ResolvedTheme } from "./types";

export function makeDrawNodeHover(theme: ResolvedTheme) {
  return function drawNodeHover(
    ctx: CanvasRenderingContext2D,
    data: { x: number; y: number; size: number; label: string | null },
    settings: { labelSize: number; labelFont: string; labelWeight: string },
  ): void {
    const { labelSize, labelFont, labelWeight } = settings;
    ctx.font = `${labelWeight} ${labelSize}px ${labelFont}`;

    ctx.fillStyle = theme.background;
    ctx.strokeStyle = theme.labelColor;
    ctx.lineWidth = 1;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 12;
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";

    const PADDING = 4;
    if (typeof data.label === "string" && data.label.length > 0) {
      const textWidth = ctx.measureText(data.label).width;
      const boxWidth = Math.round(textWidth + PADDING * 2 + 4);
      const boxHeight = Math.round(labelSize + PADDING * 2);
      const radius = Math.max(data.size, labelSize / 2) + PADDING;
      const angleRadian = Math.asin(boxHeight / 2 / radius);
      const xDeltaCoord = Math.sqrt(Math.abs(radius ** 2 - (boxHeight / 2) ** 2));

      ctx.beginPath();
      ctx.moveTo(data.x + xDeltaCoord, data.y + boxHeight / 2);
      ctx.lineTo(data.x + radius + boxWidth, data.y + boxHeight / 2);
      ctx.lineTo(data.x + radius + boxWidth, data.y - boxHeight / 2);
      ctx.lineTo(data.x + xDeltaCoord, data.y - boxHeight / 2);
      ctx.arc(data.x, data.y, radius, angleRadian, -angleRadian);
      ctx.closePath();
      ctx.fill();

      // Stroke without shadow doubling.
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.stroke();

      ctx.fillStyle = theme.labelColor;
      ctx.fillText(
        data.label,
        data.x + Math.max(data.size, labelSize / 2) + PADDING + 2,
        data.y + labelSize / 3,
      );
    }
  };
}

new Sigma(graph, container, {
  defaultDrawNodeHover: makeDrawNodeHover(theme),
});
```

Reference: [`force-graph/lib/draw-node-hover.ts`](../../src/registry/components/data/force-graph/lib/draw-node-hover.ts).

When theme flips, re-call `setSetting("defaultDrawNodeHover", makeDrawNodeHover(newTheme))` from the theme update effect.

## Hover/selection visuals via reducers + alpha

Focus-and-neighbors highlight is typically a reducer that dims everything except the focused node and its neighbors:

```tsx
function withAlpha(rgbOrRgba: string, alpha: number): string {
  // Cheap rgba string surgery — input is already rgb(...) or rgba(...) post toRenderableColor.
  const m = rgbOrRgba.match(/^rgba?\(([^)]+)\)$/);
  if (!m) return rgbOrRgba;
  const parts = m[1].split(",").map(s => s.trim());
  return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
}

const neighbors = useMemo(() => {
  if (!hoverId) return null;
  const set = new Set<string>([hoverId]);
  graph.forEachNeighbor(hoverId, (n) => set.add(n));
  return set;
}, [hoverId, graphVersion]);

useEffect(() => {
  if (!sigma) return;
  sigma.setSetting("nodeReducer", (id, attrs) => {
    if (!neighbors) return attrs;
    if (neighbors.has(id)) return attrs;
    return { ...attrs, color: withAlpha(attrs.color, 0.2), label: "" };
  });
  sigma.setSetting("edgeReducer", (id, attrs) => {
    if (!neighbors) return attrs;
    const [s, t] = graph.extremities(id);
    if (neighbors.has(s) && neighbors.has(t)) return attrs;
    return { ...attrs, color: withAlpha(attrs.color, 0.1), hidden: false };
  });
}, [sigma, neighbors, graph]);
```

`graphVersion` is the bump counter you increment whenever the graph mutates — without it, your `neighbors` set goes stale on graph mutations.

## SVG overlay sibling to the WebGL canvas

Sigma's WebGL canvas can't draw arbitrary shapes (hulls, badges, marquee selection rects, source rings during linking) — at least not without a custom program for each. The pragmatic answer is to stack an `<svg>` overlay as a sibling to Sigma's container, transformed in lockstep with the camera.

```tsx
<div className="relative isolate">
  <SigmaContainer className="absolute inset-0" {...} />
  <svg
    className="absolute inset-0 pointer-events-none"
    width="100%"
    height="100%"
  >
    <g ref={transformGroupRef}>
      {/* hulls, badges, source rings — children read positions in graph coords */}
    </g>
  </svg>
</div>
```

To keep the SVG `<g>` synced with Sigma's camera:

```tsx
useEffect(() => {
  if (!sigma) return;
  const update = () => {
    const cam = sigma.getCamera();
    const { width, height } = sigma.getDimensions();
    // viewportToGraph for two corners gives you scale + translate
    const tl = sigma.graphToViewport({ x: 0, y: 0 });
    const matrix = `translate(${tl.x}, ${tl.y}) scale(${1 / cam.ratio})`;
    transformGroupRef.current?.setAttribute("transform", matrix);
  };
  sigma.on("afterRender", update);
  update();
  return () => sigma.off("afterRender", update);
}, [sigma]);
```

**Pointer-events:**

- The SVG layer should be `pointer-events: none` by default — the WebGL canvas underneath needs to receive mouse events for pan/zoom and Sigma's captors.
- Individual SVG elements that DO need to be clickable (e.g. a badge with a context menu) get `pointer-events: auto` opt-in.

## Tailwind v4 + the no-tailwind.config posture

Tailwind v4 ships without a JavaScript config file by default — tokens live in CSS via `@theme`. To expose tokens to non-Tailwind code (a Sigma settings object, a Canvas2D fillStyle, an inline `style={...}`):

- Read via `getComputedStyle(document.documentElement).getPropertyValue('--token-name')`.
- Pass through `toRenderableColor()` if it's going to a WebGL parser.
- Cache the resolved value if you'll read it many times (theme palettes don't change at runtime in most apps).

Don't try to import the OKLCH literals from a JS module — the source of truth is globals.css. Pulling them into JS duplicates the constant and creates drift.

## Recoloring on theme flip vs reconstructing Sigma

When the host theme flips and the graph should follow:

**Don't** tear down and rebuild the Sigma instance. That blows away the camera state, the running FA2 layout, and any per-render reducer caches.

**Do:**

1. Re-resolve the palette (read from the appropriate hidden-helper element).
2. Walk the graph and re-merge per-node and per-edge color attributes (since soft/default visual logic depends on theme).
3. Call `setSetting()` on every theme-derived Sigma setting (`defaultNodeColor`, `defaultEdgeColor`, `labelColor`, `edgeLabelColor`, `defaultDrawNodeHover`).
4. Call `sigma.refresh()` (or rely on the graphology event fire from step 2).

```tsx
useEffect(() => {
  const sigma = sigmaRef.current;
  if (!sigma) return;
  // Step 1: settings update
  sigma.setSetting("defaultNodeColor", theme.nodeColor);
  sigma.setSetting("defaultEdgeColor", theme.edgeColor);
  sigma.setSetting("labelColor", { color: theme.labelColor });
  sigma.setSetting("edgeLabelColor", { color: theme.labelColor });
  sigma.setSetting("defaultDrawNodeHover", makeDrawNodeHover(theme));

  // Step 2: per-element color recompute (parent's responsibility).
  graph.forEachNode((id, attrs) => {
    // Real signature: sigmaNodeAttributes(node, nodeTypes, theme, baseSize)
    // — see force-graph/lib/node-attributes.ts.
    graph.mergeNodeAttributes(id, sigmaNodeAttributes(state.nodes.get(id), nodeTypes, theme, settings.nodeBaseSize));
  });
  graph.forEachEdge((id, attrs) => {
    graph.mergeEdgeAttributes(id, softEdgeAttributes(state.edges.get(id), { nodes: state.nodes, groups: state.groups, edgeTypes: state.edgeTypes, theme }));
  });

  sigma.refresh();
}, [theme]);
```

Reference: [`force-graph/parts/sigma-container.tsx`](../../src/registry/components/data/force-graph/parts/sigma-container.tsx) (Sigma settings update via `setSetting`) and the parent's graph-walk recolor effect in [`force-graph/parts/canvas.tsx`](../../src/registry/components/data/force-graph/parts/canvas.tsx).

## Design system tie-in (ilinxa-ui-pro specific)

Hold the line on the tokens defined in [`globals.css`](../../src/app/globals.css):

- **Background:** never pure white. Light mode is `oklch(0.975 0.003 250)` (cool off-white); dark is `oklch(0.13 0.006 250)` (graphite-cool).
- **Lime accent:** `oklch(0.80 0.20 132)` light / `oklch(0.86 0.18 132)` dark. Always paired with near-black `--primary-foreground` — lime is too bright for white text overlays.
- **Forbidden:** purple-on-white gradient clichés, neon-saturated lime (chroma > 0.20), pure white as page background.
- **Fonts:** Onest (sans), JetBrains Mono (mono). Sigma's labelFont must match — read from `--font-sans` or pass explicit `"Onest, ui-sans-serif, system-ui, sans-serif"`.

When adding new token-bound colors to a Sigma component:
1. Add the variable in `globals.css` for both `:root` and `.dark`.
2. Add the key to `VAR_MAP` in [`force-graph/lib/theme.ts`](../../src/registry/components/data/force-graph/lib/theme.ts).
3. Add a fallback hex in `SSR_DARK_FALLBACK` and `SSR_LIGHT_FALLBACK` (used during SSR + initial client render).
4. Read in components via the `theme` prop, not direct `getComputedStyle` calls.

## Sources

- [Tailwind v4 theme variables](https://tailwindcss.com/docs/theme)
- [Better dynamic themes in Tailwind with OKLCH (Evil Martians)](https://evilmartians.com/chronicles/better-dynamic-themes-in-tailwind-with-oklch-color-magic)
- [The Mystery of Tailwind Colors v4](https://dev.to/matfrana/the-mystery-of-tailwind-colors-v4-hjh)
- [html2canvas oklch issue (same class of bug)](https://github.com/niklasvh/html2canvas/issues/3269)
- [`force-graph/lib/theme.ts`](../../src/registry/components/data/force-graph/lib/theme.ts)
- [`force-graph/lib/draw-node-hover.ts`](../../src/registry/components/data/force-graph/lib/draw-node-hover.ts)
- [`force-graph/hooks/use-theme-resolution.ts`](../../src/registry/components/data/force-graph/hooks/use-theme-resolution.ts)
