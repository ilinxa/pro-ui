# Starter Prompt — Fresh Session Boot

> **What this is:** a copy-pasteable prompt to drop into the start of a new Claude Code session so the assistant orients itself in this project's state without re-deriving everything.
>
> **How to use:** copy everything between the `--- COPY BELOW ---` and `--- COPY ABOVE ---` markers and paste it as your first message in a fresh session. The new session will read the right docs, summarize the state back to you, and then wait for direction.
>
> **Variants:** §1 is the full primer (recommended for fresh sessions or long pauses). §2 is the short version for quick same-week resumption. §3 is force-graph-v0.1 continuation (the current active work).
>
> **Last refreshed:** 2026-04-30 — post-Tier-1 cascade COMPLETE, post-decision-#38 cascade, force-graph v0.1 mid-Phase-A.

---

## 1. Full primer (recommended for fresh sessions)

```
--- COPY BELOW ---

Before doing anything else, orient yourself in this project. Read these docs IN ORDER and confirm you've internalized them by summarizing back the key takeaways:

**Required reading (in order):**

1. `.claude/CLAUDE.md` — project conventions (likely auto-loaded; verify it's in context)
2. `.claude/STATUS.md` — live project state (likely auto-loaded; verify it's in context)
3. `.claude/HANDOFF.md` — session continuation context. **Read §5 carefully** — React Compiler-aware lint patterns learned during the Tier 1 sprint. Required if you're about to implement code.
4. `docs/systems/graph-system/graph-system-description.md` — master cross-cutting contract. 38 locked decisions; §8 is the index; §9 is the sub-doc map (5/5 Tier 1 ✓ implemented).
5. The plan for whatever component you're working with: `docs/procomps/<slug>-procomp/<slug>-procomp-plan.md`. 8 plans signed off (5 Tier 1 + force-graph v0.1/v0.2/v0.3).
6. **At least one shipped Tier 1 implementation** under `src/registry/components/<category>/<slug>/` as the cadence + lint reference. `forms/properties-form/` is state-heavy; `forms/entity-picker/` exercises function overloads + cmdk; `feedback/detail-panel/` shows compound API + Context.

**Skim afterward (lower priority):**

- The 5 Tier 1 procomp descriptions at `docs/procomps/<slug>-procomp/<slug>-procomp-description.md` — plans usually suffice.
- `docs/procomps/force-graph-procomp/force-graph-phase-0-spike-brief.md` — SUPERSEDED 2026-04-30 per #38; preserved for historical reference only.
- `.claude/PHASE-0-ACTION-PLAN.md` — also SUPERSEDED per #38.
- `graph-visualizer-old.md` (repo root) — original v4 spec; authoritative for force-graph internals **except** §3.5 dashed-edge rule + §11.3 custom edge program (both superseded by #38).
- `docs/component-guide.md` — long-form pro-component build reference.

**After reading, summarize back to me:**

1. **Big picture** — graph-system, 3 usage modes (DB visualizer / Obsidian-like KG / hybrid documenter), why decomposed into Tier 1 / Tier 2 / Tier 3.
2. **What's done** — 6 procomp descriptions signed off; 8 plans signed off (5 Tier 1 + force-graph v0.1/v0.2/v0.3); decision #38 amendment applied 2026-04-30; **Tier 1 cascade COMPLETE — 5/5 components implemented at alpha 0.1.0** (`properties-form`, `detail-panel`, `filter-stack`, `entity-picker`, `markdown-editor`).
3. **What "shipped" means** — typecheck + lint + build + SSR + /components index render all clean. **NOT validated:** browser-side hydration + interactivity (no test runner wired). User does manual browser testing between sessions.
4. **Decision #38 (CRITICAL — recent change)** — dashed-edge feature dropped, Phase 0 spike CANCELLED, replaced with stock Sigma `EdgeRectangleProgram` + `EdgeArrowProgram` (both inside main `sigma` package via `sigma/rendering` in Sigma 3.x). Soft/default visual differentiation via per-edge `color` + `size`: soft = `--muted-foreground` + size 1; default = `--foreground` + size 1.5. API rename `edgeType.dashed` → `edgeType.softVisual`. **Force-graph v0.1 implementation gate is UNBLOCKED at the planning level.**
5. **Force-graph v0.1 IN PROGRESS** — Phase A lib/ done (14 files committed in `35753df`, typecheck clean). Remaining: source-adapter lib (3 files) + hooks (7 files) + Phase A end-gate + Phase B (3 files) + Phase C (5 files + manifest entry + STATUS update).
6. **What's TBA** — force-graph v0.1 continuation (immediate next work); v0.2/v0.3 implementations (sequential); v0.4/v0.5/v0.6 plans (best authored after force-graph implementations validate assumptions); system Stage 2 plan; Tier 3 page (not really a component).
7. **Next-step options** from `HANDOFF.md` §6.

Then **wait for me to pick a direction**. Do NOT author plans, draft new docs, or modify code until I explicitly say which option.

**Working pattern in this project (must follow):**

- **For planning docs:** Draft → validate → re-validate → sign-off cadence. NEVER rubber-stamp the re-validation pass — it consistently catches refinements (1–3 substantive per Stage 1 description; 3–5 per Stage 2 plan).
- **For implementation:** pre-flight install (commit separately) → scaffold via `pnpm new:component` → Phase A (types + lib + hooks) → Phase B (parts + main) → Phase C (demo + integration). Each phase is a commit gate; pause for review at the user's request.
- **Decisive recommendations + impact analysis preferred** over option lists. Pick a default; explain why; surface main trade-off — in brief.
- **Brevity preference** — keep responses short and clear; match question length; drop preambles.
- **Decision #35 (Tier 1 independence)** — `force-graph` does NOT import any Tier 1 component at the registry level; composition is host/Tier 3 only. SINGLE MOST VIOLATED RULE.
- **Decision #11 footnote** — Lucide icon atlas ships in `force-graph` v0.5, not v0.1.
- **Decision #38 (current)** — stock-Sigma rendering substrate; no custom WebGL in v0.1.
- **CrudResult discriminated return** (force-graph v0.3 lock): all CRUD actions return `{ ok: true, ...payload } | { ok: false, code, reason?, entityIds? }`.
- **React Compiler-aware lint** is strict (HANDOFF §5): no setState-in-effect for derivable state; no ref reads during render; track DOM nodes via `useState<HTMLElement>` instead of `useRef`; verify with `pnpm lint` at every Phase end-gate.
- **Per-phase plan refs** — legacy `force-graph-procomp-plan.md` citations in system §8 mean per-phase plans (`force-graph-v0.{N}-plan.md`).
- **Never claim browser validation succeeded without a real browser session.** Programmatic checks (typecheck/lint/build/SSR) are NOT a substitute for hydration + interactivity testing.

Ready to receive your summary, then wait for direction.

--- COPY ABOVE ---
```

