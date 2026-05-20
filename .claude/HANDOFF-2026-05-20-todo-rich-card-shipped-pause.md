# Session pause — 2026-05-20 — ⚑ HISTORICAL (closed same-session)

> **HISTORICAL — closed same-session.** Pause was real but resume happened immediately. v0.1.0 shipped via commit chain `a7db466` → `d90f3a3` → `c2f7425` (push). F-04 path-b smoke against the published Vercel artifact then surfaced 3 F-cross-13 hits (Select Radix→Base UI signature divergence + TooltipProvider.delayDuration); patch-fixed in v0.1.1 (`431da34`); re-smoke clean. Spotcheck verdict stays `Pass with follow-ups` (F-04 closed in-line; F-01 v0.2 + F-03 future-patch + F-05 future remain open with bump targets). Next-up `todo-list` orchestration shell remains as recorded below — clarify Reading A vs B before drafting GATE 1.
>
> **Original status at pause:** `todo-rich-card@v0.1.0` is **locally complete** (28 files in folder, 26 ship via registry, 0 lint/tsc/meta-deps/build errors) but **NOT YET COMMITTED OR PUSHED**. Tip: `33c72f9`. Working tree has 4 modified + 3 untracked paths (see §"Git state" below).
>
> **Next-up on resume:** `todo-list` orchestration shell — sibling procomp to `todo-rich-card`. User explicitly named the **tree variant** as the entry point ("create the todo tree version"). Two interpretations possible; clarify on resume.
>
> **Active handoffs prior to this:** all historical — [2026-05-17 port-editor pause](HANDOFF-2026-05-17-port-editor-pause.md) (closed), [2026-05-16 × 2](HANDOFF-2026-05-16-rcif-edge-handle-debug-pause.md), [2026-05-14](HANDOFF-2026-05-14-flow-canvas-perf-pause.md), [2026-05-09](HANDOFF-2026-05-09-session-pause.md). All paused work has shipped; this is now also historical.

---

## What shipped this session (locally — pre-push)

### `todo-rich-card@v0.1.0` (44th component; 1st of 2-3 in the todo family)

Fixed-schema sibling to `rich-card`. Time-aware task card with OKLCH border-color engine, dual edit modes (popup + inline-toggle), JSON I/O + clipboard + DnD payload, granular events, permission predicates, infinite recursive children, per-card collapsibility, color-override Dialog with prominent **Auto** button.

**Surface:** ~25 props · 12 imperative-handle methods · 11 typed events · 25 exported types · 14 shadcn primitives (`avatar` / `badge` / `button` / `dialog` / `dropdown-menu` / `input` / `label` / `scroll-area` / `select` / `separator` / `switch` / `textarea` / `tooltip`) · `lucide-react` peer. Sealed folder 29 files in the working tree, 26 ship via registry (demo / usage / meta are docs-site only).

**Companion adapter:** `todoRichCardKanbanRenderer` named export for `kanban-board-01` (`dragHandle: "header"`). Lives at `parts/kanban-adapter.tsx`.

### All four GATEs cleared this session

- **GATE 1 description** signed off ([docs/procomps/todo-rich-card-procomp/todo-rich-card-procomp-description.md](../docs/procomps/todo-rich-card-procomp/todo-rich-card-procomp-description.md)) with 5 consistency fixes after audit
- **GATE 2 plan** signed off ([docs/procomps/todo-rich-card-procomp/todo-rich-card-procomp-plan.md](../docs/procomps/todo-rich-card-procomp/todo-rich-card-procomp-plan.md)) with 8 post-audit fixes
- **Implementation** all 28 files written following plan §17's order; tsc + lint + validate-meta-deps (44/44) + build (53 routes) clean
- **GATE 3 spotcheck** ([docs/procomps/todo-rich-card-procomp/reviews/2026-05-20-v0.1.0-spotcheck.md](../docs/procomps/todo-rich-card-procomp/reviews/2026-05-20-v0.1.0-spotcheck.md)) Pass with follow-ups; rotating dim Public API; 5 findings (1 ⚠️ High process gate, 1 🔸 Medium 4-deviation roll-up, 3 🔹 Low future-version candidates)
- **Guide** authored at [docs/procomps/todo-rich-card-procomp/todo-rich-card-procomp-guide.md](../docs/procomps/todo-rich-card-procomp/todo-rich-card-procomp-guide.md)
- **Decision file** at [.claude/decisions/2026-05-20-todo-rich-card-v0.1.0-first-ship.md](decisions/2026-05-20-todo-rich-card-v0.1.0-first-ship.md)

