---
name: sigma-react-pro
description: Production-grade Sigma.js v3 + React 19 graph visualization. Use when building knowledge-graph viewers, force-directed layouts, network/topology UIs, or evaluating WebGL graph libraries. Covers library selection, Sigma lifecycle, FA2 internals, theming, performance, and known pitfalls.
---

# sigma-react-pro

Production-grade WebGL graph visualization with [Sigma.js v3](https://www.sigmajs.org/), [graphology](https://graphology.github.io/), and React 19. Distilled from shipping the `force-graph` procomp in this codebase against Next.js 16 + Tailwind v4, plus a 2025–2026 survey of the wider ecosystem.

## When to use this skill

Trigger on any of:

- Building knowledge-graph / network / topology / dependency-graph viewers in React.
- Evaluating WebGL-class graph libraries (Sigma vs Cytoscape vs G6 vs react-force-graph vs Reagraph).
- Adding ForceAtlas2 / live physics layouts to an existing graph UI.
- Hitting one of the [pitfalls](pitfalls-and-fixes.md) below — SSR crashes, oklch colors rendering black, FA2 fighting drag, dead-Sigma `setSetting` crashes.
- Theming a Sigma canvas against a Tailwind v4 OKLCH design system.
- Tuning a graph that ran out of frame budget — labels, edge programs, reducers, hidden-on-move.

Skip this skill for: simple node-link diagrams under ~500 elements (use `react-flow` or plain SVG); chord/sankey/treemaps (use d3); 3D cosmography (use [`react-force-graph-3d`](https://github.com/vasturiano/react-force-graph) directly).

## TL;DR cheat sheet

Memorize these or you will lose hours.

1. **`import "sigma/rendering"` references `WebGL2RenderingContext` at module-eval.** Top-level imports break Next.js prerender. Use `Promise.all([import("sigma"), import("sigma/rendering")])` inside a mount effect. Keep `import type` for compile-time types. See [sigma-lifecycle.md](sigma-lifecycle.md).
2. **OKLCH colors render as black in Sigma's WebGL parser.** Tailwind v4 uses `oklch(...)`; `getComputedStyle` returns `lab(...)` on most browsers. Sigma's parser only knows hex / `rgb(...)` / `rgba(...)`. Round-trip every CSS-variable color through a 1×1 Canvas2D pixel and read back via `getImageData`. See [theme-and-styling.md](theme-and-styling.md).
3. **`graphology-layout-forceatlas2/worker` does NOT observe `nodeAttributesUpdated`.** It builds its position matrix at `start()` and only re-reads on `nodeAdded` / `edgeAdded` / `nodeDropped` / `edgeDropped`. Setting `fixed: true` mid-drag is invisible to the worker — it keeps writing matrix positions back, fighting the cursor. **Pause the worker on `downNode`, resume on `mouseup`** — in this codebase via the `FA2Controls` wrapper (`worker.setEnabled(false)` / `worker.setEnabled(true)`), which call `layout.stop()` / `layout.start()` under the hood. Resume rebuilds the matrix and picks up the new `fixed` value. See [fa2-and-physics.md](fa2-and-physics.md).
4. **`setSetting()` on a killed Sigma instance crashes.** It schedules a `requestAnimationFrame` that runs `render()` against an empty `nodePrograms` map. Always early-return when `sigmaRef.current` is null in update effects. In cleanup, call `kill()` then null the ref — cleanup runs synchronously, so any concurrent effect can't read the ref between the two lines. See [pitfalls-and-fixes.md](pitfalls-and-fixes.md).
5. **Overriding `edgeProgramClasses` disables auto-population of `nodeProgramClasses`.** Register `NodeCircleProgram` explicitly under key `"circle"` whenever you supply edge programs.
6. **Sigma's stock `defaultDrawNodeHover` hardcodes white fill + black shadow** — illegible on a dark canvas. Replace with a theme-aware factory (see [theme-and-styling.md](theme-and-styling.md)).
7. **`hideEdgesOnMove` defaults to `true`.** Edges visibly disappear on every pan/zoom — feels broken. Flip to `false` unless you have >50k edges and need the FPS.
8. **Sigma does not subscribe to `documentElement` class flips.** If you want the graph to follow host theme, capture both palettes via hidden `.dark`/`.light` helper elements and re-apply via `setSetting` + a graph-walk recompute on theme change.
9. **React 19 Compiler-aware lint flags `setState` in effects for derivable state, and ref reads during render.** Use `useSyncExternalStore` for SSR-safe mounted-flag, key-paired derived state for loading→ready transitions, and ref-mirror patterns to keep prop-snapshot effects out of dep arrays.
10. **Mount-time prop snapshot via per-prop refs.** Keep the construction effect's deps to `[container, graph]`; mirror `theme`, `settings`, callbacks into refs read inside the async callback. Otherwise every theme flip remounts Sigma.
11. **Dynamic-import cancellation flag.** Always `let cancelled = false` in the construction effect, check it after `await`, set `cancelled = true` in cleanup. Without it a fast unmount→remount produces two live Sigma instances on the same DOM node.
12. **`refresh()` is expensive; `scheduleRefresh()` debounces to next frame.** Prefer the latter when triggered by interactions. See [Sigma lifecycle docs](https://www.sigmajs.org/docs/advanced/lifecycle/).
13. **Reducers (`nodeReducer`, `edgeReducer`) re-run on every render.** Keep them pure, branchy on a small in-memory state map (e.g. selected/hovered IDs as `Set<string>`), and avoid allocating objects per call when you can early-return the input.
14. **`event.x` / `event.y` from Sigma's mouse captor are container-relative.** Pass them straight to `viewportToGraph` — do NOT add `getBoundingClientRect()` offsets, you will teleport the node by the container's offset.
15. **Sigma's analog to `event.preventDefault()` is `event.preventSigmaDefault()`. Use both.** `preventSigmaDefault()` stops the stage panner from running in parallel with your custom drag; `event.original.preventDefault?.()` suppresses native browser behaviors (text selection, drag-image). The project calls both in its `downNode` handler.

## Architecture at a glance

Three decoupled layers, each owned by a different runtime:

```
┌─────────────────────────────────────────────────────────────┐
│  React 19 component (lifecycle, props, refs, state stores)  │
│  ─ mounts Sigma, owns disposal, mirrors props into refs     │
└─────────────┬─────────────────────────────────┬─────────────┘
              │                                 │
              ▼                                 ▼
┌─────────────────────────────┐   ┌───────────────────────────┐
│  graphology MultiGraph       │   │  Sigma.js v3 instance     │
│  ─ source of truth           │◄──┤  ─ WebGL renderer         │
│  ─ events: nodeAdded,        │   │  ─ subscribes to graph    │
│    edgeAdded, attrUpdated    │   │    events for re-renders  │
│  ─ x/y/size/color/label      │   │  ─ programs: NodeCircle,  │
│    attributes per node       │   │    EdgeRectangle,         │
└──────────────┬──────────────┘    │    EdgeArrow, custom...   │
               │                   └───────────────────────────┘
               │  shares the same MultiGraph reference
               ▼
┌─────────────────────────────────────────────────────────────┐
│  FA2 supervisor (graphology-layout-forceatlas2/worker)      │
│  ─ owns a Web Worker thread                                 │
│  ─ reads graph at start() into Float32Array matrix          │
│  ─ writes positions back via assignLayoutChanges            │
│  ─ subscribes to nodeAdded/edgeAdded/Dropped only           │
└─────────────────────────────────────────────────────────────┘
```

**Single source of truth:** the graphology MultiGraph. Sigma reads from it on graph events; FA2 reads from it on `start()`. Mutations go through graphology's API, never through Sigma's settings or FA2's matrix directly.

**React owns lifecycle, not state.** Component construction creates Sigma + FA2; cleanup kills both. State stores (Zustand, jotai, useReducer) live above the graph and bump a `graphVersion` counter to force re-renders of React-side panels — Sigma re-renders itself off graphology events, independent of React.

**Tier separation in the force-graph procomp:**

| Tier | Owns | Files in `src/registry/components/data/force-graph/` |
|------|------|--------|
| Provider | Zustand store, FA2 worker, graphology graph | `parts/provider.tsx`, `hooks/use-fa2-worker.ts`, `hooks/use-graph-store.ts` |
| Canvas | Sigma instance lifecycle | `parts/sigma-container.tsx`, `parts/canvas.tsx` |
| Interaction | drag, hover, click captors | `parts/interaction-layer.tsx`, `hooks/use-drag-handler.ts` |
| Overlay | SVG hulls/badges sibling to WebGL canvas | `parts/svg-overlay.tsx`, `parts/linking-source-overlay.tsx` |

## Decision tree: which library

Quick rule of thumb (full table in [library-selection.md](library-selection.md)):

- **Sigma.js v3** — first choice for >5k-node interactive force-directed graphs in React. WebGL, mature, opinionated. ✓ when you also need graphology's algorithms ecosystem.
- **react-force-graph (Vasturiano)** — first choice when you need 3D, when you want a "just works" React component, or when interactivity is secondary to visual impact. WebGL via Three.js. Less control over per-element rendering.
- **Cytoscape.js** — when graph analysis (algorithms, traversal, BFS/DFS, centrality) matters more than render scale. WebGL preview shipped in [3.31](https://blog.js.cytoscape.org/2025/01/13/webgl-preview/) (Jan 2025) but Canvas2D historically caps near 5k. Best React-free.
- **AntV G6 v5** — when you need Chinese-i18n design systems, mixed Canvas/WebGL/SVG, or `@antv/g6-extension-3D`. Ecosystem is large but English docs lag.
- **Reagraph** — when you want React-first WebGL with built-in clustering and don't want to wire Sigma yourself. Smaller, more opinionated, less control.
- **vis-network** — when you need a quick canvas-based diagram and don't care about scale. Maintenance has been thin.
- **ngraph** — when you want raw layout/algorithm primitives to build your own renderer.

If "should I use `@react-sigma/core`?" — see [sigma-lifecycle.md §react-sigma](sigma-lifecycle.md). Short answer: it's a thin wrapper that solves SSR via `dynamic(... { ssr: false })` and gives you `useSigma()` / `useLoadGraph()`. It does NOT solve the FA2-fixed bug, the OKLCH bug, or the dark-hover bug. If you want full control of the lifecycle and your component must be portable (e.g. shipped to NPM without a Next.js dep), build directly on `sigma` like the force-graph procomp does.

## Recipe links

| File | Covers |
|------|--------|
| [library-selection.md](library-selection.md) | Comparison matrix; "use X when …" prose |
| [sigma-lifecycle.md](sigma-lifecycle.md) | SSR-safe dynamic import, programs, reducers, captors, camera, kill, React 19 patterns |
| [fa2-and-physics.md](fa2-and-physics.md) | FA2 worker internals, fixed-attribute observability gap, drag suspension, kick(), tuning |
| [theme-and-styling.md](theme-and-styling.md) | OKLCH bug + Canvas2D fix, decoupled-theme pattern, theme-aware hover, SVG overlay |
| [performance.md](performance.md) | Bundle, WebGL ceilings, hideEdgesOnMove, labelDensity, reducers, multi-edge cost |
| [pitfalls-and-fixes.md](pitfalls-and-fixes.md) | 20+ symptom → root cause → fix entries |

## Required reading order

For new contributors to a Sigma-based component:

1. **This file's TL;DR** — the 15 facts above.
2. [sigma-lifecycle.md](sigma-lifecycle.md) — read end-to-end before writing any mount code.
3. [theme-and-styling.md](theme-and-styling.md) — read before adding any color from Tailwind.
4. [fa2-and-physics.md](fa2-and-physics.md) — read before enabling layout, even on small graphs.
5. [pitfalls-and-fixes.md](pitfalls-and-fixes.md) — skim once; return to it as a lookup.
6. [performance.md](performance.md) — skip until you have measured a slowdown.
7. [library-selection.md](library-selection.md) — skip if Sigma is already chosen.

## Project-local invariants (ilinxa-ui-pro)

When extending the `force-graph` procomp specifically:

- Components in `src/registry/` must NOT import `next/*`, app contexts, or env-specific code — the registry is portable for future NPM extraction. Sigma is a peer-installed dep; your component imports from `"sigma"` and `"sigma/rendering"` directly, never via a Next.js wrapper.
- Honor the design tokens in [src/app/globals.css](../../../src/app/globals.css). Lime accent `oklch(0.80 0.20 132)` (light) / `oklch(0.86 0.18 132)` (dark). Cool off-white background, never pure white. Graphite-cool darks. See [theme-and-styling.md §design-system-tie-in](theme-and-styling.md).
- The graph's theme is decoupled from the host document's `.dark` class — pass `theme="dark" | "light" | "custom"` as a prop and resolve via the hidden-helper-element pattern. The graph keeps its visual identity regardless of host document class.
- Update `.claude/STATUS.md` whenever you change anything load-bearing (a new program, a new pitfall, a layout-engine swap).
