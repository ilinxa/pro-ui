# `gantt-timeline-01` v0.3.0 — Pro-component Plan (Stage 2 / GATE 2)

> **Stage:** 2 of 3 · **Status:** 🟡 Awaiting sign-off (**GATE 2**) — implements the [v0.3.0 description](./gantt-timeline-01-procomp-description-v0.3.0.md) (GATE 1 confirmed: **D22 auto-when-movable** · **D23 atomic permission**; Q1 scope confirmed; Q2 = **include** `shiftTaskGroup`).
> **Bump:** v0.2.1 → **v0.3.0**. **No new files · no new deps · no new shadcn primitive.** 8 edited code files + docs.

This is the **how**. Every change is additive over the v0.2.x edit layer; the read-only and single-edit paths are untouched and remain the guaranteed fall-through.

---

## 1. The pure mutation — `lib/edit-mutations.ts` (+2 functions, Vitest-ready)

Group-move is *single-bar move applied to each scheduled leaf*. The span is invariant under a rigid shift (both edges move by the same delta), so **no `MIN_DURATION` clamp is needed** — unlike `setWindow`.

```ts
/** Leaf descendants of `root` (excludes derived summaries). Walks children
 *  directly — NO index rebuild — so it's cheap in the render-hot canGroupMove. */
export function subtreeLeaves(root: TodoItem): TodoItem[] {
  const out: TodoItem[] = [];
  const walk = (n: TodoItem) => {
    if (n.children?.length) n.children.forEach(walk);
    else out.push(n);
  };
  root.children?.forEach(walk);   // a summary root → never itself pushed
  return out;
}

/**
 * Rigidly shift a subtree by `deltaMs`: every LEAF descendant's window moves;
 * derived summaries (the root + any nested parent) keep their own latent dates
 * and recompute their brackets from the moved leaves (D24, WBS-consistent).
 * Writes `startAt` (+ `expireAt` for expireAt-driven leaves); `duration`/`setAt`
 * untouched; milestones shift `startAt` only. Structural sharing.
 */
export function shiftSubtree(data: TodoItem[], rootId: string, deltaMs: number): TodoItem[] {
  if (!Number.isFinite(deltaMs) || deltaMs === 0) return data;
  const shiftLeaf = (item: TodoItem): TodoItem => {
    const next: TodoItem = { ...item, startAt: new Date(effStartMs(item) + deltaMs).toISOString() };
    if (item.expireAt != null) next.expireAt = new Date(effEndMs(item)! + deltaMs).toISOString();
    return next;
  };
  const shiftDeep = (item: TodoItem): TodoItem =>
    item.children?.length
      ? { ...item, children: item.children.map(shiftDeep) }
      : shiftLeaf(item);
  return replace(data, rootId, shiftDeep);   // reuses the existing `replace` helper
}
```

`effStartMs`/`effEndMs` import from `./geometry` (edit-mutations lives in `lib/`, so geometry is a same-dir sibling — `./geometry`, **not** `../lib/geometry`; the file currently imports only `TodoItem` from `../types`). Pure, no React.

---

## 2. The dispatcher + capability — `hooks/use-gantt-edit.ts`

Add `canGroupMove` (drives both the gesture gate and the cursor) and `moveSubtree` (the chokepoint). Both reuse the existing `can("move", …)` resolver and `guard` — **no new permission code**.

```ts
import { shiftSubtree, subtreeLeaves } from "../lib/edit-mutations";

/** Atomic (D23): summary movable AND every descendant leaf movable. */
const canGroupMove = useCallback((item: TodoItem): boolean => {
  if (!editable || !can("move", item)) return false;
  const leaves = subtreeLeaves(item);            // item in hand → no index rebuild
  return leaves.length > 0 && leaves.every((l) => can("move", l));
}, [editable, can]);

const moveSubtree = useCallback((id: string, deltaMs: number) => {
  const summary = guard("move", id);            // fires onPermissionDenied if summary blocked
  if (!summary) return;
  const leaves = subtreeLeaves(summary);        // summary item already in hand
  if (leaves.length === 0) return;
  for (const leaf of leaves) {                  // atomic: report the first blocker, abort
    if (!can("move", leaf)) {
      const reason: TodoPermissionReason = leaf.locked
        ? "locked" : canMoveItem?.(leaf.id) === false ? "predicate" : "default";
      onPermissionDenied?.("drag", leaf.id, reason);
      return;
    }
  }
  if (deltaMs === 0) return;
  const next = shiftSubtree(data, id, deltaMs);
  if (next === data) return;
  const nextIndex = buildIndex(next);
  for (const leaf of leaves) {                  // D25: per-leaf field events, parity w/ single-move
    const updated = nextIndex.get(leaf.id)?.item;
    if (!updated) continue;
    onFieldEdited?.({ itemId: leaf.id, key: "startAt", oldValue: leaf.startAt, newValue: updated.startAt });
    if (updated.expireAt !== leaf.expireAt)
      onFieldEdited?.({ itemId: leaf.id, key: "expireAt", oldValue: leaf.expireAt, newValue: updated.expireAt });
    onTaskReschedule?.({ itemId: leaf.id, startAt: updated.startAt ?? updated.setAt, expireAt: updated.expireAt });
  }
  onChange?.(next);                             // single onChange = one undo step
}, [data, can, guard, canMoveItem, onPermissionDenied, onFieldEdited, onTaskReschedule, onChange]);
// (deps reference only what the body uses — `guard` already encapsulates `editable`/`index`;
//  the exact list is enforced by the lint gate.)
```