### Post-spotcheck fast-follows (same session, before push) — folded into F-02

1. **Color override `<Popover>` → `<Dialog>`** — outside-click race with action-menu dismissal; pivoted to modal Dialog. Footer carries prominent **Auto** button (Sparkles icon, secondary variant) that clears the override. `popover` dropped from `meta.shadcn` + `registry.json`.
2. **Per-card collapsibility** — chevron at left of every header; toggles `collapsedIds: ReadonlySet<string>` slice on reducer state. Collapsed cards hide body + nested children. Per-item, UI-only (NOT in `TodoItem` schema). Default expanded.
3. **Demo whitespace fix** — `{DEMO_ITEMS.length} demos · ...` JSX whitespace caused SSR-vs-client hydration mismatch; collapsed to a single template-literal expression.
4. **Color picker hyper-cleanup** — palette swatches + free-text CSS input + Auto button + Close button in DialogFooter.

All four deviations are captured in spotcheck F-02 (Medium); guide.md + usage.tsx + meta.ts updated post-spotcheck to match current behavior.

---

## Git state at pause

```
On branch master
Modified (4):
  .claude/STATUS.md
  registry.json
  src/app/components/[slug]/_lib/source-map.generated.ts   ← auto-generated by predev/prebuild
  src/registry/manifest.ts

Untracked (3):
  .claude/decisions/2026-05-20-todo-rich-card-v0.1.0-first-ship.md
  docs/procomps/todo-rich-card-procomp/
  src/registry/components/data/todo-rich-card/

Last commit: 33c72f9 — "Refactor code structure for improved readability and maintainability"
```

**Suggested commit chain on resume:**

1. `feat(todo-rich-card): v0.1.0 first ship — 44th component`
   - Scope: `src/registry/components/data/todo-rich-card/` (28 files) + `src/registry/manifest.ts` + `registry.json` + `src/app/components/[slug]/_lib/source-map.generated.ts` (auto)
2. `docs(todo-rich-card): procomp planning + GATE 3 spotcheck + decision file`
   - Scope: `docs/procomps/todo-rich-card-procomp/` (4 files: description, plan, guide, reviews/spotcheck) + `.claude/decisions/2026-05-20-todo-rich-card-v0.1.0-first-ship.md`
3. `docs(status): todo-rich-card v0.1.0 SHIPPED entry + 44 components`
   - Scope: `.claude/STATUS.md`

Or one combined commit if preferred. The dev server was running (`bn0ewb4ql`) and may still be alive in the background — kill before commit if so.

---

## Pending work on resume (in priority order)

### 1. Commit + push `todo-rich-card@v0.1.0`

Standard flow. Push triggers Vercel `pnpm vercel-build` → regenerates `public/r/*.json` from `registry.json` → component installable via `pnpm dlx shadcn@latest add @ilinxa/todo-rich-card`.

### 2. F-04 — F-cross-11 path-b smoke harness (spotcheck High)

Pre-requirement for declaring v0.1.0 truly "shipped." Runs against the published Vercel artifact:

```bash
# In a separate session/branch (smoke harness is at e:/tmp/ilinxa-smoke-consumer/)
cd e:/tmp/ilinxa-smoke-consumer
pnpm dlx shadcn@latest add @ilinxa/todo-rich-card     # install
pnpm dlx shadcn@latest add @ilinxa/todo-rich-card-fixtures   # fixtures sibling
pnpm tsc --noEmit                                      # path-b: consumer-side tsc clean
```

Update the spotcheck file with the result row + flip verdict to clean **Pass** if smoke passes. If smoke fails, iterate (likely F-S1-class cross-procomp import bugs; we have no cross-procomp imports in this procomp so risk is low — only `@/components/ui/*` shadcn imports).

### 3. `todo-list` orchestration shell — NEXT-UP WORK ⭐

User's pause request: **"create the todo tree version"**.

**Two readings:**

- **Reading A** (full v0.1 with three variants, tree being the simplest entry): ship `todo-list@v0.1.0` with `variant="rich" | "tree" | "kanban"` per the description doc's locked scope. Implement tree first because it's the lightest weight, then layer rich (consumes `todo-rich-card`) and kanban (composes `kanban-board-01` with `todoRichCardKanbanRenderer`).
- **Reading B** (ship just the tree variant as v0.1.0, then add rich + kanban in v0.2 / v0.3): minimum-viable v0.1 with `todo-list-tree` only. Rename slug or keep `todo-list` with a single supported variant. Smaller initial surface.

**Clarify on resume.** Recommend Reading A — the existing description doc was authored as "todo-list with three variants" + the work is split across todo-rich-card (already done) + todo-list (this one) + todo-rich-card-in-flow (later); shipping all three variants of todo-list together keeps the procomp count manageable.

