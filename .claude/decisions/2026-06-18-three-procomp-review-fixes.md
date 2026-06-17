---
date: 2026-06-18
session: consumer-issue-report fixes (kanban-board-01 / todo-rich-card / todo-tree)
phase: maintenance — public-API-touching minor bumps
type: bug-fix + feature + docs-alignment
commits: [pending — 3 per-component commits, tip recorded at push]
components: [kanban-board-01, todo-rich-card, todo-tree]
findings: 35 (all validated real) — K1–K10, R1–R14, TT1–TT11
status: closed pending push (3× GATE 3 Pass-with-follow-ups)
---

# Three-procomp consumer-issue-report fixes (35 findings)

## Context

An external consumer filed a 35-item issue report against three composed procomps
(`kanban-board-01` v0.3.0, `todo-rich-card` v0.1.1, `todo-tree` v0.1.3). We **independently
validated every finding** against current source (3 verification agents, quoted evidence):
**all 35 are real**, none refuted, a handful narrowed in scope, plus one report-side error that
surfaced a *bonus* issue (kanban `meta.ts` vs `registry.json` dep mismatch). Fixed all of them.

The three compose: `TodoItem` is defined in `todo-rich-card/types.ts` and imported by `todo-tree`;
`kanban-board-01` is schema-agnostic and composes todo-rich-card only via `kanban-adapter.tsx`.

## Scope decisions (user-confirmed)

- **Gap depth = Hybrid.** Built the load-bearing features (R4 controlled mode + R3 kanban
  edit-flow). Honest-trimmed the rest (R5/R7 removed over-promising fields from the editable union
  + doc; TT8 kept deferred; K5 dropped the unshipped hard-maxItems promise).
- **Tests = deferred** to match convention (no runner exists; readiness-review treats Vitest as an
  informed-defer; all 55 prior procomps shipped on tsc + lint + demo verification). K6/R11/TT9 stay
  as documented test-debt. *Flag:* the defer's named exit-trigger ("first non-trivial bug in pure
  `lib/`") is arguably now tripped by R1/R2/TT1 — recorded, not actioned.

## Version bumps

| Component | → | Why minor |
|---|---|---|
| kanban-board-01 | **0.4.0** | K2 + K7 type narrowings; additive `KanbanRenderContext.onDataChange` (R3) |
| todo-rich-card | **0.2.0** | additive controlled `value` (R4); R5/R7 editable-union narrowing |
| todo-tree | **0.2.0** | TT1 changes DnD/row gating *behavior*; TT3 full guide-API regen |

## Headline fixes

**kanban-board-01 (K1–K10 + bonus + R3-kanban):** object-shape callback docs (K1); `meta[].value`
→ `string | number` (K2); removed dead `tooltip` dep from `registry.json` + guide + closed the
meta/registry mismatch (K3 + bonus); version reconcile + changelog (K4); dropped hard-maxItems
promise (K5); `onColumnCreate` → `KanbanColumn` (K7); removed dead `newSwimlaneId` (K8); validate
re-runs on data change (K9); crypto ids (K10). **R3 kanban side:** additive
`KanbanRenderContext.onDataChange` threaded Board→Column→ColumnBody→SwimlaneCell→ItemShell;
`handleItemUpdate` wired ungated so self-editing renderers persist to board state.

**todo-rich-card (R1–R14):** **R1** re-id pass (`reassignIds`) at the single `add-child` reducer
chokepoint (verified no programmatic add path → no consumer-id clobber); **R2** cache-miss resolves
against the parent's real ancestor rule; **R3** adapter now `value`-controlled + `onChange →
onDataChange` + `editable={!isLocked}` + `key` (adapter uses an INLINE ctx type → no new
registryDependency); **R4** controlled mode (`value` prop + `sync-tree` action + reconcile effect
with echo + `suppressChangeRef` guards, mirroring todo-tree's dual-mode pattern); **R5/R7**
person/image/link removed from `TodoEditableField` + doc read-only; **R6** single `requestEdit`
(veto-before-dispatch) across header/keyboard/handle, retroactive `close-edit` removed; **R8–R13**
docs + Select annotation + `initials()` guard + JSDoc; **R14** documented-defer.

**todo-tree (TT1–TT11):** **TT1** the `permissions` matrix is now honored on the mouse/DnD path —
per-row `canDrag`/`canToggleActive` via `evalPermission`, drop predicates threaded into the DnD
hook (were `undefined`); **TT2/TT11** full serialized-tree echo guard (was a 5-field walk that
dropped assignee/description/date changes); **TT4** toolbar "+ New" honors level-0 `addChildren`;
**TT6** native `CSS.escape`; **TT7** scroll/wheel re-compute the drag over-zone from the cached
pointer; **TT3** guide API sections fully regenerated from `types.ts` (26-method handle, 17 events,
real headless fields, `virtualize` prop, 0-indexed `byLevel`, deleted non-existent predicate
props) + `meta.ts:23` fixed; **TT5/TT8/TT10** doc/comment clarifications.

## Key engineering notes / lessons

- **Generic vs variance:** making `KanbanRenderContext<TData>` generic broke the built-in renderers
  (contravariant `onDataChange` param). Kept it non-generic with `(nextData: unknown)`; the typed
  adapter passes a `TodoItem` (assignable to `unknown`). Simpler + correct.
- **Controlled reconcile (R4):** deps `[value]` ONLY (not `state.root`) so internal optimistic
  mutations don't revert; canonical `normalize→denormalize` JSON compare as the echo guard;
  `suppressChangeRef` prevents the apply-from-`value` re-firing `onChange`.
- **R1 chokepoint:** re-iding in the reducer (not the 3 call sites) is safe *because* no programmatic
  `addChildren` path exists — all `add-child` dispatches are paste/drop.
- **TT1 row affordances** AND `!readOnly` — also closes a latent readOnly hole (grip/checkbox were
  enabled in readOnly before).
- **TT7 refs:** `react-hooks/refs` forbids writing refs during render → synced `activeItemRef`/
  `itemsRef` in an effect.
- **TT10 nuance:** the row checkbox binds a single item's `active` (never a mixed group) — the
  report's "always commits true" doesn't apply; the fix is the misleading-comment correction.

## Verification

tsc clean · lint at repo baseline (81/22, **0 new**) · `validate:meta-deps` 55/55 · `registry:build`
(kanban `tooltip` gone; `onDataChange`/`reassignIds`/`sync-tree` shipped) · `pnpm build` (64 pages).
GATE 3 spotchecks authored for all three, each **Pass with follow-ups**:
[kanban](../../docs/procomps/kanban-board-01-procomp/reviews/2026-06-18-v0.4.0-spotcheck.md),
[todo-rich-card](../../docs/procomps/todo-rich-card-procomp/reviews/2026-06-18-v0.2.0-spotcheck.md),
[todo-tree](../../docs/procomps/todo-tree-procomp/reviews/2026-06-18-v0.2.0-spotcheck.md).

## Open follow-ups (all Low / deferred)

- Post-deploy cross-procomp consumer-tsc smoke for the kanban × todo-rich-card pair.
- v0.3: person/image/link editors (re-add to the union); SSR deterministic-first-paint; gated
  `try*` imperative-handle variants (todo-tree); inline rename (todo-tree).
- Vitest infra (policy-blessed defer; trigger now arguably met).
