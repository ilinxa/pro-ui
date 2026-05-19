# `rich-card-in-flow` v0.3.0 — Per-Field Ports + Custom Port-Type Picker Description (Stage 1)

> **Stage:** 1 of 3 · **Status:** **Draft — awaiting GATE 1 sign-off.** Assistant-recommended locks marked **Lock (proposed)**; user retains right to revise at GATE 1 sign-off; ambiguities flagged as **Q-…** for explicit decision.
> **Slug:** `rich-card-in-flow` (additive features; sibling exports + prop widening, no breaking changes)
> **Target version:** `rich-card-in-flow@v0.3.0` (minor bump — adds public surface)
> **Dependencies bumped:** **none anticipated** (Q1 lock (a) rcif-side `RichCardPort` subtype + Q2 lock (a) edge-with-hint rendering = zero flow-canvas-01 changes. Q-O5 confirms this is a pure rcif version bump unless user overrides Q1 or Q2 to options that require host help).
> **Parallel track to:** v0.2.0 (shipped 2026-05-17); v0.3.0 widens the editor + port-record shape that v0.2 introduced.

This is the description doc. Job: pin down the architecture for **per-field ports** + **custom port-type registration in the editor's picker**, surface open decisions, earn sign-off before any planning or code.

---

## 1. Problem

`rich-card-in-flow@v0.2.0` shipped opt-in `PortEditorStrip` with per-card + per-subcard ports. Two follow-ups carried forward from the v0.2 spotcheck:

| Capability | Status post-v0.2 |
|---|---|
| Card-level ports (`port → card`) | ✅ shipped v0.1 |
| Subcard-level ports (`port → subcard.__rcid`) | ✅ shipped v0.1 |
| Editor UI for port id / type / side / dir / multi / label | ✅ shipped v0.2 |
| `[✓in][✓out]` atomic-row create-flow | ✅ shipped v0.2 |
| Doc-port type with editor-side bottom-only enforcement | ✅ shipped v0.2 |
| **Per-field ports (`port → field`)** | ❌ this doc |
| **Custom port-type registration in editor's picker** | ❌ this doc |

Original user ask back at v0.2 GATE 1: *"for fields and cards."* v0.2 covered cards (root + subcards); v0.3 closes the field half. Custom port-type registration was deferred from v0.2's Q5-bis because the only safe API needed the strip to see what the host canvas's `portTypes` prop carries — that's solvable via a simple explicit prop (path b chosen in v0.2 spotcheck F-03).

---

## 2. Architecture (the system, one glance)

```
┌─────────────────────────────────────────────────────────────────────┐
│ flow-canvas-01 (host)                                               │
│                                                                     │
│  ┌──────────────────────────────────────┐                           │
│  │ RichCardViewer (rendered NodeRenderer│                           │
│  │                                                                  │
│  │  ┌──────────────────────────────┐                                │
│  │  │ Title strip                  │ ← card-level ports on edges    │
│  │  │ ─────────────────────────────│                                │
│  │  │ field: foo = "bar"      ⦿    │ ← NEW v0.3: field-level port   │
│  │  │ field: baz = 42         ⦿    │       at inline position       │
│  │  │ field: qux = true            │       (Q-O1: render-where?)    │
│  │  │ ─────────────────────────────│                                │
│  │  │ Subcard A (recursive)        │ ← subcard ports + own fields   │
│  │  └──────────────────────────────┘                                │
│  └──────────────────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────┘

  Data contract change (rcif-side ONLY; flow-canvas-01 untouched):
    type RichCardPort = Port & { fieldKey?: string }    ← new rcif export
                              ──────────────────       added per port record

    No fieldKey  → card-level port (existing v0.1/v0.2 semantics, unchanged)
    fieldKey     → field-level port; logically anchored to that flat field
                   on the card identified by __rcid.

    flow-canvas-01's Port stays unchanged: a RichCardPort assigns to Port
    via structural subtype (TS-narrows `fieldKey` away when seen as Port).
    The host treats the field as opaque; only rcif's editor + viewer read it.

  Editor change:
    PortEditorStrip props gain { portTypes?: PortTypeDef[] }
    Per-row picker offers fieldKey selector when card has flat fields
```