**Pre-resume reading list:**

1. The current todo-rich-card description's §"Composable target surfaces" + §"todo-list features" descriptions (locked, not authored yet)
2. `file-tree`'s implementation at `src/registry/components/navigation/file-tree/` for tree-rendering patterns (DO NOT compose; FsNode shape is too opinionated — borrow patterns only)
3. `kanban-board-01`'s `KanbanCardRenderer` + `KanbanData` types — kanban variant transforms `TodoItem[]` → `KanbanData` via consumer-configured `groupBy`
4. Original conversation locks (from todo-rich-card session):
   - **Architecture (Q2):** two procomps, todo-rich-card first then todo-list
   - **Kanban groupBy (Q4 from todo-list conversation):** configurable — `'status' | 'targetPerson' | 'active' | (item) => string`, default `'status'`
   - **Tree variant treatment of color (Q15 from todo-rich-card):** opts out of auto-color (lightweight rows)
   - **DnD edge-zone reparenting:** top/bottom edge = sibling adjacent; middle = reparent as child
   - **Sort/filter/search:** default toolbar UI + headless `useTodoListState` hook (BYO UI)
   - **Active items:** inactive hidden by default with toggle
   - **DnD payload protocol with todo-rich-card:** card swallows drops into its own children-group; list shell handles sibling/reparent zones (don't double-handle)

**GATE 1 description doc is REQUIRED before any code per CLAUDE.md workflow.** Do not run `pnpm new:component` until GATE 1 + GATE 2 are signed off.

### 4. (later) `todo-rich-card-in-flow` adapter procomp

Sibling to `rich-card-in-flow`. NodeRenderer for flow-canvas-01 that wraps a `TodoRichCard` per node. Smaller scope than todo-list — a few files mirroring rcif's shape. Lower priority; queue after todo-list ships.

---

## State of the surrounding world

- **Components:** 44 across 8 categories
- **Active queue:** 6/8 shipped (pdf-viewer / file-tree / file-manager / code-block / json-form / **todo-rich-card**); 2 remaining (chat-panel, notification-system). rich-graph-2 still on the roadmap (separate from active queue).
- **Open project-wide decisions / TODOs** (unchanged from pre-session): F-cross-13 path (b) primitive refresh, F-S1 watch, flow-canvas-01 v0.2.0 spotcheck follow-ups, pdf-viewer worker default v0.2 candidate, smoke harness baseline at `e:/tmp/ilinxa-smoke-consumer/`. See STATUS.md "Open decisions / TODOs" §.
- **Memory-driven locks active for next session:**
  - F-S1 — relative cross-procomp imports + drop barrel re-exports (will apply when todo-list imports todo-rich-card)
  - F-cross-13 — shadcn primitive defensive callback contravariance + drop syntactically-divergent prop names + `<Select className="w-full">` override
  - Controlled-mode three-defenses — N/A here (uncontrolled by default)
  - Verify peer packages exist on npm during plan stage

---

## Code state — verification at pause

```
pnpm tsc --noEmit                  → 0 errors
pnpm lint                          → 0 errors for todo-rich-card (2 unrelated pre-existing warnings)
pnpm validate:meta-deps            → 44/44 clean
pnpm build                         → 53 static pages, no console warnings
```

Dev server was running (`pnpm dev` → http://localhost:3000) — user was test-driving the demo when pause was called. Background bash ID at pause: `bn0ewb4ql`.

---

## Resume checklist

```
[ ] 1. git status — confirm working tree still matches §"Git state" snapshot above
[ ] 2. Kill the dev-server background process if still alive
[ ] 3. Commit the queued changes (chain in §"Suggested commit chain" above)
[ ] 4. Push to master — Vercel auto-deploys
[ ] 5. Run F-04 smoke harness against the published artifact
[ ] 6. Flip spotcheck verdict to clean Pass + update STATUS / decision file
[ ] 7. Clarify with user: Reading A (full todo-list with 3 variants) vs Reading B (tree-only v0.1) for "create the todo tree version"
[ ] 8. Draft GATE 1 description for todo-list at docs/procomps/todo-list-procomp/todo-list-procomp-description.md
[ ] 9. Get GATE 1 sign-off → draft GATE 2 plan → sign-off → scaffold → implement → GATE 3 → ship
[ ] 10. Author handoff close — mark this file historical
```

This handoff replaces no prior handoff (the 2026-05-17 port-editor pause is the last historical one). On resume, mark this file as historical in STATUS.md after step 6.
