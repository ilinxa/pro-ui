# `rich-card-in-flow` v0.2.0 — Stage 2 Plan (Port Editor)

> **Stage:** 2 of 3 · **Status:** **Signed off 2026-05-17 (GATE 2 closed; implementation unlocked)** — Workstream split + F-01..F-13 + F-S5/S6 + PV2..PV5 + C1..C6 + M1..M6 all accepted on user "proceed" authorization.
> **Slug:** `rich-card-in-flow` · **Category:** `data`
> **Inputs:** Stage 1 description signed off 2026-05-17 ([rich-card-in-flow-v0.2.0-port-editor-description.md](rich-card-in-flow-v0.2.0-port-editor-description.md)). All 12 Qs + Q5-bis + Q-O1/2/3/4 locked.
> **What this plan covers:** the **two coordinated workstreams** that ship the port editor — `flow-canvas-01@v0.2.5` (1-line `defaultPortTypes` patch) AND `rich-card-in-flow@v0.2.0` (new `<PortEditorStrip>` export + supporting modules + demo + usage). Sequenced: flow-canvas-01 patch first, rcif minor second.

After GATE 2 sign-off, no scaffolding-time second-guessing — implementation follows the plan, deviations are loud.

---

## 1. Inherited inputs (one-paragraph summary)

`rich-card-in-flow@v0.2.0` adds a new opt-in editor export — `<PortEditorStrip>` — that lets consumers mount port editing UI alongside the existing `<RichCard editable>` dialog. The strip is uncontrolled (operates on the `canvas` prop), reads `ports[]` from the targeted node/subcard, and writes via the consumer's `onChange`. Direction multi-select at create time produces 1 or 2 atomic port rows (no auto-grouping post-save). Doc-port type is a new built-in (free direction; bottom-only side via editor enforcement; orphan slots until doc-files ship). No flow-canvas-01 runtime contract change — only `defaultPortTypes` gains the `"doc"` entry. Custom port type registration in the strip's picker deferred to v0.3 with proper shared-context plumbing.

---

## 2. Workstream split

| Workstream | Slug | Version | Purpose | Effort |
|---|---|---|---|---|
| **A — Built-in port type patch** | `flow-canvas-01` | `0.2.4 → 0.2.5` | Add `"doc"` to `defaultPortTypes` (1 line) | ~10 min |
| **B — Port editor procomp** | `rich-card-in-flow` | `0.1.0 → 0.2.0` | New `<PortEditorStrip>` + parts + lib + demo wiring + usage + registry distribution | ~4–6 hours |

Workstream A is trivially small and unblocks B. A must ship first (or in the same push) so B's strip can offer the `"doc"` type from defaults without hardcoding it locally.

---

## 3. Resolved validation findings (lock-in)

Stage 1 closed with 12 Qs + Q5-bis + 4 Q-Os locked. This plan adds implementation-level locks AND the new F-NN findings surfaced during plan drafting.

### F-01 — Port shape stays `Port` from `@/registry/components/data/flow-canvas-01/types`

No port shape extension in v0.2. The strip reads/writes exactly the `Port` shape that flow-canvas-01 already publishes: `{ id, side, dir, type, multi?, label? }`. **No new fields, no `boundField`, no `role`.** Per-field ports (Q-O4 deferred) would later add `boundField?: string` — that's v0.3 work.

### F-02 — Target-walker module — new `lib/find-port-target.ts`

The strip needs a pure function that, given `(canvas, nodeId, subPath?)`, returns the `Port[]` slot at that location.

**Lock:** new file `lib/find-port-target.ts` exporting:
```ts
type PortTarget = {
  node: NodeRecord;
  cardData: RichCardJsonNode;  // either node.data root, or a nested subcard by __rcid
  ports: Port[];                 // current ports[] at that level (empty array if undefined)
  updateIn: (next: Port[]) => CanvasData;  // closure that returns updated canvas
};

export function findPortTarget(
  canvas: CanvasData,
  nodeId: string,
  subPath?: string,
): PortTarget | null;
```