**Three properties that fall out of this shape:**

1. **Strict superset of v0.2.** Every v0.2 fixture validates unchanged — a port without `fieldKey` is implicitly card-level. No data migration required for existing consumers.
2. **rich-card stays port-agnostic.** Same as v0.1/v0.2 — rich-card's editor strips ports out of its own view. v0.3 doesn't touch rich-card.
3. **flow-canvas-01 stays portType-neutral.** `fieldKey` lives in the port record; flow-canvas-01 treats it as opaque metadata. Edge validation (same-type-only, dir, multi) unchanged. **One potential exception:** if Q-O1 lands as "render at field row," flow-canvas-01 may need to surface a helper for per-element handle coordinates — that's a separate v0.2.6 patch evaluated at GATE 2 plan, NOT v0.3 scope.

---

## 3. In scope / Out of scope (v0.3.0)

### v0.3.0 — in scope

- **Port record widening (rcif-side ONLY):** new `RichCardPort = Port & { fieldKey?: string }` type exported from rcif's types.ts. flow-canvas-01's `Port` stays unchanged — host portability honored per CLAUDE.md mandate. Card-level ports = `fieldKey` absent (assigns to plain `Port`); field-level = `fieldKey` set to one of the card's flat-field keys (rcif narrows back to `RichCardPort` when reading).
- **PortEditorStrip prop additions:**
  - `portTypes?: PortTypeDef[]` — explicit consumer-passed array; defaults to `defaultPortTypes` (the 6 built-ins). Path (b) from v0.2 spotcheck F-03.
  - **No new `field`-level config props** — field selector surfaces automatically when the editor sees flat fields on the targeted card.
