# `rich-card-in-flow` v0.2.0 — Port Editor Description (Stage 1)

> **Stage:** 1 of 3 · **Status:** **Signed off 2026-05-17 (GATE 1 closed; Stage 2 plan unlocked)** — V-findings V1–V6 folded; Q-O1 / Q-O2 / Q-O4 locked with assistant-recommended defaults per user "go ahead" authorization; user retains right to revise at GATE 2 sign-off.
> **Slug:** `rich-card-in-flow` (additive feature; sibling export, no breaking changes)
> **Target version:** `rich-card-in-flow@v0.2.0` (minor bump — adds public surface)
> **Dependencies bumped:** `flow-canvas-01@v0.2.5` (1-line patch — adds built-in `"doc"` port type to `defaultPortTypes`; no runtime contract changes)
> **Parallel track to:** v0.1.0 (shipped 2026-05-16); v0.2.0 builds ON v0.1.0's `RichCardViewer` + `onEditRequest` plumbing.

This is the description doc. Job: pin down the architecture for putting **port editing UI** into the rich-card-in-flow dialog flow, surface decisions, earn sign-off before any planning or code.

---

## 1. Problem

`rich-card-in-flow@v0.1.0` lets consumers put rich-card content into flow-canvas nodes and edit that content through a popup dialog. **Ports are static** — set in the fixture at construction time, never editable through the UI. Adding, removing, or retyping a port today requires editing source code.

The flow-canvas-01 port primitive already supports everything needed:

| Capability | Status |
|---|---|
| Port type registry + 5 built-ins (`data`, `text`, `image`, `card`, `event`) | ✅ shipped (v0.1.0) |
| Consumer-overridable types via `portTypes` prop | ✅ shipped |
| Direction enforcement (`out → in`) | ✅ shipped |
| Same-type-only connection validation | ✅ shipped |
| Per-port-side multi/limit control | ✅ shipped |
| `onBeforeConnect` consumer validator hook | ✅ shipped |
| **Editor UI to set port `id` / `type` / `side` / `dir` / `multi` / `label` from the dialog** | ❌ this doc |
| **"doc" port type — bottom-only, links to doc files** | ❌ this doc (1-line flow-canvas-01 patch + editor-side enforcement) |
| Doc-file target resource | ❌ out of scope (separate future procomp) |

This procomp adds the editor surface ON TOP of the existing primitives. No re-design of the port model.

---

## 2. Architecture (the system, one glance)

```
┌─────────────────────────────────────────────────────────────────────┐
│ flow-canvas-01 (host)                                               │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐                                 │
│  │RichCardViewer│  │RichCardViewer│  ... × N         (unchanged)    │
│  │  + ports     │  │  + ports     │                                 │
│  └──────┬───────┘  └──────────────┘                                 │
│         │ onClick → ctx.onEditRequest(subPath?)                     │
└─────────┼───────────────────────────────────────────────────────────┘
          │ bubbles to FlowCanvasProps.onEditRequest(nodeId, subPath?)
          ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │ Consumer-owned <Dialog>                                          │
  │                                                                  │
  │   ┌─────────────────────────────────────────────────────────┐    │
  │   │ <PortEditorStrip>             ← NEW v0.2 export         │    │
  │   │   targets the same subPath/nodeId as RichCard           │    │
  │   │   reads ports[] from current node.data (at subPath)     │    │
  │   │   onChange → consumer's updateNodeData(nodeId, mut)     │    │
  │   │                                                         │    │
  │   │   [+ Add port]   ← opens popover with [✓in][✓out]       │    │
  │   │                    checkboxes — commits 1 or 2 rows     │    │
  │   │   ┌────────────────────────────────────────────────┐    │    │
  │   │   │ id  type↓  side↓  dir↓ (in)  [ ]multi  label    │    │    │
  │   │   │ id  type↓  side↓  dir↓ (out) [✓]multi  label    │    │    │
  │   │   │ id  type↓  side↓  dir↓ (in)  [ ]multi  label    │    │    │
  │   │   └────────────────────────────────────────────────┘    │    │
  │   │   (each row is one port; "both" only at CREATE time)    │    │
  │   └─────────────────────────────────────────────────────────┘    │
  │                                                                  │
  │   <RichCard editable> ... </RichCard>     (unchanged from v0.1)  │
  └──────────────────────────────────────────────────────────────────┘

  Data contract: ports[] live on the same RichCardJsonNode at the same
  __rcid level the user clicked. PortEditorStrip and RichCard operate on
  the same node, in parallel, via the same updateNodeData helper.
```

