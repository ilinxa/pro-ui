# Session Handoff — social-posts-system arc, mid-flight (4/8 shipped)

> **Refreshed:** 2026-05-02 (supersedes the 2026-04-30 post-Tier-1-cascade handoff).
>
> **Purpose:** Bootstrap a fresh session to continue the social-posts-system migration arc from where we left off. 4 of 8 components shipped: `expandable-text-01`, `video-player-01`, `media-carousel-01`, `engagement-bar-01`. **Next ship: `comment-thread-01`.** Same procomp gate, same patterns.
>
> **Read order on session start:** This doc → [.claude/CLAUDE.md](CLAUDE.md) → [.claude/STATUS.md](STATUS.md) → [docs/migrations/social-posts-system/analysis.md](../docs/migrations/social-posts-system/analysis.md). Then start the next ship.

---

## 1. 60-second project orientation

**Project:** [ilinxa-ui-pro](../) — private high-level component library on shadcn/ui. Single Next 16 app for development; live shadcn registry at `https://ilinxa-proui.vercel.app/r/<slug>.json` with `@ilinxa/<slug>` namespace.

**Tech stack:** Next 16.2, React 19.2, Tailwind v4 (OKLCH, no config file), shadcn v4, TypeScript 5, pnpm 10. React Compiler enabled. **The React Compiler-aware ESLint plugin is strict** — see §6 for the patterns the sprint locked in.

**Where things live:**
- `src/registry/components/<category>/<slug>/` — the components
- `src/registry/manifest.ts` — docs-site registry
- `registry.json` — shadcn-distribution registry (root of repo)
- `src/app/` — docs site
- `docs/procomps/<slug>-procomp/` — per-component planning docs (description / plan / guide)
- `docs/migrations/<slug>/` — migration intake (source-notes / analysis / original/)
- `C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/` — auto-memory (persistent across sessions)

**Critical convention:** the **procomp gate** is mandatory. Description → plan → implementation → guide. Stages 1+2 are signed-off gates. **Do not scaffold (`pnpm new:component`) before description AND plan are confirmed.**

---

## 2. Where we are: social-posts-system arc

Migrating kasder's monolithic post components (`E:/my projects/kasder/kas-social-front/kas-social-front-v0/src/components/social/posts/`) into 8 reusable primitives. Source files live in [docs/migrations/social-posts-system/original/](../docs/migrations/social-posts-system/original/). The **8-component breakdown + realtime contract + sealed-folder rule refinement** are all locked in [docs/migrations/social-posts-system/analysis.md](../docs/migrations/social-posts-system/analysis.md) — read this BEFORE starting any of the remaining 4.

| # | Component | Category | Status | Folder |
|---|---|---|---|---|
| 1 | `expandable-text-01` | data | ✅ shipped | `src/registry/components/data/expandable-text-01/` |
| 2 | `video-player-01` | media | ✅ shipped | `src/registry/components/media/video-player-01/` |
| 3 | `media-carousel-01` | media | ✅ shipped | `src/registry/components/media/media-carousel-01/` |
| 4 | `engagement-bar-01` | data | ✅ shipped | `src/registry/components/data/engagement-bar-01/` |
| 5 | **`comment-thread-01`** | data | ⏭️ **NEXT** | n/a yet |
| 6 | `post-card-01` | data | ⏳ pending (Tier-2 composite) | n/a |
| 7 | `story-rail-01` | data | ⏳ pending | n/a |
| 8 | `story-viewer-01` | media | ⏳ pending (FM adoption gate) | n/a |

After 8/8: **`/sandbox/social-feed-page-01`** Tier-3 composition (host code in `src/app/sandbox/`, NOT a registry component).

**STATUS.md "Last updated" + the top "Recent decisions" entries** carry the freshest narrative of each ship. Always read them before starting work.

---

## 3. The procomp gate workflow (mandatory, every component)

For every new component, in this exact order:

1. **(Migration intake — only for greenfield-from-source ports)** `pnpm new:migration <slug>`. For the social-posts arc, the analysis is already done — skip this step.
2. **Stage 1: description** at `docs/procomps/<slug>-procomp/<slug>-procomp-description.md` — what & why. Include rough API sketch + ~10 open questions.
3. **Re-validate the description.** Per memory ([feedback_re_validation_pass_catches_real_issues.md](../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/feedback_re_validation_pass_catches_real_issues.md)) this consistently surfaces **1–3 substantive refinements**. Do NOT skip — never rubber-stamp.
4. **Pause for user sign-off.** Apply confirmed refinements; commit them into the description.
5. **Stage 2: plan** at the same folder — Q-P locks (one per open question), pre-emptive locks, file-by-file plan, demo/usage/meta layout, manifest+registry wiring, test plan, risk register, implementation order.
6. **Re-validate the plan.** Per memory this consistently surfaces **3–5 substantive refinements** (architecture gaps, hooks-rules violations, edge cases).
7. **Pause for user sign-off.** Apply confirmed refinements.
8. **`pnpm new:component <category>/<slug>`** — scaffold from `_template`.
9. **Implement** in the order from the plan. Suggested: types → utils/helpers → hooks → leaf parts → root → demo/usage/meta/index. Run `pnpm tsc --noEmit` + `pnpm lint` after each substantial change.
10. **Stage 3: guide** at `docs/procomps/<slug>-procomp/<slug>-procomp-guide.md` — usage notes for hosts. Authored alongside implementation.
11. **Wire `manifest.ts`** (3 lines printed by scaffolder).
12. **Wire `registry.json`** — base item + `<slug>-fixtures` sibling. Locked target convention: `target: "components/<slug>/<sub-path>"`. Never ship `demo.tsx`, `usage.tsx`, `meta.ts`. Ship `dummy-data.ts` only via the `-fixtures` item. CSS files use `type: "registry:file"` (engagement-bar-01 was first; treat as standard now).
13. **`pnpm registry:build`** — verify the `<slug>.json` artifact's `files[]` looks right.
14. **Update [.claude/STATUS.md](STATUS.md)** — new Components row at the bottom of the table + new Recent decisions entry at the top of the section; **trim the oldest decision** to maintain ~10.
15. **Commit.** Do NOT push or commit unless the user explicitly asks.

---

## 4. Next ship: `comment-thread-01`

Per [analysis.md §5 "comment-thread-01 (data) — fifth ship"](../docs/migrations/social-posts-system/analysis.md):

**Concept:** Recursive comment tree with composer + realtime, depth default 2 (max configurable). Composes:
- `expandable-text-01` — comment bodies (long comments truncate via the maxLines pattern)
- `engagement-bar-01` (variant=`compact`) — per-comment like + reply actions

**This is the second cross-folder import in the arc** (after media-carousel-01 → video-player-01). Same `registryDependencies` pattern: declare `["expandable-text-01", "engagement-bar-01"]` in `registry.json` so installs auto-pull siblings.

