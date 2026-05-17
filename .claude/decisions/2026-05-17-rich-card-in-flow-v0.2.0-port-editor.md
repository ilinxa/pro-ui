---
date: 2026-05-17
type: feat
commits: [06aa562, e2436f0, d880860, 3b3b769, 74508a9, 89bdb9b, 55c7d82, 5684bc5]
components: [rich-card-in-flow]
findings: [F-01-closed, F-02-v0.3, F-03-v0.3]
status: shipped
---

# rich-card-in-flow v0.2.0 — port editor (Workstream B)

## Summary

`rich-card-in-flow@v0.2.0` adds `PortEditorStrip` — an opt-in editor for the ports carried by each rich-card canvas node (or any of its `__rcid`-tagged subcards). Six editable fields per port (`id` / `type` / `side` / `dir` / `multi` / `label`); live-save (no save button); add-popover with `[✓in][✓out]` atomic-row create-flow that splits to `{base}-in` / `{base}-out` rows after save (Q3 lock); doc-port type forces `bottom` side editor-side (Q4 lock); orphan-doc-target tooltip on doc-typed ports today (Q-O2 lock — separate doc-file procomp will resolve in v0.3+).

This is **Workstream B** of the two-workstream plan signed off 2026-05-17 (GATE 2 closed in commit `55c7d82`). **Workstream A** is `flow-canvas-01@v0.2.5` (one-line change: add `"doc"` built-in port type to `defaultPortTypes`) — shipped as a sibling decision at [`.claude/decisions/2026-05-17-flow-canvas-v0.2.5-doc-port-type.md`](2026-05-17-flow-canvas-v0.2.5-doc-port-type.md) but committed in the same chain (`acf2a67`).

No breaking changes vs v0.1.0. New public surface: `PortEditorStrip` component + `PortEditorPermissions` type + `PortField` union. shadcn primitive deps grew from `[]` to `[popover, select, checkbox, input, tooltip, label, button]` — 7 primitives auto-installed by the registry CLI on consumer install.

### Release notes

> **Minor bump.** `@ilinxa/rich-card-in-flow@v0.2.0` (alpha) — opt-in `PortEditorStrip` for editing the ports of any rich-card canvas node or its subcards. Mount above your `<RichCard>` editor in the consumer-owned dialog; pass `canvas` + `onChange`; the strip operates on the same node payload that flow-canvas-01 round-trips.
>
> **Six editable fields per port:** `id`, `type` (defaultPortTypes), `side` (top/right/bottom/left), `dir` (in/out/both), `multi` (boolean), `label` (optional display string). Live-save on every change; live-edges count chip surfaces how many edges currently route through each port (deletion warning surface).
>
> **`[✓in][✓out]` create-flow** atomically splits into 2 independent port rows with `{base}-in` / `{base}-out` ids. Post-save, the rows are independent — no auto-grouping, no implicit linkage (Q3 lock).
>
> **Doc-port type** forces `bottom` side editor-side (Q4 + Q-O1 lock). `flow-canvas-01` runtime stays neutral — consumers wiring doc-ports without the editor can still route them anywhere.
>
> **Permissions** prop is optional and accepts three field-level callbacks: `canAddPort(target)`, `canRemovePort(target, port)`, `canEditField(target, port, field)`. Defaults to permissive.
>
> **Install:** `pnpm dlx shadcn@latest add @ilinxa/rich-card-in-flow` — pulls 14 source files + 7 shadcn primitives + cross-registry deps on `@ilinxa/rich-card` and `@ilinxa/flow-canvas-01@^0.2.5` (latter required for the built-in `"doc"` port type).

## Files

### A1 commit (`acf2a67`) — flow-canvas-01 v0.2.5 prerequisite

| File | What |
|---|---|
| `src/registry/components/data/flow-canvas-01/registries/port-type-registry.ts` | `defaultPortTypes` gains a fourth built-in: `{ id: "doc", color: "var(--chart-3)", label: "Doc" }`. |
| `src/registry/components/data/flow-canvas-01/meta.ts` | Version `0.2.4 → 0.2.5`, `updatedAt: 2026-05-17`. |
| `public/r/flow-canvas-01.json` | Regenerated. |

### B1 commit (`06aa562`) — scaffold: types + lib helpers

| File | What |
|---|---|
| `types.ts` | Adds `PortEditorPermissions` (3 optional callbacks) + `PortField` union (`"id" | "type" | "side" | "dir" | "multi" | "label"`). |
| `lib/port-mutators.ts` | Pure helpers: `makePortId(base)`, `makeInOutPair(base) → [in, out]`, `addPort`/`updatePort`/`removePort` immutable, `isDuplicateId(ports, id, excludeIndex?)`. |
| `lib/find-port-target.ts` | Walks `RichCardCanvasNode` and locates the editable port target (root card OR subcard by `__rcid`). Returns `{ ports, updateIn(nextPorts) }` closure for immutable updates. |

### B2 commit (`e2436f0`) — components

