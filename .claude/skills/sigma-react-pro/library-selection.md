# Library selection

Pick the renderer first. Layout engine, React bindings, and storage all flow from that choice — switching renderers later is rarely backwards-compatible.

## Comparison matrix (verified May 2026)

| Library | Renderer | Practical node ceiling | React story | Bundled layouts | Animation | License | Bundle (min+gz) | Last release | Strength | Weakness |
|---|---|---|---|---|---|---|---|---|---|---|
| [Sigma.js v3](https://www.sigmajs.org/) | WebGL2 | 100k+ nodes, 200k+ edges | Imperative; pair with `graphology`. Wrappers via [`@react-sigma/core`](https://sim51.github.io/react-sigma/) | None bundled; pair with [`graphology-layout-*`](https://graphology.github.io/standard-library/) | Camera animate only | MIT | ~85 KB core + ~25 KB rendering | 3.0.2 (May 2025) | Highest performance, custom WebGL programs, mature | No declarative API; SSR-hostile imports; opacity/depth/labels listed as v4-targets |
| [Cytoscape.js](https://js.cytoscape.org/) | Canvas2D (default) / WebGL preview in [3.31](https://blog.js.cytoscape.org/2025/01/13/webgl-preview/) | ~5k Canvas; tens of thousands WebGL preview | [`react-cytoscapejs`](https://github.com/plotly/react-cytoscapejs); imperative ref-based | Cose, breadthfirst, circle, dagre (extension), klay (extension) | Built-in tween animations | MIT | ~370 KB core | 3.31.x (Jan 2025) | Best graph algorithms (BFS/DFS/centrality/Dijkstra), excellent layout ecosystem, declarative selectors | Canvas perf wall; WebGL renderer is preview, edge styles limited to straight/haystack/bezier |
| [AntV G6 v5](https://g6.antv.antgroup.com/) | `@antv/g` engine — Canvas / SVG / WebGL switch at runtime | ~10k–100k depending on renderer | First-class via `<G6 />` React extension; React node renderers supported | Force, Dagre, Concentric, Radial, Fruchterman, MDS, plus Rust-WASM versions | Built-in transitions | MIT | ~600 KB+ | v5.x (active 2025) | 3D via `@antv/g6-extension-3D`, switchable renderers, WASM/WebGPU layouts | Bundle size, English docs lag, opinionated mental model |
| [vis-network](https://visjs.github.io/vis-network/) | Canvas2D | ~3k | Not React-native; community wrappers thin | Force-directed, hierarchical | Built-in physics | Apache-2.0 / MIT | ~250 KB | Maintenance reduced after 2024 | Easiest learning curve, hierarchical layout that just works | Performance ceiling, dated API |
| [react-force-graph (Vasturiano)](https://github.com/vasturiano/react-force-graph) | 2D Canvas / 3D WebGL via Three.js (`3d-force-graph`) | 10k+ in 3D, 5k+ in 2D | First-class React component (`ForceGraph2D`, `ForceGraph3D`, `ForceGraphVR`, `ForceGraphAR`) | d3-force / ngraph (3D) | Built-in physics + camera tween | MIT | ~150 KB 2D, ~600 KB 3D (Three.js) | Active 2025 | Drop-in component, 3D/VR/AR, gorgeous defaults | Less per-element control than Sigma; binds you to Three.js for 3D |
| [r3f-forcegraph](https://github.com/vasturiano/r3f-forcegraph) | React Three Fiber | Same as 3d-force-graph | Native R3F component | d3-force-3d | R3F frameloop | MIT | depends on host R3F bundle | Active | Composes with the rest of an R3F scene | Niche; only useful inside an R3F app |
| [Reagraph](https://reagraph.dev/) | WebGL via Three.js | ~5k–20k | React-first; declarative props | Built-in (force, circular, hierarchical, radial-out) + clustering | Built-in transitions | Apache-2.0 | ~250 KB | Active 2025 | Easiest React WebGL graph; 2D + 3D; clustering | Less mature than Sigma; smaller program library; Three.js dep |
| [ngraph](https://github.com/anvaka/ngraph) | None (renderer-agnostic) | Layout-only; pair with PIXI / Three.js / Canvas | None | Force, hierarchical, custom | N/A | BSD-3-Clause | ~30 KB layout core | Periodic 2024–2025 | Fastest layout primitives, tiny | DIY rendering; no React bindings |
| [d3-force / d3-force-3d](https://d3js.org/d3-force) | None | Layout-only | Use with React + SVG / Canvas | Force, link, charge, x/y, collide | Manual ticker | ISC | ~15 KB | d3 v7+ | Composable, well-known | DIY rendering, manual frame budget |

## Use Sigma when …

- You need >5k interactive nodes with smooth pan/zoom on integrated GPUs.
- You want graphology's algorithm ecosystem ([`graphology-communities-louvain`](https://github.com/graphology/graphology/tree/master/src/communities-louvain), [`graphology-metrics`](https://github.com/graphology/graphology/tree/master/src/metrics), [`graphology-layout-forceatlas2`](https://github.com/graphology/graphology/tree/master/src/layout-forceatlas2)) on the same source-of-truth graph.
- You can write or accept custom WebGL programs for unique node/edge visuals (icons, dashed directed edges, glyph overlays).
- You're prepared to own the lifecycle in React (mount, settings updates, kill) — you do not want a black-box component.
- You're already in this codebase: the [force-graph procomp](../../src/registry/components/data/force-graph/) is Sigma-based and the design system has been validated against Sigma's color parser.

## Use Cytoscape.js when …

- Graph analysis is the core feature (community detection, shortest paths, layout-by-algorithm) and rendering is downstream.
- You want a declarative selector-based styling API (`cy.style().selector('node[type="server"]').style(...)`) rather than imperative attribute assignment.
- Your graph is moderate size (≤ 5k nodes Canvas, or ≤ 20k with the WebGL preview enabled via `webgl: true`) and you want hierarchical/dagre layouts out of the box.
- You're outside React — Cytoscape's React story is real but feels less native than Sigma + a custom React lifecycle.

## Use react-force-graph when …

- 3D / VR / AR is required.
- You want a "drop in a `<ForceGraph3D>` component and ship" experience.
- Visual impact > per-pixel control. The defaults look good immediately.
- You're okay with d3-force or ngraph as the layout engine and don't need ForceAtlas2.

## Use AntV G6 v5 when …

- You're in an AntV / Ant Design ecosystem.
- You need WebGPU-accelerated layouts (large graphs with batched layout passes).
- You want React node renderers (HTML/JSX inside a node) without writing your own program.
- Bundle size and English-docs lag are acceptable trade-offs.

## Use Reagraph when …

- You want a React-first WebGL graph that "just works" without managing the Sigma lifecycle.
- 2D + 3D + clustering as a built-in feature beats writing it yourself.
- You don't need bespoke per-element WebGL programs.

## Use vis-network when …

- Hierarchical / tree layouts are the dominant use case and graph size is small (≤ 2k).
- You're willing to accept maintenance risk in exchange for a battle-tested API.

## Use ngraph or d3-force directly when …

- You're rendering with PIXI, Three.js, raw WebGL, or SVG and just need layout primitives.
- You have an unusual rendering target (e.g. a `<canvas>` inside a Figma plugin, a server-side PNG generator).

## What changed in 2025–2026 worth noting

- **Cytoscape.js shipped a WebGL renderer preview** in [3.31.0 (Jan 2025)](https://blog.js.cytoscape.org/2025/01/13/3.31.0-release/). Enable with `webgl: true`. Significantly closes the gap with Sigma at moderate scale, but only straight/haystack/bezier edges and no dashes/overlays/underlays. Re-evaluate Cytoscape if you previously dismissed it on perf grounds.
- **Sigma.js v3 stable** since late 2024; v4 alpha in development. Roadmap targets order-independent transparency, unified picking/rendering, and DOM/CSS labels (replacing the canvas-painted labels). See [discussion #1469](https://github.com/jacomyal/sigma.js/discussions/1469).
- **AntV G6 v5** continues active development with WASM/WebGPU layout extensions. Bundle is large but layout perf is now best-in-class for hierarchical structures over 50k nodes.
- **Reagraph** is React-native and has been picking up adopters who don't want to wire Sigma manually. Still less mature; smaller program library.
- **react-sigma v5** introduced typed generics on `useLoadGraph<NodeAttrs, EdgeAttrs>()` and other hooks, and ships official Next.js dynamic-import guidance.

## Performance ceilings, with caveats

The numbers below assume an integrated GPU (Intel Iris / Apple M-series base), `hideEdgesOnMove: true`, default label settings, and 60 FPS as the threshold.

| Scale | Sigma WebGL | Cytoscape Canvas | Cytoscape WebGL preview | react-force-graph 2D | react-force-graph 3D | G6 WebGL |
|---|---|---|---|---|---|---|
| 1k nodes / 2k edges | smooth | smooth | smooth | smooth | smooth | smooth |
| 5k / 10k | smooth | edge of smooth | smooth | smooth | smooth | smooth |
| 10k / 30k | smooth | janky | smooth | smooth | smooth | smooth |
| 50k / 100k | smooth on M-series, choppy on Iris | unusable | smooth-ish | choppy | smooth (less DOM in scene) | smooth with WASM layout |
| 100k / 200k | use `hideEdgesOnMove: true`, label thresholds, possibly drop FA2 to pre-computed positions | unusable | choppy | unusable | choppy | depends |
| 1M+ | requires WebGPU + spatial culling — none of these ship a turnkey solution | — | — | — | — | partial via WebGPU layouts |

Above 200k, you're in a custom-tooling regime — pre-computed positions on the server (Gephi, networkx + cugraph), client-side viewport culling, and probably WebGPU. None of the libraries above ship a turnkey 1M-node solution as of May 2026.