**Realtime contract (locked in analysis.md):**
```ts
type CommentDelta =
  | { kind: "added"; comment: Comment; parentId?: string }
  | { kind: "edited"; commentId: string; content: string }
  | { kind: "removed"; commentId: string }
  | { kind: "liked"; commentId: string; liked: boolean; count: number };
```
Same `Subscribe<T>` shape engagement-bar-01 uses. Same `controlledRef` + `onSubscribeDeltaRef` pattern in the hook (copy `useEngagementState`'s shape verbatim).

**v0.1 ships:**
- Add comment + delete (kebab menu) + like + reply
- Max-depth flatten with "View N more replies" inline-expand at the boundary
- Composer textarea autosize via roll-our-own ~20 LOC hook (NOT `react-textarea-autosize` peer dep)

**Deferred from kasder per analysis (don't try to add):**
- Edit support (kasder doesn't have it; v0.2 candidate)
- Mentions / hashtags (v0.2)
- Voting (up/down) — kasder is like-only

**First message in next session:** "Continue the social-posts-system arc — start `comment-thread-01` per the procomp gate." Then:
1. Re-read STATUS.md "Recent decisions" for engagement-bar-01 (contract patterns to copy).
2. Re-read analysis.md §5 for comment-thread-01 breakdown.
3. Re-read the kasder source: [docs/migrations/social-posts-system/original/posts/PostEngagementPanel.tsx](../docs/migrations/social-posts-system/original/posts/PostEngagementPanel.tsx) — the `CommentItem` sub-component (lines 413–467) is the visual reference for per-comment rows.
4. Draft the description. Include: depth handling, composer (autosize + Enter-to-submit + Shift+Enter newline + cancel-on-Escape), realtime via `Subscribe<CommentDelta>`, per-comment compact `engagement-bar-01`, expandable bodies via `expandable-text-01`, kebab menu (delete + report), open questions (~10).
5. Re-validate. Pause for sign-off. Continue through the gate.

---

## 5. Reference implementations to copy patterns from

When designing `comment-thread-01`, copy these patterns directly:

- **Hook with subscription + reducer + controlledRef pattern** → [src/registry/components/data/engagement-bar-01/hooks/use-engagement-state.ts](../src/registry/components/data/engagement-bar-01/hooks/use-engagement-state.ts). The `controlledRef` + `onSubscribeDeltaRef` mirrors so the subscription effect re-runs only on `subscribe` identity change is the canonical shape.
- **Stable imperative handle identity via passive useEffect ref-mirrors** → [src/registry/components/data/engagement-bar-01/engagement-bar-01.tsx](../src/registry/components/data/engagement-bar-01/engagement-bar-01.tsx) lines 60–67. Refs MUST NOT be written during render (`react-hooks/refs` lint catches it).
- **Cross-folder import + `registryDependencies`** → [src/registry/components/media/media-carousel-01/parts/slide-renderer.tsx](../src/registry/components/media/media-carousel-01/parts/slide-renderer.tsx) imports `<VideoPlayer01>` directly; `registry.json` declares the dependency.
- **Per-action / per-row component with own click handler + React.memo** → [src/registry/components/data/engagement-bar-01/parts/like-action.tsx](../src/registry/components/data/engagement-bar-01/parts/like-action.tsx). Click handler closes over its own props; never memoized upstream in `.map()` (hooks-rules violation).
- **Procomp doc structure (most recent + format) ** → [docs/procomps/engagement-bar-01-procomp/](../docs/procomps/engagement-bar-01-procomp/). description.md + plan.md + guide.md — match this structure.

---

## 6. Locks worth holding (don't re-debate these)

These came from session-mid corrections that cost time to find. If you don't understand WHY a lock exists, ask the user before working around it.

### Architectural locks

- **No framer-motion until story-viewer-01.** Heart-burst, count flips, comment collapse animations all CSS-keyframe-based. Adoption gate is the swipe-to-dismiss gesture in story-viewer-01 — that's where rolling our own pointer-event handler genuinely costs more than the dep. See [memory: project_motion_substrate.md](../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/project_motion_substrate.md).
- **Sealed-folder rule refined:** cross-folder imports allowed within a designed system (declared via `registryDependencies`); not allowed across unrelated domains. media-carousel-01 → video-player-01 was first; comment-thread-01 → expandable-text-01 + engagement-bar-01 is the second.
- **Hybrid controlled/uncontrolled per-field, per-render** is the canonical pattern (matches React `<input value>`). When designing a component with toggleable state: host passes prop = controlled; omits = component owns. Do NOT add a `controlled: boolean` switch.
- **Realtime via `Subscribe<TDelta>` + `onSubscribeDelta` callback.** Identity-stable subscribe (host memoizes via `useCallback`); component re-subscribes only on identity change. Controlled fields ignore deltas; `onSubscribeDelta` always fires for host translation.
- **`registry:file`** for sibling CSS files (precedent set by engagement-bar-01's `engagement-heart-burst.css`). Smoke-test from tmp consumer is a recommended ship gate.

### React-Compiler-aware lint patterns (caught the hard way)

- **`useSyncExternalStore`** is the canonical fix for `react-hooks/set-state-in-effect`. Used in: video-player-01's `usePrefersReducedMotion`, media-carousel-01's `useEmblaWithState`. If you're tempted to setState in a useEffect for an external subscription, switch to useSyncExternalStore.
- **Refs must not be written during render.** Mirror via passive useEffect (`useEffect(() => { ref.current = value; });` with no deps array). Engagement-bar-01's pattern is the reference.
- **`useCallback` inside `.map()` is illegal** — hooks-rules violation. Per-row click handlers live INSIDE the row component, closing over its own props. `React.memo` on each row keeps re-renders cheap.
- **`useCallback(funcCallResult, [])` is illegal** — must be an inline function. For memoizing a value (not a callback), use `useMemo(() => createThing(), [])`.
- **`useEffect` deps with `[opts.subscribe]` triggers `react-hooks/exhaustive-deps`.** Extract `const subscribe = opts.subscribe` to local + dep on `[subscribe]`.

### Tailwind v4 canonical translations from kasder source

(Saved as memory: [project_tailwind_v3_to_v4_translations.md](../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/project_tailwind_v3_to_v4_translations.md))

- `bg-gradient-to-X` → `bg-linear-to-X`
- `break-words` → `wrap-break-word`
- `grayscale-[N%]` → `grayscale-N`
- Pre-fix during plan stage to save a lint cycle.

### Project locks specific to engagement-bar-01

- Bar handle does NOT include `triggerHeartBurst()` — it was deliberately dropped. Host owns the burst counter (`setBurstKey(k + 1)`) alongside calling `barRef.current?.triggerLike()`. Don't re-introduce.
- `<EngagementHeartBurst>` is RSC-compatible (no `"use client"`). Don't add it back.

---

## 7. Behavioral locks (from memory)

- **Brevity preference:** match question length, drop preambles, skip structure when not needed. See [memory: feedback_brevity_preference.md](../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/feedback_brevity_preference.md).
- **Never offer `/schedule`:** user does not use scheduled background agents in this project. Skip the trailing offer entirely. See [memory: feedback_no_schedule_offers.md](../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/feedback_no_schedule_offers.md).
- **Re-validation discipline:** never rubber-stamp draft → sign-off. Always do a critical re-read pass before pausing for user. See [memory: feedback_re_validation_pass_catches_real_issues.md](../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/feedback_re_validation_pass_catches_real_issues.md).
- **Dynamicity + reusability primacy:** default to open API surfaces (slots, callbacks, polymorphic, public helpers). "Add it later" is a breaking change. The bar is "plausible consumer override," not "any way to configure." See [memory: feedback_dynamicity_reusability_primacy.md](../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/feedback_dynamicity_reusability_primacy.md).
- **Use official CLI commands** for tooling setup. Research current versions before installing. See [memory: feedback_official_commands_and_version_research.md](../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/feedback_official_commands_and_version_research.md).
- **Force-graph + sigma frozen.** v0.2 is the last shipped state; don't propose v0.3, sigma fixes, or browser-validation unless user reopens. See [memory: project_force_graph_frozen.md](../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/project_force_graph_frozen.md).

---

## 8. What NOT to do

- ❌ Don't scaffold `pnpm new:component` before description AND plan are signed off.
- ❌ Don't propose framer-motion. CSS keyframes for everything until story-viewer-01.
- ❌ Don't offer `/schedule`.
- ❌ Don't write long preambles — match question length.
- ❌ Don't add backwards-compat shims, error handling for impossible cases, or features beyond the task.
- ❌ Don't propose v0.3 of `force-graph` or sigma fixes.
- ❌ Don't commit unless the user explicitly asks.
- ❌ Don't add `triggerHeartBurst()` to engagement-bar-01's handle (deliberately dropped).
- ❌ Don't add framer-motion or other heavy peer deps to comment-thread-01 / post-card-01 / story-rail-01.
- ❌ Don't try to import `next/*` in registry components. (Only `src/app/` host code can.)
- ❌ Don't include `demo.tsx`, `usage.tsx`, `meta.ts` in `registry.json` files.

---

## 9. Pre-flight checklist for next ship

Before drafting any new component:

- [ ] Read this handoff doc end-to-end.
- [ ] Read [.claude/STATUS.md](STATUS.md) — top "Last updated" + "Recent decisions" §.
- [ ] Read [docs/migrations/social-posts-system/analysis.md](../docs/migrations/social-posts-system/analysis.md) for the next component's section.
- [ ] Read the kasder source the component is migrating.
- [ ] Read the most recent procomp doc set ([docs/procomps/engagement-bar-01-procomp/](../docs/procomps/engagement-bar-01-procomp/)) to match format.
- [ ] Check the most recent reference implementation ([src/registry/components/data/engagement-bar-01/](../src/registry/components/data/engagement-bar-01/)) for current patterns.
- [ ] Confirm the user's intent: "Continue the arc — start `<slug>` per the procomp gate."
- [ ] Then: draft description → re-validate → pause for sign-off → draft plan → re-validate → pause for sign-off → implement → guide → wire → STATUS.md → commit.

---

## 10. Glossary

- **Procomp** = "pro-component," a high-level component in this library (vs. shadcn primitives in `src/components/ui/`).
- **Procomp gate** = description → plan → guide workflow with 2 sign-off gates.
- **Tier 1** = primitive panels (data-table, properties-form, detail-panel, etc.).
- **Tier 2** = composite components built from Tier 1 (post-card-01 composes engagement-bar-01 + media-carousel-01 + comment-thread-01 + expandable-text-01).
- **Tier 3** = full assembled pages, host code only (lives in `src/app/sandbox/<slug>/`, NOT in registry).
- **Sealed folder** = each component owns its files in `src/registry/components/<category>/<slug>/`. Cross-folder imports were forbidden until media-carousel-01 refined the rule (allowed within a designed system declared via `registryDependencies`).
- **Q-P** = "Question-Plan lock," numbered locked answers in the plan.md doc.
- **Migration origin** = kasder source file that's being ported. Always referenced in the description.md.
- **Fixtures** = `dummy-data.ts` shipped via separate `<slug>-fixtures` registry item (not in base item).
- **`registry:file`** = shadcn registry entry type for arbitrary files (CSS, etc.) vs. `registry:component` for TSX/TS.

---

**Confidence check before starting next ship:** if you don't understand WHY a lock above exists, ask the user before working around it. Most of these came from session-mid corrections that cost time to find.