| File | What |
|---|---|
| `parts/port-editor-add-popover.tsx` | Add-popover with `[✓in][✓out]` checkboxes + id-base input + type select + side select + multi toggle + label input. On save: 1 row if one direction checked, 2 atomic rows if both. |
| `parts/port-editor-row.tsx` | Inline-edit row per port: id (commit-on-blur with duplicate-check), type (Select; Q4 auto-correct on doc), side (Select; disabled options when type=doc), dir, multi (Checkbox), label (commit-on-blur), remove button. Read-only summary variant when `editable: false`. |
| `parts/port-editor-strip.tsx` | Main strip. Pre-computes a `live-edges-by-port-id` map from `canvas.data.edges` for the deletion-warning chip. Re-reads `canvas.data.tree.ports` on every render — uncontrolled-by-design (Q9 lock; no key remount required). |

### B2-review commit (`d880860`)

| File | What |
|---|---|
| `types.ts` | Extracted `PortField` as a top-level export type (was inline `keyof`-derived). |
| `parts/port-editor-row.tsx` | `canEditField` callback simplified to `(field: PortField) => boolean`. |
| `parts/port-editor-strip.tsx` | Added comment on `target!` non-null assertion in `commit` closure (narrowed by guard, scope-loss prevents flow analysis). |

### B3 commit (`3b3b769`) — demo + usage + barrel + meta + guide

| File | What |
|---|---|
| `demo.tsx` | Adds `<PortEditorStrip>` above `<RichCard editable>` inside the consumer-owned dialog. Routes onChange through `updateNodeData` helper preserving `__type` + `ports` + tree. |
| `usage.tsx` | New §"Port editing" — wiring snippet, permissions pattern, doc-port enforcement footgun. |
| `index.ts` | Re-exports `PortEditorStrip`, `PortEditorStripProps`, `PortEditorPermissions`, `PortField`, `RichCardCanvasNode`. NO cross-procomp re-exports (F-S1 lock from v0.1.0 retained). |
| `meta.ts` | Version `0.1.0 → 0.2.0`. `dependencies.shadcn: [popover, select, checkbox, input, tooltip, label, button]` (was `[]`). New `features` line for PortEditorStrip. |
| `docs/procomps/rich-card-in-flow-procomp/rich-card-in-flow-procomp-guide.md` | New §7 "Port editor (v0.2 addition)" — full consumer-facing usage notes. §8 Footguns / §9 Migration / §10 Contributor / §11 Cross-references renumbered. |

### B3 UI fix-up commits (`74508a9` + `89bdb9b`)

Two rounds of layout tuning on the in-dialog strip. Round 1 (`74508a9`) widened the dialog and made the row swipeable. Round 2 (`89bdb9b`) root-cause-fixed the "gappy selects" perception: **shadcn v4 `SelectTrigger` ships with `w-fit` baked in**, so fr-grown grid columns left selects content-sized with empty space around them. Final state: `sm:max-w-4xl` dialog (896px), fixed-pixel row columns 220/120/100/80/80/200/36 = 860px row, `w-full` on every `<SelectTrigger>` to fill its column. Read-only row mirrors editable columns. Memory captured at [`project_shadcn_v4_select_w_fit.md`](../../../../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/project_shadcn_v4_select_w_fit.md).

### Planning landing commit (`55c7d82`)

GATE 1 description (`rich-card-in-flow-v0.2.0-port-editor-description.md`) + GATE 2 plan (`rich-card-in-flow-v0.2.0-port-editor-plan.md`) committed. (Should have landed before B1 per the workflow, but slipped through the impl flow and was caught at session pause.)

### B4 commit (`5684bc5`) — registry distribution + smoke + primitive divergence fix