Return both from the hook; add to the deps/return list.

---

## 3. The gesture — `parts/gantt-timeline-body.tsx`

**3a. New `EditDrag` variant** (alongside `move`/`resize`/`create`):
```ts
| { kind: "groupmove"; id: string; grabMs: number; deltaMs: number;
    spanStart: number; spanEnd: number; topPx: number }
```

**3b. Hit-test in `tryStartEdit`** — inserted **after** `snapUnitRef.current` is set and **before** the `[data-itemid]` bar block (summary bars carry `data-summaryid`, not `data-itemid`, so the two are independent; placing it first keeps the read clear):
```ts
const summaryEl = target.closest<HTMLElement>("[data-summaryid]");
if (summaryEl) {
  const sid = summaryEl.dataset.summaryid!;
  const sitem = ctx.getItem(sid);
  if (!sitem || !ctx.canGroupMove(sitem)) return false;   // → falls through to pan (v0.2.1)
  const span = ctx.summarySpanFor(sitem);
  if (!span) return false;
  const drag: EditDrag = { kind: "groupmove", id: sid, grabMs: tMs, deltaMs: 0,
    spanStart: span.startMs, spanEnd: span.endMs, topPx: rowTopOf(sid) };
  editDragRef.current = drag; setEditDrag(drag);
  e.currentTarget.setPointerCapture(e.pointerId);
  return true;
}
```
> **Fall-through preserved:** grabbing the *empty area* of a summary row (not the bracket) still hits the later `[data-rowid]` → `isSummary` → `return false` → pan. Grabbing the bracket of a *non-movable* group also returns false → pan. v0.2.1 behavior is exactly retained for every non-group-move case.

**3c. `moveEdit`** — new arm (snap the leading edge, like single-move):
```ts
if (d.kind === "groupmove") {
  const newStart = snapTo(d.spanStart + (tMs - d.grabMs), u);
  nextDrag = { ...d, deltaMs: newStart - d.spanStart };
}
```

**3d. `commitEdit`** — handle early (before the single-item `ctx.rows.find(d.id)` lookup, like the `create` arm):
```ts
if (d.kind === "groupmove") { if (d.deltaMs !== 0) ctx.moveSubtree(d.id, d.deltaMs); return; }
```

**3e. `EditPreview`** — new `groupmove` arm renders the **shifted bracket span** + label:
```ts
if (drag.kind === "groupmove") {
  const s = drag.spanStart + drag.deltaMs, e = drag.spanEnd + drag.deltaMs;
  left = x(viewport, s); width = Math.max(x(viewport, e) - left, 8);
  label = `${new Date(s).toLocaleDateString()} → ${new Date(e).toLocaleDateString()}`;
}
```
(topPx = the summary row — already on the drag.) Cursor: the existing `editDrag?.kind === "create" && "cursor-crosshair"` line stays; group-move uses the SummaryBar's own grab cursor.

**3f. Render props on `SummaryBar`** — in the summary branch of the row map, pass:
```ts
<SummaryBar … data-summaryid={item.id}
  groupMovable={editable && ctx.canGroupMove(item)} … />
```

---

## 4. The handle + cursor — `parts/gantt-bars.tsx`

`SummaryBar` gains one additive prop + a transparent hit-pad (the visual stays a 7px bar; the pad makes the grab comfortable per the GATE-1 hit-target note):
```ts
export type SummaryBarProps = { leftPx; widthPx; selected?;
  /** v0.3.0 — grab cursor + enlarged hit area for group-move. */
  groupMovable?: boolean;
} & HTMLAttributes<HTMLDivElement>;

// className: swap the static "cursor-pointer" for
//   groupMovable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
// body (when groupMovable): a transparent vertical pad so the thin bar is grabbable
{groupMovable ? <span aria-hidden className="absolute -inset-y-2 inset-x-0" /> : null}
```

---

## 5. Types + root wiring

**`types.ts`** — `GanttContextValue` gains:
```ts
canGroupMove: (item: TodoItem) => boolean;
moveSubtree: (id: string, deltaMs: number) => void;
```
`GanttTimelineHandle` gains (Q2):
```ts
/** v0.3.0 — shift a summary's whole subtree by deltaMs (no-op if not group-movable). */
shiftTaskGroup(summaryId: string, deltaMs: number): void;
```