---

## 2. Short variant (quick same-week resumption)

```
--- COPY BELOW ---

Read in order: `.claude/CLAUDE.md`, `.claude/STATUS.md`, `.claude/HANDOFF.md`. Then wait for my direction.

Critical reminders:
- **Tier 1 cascade COMPLETE** (5/5 implemented). Force-graph v0.1 mid-Phase-A — lib/ done at `35753df`; hooks + parts pending.
- **Decision #38** — stock Sigma `EdgeRectangleProgram` + `EdgeArrowProgram` (both in main `sigma` package); soft edges = `--muted-foreground` + size 1; default = `--foreground` + size 1.5; `edgeType.softVisual` (renamed from `dashed`). Phase 0 spike CANCELLED.
- **Decision #35** — Tier 1 independence; force-graph never imports Tier 1.
- **React Compiler-aware lint is strict** (HANDOFF §5).
- **Brevity preference** — keep responses short; match question length.
- **Working pattern** — draft → validate → re-validate → sign-off; never rubber-stamp.

I'll tell you what to do once you've confirmed orientation.

--- COPY ABOVE ---
```

---

## 3. Force-graph v0.1 continuation (current active work)

Use this when resuming the force-graph v0.1 implementation specifically — skips general Tier 1 context.

```
--- COPY BELOW ---

Resuming force-graph v0.1 implementation — Phase A lib/ done; continuing with source-adapter lib + hooks.

Read in order:

1. `.claude/CLAUDE.md` (project conventions)
2. `.claude/STATUS.md` (live state)
3. `.claude/HANDOFF.md` — **§5 React Compiler-aware lint patterns is REQUIRED** (the hooks layer about to land will hit this)
4. `docs/procomps/force-graph-procomp/force-graph-v0.1-plan.md` — full plan; §2 is the stock-Sigma substrate (post-#38); §7 the two-layer state model; §8.1+ the file-by-file plan; §17 the Q-P locks; §18 the gate
5. `src/registry/components/data/force-graph/` — what's already shipped (Phase A lib/; 14 files in commit `35753df`)
6. **At least one shipped Tier 1 implementation** for the React-Compiler-aware patterns reference — `forms/entity-picker/` is the closest fit (function overloads, useState-instead-of-useRef pattern, controlled-or-uncontrolled config)

**Current state:**
- Phase A lib/ ✓ — types.ts, edge-attributes.ts (#38 contract), validate-snapshot.ts, theme.ts, permissions/resolver.ts, store/* (creator + 4 slices + 2 derived + cascade + apply-delta) all typecheck clean
- Phase A continuation ⨯ — source-adapter lib (3 files) → hooks (7 files) → Phase A end-gate (`pnpm tsc --noEmit` + `pnpm lint` clean)
- Phase B ⨯ — parts/sigma-container, parts/svg-overlay, force-graph.tsx (still scaffolder stub)
- Phase C ⨯ — dummy-data, demo, usage, meta, index, manifest entry
- Final ⨯ — STATUS.md update + system §9 sub-doc map update + ship commit

**Next concrete files (Phase A continuation):**

`lib/source-adapter/`:
- `source-types.ts` — typed delta dispatch helpers
- `snapshot-mode.ts` — static snapshot bootstrap
- `live-mode.ts` — subscribe + delta loop

`hooks/`:
- `use-graph-store.ts` — Zustand store ref + lifecycle (idempotent re-mount per StrictMode double-mount; Q-P1)
- `use-graphology-adapter.ts` — wraps mutations + bumps graphVersion
- `use-graph-selector.ts` — observes graphVersion (decision #4)
- `use-fa2-worker.ts` — FA2 worker lifecycle (start/stop/kick; idempotent disposal)
- `use-theme-resolution.ts` — CSS variable resolution + MutationObserver on `.dark` class
- `use-source-adapter.ts` — loadInitial + subscribe orchestration (delta queue with cap 1000 per Q-P5)
- `use-graph-actions.ts` — exposes ActionsV01

**Critical reminders for hooks layer:**
- React Compiler-aware lint patterns from HANDOFF §5 will surface — derive instead of useState-in-effect; no ref reads during render; useState<HTMLElement> for DOM nodes
- React.StrictMode double-mount handling per plan §17.5 #2 — Sigma + FA2 worker + store creation must be idempotent (`if (!storeRef.current)` pattern)
- Q-P1 lock — graphology MultiGraph + Sigma + FA2 worker all live in `useRef`s inside the component
- `useGraphSelector` MUST observe `graphVersion` (decision #4) — bake the touch into the hook so consumers can't forget

After Phase A end-gate passes (typecheck + lint), pause for review before Phase B.

--- COPY ABOVE ---
```

---

## 4. When to use which

| Scenario | Use |
|---|---|
| Fresh session, weeks since last work, want full re-orient | §1 full primer |
| Same week, you remember the broad strokes | §2 short variant |
| Continuing force-graph v0.1 implementation | §3 force-graph continuation |
| Mid-sprint pause within the same day | Just say "continue from HANDOFF" — auto-memory + auto-loaded STATUS suffice |

---

## 5. Maintenance

When the project state changes meaningfully:

- If `HANDOFF.md` is refreshed, the references here stay accurate — no edit needed.
- If a new top-level decision lands (like #38 in 2026-04-30), update §1 "Decision #X" reminders + §2 critical reminders.
- If force-graph v0.1 ships, retire §3 (or repurpose for v0.2 continuation).
- If a new mandatory convention lands, add it to "Working pattern" in §1, and "Critical reminders" in §2 + §3.

The starter prompt is meant to be stable across pauses; per-pause specifics live in `HANDOFF.md`. If you find yourself updating this file every pause, the content probably belongs in `HANDOFF.md` instead.