- `registry.json` — rcif base item gets 5 new files (port-editor-{strip,row,add-popover}.tsx + port-mutators.ts + find-port-target.ts) + 7 shadcn entries in `registryDependencies` + description bumped to mention `PortEditorStrip` + `@ilinxa/flow-canvas-01@^0.2.5`.
- `public/r/rich-card-in-flow.json` regenerated. 14 files; 9 registryDependencies.
- **F-S smoke path-b surfaced 3 NEW errors** in consumer-side tsc: producer ships Radix-based shadcn primitives but `shadcn@4.6.0 add` installs Base UI primitives (project's `components.json` style is `base-nova` but `src/components/ui/{tooltip,select}.tsx` were never re-added). `TooltipProvider` accepts `delayDuration` on Radix but `delay` on Base UI; `Select.onValueChange` is `(v: string) => void` on Radix but `(v: string | null, eventDetails) => void` on Base UI.
- **Three source-side fixes shipped in same commit** to make rcif robust to BOTH backends via parameter contravariance: (1) dropped `delayDuration={300}` from `<TooltipProvider>` in port-editor-strip.tsx (accept default delay on each backend); (2) widened 4 `onValueChange` handlers in port-editor-{row,add-popover}.tsx to `(v: string | null)` with null-short-circuit; (3) widened `handleTypeChange` function signature similarly. Re-smoke confirmed 0 rcif errors.
- Promoted to **F-cross-13** in `docs/reviews/sweep-tracker.md` (shadcn primitive Radix→Base UI divergence) — cross-cutting; defensive-callback-pattern reminder for all future procomps using Select / Tooltip / Popover with non-trivial props.

## Verification

All commits clean (post-B4):

- `pnpm tsc --noEmit` — clean
- `pnpm lint` — 0 errors (2 pre-existing virtualizer warnings unchanged)
- `pnpm validate:meta-deps` — 43/43 clean
- `pnpm registry:build` — clean; rcif artifact spot-checked (14 files + 9 registryDependencies)
- F-S smoke harness path-b — pass (after primitive-divergence fix-up cycle)
- `pnpm build` — verified clean in final pre-push verification pass (43 routes including `/components/rich-card-in-flow`)

## GATE 3 spot-check

**Verdict: Pass with follow-ups** ([reviews/2026-05-17-v0.2.0-spotcheck.md](../../docs/procomps/rich-card-in-flow-procomp/reviews/2026-05-17-v0.2.0-spotcheck.md))

Rotating dimension: **Public API** (new `PortEditorStrip` component + `PortEditorPermissions` + `PortField` types are first-of-kind on this slug; load-bearing for v0.3+ compatibility).

Three findings:
- **F-01 (Medium, closed pre-ship):** F-S shadcn primitive Radix→Base UI divergence surfaced + fixed in same v0.2.0 ship (B4). Promoted to F-cross-13 in sweep-tracker.
- **F-02 (Low, v0.3 candidate):** Per-field ports (Q-O4) deferred to v0.3. Already documented in plan + guide.
- **F-03 (Low, v0.3 candidate):** Custom port-type registration in the editor's picker (Q5-bis) deferred to v0.3. Path (b) chosen in spot-check: explicit `portTypes?: PortTypeDef[]` prop, no implicit context.

## Rationale points worth keeping

**Why uncontrolled-by-design `PortEditorStrip` (Q9 lock)?** The strip operates on `canvas` prop and re-reads `canvas.data.tree.ports` on every render. No internal port-list state, no `key={canvas.id}` remount required by consumers. Mirrors the same controlled-mode discipline as rich-card and flow-canvas-01. Add-popover holds its own draft state (controlled subform) — that's the only stateful island.

**Why `[✓in][✓out]` atomic post-save (Q3 lock)?** The two checkboxes are a single create gesture; on save, the popover creates 2 independent port rows with `{base}-in` / `{base}-out` ids. No `groupId` field, no implicit linkage. Consumers who want to reason about pairs can group by id prefix; consumers who want pairs to stay atomic post-creation should drive the editor differently (e.g., compose their own multi-row create modal). The plan considered grouping and rejected it: "atomic post-save" is the simpler contract.

**Why editor-side-only doc-port enforcement (Q4 + Q-O1 lock)?** `flow-canvas-01` runtime stays neutral about port types — including `"doc"`. The editor (rcif's PortEditorStrip) is what enforces `side: "bottom"` for doc-typed ports. Consumers wiring doc-ports without the editor can still route them anywhere — by design. Why: keeps `flow-canvas-01` agnostic + lets future consumers experiment with other doc-port layouts before any opinion gets baked into the host.

**Why drop `delayDuration={300}` from `<TooltipProvider>` instead of swap-on-detect?** The defensive contravariant signature works for `onValueChange` because function parameters are contravariant. But prop names aren't — `delayDuration` (Radix) vs `delay` (Base UI) are syntactically different keys, so no single source attribute satisfies both. Cheapest fix: don't pass the prop; accept each backend's default. The UX divergence is 700ms (Radix default) vs 0ms (Base UI default) on the orphan-doc-target tooltip's appearance — acceptable cosmetic difference, especially because the broader F-cross-13 producer-hygiene task will eventually align producer's primitive to Base UI.

**Why F-cross-13 instead of an inline rcif-specific fix?** The Radix→Base UI gap affects EVERY procomp that uses shadcn primitives with non-trivial props. Documenting the defensive-callback-signature pattern in the cross-cutting tracker lets future procomp authors write robust code by default, rather than each procomp re-discovering the gap at smoke time. The producer-hygiene refresh (re-add `tooltip.tsx` + `select.tsx` under `base-nova`) is a separate standalone task because it touches the primitive layer that all 43 components share.

## What this does NOT include

- **Per-field ports (Q-O4)** — deferred to v0.3. User reminded honoring this when v0.3 starts. Plan §3 + guide cover the gap.
- **Custom port-type registration in PortEditorStrip's picker (Q5-bis)** — deferred to v0.3. Today the picker uses `defaultPortTypes` hardcoded. Path (b) chosen: explicit `portTypes?` prop on the strip in v0.3.
- **Doc-file target resource** — separate future procomp. Doc-ports today are orphan slots with the dev-mode tooltip (Q-O2 lock). Q-O2 surfaces the friction so doc-file procomp planning has real consumer signal when it starts.
- **Drag-to-reorder ports** — deferred to v0.3+. The data shape (array) supports it; the UX is a separate decision.
- **Connection-aware port deletion confirmation** — today the live-edges chip surfaces the count but consent dialog is on the consumer; rcif's remove button fires straight through.