Walker logic: locate `node` by id; if `subPath` undefined → return node.data root; if `subPath` defined → recursive Object.entries walk to find the subcard with matching `__rcid` (re-uses the same walker pattern as `lib/enumerate-subcards.ts`). Returns `null` if node missing or subPath unmatched (the strip renders an empty-state in that case).

`updateIn(next)` closure encapsulates the immutable update — walks the same path again, replaces `ports`, returns new `CanvasData` via `updateNodeData`. Strip's `onChange` callbacks invoke `updateIn(newPorts)` and pass result to consumer's `onChange`.

### F-03 — Add-port popover is its own component

The `[✓in] [✓out]` checkbox popover is non-trivial UI (popover trigger + form + commit) and reused identically per nesting level. **Lock:** factored into `parts/port-editor-add-popover.tsx`. Uses shadcn's `<Popover>` (already a procomp dep via `<PredefinedAddMenu>` precedent). On commit, calls `onAdd(newPorts: Port[])` with 1 or 2 fresh ports.

### F-04 — Port id generation lives in `lib/port-mutators.ts`

**Lock:** new file `lib/port-mutators.ts` with pure helpers:
```ts
export function makePortId(cardRcid: string | undefined): string;
// → `p-${cardRcid ?? "card"}-${shortUuid(8)}`
export function makeInOutPair(cardRcid, type, side, multi, label): [Port, Port];
// → [{id: `${base}-in`, dir:"in", ...}, {id: `${base}-out`, dir:"out", ...}]
export function addPort(existing: Port[], port: Port): Port[];
export function updatePort(existing: Port[], portId: string, mut: Partial<Port>): Port[];
export function removePort(existing: Port[], portId: string): Port[];
export function isDuplicateId(existing: Port[], id: string, excludePortId?: string): boolean;
```

