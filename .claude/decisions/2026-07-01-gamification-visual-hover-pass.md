---
date: 2026-07-01
session: gamification visual QA (post-6/6 close)
phase: post-ship polish
type: visual-polish-patch
commits: [pending]
components:
  - team-trophy-shelf-01 (v0.1.0 → v0.1.1)
  - team-quest-log-01 (v0.1.0 → v0.1.1)
  - team-progress-bar-01 (v0.1.0 → v0.1.1)
  - cooperative-challenge-01 (v0.1.1 → v0.1.2)
findings:
  - button-primitive-primary-hover-was-link-only
status: shipped
---

# Gamification visual QA + hover pass (2026-07-01)

A user-driven visual QA sweep over the just-closed `gamification-system` (6/6).
The user walked the docs pages component-by-component and flagged concrete
polish issues; each was fixed live against the dev server, then shipped as a
batch. **All patch bumps — visual-only, no public-API change → per
[`readiness-review.md`](../rules/readiness-review.md) a patch bump does NOT
trigger GATE 3.**

## What changed

### Real component changes (patch bumps + `registry:build`)
1. **team-trophy-shelf-01 → v0.1.1** — the Tier-C `TeamMilestoneBadge` had a
   name-length-driven ragged grid (`max-w-32 truncate`, no fixed cell width).
   Fixed: **size-driven fixed cell** (`w-24` md / `w-20` sm) so every token has
   an identical footprint → even grid rhythm; **2-line label** (`truncate` →
   `line-clamp-2 wrap-break-word` + reserved `min-h-8`); **seamless hover**
   (medallion `motion-safe:group-hover:-translate-y-0.5` + `group-hover:shadow-md
   shadow-primary/25`). Side-effect: uniform cells → main shelf lays out ~5/row
   instead of ragged 6 (intended).
2. **team-quest-log-01 → v0.1.1** — `ChapterBeat` marker circles gained a
   state-aware seamless hover (done: shadow glow; current: ring deepens
   `/30 → /50`; upcoming: border+text pick up lime), via `group` on **both** the
   interactive `button` and the static `div` wrappers (so hover shows in every
   demo section, not only the one that wires `onChapterClick`).
3. **team-progress-bar-01 → v0.1.1** + **cooperative-challenge-01 → v0.1.2** —
   progress fill **brightens + glows** on hover: `group` on the wrapper →
   `group-hover:**:data-[slot=progress-indicator]:brightness-110` + a soft lime
   glow on the `Progress` root (`group-hover:shadow-primary/30`; the root's own
   box-shadow is NOT clipped by its `overflow-x-hidden` — overflow clips
   children, not the element's own outset shadow). Design-mandate-safe:
   `brightness` lifts lightness, not chroma → never neon-saturated lime.

### Docs-site / infra (no version bump)
4. **`src/components/ui/button.tsx` (shared primitive)** — the `default`
   (primary/lime) variant hovered **only as a link**: `[a]:hover:bg-primary/80`.
   On a normal `<button>` it had NO hover feedback (every other variant did).
   Fixed to a real button hover: `hover:bg-primary/90 hover:shadow-md
   hover:shadow-primary/25`. **Key nuance:** our components ship
   `registryDependencies: ["button"]` (shadcn's canonical button), NOT our
   `button.tsx`, so this changes **only our docs site's rendering** — no
   consumer's buttons change, and it is **not** a component version bump.
5. **6× gamification `demo.tsx` centering** — added `mx-auto` so the `max-w-*`
   demo column centers in the preview area (all six were left-aligned).
6. **team-feedback-loop-01 demo** — the "Composed / lighter" **Start** button
   looked dead (it fires `onNextTask`, a consumer hand-off, and by design does
   NOT dismiss the nudge). Demo now drives the nudge from local state so Start
   visibly clears the prompt + shows a "Started …" line + Reset. **Component
   behavior unchanged** (user chose the demo-only fix).
7. **task-choice-control-01 demo** — the component renders no card of its own
   (inline `role="group"` controls meant to embed in a consumer's card); added a
   subtle lime border + shadow hover to the **demo** card wrappers.

## Reusable findings

- **F: the Nova-preset Button primary variant only hovered as an anchor**
  (`[a]:hover:bg-primary/80`) — a real gap where primary `<button>`s had no
  hover, inconsistent with every other variant. Fixed at the primitive (docs
  site only; consumers get their own `button`).
- **Progress-root box-shadow is NOT clipped by `overflow-x-hidden`** — a glow on
  the `Progress` root shows; a glow on the *indicator* would be clipped. Put
  bar-level glows on the root, fill-level effects (brightness) on the indicator.
- **`brightness` is design-mandate-safe for lime** — it lifts lightness, not
  chroma, so it never trips the "no neon-saturated lime (chroma ≤ 0.20)" rule.
  Prefer it over `saturate` for lime hover states.
- **A hover on a static (non-interactive) element** is a deliberate pack
  convention here (trophy tokens, quest circles) — subtle, transform-based, reads
  as "alive," and matches the interactive path so the compound feels coherent.

## Gates
tsc 0 · eslint (touched) clean · meta-deps 63/63 · build 72 pages (no SSR err) ·
registry:build ✔ (all 4 artifacts spot-checked — new hover classes present).