- **PortField union widening:** `"id" | "type" | "side" | "dir" | "multi" | "label" | "fieldKey"` (one new value; non-breaking for consumers because they use `PortField` to RECEIVE the field name via `canEditField` callback, not to construct one).
- **Per-row UI in the editor:** new `fieldKey` selector column showing flat fields of the target card (with "—" / "card-level" as the default empty option). Disabled when target card has 0 flat fields.
- **Visual rendering of field-level ports** in RichCardViewer — see Q-O1 for the architectural choice between "inline at field row" vs "card edge with field hint."
- **Live save** of `fieldKey` changes (matches v0.2's live-save pattern).
- **Add-popover field selector:** the `[✓in][✓out]` create flow gains a `fieldKey` picker upstream of the side/type/dir/multi/label inputs. If the user picks a field, the resulting port(s) get `fieldKey` set.

### v0.3.0 — out of scope (intentional cuts)

- **Drag-to-reorder ports within a card** — v0.4 if needed (data shape is array, supports it; UX is a separate decision).
- **Connection-aware port deletion confirmation** — today the live-edges chip surfaces the count; consumer-side confirmation is the consumer's call. v0.4+ if a real pattern emerges.
- **Doc-file target resource** — still a separate future procomp.
- **Port-from-field-defaults sync** (use field's type to derive port's type) — deferred indefinitely; unclear use case.
- **Sub-subcard ports** (nested deeper than 1 level) — `enumerateSubcards` walks one level deep per v0.1's MAX_NESTED_OUTLINES=1 lock. Per-field within a subcard is in scope (subcard is its own card with its own flat fields); deeper nesting stays deferred.
- **Field rename invalidates port** — if consumer renames a flat field, ports referencing the old `fieldKey` become orphaned. v0.3 surfaces a dev-mode warning + greys out the row; auto-rename is too consumer-policy-dependent (some consumers will want manual, some auto-sync). v0.4+ if a real pattern emerges.

---

## 4. Locked decisions (Q1–Q5; assistant-recommended defaults)

### Q1 — Data shape for field reference

**Problem:** Where does the field-level port discriminator live, and which package owns the type?

**Options:**
- (a) **rcif subtype** — `type RichCardPort = Port & { fieldKey?: string }` exported from rcif's types.ts. flow-canvas-01's `Port` stays untouched. rcif viewer + editor narrow to `RichCardPort` when reading; flow-canvas-01 sees a plain `Port` (TS-structurally accepted via subtype). Single array per card. Existing card-level ports stay valid (assign as plain `Port`).
- (b) **Widen flow-canvas-01's `Port`** — add `fieldKey?: string` to the host type. Single source of truth, but bleeds rcif-specific knowledge into a portable host (violates CLAUDE.md portability mandate — flow-canvas-01 should stay rich-card-agnostic).
- (c) **Side-table on RichCardJsonNode** — add a separate `fieldPortMap?: Array<{ portId: string; fieldKey: string }>` lookup on each card. Keeps port records pristine; doubles bookkeeping surface (mutators must keep two arrays consistent; orphan-on-port-delete risk).
- (d) **Nested `ports[]` on each flat field's data** — breaks the rich-card-side contract that fields are pure data; rich-card would suddenly need to know about ports.

**Lock (proposed):** **(a) `RichCardPort = Port & { fieldKey?: string }` subtype on rcif side.** Keeps flow-canvas-01 untouched (no v0.2.6 host patch needed for the data shape). Single array per card. Subtype narrowing is TS-native and zero-runtime-cost. (b) violates host portability. (c) doubles the bookkeeping + creates orphan-port-on-mutation footguns. (d) breaks rich-card's port-agnostic contract. **Side benefit:** Q-O5 below becomes a confirmed "no flow-canvas-01 patch needed" — v0.3 is a pure rcif version bump.

### Q2 — Visual rendering of field-level ports

**Problem:** Where does a field-level port's circle / handle appear visually?

**Options:**
- (a) **Card edge with field-hint** — port renders at the card's left/right/top/bottom edge per `side`, but the label includes the field name (e.g., `"foo (in)"`). No DOM-coordinate gymnastics. Edge connects to the card edge.
- (b) **Inline at the field row** — port renders next to the actual field row in the viewer (right or left of the field text). Edge anchors to the field's DOM position. Visually clearer about "this connects FROM field X."
- (c) **Both layouts available** — consumer chooses via `fieldPortLayout?: "edge" | "inline"` prop.

**Lock (proposed):** **(a) card edge with field-hint** for v0.3. Rationale: (b) requires per-field DOM measurement + a flow-canvas-01 helper that doesn't exist today (`getHandleCoords(fieldKey)`); too much scope for v0.3. (a) ships with zero flow-canvas-01 changes, keeps the existing `<PortsAt>` rendering pipeline. (c) is YAGNI in v0.3 — if (b) becomes a real consumer ask, add it as `fieldPortLayout?` in v0.4 as a non-breaking widening.

### Q3 — Editor surface for field ports

**Problem:** How does the editor present field-level vs card-level ports?

**Options:**
- (a) Single mixed list — every port row has a `fieldKey` column; "—" means card-level.
- (b) Two sections — "Card ports" above, "Field ports" below, each with its own add-popover.
- (c) Tabs — "Card ports" / "Field ports" tabs.

**Lock (proposed):** **(a) single mixed list with a `fieldKey` column.** Each port row gets the same 6 fields v0.2 has, plus the new `fieldKey` selector. Reads cleanly; doesn't double the UI; matches the data-shape simplicity from Q1. Consumer can filter visually by sorting in the `permissions.canEditField` callback if they want section-like grouping (not blocked).

### Q4 — `portTypes` prop on PortEditorStrip

**Problem:** Exact prop shape for custom-port-type registration (Q5-bis deferred from v0.2).

**Options:**
- (a) `portTypes?: PortTypeDef[]` — explicit array; defaults to `defaultPortTypes`.
- (b) `portTypes?: PortTypeDef[] | ((canvas: CanvasData) => PortTypeDef[])` — array OR derive-from-canvas function.
- (c) Auto-pull from `flow-canvas-01`'s `<FlowCanvas portTypes={…}>` via a shared context.

**Lock (proposed):** **(a) `portTypes?: PortTypeDef[]`.** Matches the rest of rcif's API style (explicit props, no implicit context). Consumer responsibility to pass the same array they passed to `<FlowCanvas portTypes={…}>` — clear contract, no surprise. (b) and (c) both add complexity for an edge case (consumer wanting different palette for editor vs canvas — likely a footgun anyway). Default = `defaultPortTypes` (the 6 built-ins from flow-canvas-01@v0.2.5). Re-export `defaultPortTypes` from rcif's barrel for convenience.

### Q5 — `permissions.canEditField` widening

**Problem:** `PortField` union gains `"fieldKey"`; should `permissions.canEditField` be aware?

**Lock (proposed):** **Yes — add `"fieldKey"` to the union; non-breaking.** Consumers using `canEditField` already handle unknown field values gracefully (`?? true` permissive default). Adding a new value is a widening; consumers can opt in to restricting `fieldKey` edits by returning `false` for that field.

---

## 5. Open questions (Q-O1...Q-O5; awaiting user input at sign-off)

### Q-O1 — How strict is "fieldKey must be a real flat-field key"?

**Options:**
- (a) **Lenient** — editor allows any string; if it doesn't match a field, port shows as "orphan field-ref" with a warning tooltip. Useful if consumer plans to add the field later or generate fields dynamically.
- (b) **Strict** — editor's selector only offers actual current flat-field keys; you can't pick an absent key. Runtime stays neutral (a programmatically-constructed port with a non-existent fieldKey still saves).

**Assistant recommends:** **(b) strict in the editor**. Matches v0.2's pattern (editor enforces shape; runtime stays neutral). Tooltip + greying for orphaned ports (e.g., after field rename) covers the recovery path. Consumer who wants pre-creation can add the field first, then the port.

### Q-O2 — What happens to a field-level port when its target field gets removed / renamed in rich-card?

**Options:**
- (a) **Surface a warning, don't auto-fix.** Port shows greyed with tooltip "Field 'foo' no longer exists." Consumer rename = manual port update.
- (b) **Auto-orphan to card-level.** When field disappears, port's `fieldKey` gets cleared (becomes card-level). Lossy.
- (c) **Auto-delete the port.** When field disappears, port goes too. Aggressive.

**Assistant recommends:** **(a) warning, don't auto-fix.** Matches the same "consumer-policy" thinking as edge-on-port-rename (v0.2). Auto-fix is too opinionated for a primitive library; consumers can implement their own auto-rename via their `rich-card` change hook.

### Q-O3 — Per-field ports on subcards

**Question:** Subcards have their own flat fields (each subcard is itself a rich-card). Does v0.3 support per-field ports on subcard fields too?

**Assistant recommends:** **Yes — same mechanism.** PortEditorStrip operates on whichever level the user clicked (root or subcard, via subPath); the field selector pulls from THAT level's flat fields. No special handling required since subcard ports already work; per-subcard-field ports inherit the same widening.

### Q-O4 — Backward compat for existing v0.2 consumers

**Question:** v0.2 consumers have ports without `fieldKey`. Do they need to migrate?

**Assistant confirms:** **No migration.** Card-level = `fieldKey` absent (or `fieldKey === undefined`). All v0.2 fixtures + consumer code continues to work as-is. v0.3 is a strict widening.

### Q-O5 — Does v0.3 need a flow-canvas-01 patch?

**Question:** Does any v0.3 work require an additive change to flow-canvas-01?

**Assistant analysis (post-Q1-refinement):**
- **Data shape** — Q1 lock (a) `RichCardPort` subtype keeps the type widening rcif-side. Zero flow-canvas-01 change.
- **Visual rendering** — Q2 lock (a) edge-with-hint uses existing `<PortsAt>` pipeline. Zero flow-canvas-01 change.

**Confirmed: zero flow-canvas-01 changes for v0.3.** Pure rcif version bump (no Workstream A; no v0.2.6 patch).

If user overrides Q2 to (b) inline rendering, the flow-canvas-01 work becomes a v0.2.6 patch evaluated at GATE 2 (adds a helper for per-field handle coordinates). If user overrides Q1 to (b) widen-host-Port, that's a v0.3.0 flow-canvas-01 minor bump on the same plan as a Workstream A.

---

## 6. Public API matrix (proposed)

| Surface | v0.2 shape | v0.3 shape | Breaking? |
|---|---|---|---|
| `RichCardPort` type (rcif export) | absent | `Port & { fieldKey?: string }` | No (new export; existing `Port` consumers unaffected) |
| `PortField` union | `"id" \| "type" \| "side" \| "dir" \| "multi" \| "label"` | `+ "fieldKey"` | No (consumers receive, don't construct; widening is safe) |
| `PortEditorStripProps.portTypes?` | absent | `PortTypeDef[]` | No (additive optional, defaults to `defaultPortTypes`) |
| `PortEditorPermissions.canEditField` | `(card, port, field: PortField) => boolean` | unchanged signature, callback now receives `"fieldKey"` as a possible value | No (consumers' permissive default handles unknown values) |
| `defaultPortTypes` re-export from rcif barrel | absent | re-exports from flow-canvas-01 for convenience | Additive |

**Zero breaking changes.** Existing v0.2 fixtures + consumer code validates unchanged.

---

## 7. Risks & mitigations

- **Risk: editor UI gets cramped with the new `fieldKey` column.** Mitigation: column only renders when target card has flat fields > 0. Width-tune in B3 polish pass.
- **Risk: orphaned `fieldKey` ports surface as a UX paper-cut.** Mitigation: dev-mode tooltip + grey treatment per Q-O2 lock (a); document in procomp guide §7 footguns.
- **Risk: consumer passes different `portTypes` array to `<FlowCanvas>` vs `<PortEditorStrip>`.** Mitigation: procomp guide §7 footgun — "pass the same array to both." Acceptable cost for explicit-prop simplicity.
- **Risk: visual confusion between card-level and field-level ports on the canvas.** Mitigation: Q2 lock (a) edge-with-hint puts the field name in the port label (`"foo (in)"`), distinguishing them visually without needing inline rendering.

---

## 8. Sign-off

GATE 1 closure requires:
- [ ] Q1 (data shape) — confirm (a) `fieldKey?: string` on `Port`, OR override
- [ ] Q2 (visual rendering) — confirm (a) edge-with-hint, OR override to (b) inline + accept v0.2.6 flow-canvas-01 patch
- [ ] Q3 (editor surface) — confirm (a) single mixed list, OR override
- [ ] Q4 (`portTypes` prop) — confirm (a) `portTypes?: PortTypeDef[]`, OR override
- [ ] Q5 (`canEditField` widening) — confirm yes, OR override
- [ ] Q-O1 (lenient vs strict fieldKey) — pick **a / b**
- [ ] Q-O2 (orphan field-port handling) — pick **a / b / c**
- [ ] Q-O3 (per-field on subcards) — confirm yes, OR override
- [ ] Q-O4 (no migration) — confirm
- [ ] Q-O5 (no flow-canvas-01 patch with Q2=(a)) — confirm
- [ ] Add or revise any item; explicit OK to proceed to GATE 2 plan

Once signed, Stage 2 plan unlocks (target ~3–4 hour implementation: data-shape widening + editor row column + add-popover field selector + permissions widening + procomp guide §7 update + GATE 3 spotcheck with rotating dim Public API).
