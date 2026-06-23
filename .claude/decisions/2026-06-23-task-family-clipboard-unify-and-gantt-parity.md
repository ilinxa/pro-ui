---
date: 2026-06-23
session: task-family-clipboard-unify
phase: implementation
type: feature + cross-cutting-fix
commits: []  # built + gated, not yet committed at time of writing
components: [todo-rich-card, calendar-01, gantt-timeline-01, todo-tree]
findings: [F-cross-clipboard-two-formats]
status: in-flight (gated green; review + push pending)
---

# Task-family clipboard unification + gantt-timeline-01 v0.5.0 calendar-parity

## Why

The user compared `calendar-01` and `gantt-timeline-01` and flagged that gantt lacked
two calendar affordances — **double-click → create dialog** and **right-click clipboard** —
then asked to "make everything consistent between the management components."

The dependency audit surfaced a real, pre-existing inconsistency: **the task family had two
incompatible clipboard formats**, so cross-surface paste silently no-op'd between some pairs:

| Surface | Module | Transport | Payload |
|---|---|---|---|
| `todo-rich-card` | `lib/json-io.ts` | MIME `application/x-ilinxa-todo+json` + text/plain | a **bare single `TodoItem`** |
| `calendar-01` | `lib/clipboard.ts` | text/plain only | an **envelope** `{kind:"ilinxa/task", version, items: TodoItem[]}` |

calendar↔rich-card paste failed both ways (each rejected the other's shape). Just hoisting
calendar's file verbatim would have left two formats and the break unfixed.

## Decisions (user-approved via AskUserQuestion)

1. **Full unify on ONE envelope, hosted in `todo-rich-card`.** Rich-card joins it — the
   envelope carries the *whole* `TodoItem` (all detail: description/images/links/people/
   children), so rich-card loses nothing; it's just the single-item degenerate case
   (`items:[item]`). Back-compat read branch still accepts a legacy bare item.
2. **Double-click "create dialog" = lightweight quick-composer** (new
   `gantt-quick-composer.tsx`), mirroring calendar's `quickCompose`.
3. **Optional extras: Priority submenu** (gantt). Explicitly NOT: imperative copy/paste
   handle methods on gantt, cut visual feedback.
4. **todo-tree parity:** add clipboard (keyboard + handle) AND `priorityOptions`.
5. **kanban stays out** — it's data-agnostic (`KanbanItem`, no `TodoItem`, no todo-rich-card
   dep). A future `todoRichCardKanbanRenderer` could wire the adapter; not built here.

## What shipped

### Phase 1 — `todo-rich-card` v0.4.0 (the foundation)
- **NEW `lib/clipboard.ts`** — the canonical family module. Envelope on **both** the custom
  MIME (async `navigator.clipboard.write` fast-path) and `text/plain` (universal + the
  ClipboardEvent path). Read is omnivorous (envelope OR legacy bare item → `[item]`). Pure /
  framework-free. Exports `serializeTasks`/`parseTasks`/`reassignTaskIds`/`write|readTasksToClipboardEvent`/
  `copy|readTasksFromClipboard` (async) + `TaskClipboardEnvelope`. Neutral `task-` id prefix.
- **Migrated** rich-card's own copy/paste (imperative handle, keyboard hook, action-menu)
  onto it; **removed** json-io's 4 clipboard fns (`toClipboardItem`/`fromClipboardItems`/
  `copyToClipboard`/`readFromClipboard`) — `serialize`/`validate`/`parse`/`fromDataTransfer`
  (DnD) stay. Barrel-exported the clipboard surface. Added `lib/clipboard.ts` to `registry.json`.