**Three properties that fall out of this shape:**

1. **Opt-in.** Consumers who don't need port editing simply don't mount `<PortEditorStrip>`. v0.1 behavior is unchanged.
2. **rich-card stays port-agnostic.** No rich-card changes. The strip reads/writes the `ports` array directly on the node data; rich-card's `stripFlowCanvasFields` continues to hide ports from its own editor.
3. **flow-canvas-01 minimally affected.** One narrow addition: `"doc"` built-in type. **No runtime contract change** — doc-port side enforcement is editor-side only (PortEditorStrip disables non-bottom options in the picker; flow-canvas-01 stays neutral about it).

---

## 3. In scope / Out of scope (v0.2.0)

### v0.2.0 — in scope

- New rcif export: `<PortEditorStrip>` (React component)
- Props: `{ nodeId: string; subPath?: string; canvas: CanvasData; onChange: (next: CanvasData) => void; editable?: boolean; permissions?: PortEditorPermissions; }`
  - **No `portTypes` prop in v0.2.** Strip uses the 5 v0.1 built-ins + the new `"doc"` type. Consumer-registered custom types support deferred to v0.3 (requires shared-context plumbing — see Q5-bis).
- UI rows per port (each row = one port): id, type picker (dropdown), side picker (left/right/top/bottom), dir picker (in OR out — single value), multi toggle, label, remove
- "+ Add port" affordance opens a popover with `[✓in] [✓out]` checkboxes. On commit: one checked → creates 1 row; both checked → creates 2 rows (one `dir:in` + one `dir:out`) sharing type/side/multi/label. **After save, the two rows are fully independent.** No auto-grouping at re-render time.
- New built-in `"doc"` port type in flow-canvas-01 `defaultPortTypes` (one-line addition to `port-type-registry.ts`)
- `"doc"`-typed ports: side forced to `"bottom"` in PortEditorStrip's picker (other options disabled with tooltip). **No runtime enforcement** — flow-canvas-01 doesn't validate this; only the editor does.
- Per-card port management (ports on the targeted card/subcard's data root)
- Live save (every change flows immediately, matching v0.1's rich-card pattern)
- Port ids — auto-generated as `p-{cardRcid}-{shortUuid}` on add, editable by user

### v0.2.0 — out of scope (intentional cuts)

- **Per-field ports** (link a port to a specific flat field) — deferred to v0.3 (see Q-O4 — user may override).
- **Doc-file target resource** — separate future procomp. Doc-ports created in v0.2 are orphan slots until that lands; they validate against `type === "doc"` and accept nothing else.
- **Consumer-registered custom port types** in PortEditorStrip's picker — deferred to v0.3 (requires either a shared context or a `getPortTypes(canvas)` helper from flow-canvas-01).
- **Runtime port validation** (e.g. `validatePort(port)` hook in flow-canvas-01) — deferred indefinitely; editor-side enforcement is sufficient for v0.2.
- **Drag-reorder ports within a card** — v0.3 if needed.
- **Bulk port operations** (e.g. "generate 4 ports for 4 sides") — v0.3 if needed.
- **Visual preview** of port placement on the card thumbnail — v0.3 if needed.
- **Port-from-existing-rich-card-meta sync** (using `__rcmeta` to drive port defaults) — deferred indefinitely; unclear use case.
- **Custom port-type-specific editors** (e.g. `image` ports get a thumbnail picker) — v0.3 if patterns emerge.

---

## 4. Locked decisions (Q1–Q12)

### Q1 — Where does PortEditorStrip live in the dialog?

**Problem:** Strip and RichCard share dialog real estate; visual order matters.

**Options:**
- (a) Above RichCard — port edits feel "metadata-first," card content secondary
- (b) Below RichCard — content first, ports as configuration tail
- (c) Inside a Tabs control — "Content" / "Ports" tabs

**Lock:** **(a) above RichCard.** Port edits are typically rare; surfacing them at top makes the affordance discoverable without burying it under rich-card's scroll. Tabs (c) add a click for the common (content-edit) case. Consumer can override by ignoring the recommended slot and placing the strip wherever they want — `<PortEditorStrip>` doesn't impose its own dialog chrome.

### Q2 — Per-card or per-subcard targeting?

**Problem:** Rich-card-in-flow's `onEditRequest(nodeId, subPath?)` already carries `subPath` for subcard targeting (Q-S6 in v0.1 spec).

**Lock:** PortEditorStrip targets **the same level** the user clicked on. Click on a root card → strip edits root ports. Click on a subcard → strip edits that subcard's ports. Consistent with the popup-edit convention.

### Q3 — Direction multi-select: 1 port or 2 ports for "both"?

**Problem:** A port with both directions could be 1 port with `dir:"both"` (new value) OR 2 ports.

**Lock:** **2 ports — at CREATE time only.** No new `dir` value in flow-canvas-01 — keeps runtime model unchanged. The "+ Add port" popover offers `[✓in] [✓out]` checkboxes. Both checked → creates two port rows (one `dir:"in"`, one `dir:"out"`) sharing type/side/multi/label, with ids `{base}-in` and `{base}-out`.

**After save, the two ports are fully independent rows in the editor.** No auto-grouping at re-render time. To remove one direction post-save, user clicks the remove button on that row. To re-pair, user removes one and re-adds via the "+ Add port" popover with both checked.

Rationale: auto-grouping at re-render requires fragile heuristics (same id-prefix, same side, same type, same multi, same label — what if some diverge?). Splitting the model cleanly into "ports are atomic; pair-creation is a UI convenience" avoids the trap.

### Q4 — Doc-port semantics

**Lock:**
- New built-in port type id: `"doc"`
- Default color: `var(--chart-3)` (distinct from the 5 existing types — leaning amber-ish to read as "documentation"). Color picker should be verified against actual `--chart-3` token at impl time to avoid accidental clash with v0.3 future types.
- **Side: editor-side forced to `"bottom"`.** PortEditorStrip's side picker disables left/right/top when the row's type is `"doc"`. flow-canvas-01 runtime does NOT enforce this — if a consumer programmatically constructs a `{type:"doc", side:"left"}` port outside the editor, flow-canvas-01 renders it without warning. The editor is the gate.
- **Direction: free** (Q-O1 lock = (c) — both `"in"` and `"out"` allowed). Rationale: doc-file resource doesn't exist yet, so locking semantic direction is premature. Eventual doc-file procomp can refine if needed. Editor exposes the standard `[✓in] [✓out]` create-flow + per-row dir picker for doc-typed ports too.
- Multi: defaults to `true` (a card can have many doc references)
- Target: doc files don't exist yet. **Q-O2 lock = (a) ship as orphan slots.** Doc-ports validate against `type === "doc"` connections only via the existing same-type-only validator; until doc files ship with `type:"doc"` ports, doc-ports on cards are orphan slots with no connection candidates. PortEditorStrip shows a dev-mode tooltip on doc-typed ports: `"Doc file targets not yet shipped — coming in a future procomp."` Picker keeps the type visible (not hidden, not blocked).

### Q5 — Port id generation

**Lock:** auto-generated as `p-{cardRcid}-{shortUuid}` on "+ Add port" (single direction). For "both" → split into `p-{cardRcid}-{shortUuid}-in` and `p-{cardRcid}-{shortUuid}-out`.

**Worked example:** clicking "+ Add port" on a card with `__rcid="card-llm-system"` and selecting `[✓in]` produces port id `p-card-llm-system-a3f2`. Selecting `[✓in][✓out]` produces `p-card-llm-system-a3f2-in` and `p-card-llm-system-a3f2-out`.

User can edit the id inline; uniqueness validated within the node (cross-card unique not required — flow-canvas-01 already qualifies by `nodeId:portId`).

**Edge case (locked):** auto-generated ids stay stable through edits. Renaming a port doesn't break existing edges automatically — edges reference `nodeId:portId` strings, and the consumer must update edges if they rename a port. Editor surfaces a warning when renaming a port that has live edges.

### Q5-bis — Custom port type registration in v0.2

**Lock:** v0.2 PortEditorStrip uses the 5 v0.1 built-ins + the new `"doc"` type. **No `portTypes` prop.** Consumer-registered custom types support is v0.3 work and needs proper shared-context plumbing (or a `getPortTypes(canvas)` helper from flow-canvas-01) to avoid the strip's picker silently diverging from the canvas's runtime validator.

Rationale: a `portTypes?: PortType[]` prop on the strip is a footgun — consumer can pass a different array to `<FlowCanvas>` than to `<PortEditorStrip>` and the two diverge with no warning. Defaults-only in v0.2 sidesteps that.

### Q6 — Save model: live save or commit-on-close?

**Lock:** **Live save** (matches v0.1 rich-card's pattern). Every change calls `onChange(updatedCanvas)`. No commit/cancel button. Consistent with the existing rcif demo's live-save UX.

### Q7 — Validation in the strip

**Lock:** inline validation on each row:
- Empty id → red border + tooltip "Port id required"
- Duplicate id within the same node → red border + tooltip "Port id must be unique within this node"
- Empty direction (shouldn't happen post-Q3 — each row is one direction) → row disabled (defensive)
- `"doc"` type with non-bottom side (shouldn't happen post-Q4 — side picker disables non-bottom) → tooltip warning (defensive, in case consumer-supplied data is non-conformant)
- Invalid `multi:false` change that would orphan an existing connection → tooltip warning (port still saves)

No validation prevents save — strip operates in best-effort mode. Hard validation lives in flow-canvas-01's `isValidConnection`.

### Q8 — Permissions

**Lock:** PortEditorStrip accepts an optional `permissions?` prop that mirrors rich-card's predicate API shape:
```ts
type PortEditorPermissions = {
  canAddPort?: (cardId: string) => boolean;
  canRemovePort?: (cardId: string, portId: string) => boolean;
  canEditPort?: (cardId: string, portId: string) => boolean;
  canEditPortField?: (
    cardId: string,
    portId: string,
    field: "type" | "side" | "dir" | "multi" | "label" | "id",
  ) => boolean;
};
```
Default: everything allowed when `editable={true}` (consistent with rich-card's default).

### Q9 — Strip lifecycle (mount + node switch)

**Lock:** PortEditorStrip is always mounted alongside RichCard inside the dialog — same lifecycle. If the dialog is closed, both unmount. If editing is null, both are absent.

**Uncontrolled by design.** The strip operates on `canvas.data` (passed via prop) and has no local state to corrupt across node switches. On `nodeId` or `subPath` prop change, the strip re-reads `ports[]` from the new node's data and re-renders. **No `key={nodeId}` remount needed** (unlike the v0.1 `<RichCard>` mount pattern, which is uncontrolled-by-defaultValue and DOES need the remount).

If the consumer wants the strip outside the dialog scope (e.g., persistent sidebar), they can mount it standalone — the component doesn't require a dialog context.

### Q10 — Cross-procomp imports

**Lock:** rcif `<PortEditorStrip>` imports from `@/registry/components/data/flow-canvas-01/types` (Port, PortType, CanvasData) and `@/registry/components/data/flow-canvas-01/lib/update-node-data` (the helper). **F-S1 lock applies:** use RELATIVE imports (`../flow-canvas-01/types`, `../flow-canvas-01/lib/update-node-data`) in shipped source per the json-form v0.1.4 + rcif v0.1.0 precedent.

### Q11 — Visual design

**Lock:** strip matches rich-card's existing affordance style for visual continuity. Specifically the "+ Add port" button mirrors rich-card's `+ FIELD` / `+ BLOCK` pattern at [`parts/predefined-add-menu.tsx:56-59`](../../src/registry/components/data/rich-card/parts/predefined-add-menu.tsx#L56-L59):

```
border-dashed border-border/70 bg-transparent px-2 py-1
font-mono text-[10px] uppercase tracking-wider text-muted-foreground
```

Port type pickers show the type's color swatch alongside the label, with colors rendered via design tokens (`var(--chart-*)` / `var(--primary)` / etc., never raw hex), consistent with flow-canvas-01's port handle rendering. One row per port, no nesting. Compact spacing — strip should not dominate dialog height.

### Q12 — Backwards compatibility

**Lock:** purely additive. No breaking changes to v0.1 API. Existing rcif consumers continue to work without mounting the strip. Existing port data continues to work (the strip just reads what's there).

---

## 5. Open questions — RESOLVED at GATE 1 sign-off

All four Q-O items resolved 2026-05-17 on user "go ahead" authorization. User retains right to revise at GATE 2 sign-off.

- **Q-O1 (doc-port direction):** **(c) free.** No direction lock. Both `in` and `out` allowed; revisit when doc-file procomp ships. Rationale: locking semantics is premature without the target resource to inform the constraint. Folded into Q4 above.
- **Q-O2 (doc-port shipping mode):** **(a) ship as orphan slots.** PortEditorStrip's picker shows `"doc"` with a dev-mode tooltip noting that targets aren't shipped yet. Folded into Q4 above.
- **Q-O3 (flow-canvas-01 version bump):** **(b) v0.2.5 patch.** Closed by V6 earlier; no runtime contract growth so semver patch is correct.
- **Q-O4 (per-field ports in v0.2):** **(a) defer to v0.3** with explicit "next-up after v0.2" priority. Rationale: keeps v0.2 scope tight + shippable; per-field UX deserves its own design pass (right-click affordance vs. inline toggle vs. promote-from-rich-card all merit exploration). User's "for fields and cards" original ask is honored as a near-term roadmap commitment, not a v0.2 cut.

---

## 6. Non-goals (explicit)

- Not building a doc-file resource type.
- Not changing rich-card.
- Not changing flow-canvas-01's port runtime model (only `defaultPortTypes` array gains one entry).
- Not building visual port-placement preview.
- Not building drag-reorder for ports.
- Not building port templating.
- Not building consumer-registered custom-types support in PortEditorStrip in v0.2 (deferred to v0.3 with proper shared-context plumbing).

---

## 7. Re-validation pass — applied refinements changelog

Critical re-read of the initial draft surfaced 6 V-findings. All have been folded into the upstream Qs / §3 / §2 / header in the rewrite above. This section is the audit trail.

| # | What it changed | Where it landed |
|---|---|---|
| **V1** | Dropped auto-grouping of in/out port pairs. Ports are atomic post-save; "both" is a CREATE-time convenience only. | Q3 lock rewritten; §3 in-scope direction-bullet rewritten; §2 diagram updated (rows show single-dir, popover handles both-create) |
| **V2** | Worked example added showing `p-{cardRcid}-{shortUuid}` and the in/out split form. | Q5 lock |
| **V3** | Strip is uncontrolled by design — no `key={nodeId}` remount needed; re-reads `ports[]` on prop change. | Q9 lock |
| **V4** | Visual design cites the exact rich-card `+ FIELD` Tailwind classes (line-anchored to `predefined-add-menu.tsx:56-59`). | Q11 lock |
| **V5** | Dropped `portTypes?: PortType[]` prop from PortEditorStrip; v0.2 uses defaults-only. Custom types deferred to v0.3 with proper plumbing. | §3 props signature; new Q5-bis; §3 out-of-scope |
| **V6** | Dropped proposed `validatePort` runtime hook in flow-canvas-01. v0.2 flow-canvas-01 changes reduce to 1-line `defaultPortTypes` addition. Bump goes from `v0.3.0` minor → `v0.2.5` patch. Answers Q-O3. | Header line 6; §2 property #3; Q4 lock (side enforcement editor-only); §3 in-scope (note); §3 out-of-scope (runtime validation deferred); Q-O3 marked closed |

Summary of net effect: v0.2 ships as PortEditorStrip + 1-line flow-canvas-01 patch + zero runtime contract changes. Cleaner scope.

---

## 8. Sign-off — CLOSED 2026-05-17

- [x] Q-O1 answered (c free)
- [x] Q-O2 answered (a orphan slots)
- [x] Q-O3 answered (b v0.2.5 patch — by V6)
- [x] Q-O4 answered (a defer to v0.3, prioritized as next-up)
- [x] Q1–Q12 + Q5-bis locks accepted (assistant-recommended defaults under "go ahead" authorization)
- [x] Scope (in/out) accepted
- [x] V-findings audit trail (§7) acknowledged

User retains right to revise any lock at GATE 2 sign-off.