`shortUuid` is `crypto.randomUUID().slice(0, 8)` — matches the 8-char length used by `makeEdgeId` / `makeNodeId` in [`flow-canvas-01/hooks/use-canvas-data.ts:34-45`](../../../src/registry/components/data/flow-canvas-01/hooks/use-canvas-data.ts#L34-L45). Falls back to `Math.random().toString(36).slice(2, 10)` in non-crypto environments per F-S6 below (also matches flow-canvas-01 fallback length).

### F-05 — Strip handles null target gracefully

When `findPortTarget` returns `null` (node missing, subPath unmatched) the strip renders an empty-state message `"No card found"` — does NOT crash. Common path: dialog open transitioning between nodes, prop arrives 1 frame before the canvas state update. Self-corrects next render.

### F-06 — Row component is its own file with explicit prop contract

**Lock:** new file `parts/port-editor-row.tsx`. Props:
```ts
type PortEditorRowProps = {
  port: Port;
  portTypes: PortType[];                              // resolved defaults (no custom yet — see Q5-bis)
  existingPorts: Port[];                              // for dup-id validation
  liveEdgeCount: { asSource: number; asTarget: number }; // from strip's pre-computed map (PV2)
  editable: boolean;                                  // F-08: from strip's `editable` prop; gates edit/remove affordances
  permissions: PortEditorPermissions;                 // further per-field gating
  onUpdate: (mut: Partial<Port>) => void;
  onRemove: () => void;
};
```

The row owns its own inline-edit state (which field is being edited) via local `useState` — these are uncontrolled edits committed on blur, matching rich-card's field-edit pattern. The strip itself is uncontrolled-by-data; rows are uncontrolled-by-field-state. Two-level model is intentional and matches rich-card precedent.

When `editable=false`, the row hides all edit affordances + remove button — renders read-only summary only (per F-08).

### F-07 — Live-edges lookup is O(N×E) per row; pre-compute at strip level

Each row needs to know if its port has live edges (for the rename-warning). Naive: filter `canvas.edges` per row → O(E) per row → O(N×E) total. **Lock:** strip pre-computes `Map<string, { asSource: number; asTarget: number }>` once per render (key = `${nodeId}:${portId}`; walks all edges, increments counts). Pass the relevant entry to each row via prop (PV2 refinement). O(E + N) overall.

### F-08 — `editable={false}` collapses the strip but doesn't hide it

When `editable={false}` is passed, the strip renders read-only port summary rows (no add button, no row edit affordances, no remove buttons) — analogous to rich-card's `editable={false}` mode. Consumer can hide the strip entirely by simply not mounting it.

### F-09 — Cross-procomp imports use RELATIVE paths

Per F-S1 lock (rcif v0.1.0). All cross-procomp imports in shipped source use relative paths — same-category siblings (rich-card, flow-canvas-01) are subject to shadcn's path-rewriter substituting the current slug for the target slug. Specifically:

**From flow-canvas-01:**
- `import type { Port, PortType, CanvasData, NodeRecord } from "../flow-canvas-01/types"` ✓ relative
- `import { updateNodeData } from "../flow-canvas-01/lib/update-node-data"` ✓ relative
- `import { defaultPortTypes } from "../flow-canvas-01/registries/port-type-registry"` ✓ relative

**From rich-card:**
- `import type { RichCardJsonNode } from "../rich-card/types"` ✓ relative (referenced by `PortTarget.cardData` in F-02; also reused throughout the strip for type narrowing)

The barrel re-export at rcif's `index.ts` continues to NOT re-export cross-procomp symbols (per F-S1 second bug). rcif-internal types (`PortEditorPermissions`, `PortEditorStrip` component) ARE safe to re-export from rcif's barrel — only cross-procomp re-exports trip the rewriter.

### F-10 — Demo wires the strip above `<RichCard>` per Q1 lock

Demo update at `demo.tsx`:
```tsx
{editing && editingTree && (
  <div className="max-h-[60vh] overflow-auto space-y-3">
    <PortEditorStrip
      nodeId={editing.nodeId}
      subPath={editing.subPath}
      canvas={canvas}
      onChange={setCanvas}
      editable={true}
    />
    <RichCard
      key={editing.nodeId}
      ref={richCardRef}
      defaultValue={editingTree}
      editable={true}
      onChange={(next) => { /* unchanged */ }}
    />
  </div>
)}
```

Strip operates on `canvas` directly (not on `editingTree`) — port mutations bypass rich-card's data path entirely, so rcif's `stripFlowCanvasFields` / `mergeFlowCanvasFields` helpers are unchanged.

### F-11 — Usage doc adds a §"Port editing" section

New section in `usage.tsx` showing the canonical wiring + the orphan-doc-port caveat + permission predicate examples. Inserted between existing §"Canonical wiring" and §"Footguns" sections.

### F-12 — Registry distribution shape

`registry.json` rcif base item gains the new files:
- `parts/port-editor-strip.tsx`
- `parts/port-editor-row.tsx`
- `parts/port-editor-add-popover.tsx`
- `lib/port-mutators.ts`
- `lib/find-port-target.ts`

All target convention: `target: "components/rich-card-in-flow/<sub-path>"`, type `registry:component`. Demo / usage / meta stay docs-site-only (per the rule). Fixtures sibling item (`rich-card-in-flow-fixtures`) needs no changes — `dummy-data.ts` already carries ports in the fixture.

**Sub-item:** consider adding a `doc`-typed port to one of the demo fixture's cards to exercise the orphan-doc-port code path (PV4 — surfaced during impl). Not required for v0.2 ship; flag for B3 visual-sanity step.

### F-13 — meta.ts updates

- Version: `0.1.0 → 0.2.0`
- updatedAt: `2026-05-17`
- features: add `"v0.2 port editor: <PortEditorStrip> opt-in for editing ports per card/subcard (id / type / side / dir / multi / label); free direction for doc-typed ports; create-flow [✓in][✓out] splits to atomic rows"`
- shadcn deps: **was empty in v0.1; v0.2 adds six primitives** — `popover` (add-popover + tooltips on warnings), `select` (type + side + dir pickers), `checkbox` ([✓in][✓out] in add-popover), `input` (id + label inline edits), `tooltip` (rename-warning + orphan-doc tooltip), `label` (form field labels). Final array: `["popover", "select", "checkbox", "input", "tooltip", "label"]`. All six get auto-installed via the registry pipeline when consumer runs `pnpm dlx shadcn@latest add @ilinxa/rich-card-in-flow`.
- internal deps: `["rich-card", "flow-canvas-01"]` (unchanged — same as v0.1)
- npm deps: unchanged (Port shape already imported via flow-canvas-01; no new third-party packages)

### F-S5 — Smoke harness path-b smoke run is REQUIRED for the rcif minor bump

Per readiness-review rule for minor bumps that touch public API. The new `<PortEditorStrip>` is a new public surface. Smoke harness path-b (install + consumer-tsc) must run pre-push. F-S1 cross-procomp bugs may re-surface; if they do, fix in shipped source (relative paths) per the existing lock.

Additional smoke check: with the new shadcn deps (popover/select/checkbox/input/tooltip/label) all auto-installed by the registry pipeline, verify the consumer's `components.json` registries list resolves them correctly and consumer-side build succeeds.

### F-S6 — Crypto/UUID fallback

`crypto.randomUUID()` is widely available in modern browsers + Node. Stage 2 plan locks the fallback: if `typeof crypto === "undefined" || typeof crypto.randomUUID !== "function"`, use `Math.random().toString(36).slice(2, 8)` (matches use-canvas-data.ts:34-37 precedent). Pure utility — no exception or warning thrown.

---

## 4. File-level changes

### Workstream A — `flow-canvas-01@v0.2.5`

| File | Change |
|---|---|
| `src/registry/components/data/flow-canvas-01/registries/port-type-registry.ts` | Add `{ id: "doc", color: "var(--chart-3)", label: "Doc" }` to `defaultPortTypes` array — single line in the array literal |
| `src/registry/components/data/flow-canvas-01/meta.ts` | Bump `version: "0.2.5"`, `updatedAt: "2026-05-17"`; add `"doc"` to the features list (no API change, but useful for discoverability) |
| `public/r/flow-canvas-01.json` | Regen via `pnpm registry:build` |

Validation: confirm `--chart-3` token resolves to a distinct color in [`src/app/globals.css`](../../../src/app/globals.css) light + dark themes and doesn't clash with the 5 existing types (`--muted-foreground`, `--chart-5`, `--chart-2`, `--primary`, `--chart-4`). Swap to an alternative token at impl time if clash.

### Workstream B — `rich-card-in-flow@v0.2.0`

**New files (5):**
| File | Lines (rough) | Purpose |
|---|---|---|
| `parts/port-editor-strip.tsx` | ~120 | Main component; renders rows + add-popover; pre-computes live-edges map |
| `parts/port-editor-row.tsx` | ~150 | Single port row with inline-edit affordances |
| `parts/port-editor-add-popover.tsx` | ~70 | Popover with `[✓in][✓out]` checkboxes |
| `lib/port-mutators.ts` | ~80 | Pure ID + add/update/remove helpers |
| `lib/find-port-target.ts` | ~60 | Walker; returns target ports[] + updater closure |

**Modified files (4):**
| File | Change |
|---|---|
| `index.ts` | Re-export `PortEditorStrip` + `PortEditorPermissions` type |
| `types.ts` | Add `PortEditorPermissions` type |
| `demo.tsx` | Mount `<PortEditorStrip>` above `<RichCard>` in the dialog (per F-10) |
| `usage.tsx` | New §"Port editing" section (per F-11) |
| `meta.ts` | Version 0.2.0 + features + updatedAt (per F-13) |

**Registry distribution:**
| File | Change |
|---|---|
| `registry.json` | Add 5 new files to `rich-card-in-flow` base item, all `type: "registry:component"` (per F-12) |
| `public/r/rich-card-in-flow.json` | Regen via `pnpm registry:build` |

---

## 5. Implementation sequencing

**A1 — flow-canvas-01@v0.2.5 patch** (single commit):
1. Edit `port-type-registry.ts`, add `"doc"` entry
2. Validate `--chart-3` token; swap if clash
3. Bump meta + updatedAt
4. `pnpm registry:build`
5. tsc + lint + validate:meta-deps
6. Commit: `fix(flow-canvas-01): v0.2.5 — add "doc" built-in port type to defaultPortTypes`

**A2 — flow-canvas-01 tracking** (single commit; lands AFTER B5 in the same overall push batch — both A2 and B5 commits go to origin together so deployed Vercel artifacts are consistent):
- Decision file `.claude/decisions/2026-05-17-flow-canvas-v0.2.5-doc-port-type.md`
- STATUS.md row (table version 0.2.4 → 0.2.5) + Recent activity entry
- component-versions.md table row + highlights line update

**B1 — Scaffolding + types** (single commit):
1. New file `types.ts`: add `PortEditorPermissions`
2. New file `lib/port-mutators.ts`: pure helpers
3. New file `lib/find-port-target.ts`: walker + updater
4. tsc clean
5. Commit: `feat(rich-card-in-flow): v0.2.0 B1 — scaffold port editor types + lib helpers`

**B2 — Components** (single commit):
1. New file `parts/port-editor-add-popover.tsx`
2. New file `parts/port-editor-row.tsx`
3. New file `parts/port-editor-strip.tsx`
4. Wire all three; tsc clean
5. Commit: `feat(rich-card-in-flow): v0.2.0 B2 — PortEditorStrip + Row + AddPopover`

**B3 — Demo + usage + barrel + guide** (single commit):
1. Modify `demo.tsx` (mount strip above RichCard)
2. Modify `usage.tsx` (new §"Port editing")
3. Modify `index.ts` (re-exports — rcif-internal symbols only per F-09)
4. Modify `meta.ts` (version + features + shadcn deps array per F-13)
5. Author new §"Port editor" section in `docs/procomps/rich-card-in-flow-procomp/rich-card-in-flow-procomp-guide.md` (PV5 — guide-section authoring lives here, NOT B5)
6. Run `pnpm dlx shadcn@latest add popover select checkbox input tooltip label` IF any are not already installed locally (they likely are; this is the dev-side install)
7. Visual sanity: dev server + click a node + add/edit/remove ports + verify they persist + **test subcard without `__rcid`** (PV4) → orphan-state shows empty-state placeholder
8. tsc + lint + validate:meta-deps + `pnpm build`
9. Commit: `feat(rich-card-in-flow): v0.2.0 B3 — demo + usage + barrel + meta + guide`

**B4 — Registry + smoke** (single commit):
1. Modify `registry.json` (add 5 files to rcif base item)
2. `pnpm registry:build`
3. Smoke harness path-b run — F-S5 lock; install rcif into `e:/tmp/ilinxa-smoke-consumer/` from local-served `public/r/rich-card-in-flow.json`, run consumer-side `pnpm tsc --noEmit`
4. Fix any F-S surfacing (relative-import fixes per F-S1 if rewriter trips)
5. Commit: `feat(rich-card-in-flow): v0.2.0 B4 — registry distribution + smoke run`

**B5 — GATE 3 spot-check + tracking** (single commit; guide moved to B3 per PV5):
1. Author `docs/procomps/rich-card-in-flow-procomp/reviews/2026-05-17-v0.2.0-spotcheck.md`
2. Rotating dimension recommended: **Public API** (matches v0.1 spotcheck; the new strip's API surface is the headline change)
3. Verdict ≥ Pass with follow-ups before push
4. Author `.claude/decisions/2026-05-17-rich-card-in-flow-v0.2.0-port-editor.md`
5. STATUS.md row + Recent activity + Last-updated
6. component-versions.md table row + highlights
7. Commit: `docs(tracking,rich-card-in-flow): v0.2.0 SHIPPED — STATUS + decision + spot-check + component-versions`

**Push:** all commits land before push; A + B push together so deployed registry artifacts are consistent.

---

## 6. Risks + mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| `--chart-3` token clashes with existing color or doesn't read as "doc" | Medium | Verify in dev server + dark-mode toggle pre-A1 commit; swap to alternative token if needed |
| `findPortTarget` walker fails on rich-card-internal `__rcid` formats vs consumer-defined formats | Low | Walker uses `===` on `__rcid` string only; format-agnostic (rich-card auto-attaches but doesn't normalize) |
| Demo crashes when `editing.subPath` points at a card without `__rcid` (orphan subcard) | Medium | F-05 lock — strip renders empty-state, no crash; matches rcif v0.1's F-03 graceful degradation pattern |
| Smoke harness path-b surfaces new F-S findings | Medium-high | Plan includes step B4 explicitly; budget +1 hour for fixups; F-S1 pattern (relative imports) already known |
| Live-save creates noisy onChange flood during type-picker open (e.g. user previewing types) | Low | Type picker uses shadcn `<Select>` — commit on close only (default behavior); no preview-onChange |
| Multiple PortEditorStrip instances mounted by consumer (e.g. multi-dialog edge case) | Low | Strip is fully uncontrolled + stateless re: dialog scope; multiple instances on same canvas are fine but each fires independent onChange (consumer last-write-wins) |
| Per-field ports requirement (Q-O4 deferred) bites consumers immediately | Low-Medium | Usage doc §"Port editing" explicitly notes per-field deferred to v0.3; recommends manual port-add for now |

---

## 7. Re-validation pass — applied refinements

Critical re-read of this plan before user sign-off surfaced 4 refinements (PV2–PV5). PV1 from the initial pass turned out to be a non-finding ("F-04 makeInOutPair signature is correct as drafted") and was dropped.

- **PV2** — F-07 live-edges map should track source/target halves separately for useful rename-warnings. **Refinement:** map is `Map<string, { asSource: number; asTarget: number }>` where key is `${nodeId}:${portId}` — strip pre-computes once, row reads its own count. Folded into F-07 + F-06 row props.
- **PV3** — F-02 PortTarget type should include `cardRcid: string | undefined` so makePortId has it directly. **Refinement:** add `cardRcid` to PortTarget. Folded into F-02.
- **PV4** — B3 visual sanity check should also test the orphan-`__rcid` subcard path (F-05). **Refinement:** add "test subcard without `__rcid`" to B3 step 7. Folded into sequencing. Also flagged as fixture sub-item in F-12.
- **PV5** — Stage 3 guide update was originally a separate B5 step; moved into B3 (same commit batch as usage.tsx + meta.ts). Cleaner commit chain — guide and usage land together so consumer-facing docs stay in sync.

Plus 12 corrections (C1–C6 + M1–M6) from a follow-up consistency review folded into F-04, F-06, F-07, F-09, F-12, F-13, F-S5, §1, §2 A2, and §5 B3/B5 sequencing.

All folded into the relevant Fs / sequencing above.

---

## 8. Sign-off — awaiting user

- [ ] Workstream split accepted (A: 1-line patch / B: new export + parts + lib + demo)
- [ ] F-01 through F-13 + F-S5/S6 locks accepted
- [ ] PV2–PV5 refinements accepted (PV1 dropped — non-finding)
- [ ] C1–C6 + M1–M6 consistency corrections accepted
- [ ] Implementation sequencing (A1 → A2 → B1 → B2 → B3 → B4 → B5) accepted
- [ ] Risks + mitigations acknowledged

After sign-off: scaffold + implement A first (since it's tiny), then begin B1.