### Phase 2 — `calendar-01` v0.2.3 (smallest)
- Deleted local `lib/clipboard.ts`; repointed **4 import sites** (use-calendar-edit,
  context-menu, root) + the **public barrel re-export** to `../todo-rich-card/lib/clipboard`
  (kept the re-export so calendar's public API is unchanged → non-breaking patch). Removed
  the file from `registry.json`.

### Phase 3 — `gantt-timeline-01` v0.5.0 (headline)
- **Double-click-create + quick-composer:** canvas-level `onDoubleClick` on empty row area
  (ignores `[data-itemid]`/`[data-summaryid]`) → `openComposer` with a snapped default span;
  new flat-exported `GanttQuickComposer` (plain panel, name + native status select, "More
  options" → full editor via a new `createItem(..., {openEditor})` arg). `composerTarget`
  state + `quickCompose`/`renderQuickComposer` props. Independent of Draw mode.
- **Clipboard:** document-level copy/cut/paste ClipboardEvent listeners in the Root (gated on
  focus + not-over-text + not-busy), Copy/Cut menu items, `pasteTasks`/`copyItem`/`cutItem`
  dispatchers. Paste = sibling-of-selection, dates preserved (gantt has no "drop window").
- **Priority submenu:** `changePriority` (mutate + onChange only — `"priority"` is not a
  `TodoEditableField`, matching calendar) + a Priority `ContextMenuSub`.

### Phase 4 — `todo-tree` v0.3.0 (parity)
- **Clipboard:** document Ctrl+C/X/V listeners over the selection (or focused row) + handle
  `copyItems`/`cutItems`/`pasteItems` (29-method handle now). Paste re-ids each subtree under
  the focused row.
- **`priorityOptions` prop** threaded to the `TodoTreeWithEditor` edit card (+ statusOptions).

## Key facts / lessons

- **The envelope carries full `TodoItem`s** → rich-card joining the shared format loses no
  detail; role (single-item, strict validate) stays, transport unifies. This is what makes
  copy-anywhere/paste-anywhere actually work.
- **Same-category relative cross-procomp imports are layout-stable at any depth.** Both
  procomps install as siblings under `components/`; the category segment is stripped
  uniformly, so `../../todo-rich-card/lib/clipboard` from `<slug>/hooks/` has identical hops
  dev-side and consumer-side, and the rewriter leaves relative imports untouched. Producer-tsc
  exercises the exact import → strong evidence the consumer resolves. (Depth-1 precedent:
  calendar's shipped `../todo-rich-card` type import.)
- **Calendar's clipboard was PUBLIC** (barrel re-export) — the repoint had to preserve those
  re-exports pointed at the shared module, else v0.2.3 would have been breaking, not a patch.
- **`"priority"` is not a `TodoEditableField`** — `changePriority` mutates + `onChange` only,
  no typed field event (caught by reading calendar's impl; would have been a tsc error).
- **Zero new deps** across all four components (clipboard is a pure module; the composer
  reuses `input`/`button`; Priority reuses `ContextMenuSub`; tree clipboard is kbd+handle).
- **Two clipboard modules coexist in todo-rich-card by design:** `json-io.ts` keeps single-item
  structural validation + DnD (`fromDataTransfer`); `clipboard.ts` owns the cross-surface
  transport. Validation stays; transport unifies.
- **⚠️ KEY LESSON — `meta.ts` `internal: [...]` is NOT `registry.json` `registryDependencies`.**
  The plan conflated them ("all four already keep todo-rich-card as a registryDependency").
  A deep adversarial re-review caught that **todo-tree's `registry.json` item omitted
  `@ilinxa/todo-rich-card`** even though it declares `internal: ["todo-rich-card"]` in meta and
  now has 5 runtime value imports from the shared clipboard — a consumer `shadcn add` would have
  shipped broken (the content-composer-01 F-01 / F-cross-11 class; producer tsc/lint/meta-deps
  can't see it). gantt + calendar already had the registry entry; todo-tree was the odd one out
  (its pre-existing `TodoRichCard` value import in the editor wrapper was already latently broken).
  Fixed; artifact verified. **Always check the registry.json `registryDependencies` array, not
  just meta's `internal`, when a procomp gains a cross-procomp runtime import.**
- **Copy must `denormalize` a normalized node, not read `node.item`** — `item.children` goes stale
  after edits (childNodes is the source of truth). The re-review caught all 3 rich-card copy sites
  serializing stale subtrees into the now-cross-surface clipboard; fixed to `denormalize(node)`.
- **Back-compat fences must match the original validator** — the bare-item branch initially checked
  only `id`+`name`, false-positiving foreign JSON; tightened to the full `id/name/status/active/setAt`
  contract (matching json-io's `validate`).

## Verification

- tsc 0 · lint 0 (touched folders; repo-wide warnings pre-existing/unrelated) · meta-deps
  57/57 · build 66/66 · registry:build ✓ (artifacts verified).
- Shared envelope round-trip logic: **7/7** (single/multi/nested-subtree/back-compat/foreign-text).
- **Post-deploy (4-ship pattern):** live `shadcn add` consumer-tsc (rewriter) + browser
  cross-surface round-trip (copy in rich-card → paste in gantt/calendar/tree and back).

## Follow-ups

- F-cross (promote to sweep-tracker): the two-format clipboard break — now resolved by the unify.
- GATE 3 spotcheck review files for the 3 minor bumps (gantt v0.5.0, todo-rich-card v0.4.0,
  todo-tree v0.3.0).
- Procomp guide/description/plan deltas for the 3 minors (doc sync).
- Post-deploy live consumer smoke + browser round-trip.
- Optional: status pick parity in calendar's composer (gantt's gained one); kanban adapter →
  shared clipboard; todo-tree context-menu for clipboard (kbd+handle suffice today).