**`parts/gantt-timeline-root.tsx`** — thread `canGroupMove: edit.canGroupMove`, `moveSubtree: edit.moveSubtree` into `ctx`; add `shiftTaskGroup: (id, d) => edit.moveSubtree(id, d)` to the imperative handle (deps already include `edit`).

---

## 6. Docs + meta + registry

- **`meta.ts`** — `version: "0.3.0"`; add a feature bullet *("v0.3 group-move: drag a WBS summary bracket → rigid subtree shift, snap + Alt-free, atomic permission, one onChange")*; extend the description sentence. `status` stays `alpha`.
- **`registry.json`** — **no file list change** (all touches are to already-listed files). Update only the base item's `description` string to mention group-move (surgical text edit, not a re-stringify — per the registry hand-format lesson).
- **`guide.md`** — new "Group-move" subsection (how to grab, snap/Alt, atomic permission, the per-leaf events + single onChange, `shiftTaskGroup`).
- **`demo.tsx` / `usage.tsx`** — a one-line hint in the editable example ("drag a summary bracket to move the whole group"); no structural demo change required.

---

## 7. Verification (GATE 3) — spot-check, rotating dim **Public API**

Rotating dimension = **Public API** (the headline risk is the **pan→move behavior change** for editable+movable consumers + the new handle method + the `SummaryBar` prop). Fixed core (4): planning-docs sync · registry distribution · meta/manifest sync · verification.

Gates to pass before push:
- `pnpm tsc --noEmit` → 0 · `pnpm lint` → 0 err · `pnpm validate:meta-deps` → **56/56** (no file-count change) · `pnpm build` ✓ · `pnpm registry:build` ✓.
- **Manual interaction smoke** (the de-facto gate, per the v0.2.x lessons — tsc/lint can't see gesture bugs):
  1. Drag a summary bracket → whole subtree shifts; bracket re-frames; `onChange` fires once.
  2. Snap to active unit; Alt = free.
  3. Lock one leaf → bracket-drag **pans** (atomic deny) + `onPermissionDenied` fires.
  4. `editable={false}` → byte-identical v1 (bracket-drag pans, no move).
  5. Empty summary-row area (not the bracket) → pans.
  6. Collapsed summary → group-move still shifts hidden descendants.
- **F-01 cross-backend consumer smoke** — **not mandated** (no new shadcn primitive → F-cross-13 trigger doesn't fire). Optional light post-deploy `shadcn add` + consumer-tsc as a courtesy; will note in the decision file.
- **Vitest** — `shiftSubtree` + `subtreeLeaves` are pure + test-ready; tests deferred per the standing convention (noted, not blocking).

---

## 8. File touch list (final)

| # | File | Change |
|---|---|---|
| 1 | `lib/edit-mutations.ts` | +`subtreeLeaves`, +`shiftSubtree` (+geometry import) |
| 2 | `hooks/use-gantt-edit.ts` | +`canGroupMove`, +`moveSubtree`; return + deps |
| 3 | `parts/gantt-timeline-body.tsx` | `groupmove` EditDrag arm: hit-test, moveEdit, commitEdit, EditPreview; pass props to SummaryBar |
| 4 | `parts/gantt-bars.tsx` | `SummaryBar`: `groupMovable` prop + grab cursor + hit-pad |
| 5 | `types.ts` | `GanttContextValue` +2; `GanttTimelineHandle` +`shiftTaskGroup` |
| 6 | `parts/gantt-timeline-root.tsx` | wire `ctx` +2 + handle method |
| 7 | `meta.ts` | version 0.3.0 + feature bullet + description |
| 8 | `registry.json` | base-item description string only |
| — | `guide.md` · `demo.tsx` · `usage.tsx` | consumer docs + demo hint |
| — | `reviews/2026-06-21-v0.3.0-spotcheck.md` | GATE 3 |
| — | STATUS.md · decision file · memory | close-out |

**Net:** 0 new files, 0 new deps, 0 new primitives. One new gesture arm, one pure mutation, one dispatcher, one additive primitive prop, one handle method.

---

## 9. Risks & mitigations

- **R1 — behavior change (pan→move).** Mitigated: gated behind `editable`; degrades to pan for non-movable groups; called out honestly in the description. Minor bump signals it.
- **R2 — thin bracket hit target.** Mitigated by the transparent vertical hit-pad (§4); visual unchanged.
- **R3 — event volume on a big subtree.** Per-leaf events are parity with single-move (a consumer already handles them); a single `onChange` bounds the echo to one render/undo step. If a consumer wants quiet, they can ignore `onFieldEdited` and use only `onChange`. Acceptable; documented.
- **R4 — gesture arbitration regression.** Mitigated: the new arm only fires on `[data-summaryid]` + `canGroupMove`; every other path (bars, empty rows, non-movable summaries, non-editable) is unchanged and tested in the manual smoke.

On GATE 2 sign-off I implement §1–§6, run §7 gates, author the §7 review, and only then commit/push.
