---
date: 2026-06-06
session: live-json-playgrounds + rich-card SSR fix
phase: docs-site feature + shipped-component patch
type: feature + bugfix
commits:
  - fc8e469  # fix(rich-card): v0.4.3 SSR-stable auto-ids
  - f8a734b  # feat(docs): live JSON playgrounds on config-driven detail pages
  - 6bf1be6  # fix(docs): flow-canvas starter — explicit data.ports
components:
  - content-composer-01   # playground (no code change)
  - json-form             # playground (no code change)
  - rich-card             # playground + v0.4.3 SSR fix
  - flow-canvas-01        # playground (no code change)
findings:
  - JsonPlayground-generalized
  - validators-return-original-parsed-json
  - rich-card-ssr-random-id-hydration-bug
status: COMMITTED-NOT-PUSHED (tip f8a734b, 2 ahead, tree clean, prod build ✓)
---

# Live JSON playgrounds + rich-card v0.4.3 SSR fix

## What

A new docs-site feature: a **live JSON playground** on the detail page of each
config-driven component. Left pane = a JSON editor for the component's config;
right pane = the component rendered live from that JSON. Submit is gated on
zod-validity.

Generalized to a reusable **`<JsonPlayground<T>>`**
(`src/app/components/[slug]/_components/json-playground.tsx`): split-pane, mono
`<textarea>` editor, live validation + status line, Submit / Format, an error
boundary (so a bad config can't white-screen the page), an empty state, and a
generic result strip. Four thin wrappers + per-type validators:

| Slug | Config type | Wrapper notes |
|---|---|---|
| `content-composer-01` | `ComposerConfig` | registers a generic **"playground" adapter** (mutates the exported `ADAPTER_REGISTRY`) + a fake object-URL uploader, so Publish/Save assemble a visible result for any config |
| `json-form` | `FormSchema` | onSubmit shows collected values |
| `rich-card` | `RichCardJsonNode` | rendered `editable` |
| `flow-canvas-01` | `CanvasData` | a **module-scope** `card` renderer (xyflow's critical memoization rule) + the built-in custom-JSON fallback; wrapped in a fixed-height frame (xyflow needs explicit dimensions) |

`page.tsx` routes the right playground per slug via a `PLAYGROUNDS`
slug→`{description, render}` map. **Docs-site only** (`src/app`) — the shipped
registry components are unchanged by the feature itself.

## Why these four

The playground fits where the component **is** a JSON-config/data renderer.
content-composer-01 + json-form were the user's asks; rich-card (JSON card-tree)
and flow-canvas-01 (nodes/edges) are the two other "the config IS the component"
fits. The reusable component makes the data-driven tier (media-carousel-01,
pricing-table-01, kanban-board-01, the tree/list family) ~10-line additions for
later.

## Key implementation decisions

- **Validators run zod for ERROR MESSAGES but return the ORIGINAL
  `JSON.parse(text)` result**, not zod's parsed output. zod (default object mode)
  strips unmodelled keys; the composer/json-form/rich-card need those keys
  (`rows`, `options`, `validators`, extra slotConfig fields). Returning the
  original object preserves full fidelity while still surfacing precise
  per-path errors.
- **The composer playground needs a registered adapter** for Publish/Save to
  assemble a `ContentCardItem`. Rather than force the user's config to use the
  one registered (`news-content-item`) adapter, the playground registers a
  generic `playground` adapter at module load (the exported `ADAPTER_REGISTRY`
  is mutable). "Fully functional for any config" per the user's ask.
- **CodeMirror is already a project dependency** (`@codemirror/*`), but the user
  chose a styled mono `<textarea>` for v1 (zero setup, holds the design tokens).
- **flow-canvas**: node *renderers* are functions (can't be JSON), so the JSON
  is the `CanvasData` (nodes+edges referencing renderer `__type`s); the built-in
  custom-JSON fallback renders any unknown `__type`.
- **flow-canvas starter must list `data.ports` EXPLICITLY** (commit `6bf1be6`).
  `inflateDefaultPorts` (which seeds `data.ports` from a renderer's
  `defaultPorts`) runs ONLY in the drop pipeline — NOT for nodes loaded from
  `defaultData`. The first starter relied on `defaultPorts` → nodes had no ports
  → `PortsAt` rendered nothing → edges had nothing to anchor (no ports/edges
  visible). Fixed by listing explicit ports per node (matches the demo fixtures)
  + made the starter richer (multi out-port fan-out, passthrough chain, terminal
  nodes, custom-JSON fallback node, 3 edges). **Lesson: for any node-graph/data
  playground, the starter must include the full explicit shape — defaultData is
  taken verbatim, not inflated.**

## rich-card v0.4.3 — SSR-stable auto-ids (the bug the playground surfaced)

Loading the rich-card detail page threw a **hydration mismatch**
(`data-rcid` / `aria-labelledby` differed server vs client). Root cause:
`lib/parse.ts` `generateId()` minted `crypto.randomUUID()` for any card lacking
an explicit `__rcid` — and **parse runs at render-time state-init**, so the SSR
pass and the client hydration pass produced *different* random ids.

Fix: auto-ids now derive **deterministically from the node's tree path**
(`rc-auto-<sanitized-path>`). Server + client parse the same input tree in the
same order → identical ids → no mismatch (also stable across remounts, which the
random ids never were). Runtime edits (`reducer.ts`, `rich-card.tsx`) still mint
random ids — those fire post-hydration, client-only, so they're safe.

Verified: two SSR requests now return identical `rc-auto-*` ids (e.g.
`rc-auto-conclusion` for the id-less demo card). Pre-existing bug — affected
**any** SSR'd RichCard with id-less cards (incl. the demo on its own page).
Patch bump (no GATE 3).

**Lesson:** any id minted during render/parse must be deterministic
(path-derived, or React `useId`) — a random UUID at SSR always hydration-
mismatches.

## State / resume

- **Everything from `fc8e469` onward is UNPUSHED** (origin at `92d5eec`):
  `fc8e469` (rich-card fix) + `f8a734b` (playgrounds) + `6bf1be6` (flow-canvas
  starter fix) + session-close docs. Working tree clean.
- Gates: tsc 0 · lint 81-22 baseline · meta-deps 53/53 · registry:build ✓ ·
  **full `pnpm build` ✓** · all 4 playground pages SSR 200; validators accept
  their starters; deterministic rich-card ids confirmed; **all 4 playgrounds
  user-confirmed working in the browser.**
- **Resume:** `git push origin master` (the only pending step). Optionally add
  data-driven-tier playgrounds.
