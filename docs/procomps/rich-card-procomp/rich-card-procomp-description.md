# `rich-card` — Pro-component Description (Stage 1)

> **Stage:** 1 of 3 · **Status:** Decisions locked — awaiting final sign-off
> **Slug:** `rich-card` · **Category:** `data`
> **Conceptual lineage:** outline editors (Roam, Logseq, Notion blocks), structural tree editors (`react-arborist`, `@uiw/react-json-view`). **Not a Notion clone.** A **structured-content viewer/editor** for arbitrary recursive card hierarchies, with a JSON-native data model.

This is the **description** doc. Its job is to pin down what we're building and why, surface open decisions, and earn sign-off before any planning or code. Open questions raised during review have been resolved (see §7). Deviations from the original concept brief are flagged ⚠. The full concept brief authored by the user is preserved verbatim in the appendix at the end.

> ⚠ **Top-level deviation from the original brief — markdown support is dropped.** The original concept proposed a dual-format JSON ↔ Markdown contract as "a critical property." After review, **markdown support is removed entirely from rich-card**. The component is JSON-only. Rationale: the markdown layer was the highest-risk and largest implementation cost in v0.1; it was constraining decisions throughout (string-only fields, definition-list encoding, custom remark plugins, four npm dependencies); and a markdown adapter that emits/consumes our JSON tree is better architected later as a layer on top of a proven JSON model. The original markdown framing is preserved verbatim in Appendix A as historical record. Future markdown support — if a real consumer needs it — would ship as a separate companion (see §2 v0.5).

---

## 1. Problem

Hessam's projects regularly need to display, navigate, and edit **deeply nested structured content** — agent transcripts, configuration trees, decision records, runbooks, requirement docs, and other "outlines with content under each heading". The shapes share essential properties:

- Recursive and unbounded — depth and breadth vary per document
- Mixed content per node — flat typed fields, code, tables, images, lists, quotes
- JSON is the natural source format — produced by APIs, agents, schemas, configuration tools
- Need for both viewer-only display AND structural editing
- Per-level visual hierarchy — top-level sections should look different from leaf cards

Today, every project handles this differently:

- **JSON-tree editors** (`@uiw/react-json-view`, `react-arborist`) accept JSON but render as code-style key/value pairs — useless for content presentation.
- **Notion-likes** (BlockNote, Tiptap) are excellent but lock you into their block schema — not a generic "card-tree of any shape" primitive, and they're authored, not driven by external JSON.
- **Custom-built per project** — 2–6 weeks of work, accessibility usually skipped, never reusable.

There is no high-quality React component for **structured recursive cards driven by JSON** with great visual hierarchy and a clean editing model. This pro-component fills that gap.

The release strategy is **phased** to keep each version shippable and useful:

- **v0.1 (viewer)** — JSON input, full styling, full a11y, canonical JSON serialization. No editing.
- **v0.2 (inline editor)** — add/edit/remove fields, cards, predefined-key elements. Granular change events. Dirty tracking.
- **v0.3 (movement + permissions)** — drag-drop (2 scopes), bulk operations, per-level / per-card / per-key permissions, custom predefined-key registration.
- **v0.4 (safety net)** — sync validation hooks, per-commit undo/redo.
- **v0.5 (markdown adapter, deferred indefinitely)** — separate companion module (NOT inside rich-card) that translates markdown ↔ `RichCardJsonNode`. Sized and scheduled only when a real consumer needs it.

Each version is independently useful: v0.1 alone is a JSON-driven outline viewer with great styling and auto-canonicalization. v0.2 makes it a content editor. v0.3+v0.4 turn it into a Notion-grade structural editor.

---

## 2. In scope / Out of scope

### v0.1 (viewer) — in scope

- **JSON input.** Accepts a single root `RichCardJsonNode`. Auto-attaches missing `__rcid` (UUID) and `__rcorder` (integer) on parse so downstream phases have stable identities to edit against.
- **Recursive structural model.** Single root card. Each card has flat typed fields, predefined-key elements, child cards, and meta.
- **Typed flat-field values.** JSON scalars only — string, number, boolean, null. Type inferred from the value at parse time; rendered per type (numbers right-aligned; booleans as checkmarks; ISO-8601 date strings formatted as dates; null rendered muted). Arrays and objects do NOT go in flat fields — they go via a predefined-key element or as child cards.
- **Closed predefined-key catalog.** `codearea`, `image`, `table`, `quote`, `list`. Five keys, each renders with a distinct styled component.
- **Per-level styling.** `levelStyles?: LevelStyle[]` (slot-based: `containerClassName`, `headerClassName`, `fieldsClassName`, `childrenClassName`). Index 0 = root (level 1); last entry repeats for deeper levels. Override via `getLevelStyle?: (level: number) => LevelStyle`.
- **Per-predefined-key styling.** `predefinedKeyStyles?: { codearea?, image?, table?, quote?, list? }`.
- **Collapsibility.** Every card has an expand/collapse toggle. Default state controlled by `defaultCollapsed?: 'all' | 'none' | (level: number) => boolean`. Collapse state persists across re-renders within a session.
- **Meta exposure.** Controlled by `metaPresentation?: 'hidden' | 'inline' | 'popover'`. Default `'hidden'`.
- **Canonical JSON serialization.** Imperative `getValue(): string` returns the tree as canonical JSON — same data the consumer passed in, with `__rcid` / `__rcorder` filled in and reserved-key collisions rejected. `getTree()` returns the parsed object form.
- **Full a11y tree.** `role="tree"`, `role="treeitem"`, `aria-level`, `aria-expanded`. Keyboard: arrow-up/down navigate visible cards, arrow-right expand/descend, arrow-left collapse/ascend, home/end jump.
- **Performance target.** Render-everything to ~500 nodes at 60fps on a mid-tier laptop.
- **Predefined-key opt-out.** `disabledPredefinedKeys?: PredefinedKey[]` — disabled keys parse but render as neutral fields (no special styling or component).

### v0.2 (inline editor) — out of v0.1, planned

- Inline editing of flat fields (input swap on activation, **type-aware**: text input for strings, number input for numbers, checkbox for booleans, date picker for ISO-8601 date strings; not modal, not side-panel)
- Add/edit/remove cards, fields, predefined-key elements
- Granular change events (`onCardAdded`, `onFieldEdited`, `onCardRemoved`, …)
- Dirty-state tracking (`isDirty()`, `markClean()`)
- Insertion at arbitrary `__rcorder` index
- Explicit selection model (`onSelectionChange`)

### v0.3 (movement + permissions) — out of v0.1, planned

- Drag-drop with **2 scopes** (same-level reorder, cross-level reparent) — ⚠ collapsed from original 3 scopes
- Per-level / per-card / per-predefined-key permission rules
- Bulk operations (multi-select via shift-click range + cmd-click toggle; cut/duplicate/delete subtrees)
- Card lock via `meta.locked: true` reserved meta key
- Cascade-vs-promote on remove (cascade default; `promote` opt-in per delete)
- Custom predefined-key registration (extensible catalog)
- Virtualization for trees > 500 nodes if real consumers need it

### v0.4 (safety net) — out of v0.1, planned

- Validation hooks (sync only — async deferred)
- Undo/redo (per-commit granularity, history depth configurable)
- Will-change/did-change event split

### v0.5 (markdown adapter, deferred indefinitely) — separate companion, NOT in rich-card

- Markdown → `RichCardJsonNode` parser + `RichCardJsonNode` → markdown serializer
- Lives as a separate companion module (utility or sibling component); rich-card itself stays JSON-only
- Sized and scheduled independently when a real consumer needs markdown ingestion
- Built on top of the proven JSON model — **no design decisions in v0.1–v0.4 are constrained by markdown compatibility**

### Deliberate non-goals (any version of rich-card itself)

- **Markdown parsing or serialization inside rich-card.** A separate adapter module can convert; rich-card is JSON-native.
- **Non-tree structures.** Cards have one parent. No graphs, no cross-references between subtrees.
- **Block-level rich text inside flat fields.** Flat-field values are JSON scalars. Multi-line / formatted content goes via a predefined-key element (`quote`, `codearea`, etc.) or as a nested card.
- **Cross-document references.** A card cannot link to or include another tree.
- **Server-side rendering of edits.** v0.2+ is client-only; v0.1 viewer is SSR-safe.
- **Built-in persistence.** Consumer wires it via change events; we don't ship a backend or local-storage adapter.

---

## 3. Target consumers

| Archetype | Example | What they need |
|---|---|---|
| **AI agent transcript / evaluation tool** *(primary)* | Trace viewer, prompt-engineering UI, LLM eval dashboard | Render structured agent outputs that arrive as JSON; code blocks, tables, meta-rich, deeply nested |
| **Configuration UI builder** *(primary)* | App-config editor, schema-driven forms, feature-flag console | View and edit nested config trees with typed values; clean JSON round-trip for storage |
| **Internal tool / structured-content authoring** *(primary)* | Decision records, postmortems, runbooks, requirement docs | Author hierarchical content with code blocks, quotes, tables; JSON source-of-truth for now (markdown adapter later if needed) |
| Spec-driven product team *(secondary)* | Design specs, RFC editors | View + edit hierarchical specs in a dedicated UI. Teams that need markdown-source-of-truth wait for v0.5 adapter. |

Non-targets: simple flat lists, prose-only writing apps, free-form whiteboards. For prose, use a markdown editor; for whiteboards, use a canvas component.

---

## 4. Rough API sketch (NOT final — that's the plan stage)

This is illustrative. The plan doc will lock the final shape.

```ts
// Reserved keys (developer cannot use these as flat-field keys)
const RESERVED_KEYS = ['__rcid', '__rcorder', '__rcmeta'] as const;
const PREDEFINED_KEYS = ['codearea', 'image', 'table', 'quote', 'list'] as const;
type PredefinedKey = typeof PREDEFINED_KEYS[number];

// Flat-field values: JSON scalars only
type FlatFieldValue = string | number | boolean | null;

// Predefined-key payloads
type CodeAreaValue = { format: string; content: string };
type ImageValue   = { src: string; alt?: string };
type TableValue   = { headers: string[]; rows: FlatFieldValue[][] };
type QuoteValue   = string;
type ListValue    = FlatFieldValue[];

// The card node
type RichCardJsonNode = {
  __rcid: string;                              // auto-generated via crypto.randomUUID() if absent on input
  __rcorder: number;                           // sibling-relative integer; gaps allowed for cheap insert
  __rcmeta?: Record<string, FlatFieldValue>;
  // Flat fields:        any non-reserved key with a FlatFieldValue
  // Predefined-key:     { codearea: CodeAreaValue, image: ImageValue, table: TableValue, quote: QuoteValue, list: ListValue }
  // Children:           any non-reserved, non-predefined key with object/array value (RichCardJsonNode or RichCardJsonNode[])
  [field: string]: unknown;
};

// Slot-based styling
type LevelStyle = {
  containerClassName?: string;
  headerClassName?: string;
  fieldsClassName?: string;
  childrenClassName?: string;
};

// The component (v0.1 surface)
type RichCardProps = {
  defaultValue: RichCardJsonNode;                           // seed; remount via key prop to reset

  levelStyles?: LevelStyle[];                               // index = level - 1; last entry repeats deeper
  getLevelStyle?: (level: number) => LevelStyle;            // overrides levelStyles
  predefinedKeyStyles?: Partial<Record<PredefinedKey, string | LevelStyle>>;

  defaultCollapsed?: 'all' | 'none' | ((level: number) => boolean);
  metaPresentation?: 'hidden' | 'inline' | 'popover';
  disabledPredefinedKeys?: PredefinedKey[];
  dateDetection?: 'auto' | 'never' | ((value: string) => boolean);  // ISO-8601 string → date affordance

  className?: string;

  // v0.2+ adds: editing toggles (allowFieldEdit, allowCardAdd, …), change handlers (onChange, onCardAdded, …)
  // v0.3+ adds: dnd scope toggles, permission rules
  // v0.4+ adds: validation hooks, undo config
};

// Imperative handle (via ref)
type RichCardHandle = {
  getValue(): string;                          // canonical JSON string (with auto-attached IDs)
  getTree(): RichCardJsonNode;                 // structured form
  // v0.2+: undo, redo, markClean, isDirty, focusCard, selectCard
};
```

Six public types for v0.1, one required prop (`defaultValue`), eight optional props. v0.2/v0.3/v0.4 each lock their own prop deltas. If the v0.1 surface expands beyond ~12 props, the API is wrong and we restart this section.

---

## 5. Example usages

### 5.1 — Decision record viewer (primary v0.1 use)

```tsx
<RichCard
  defaultValue={{
    __rcid: 'adr-0042',
    __rcorder: 0,
    __rcmeta: { author: 'hessam', date: '2026-04-26' },
    title: 'Migrate to OKLCH colors',
    adr_id: 'ADR-0042',
    status: 'accepted',
    priority: 2,
    locked: true,
    codearea: { format: 'ts', content: 'const lime = "oklch(0.80 0.20 132)";' },
    context: {
      __rcid: 'adr-0042-ctx',
      __rcorder: 0,
      reason: 'HSL does not preserve perceptual lightness across hues',
    },
    decision: {
      __rcid: 'adr-0042-dec',
      __rcorder: 1,
      quote: 'Adopt OKLCH for all design tokens; map legacy hex via tooling.',
    },
  }}
/>
```

A 3-card tree (root + 2 children). Typed flat fields render per type — `priority: 2` right-aligned as a number, `locked: true` as a checkmark, `status: "accepted"` as a string. The codearea renders syntax-highlighted; the quote as a styled blockquote.

### 5.2 — Agent trace viewer (primary v0.1 use)

```tsx
<RichCard
  defaultValue={{
    __rcid: 'trace-001',
    __rcorder: 0,
    __rcmeta: { ts: '2026-04-27T12:34:56Z', model: 'opus-4.7', tokens: 4823 },
    task: 'analyze the bug report',
    success: true,
    step1: {
      __rcid: 'trace-001-1',
      __rcorder: 0,
      action: 'read file',
      duration_ms: 142,
      codearea: { format: 'ts', content: 'export const fn = () => { ... }' },
    },
    step2: {
      __rcid: 'trace-001-2',
      __rcorder: 1,
      action: 'identify root cause',
      finding: 'off-by-one in loop bound',
      confidence: 0.92,
    },
  }}
  metaPresentation="popover"
  levelStyles={[
    { containerClassName: 'rounded-2xl border-2 bg-card p-6' },
    { containerClassName: 'rounded-xl border bg-muted/50 p-4 ml-6' },
  ]}
/>
```

A trace with a root and two child step cards. Meta info (timestamp, model, token count) is reachable via a popover trigger. Numeric fields (`duration_ms`, `confidence`) render as numbers; the boolean `success` as a checkmark. Level 1 cards get heavier card chrome; level 2+ get lighter chrome.

### 5.3 — JSON canonicalization (paste in raw, get back IDs filled in)

```tsx
const ref = useRef<RichCardHandle>(null);
return (
  <>
    <RichCard
      ref={ref}
      defaultValue={{
        // No __rcid / __rcorder on input — auto-attached by the component
        title: 'Project plan',
        section1: { name: 'Discovery', deliverable: 'requirements doc' },
        section2: { name: 'Build', deliverable: 'shipped feature' },
      } as RichCardJsonNode}
    />
    <button onClick={() => navigator.clipboard.writeText(ref.current!.getValue())}>
      Copy canonical JSON (with auto-attached IDs)
    </button>
  </>
);
```

Even without editing, v0.1 doubles as a JSON canonicalizer — feed in raw JSON without identity keys, the component renders the tree, and `getValue()` returns the same JSON with `__rcid` and `__rcorder` filled in. v0.2's editing operations rely on these IDs being present, so v0.1 effectively prepares JSON for the editor — a small but useful standalone capability.

---

## 6. Success criteria

The component ships v0.1.0 (alpha) when:

1. **JSON parses correctly** — a `RichCardJsonNode` produces the expected internal tree, with auto-attached `__rcid` (UUID) and `__rcorder` (integer) where missing on input.
2. **Round-trip is clean** — `parse(serialize(parse(x)))` equals `parse(x)`. JSON in, JSON out, with reserved keys preserved, missing IDs filled in, reserved-key collisions rejected.
3. **All five predefined keys render** — codearea, image, table, quote, list each have a distinct visual treatment matching design tokens.
4. **Typed scalar values render appropriately** — strings, numbers, booleans, and ISO-8601 date strings each render with their own affordance distinct from the generic string treatment. Null renders muted.
5. **Per-level styling works** — `levelStyles[0]`, `[1]`, `[2]` produce visibly distinct card chrome at three nested depths.
6. **A11y contract holds** — VoiceOver / NVDA announces level and expand state. Arrow keys navigate. Tab trap behaves correctly.
7. **Collapse persists** — toggling a card at L2 doesn't unmount its subtree; reopening shows the same expanded sub-state as before.
8. **Meta exposure modes work** — hidden / inline / popover all render correctly without leaking layout.
9. **No hardcoded colors** — semantic Tailwind tokens only. Light + dark themes both look right.
10. **500-node performance** — a 500-leaf tree expands/collapses without dropped frames on a mid-tier laptop.
11. **Portability** — zero `next/*` imports, no `process.env`, no app context. Standard pro-component portability rules.
12. **Demo + usage docs** complete; demo exercises typed scalar fields + all five predefined keys + 3-level nesting + meta in all three presentation modes.
13. **Compiles and renders** at `/components/rich-card` with no console warnings.

Stable (`1.0.0`) is gated separately and includes v0.2–v0.4 ship + external consumers + 30-day no-break window.

---

## 7. Locked decisions (was: open questions)

All resolved during review and consistency pass. Decisions that diverge from the originally-proposed concept are flagged ⚠. The biggest deviation — dropping markdown support entirely — is called out at the top of this document and is structural rather than a per-Q decision (markdown is simply absent from rich-card's surface).

| # | Question | Decision |
|---|---|---|
| Q1 | **Slug + category** | `data/rich-card`. Sits alongside [`data/data-table`](../../../src/registry/components/data/data-table/) — both are structured-data renderers. |
| Q2 | **Single-shot vs phased release** | ⚠ **Phased** — v0.1 viewer / v0.2 inline editor / v0.3 movement+permissions / v0.4 validation+undo / v0.5 (deferred indefinitely) markdown adapter. Diverges from "single shot" in the original. Rationale: largest component on the roadmap; v0.1 is independently useful as a JSON-driven viewer with auto-canonicalization; each phase is independently shippable. |
| Q3 | **Round-trip contract** | **Clean canonical** — `parse(serialize(parse(x))) === parse(x)`. JSON in, JSON out, with auto-attached `__rcid` / `__rcorder` and reserved-key-collision rejection. Trivial since both sides of the trip are JSON; no whitespace or trivia normalization concerns. |
| Q4 | **Identifier + sibling-order keys** | `__rcid` (UUID via `crypto.randomUUID()`, auto-generated if missing) and `__rcorder` (integer; gaps allowed; renumbered on insert/delete starting v0.2). Both are reserved (cannot be flat-field keys). `__rcmeta` is the third reserved key. |
| Q5 | **Field value typing** | **JSON scalars** — string, number, boolean, null. Type inferred from the value at parse time; rendered per type (numbers right-aligned; booleans as checkmarks; ISO-8601 date strings formatted as dates; null rendered muted). Arrays and objects do NOT go in flat fields — they go via a predefined-key element or as child cards. |
| Q6 | **Predefined-key catalog** | **Closed in v0.1:** `codearea`, `image`, `table`, `quote`, `list`. Meta is NOT a predefined key — it is a separate per-card structural concept. Custom-key registration deferred to v0.3. Developers can opt OUT of styling/rendering individual keys via `disabledPredefinedKeys` (they parse but render as neutral fields). |
| Q7 | **DnD scopes** | ⚠ **Two scopes** — same-level reorder, cross-level reparent. The original "global" scope was redundant with cross-level (any-to-anywhere already works under cross-level); per-level locks (v0.3) gate cross-level if the developer wants to restrict it. Implemented in v0.3 only. |
| Q8 | **Performance posture** | ⚠ **Model unbounded; v0.1 render budget ~500 nodes.** Diverges from original "no depth or breadth limit" — the *model* is unbounded, the v0.1 *renderer* targets 500 leaves. Virtualization (windowed treeitems) deferred to v0.3 if real consumers need more. |
| Q9 | **Accessibility** | **Full tree contract from v0.1.** `role="tree"`, `role="treeitem"`, `aria-level`, `aria-expanded`, `aria-selected`. Keyboard: arrows navigate, home/end jump, enter toggles collapse, type-ahead optional. Editing layers (v0.2+) add textbox roles + polite live region announcing adds/removes. |
| Q10 | **State model** | **Uncontrolled with imperative API.** `defaultValue` is seed; `key` remount resets; `useImperativeHandle` exposes `getValue()`, `getTree()`, and (v0.2+) `markClean`/`isDirty`/`undo`/`redo`. Matches workspace pattern. Avoids re-rendering 500-node tree on every host-prop change. |
| Q11 | **Per-level styling API** | `levelStyles?: LevelStyle[]` (index = level - 1; last entry repeats for deeper levels). Override via `getLevelStyle?: (level: number) => LevelStyle`. `LevelStyle` is slot-based: `containerClassName`, `headerClassName`, `fieldsClassName`, `childrenClassName`. |
| Q12 | **Selection model** | **v0.1: keyboard focus only** (drives a11y, single card at a time). v0.2: explicit selection (`onSelectionChange`). v0.3: multi-select (shift-click range + cmd-click toggle). |
| Q13 | **Edit affordance (v0.2)** | **Inline, type-aware** — text input for strings, number input for numbers, checkbox for booleans, date picker for ISO-8601 date strings. NOT modal, NOT side-panel. |
| Q14 | **Validation + undo (v0.4)** | **Sync validation only** (async deferred). **Per-commit undo** (history depth configurable; default 50). |
| Q15 | **Deletion semantics** | **Cascade by default.** `promote` available as a per-delete option in v0.2+. Root delete: **forbidden in v0.1**; v0.2 may allow with explicit consumer config. |
| Q16 | **Field key collision** | **Reject + inline error.** Both reserved-key collision (`__rcid`, `__rcorder`, `__rcmeta`, predefined keys) and sibling-key collision in the same card. v0.2 enforces this on edit; v0.1 input parsing rejects + warns. |

### What "diverged" means

Three Q-rows diverge from the originally-proposed concept (Q2, Q7, Q8); plus the structural top-level "drop markdown support entirely" deviation called out in the banner. None are reductions in capability — Q2 is a release-strategy split that preserves the same end state; Q7 is a simplification that doesn't lose any practical capability; Q8 is honest framing of a render-vs-model distinction; the markdown drop punts a feature to a separate companion that's better architected as a layer on top of a proven JSON model anyway. The original concept is preserved verbatim in Appendix A.

---

## 8. Risks

- **Scope creep across v0.2–v0.4.** Each phase is tempted to absorb the next. Each phase's plan must declare its own definition of done.
- **Accessibility debt across phases.** Adding edit affordances (v0.2) and DnD (v0.3) on top of a tree without breaking the v0.1 a11y contract is non-trivial. Each subsequent plan must keep an a11y-deltas section as a first-class concern.
- **Performance regression as features land.** A 500-node read-only tree at 60fps doesn't guarantee a 500-node editable tree at 60fps. v0.2 plan must include a perf-budget verification step.
- **Type inference for ISO-8601 date strings is heuristic.** Detecting "this string is a date" by regex will get false positives (e.g. `"2026-12-99"` matches the shape but isn't a real date). The `dateDetection` prop gives consumers an escape hatch (`'never'` to disable; a custom function for fine control). Plan must specify the exact pattern.
- **Test coverage.** Same as workspace — no test runner wired. Round-trip (even the trivial JSON-only flavor) is the kind of property that benefits from property tests (random tree → serialize → parse → assert equal). Either land Vitest as a STATUS decision before v0.1, or ship v0.1 with extensive demo-driven verification + test-debt note. Lean: raise as a STATUS decision before v0.1 codes.
- **Markdown-adapter creep.** Even though v0.5 is "deferred indefinitely," the temptation to start sketching it early is real. The whole point of dropping markdown was to NOT design the JSON model around markdown's constraints. Plan stage must enforce: no markdown-shaped concessions in v0.1–v0.4 design.

---

## 9. Definition of "done" for THIS document (stage gate)

Before moving to Stage 2 (`rich-card-procomp-plan.md`):

- [x] Sections 1–8 reviewed.
- [x] Q1–Q16 each carry an agreed answer (see §7). Q2, Q7, Q8 diverge from originals; the new answers are the locked ones.
- [x] **Markdown support dropped entirely from rich-card itself.** v0.5 markdown adapter deferred indefinitely as a separate companion. Original markdown framing preserved in Appendix A as historical record.
- [x] In-scope / Out-of-scope phased into v0.1 → v0.4 (and v0.5 deferred). Confirmed deferred to v0.2+: editing, DnD, permissions, undo, validation, multi-select, custom predefined keys, virtualization. Confirmed deferred to v0.5 (separate companion): markdown.
- [x] Framing reset — primary targets are agent-trace tools, config UIs, and structured-content authoring driven by JSON. Specs/runbooks-as-markdown is a secondary case (revisit once v0.5 adapter exists).
- [ ] **User explicitly says "description approved" (or equivalent)** — this unlocks Stage 2 (`rich-card-procomp-plan.md`).

After sign-off, no editing this doc casually — changes after sign-off should be loud and intentional, not silent rewrites.

---

## Appendix A — Original concept brief (verbatim)

This is the user's authored description, preserved unchanged for reference. The structured sections above distill from this source and resolve the gaps via §7's locked decisions.

> **Note on deviation from this brief:** the original brief proposed a dual-format JSON ↔ Markdown contract as "a critical property." After review, markdown support was dropped from rich-card — see the deviation banner at the top of this document and the v0.5 deferred-companion plan in §2. The brief below is preserved verbatim so the original intent is on the record.

> # Rich-Card Component: High-Level Description
>
> ## Core Concept
>
> A recursive, self-nesting card component that represents hierarchical content as visually distinct, interactive containers. Each card is a self-contained unit that can hold its own data and an unlimited number of child cards, which themselves can hold more children — with no depth or breadth limit. The component works as both a **viewer** and a full **editor**, with every capability independently toggleable so developers can ship anything from a read-only display to a fully editable tree.
>
> ## Structural Model
>
> **The card tree:**
> - A single root card sits at the top
> - Each card can contain any number of sibling cards at the next level down
> - Each of those can contain their own children, and so on indefinitely
> - The hierarchy expands both **vertically** (deeper nesting) and **horizontally** (more siblings at any level)
>
> **What lives inside a card:**
> - **Flat fields** — simple key/value data belonging to that specific card (not inherited, not nested)
> - **Child cards** — nested card objects, each with their own fields and children
> - **Meta information** — hidden-by-default data attached to the card (timestamps, authorship, tags, internal IDs, lock flags, etc.) accessed through a dedicated meta key/element, not rendered in the default view
> - **Predefined typed keys** — reserved field names that map to specific rendering behaviors
>
> ## Dual Input Format
>
> The component accepts two interchangeable input formats representing the same logical structure:
>
> **JSON format:**
> - The root JSON object *is* the root card
> - Flat properties on the object become the card's fields
> - Nested objects become child cards
> - Every object carries a consistent identifier key and an order index, so sibling order is deterministic and addressable
>
> **Markdown format:**
> - Header levels define the hierarchy: `#` is the root card, `##` is a first-level child, `###` is a second-level child, and so on
> - Content between headers belongs to the card defined by the preceding header
> - Standard markdown elements within a card map cleanly to the card's internal structure
>
> The component does not care about font choices or visual prettiness inherited from markdown — only the **structural meaning** of headers and elements matters.
>
> ## Predefined Keys (Typed Field Conventions)
>
> A reserved vocabulary of field names with defined cross-format equivalence. The two formats describe the *same* element, just in different syntax.
>
> Example: a `codearea` field in JSON written as `{"format": "py", "content": "..."}` is structurally identical to a fenced code block ` ```py ... ``` ` in markdown. Both produce the same rendered code element inside the card.
>
> This predefined set is part of the component's contract — developers know which keys are "special" and how each one renders, regardless of which input format was used.
>
> ## Intelligent Styling System
>
> Styling is **structurally aware**, not just visually decorative:
>
> - **Per-level styling:** level 1 cards, level 2 cards, level 3 cards, etc., each have their own independently configurable style profile, so the visual hierarchy reinforces the structural hierarchy
> - **Per-predefined-key styling:** each typed key (code areas, meta blocks, etc.) is styled separately from generic fields and from card containers themselves
> - **Smart nesting presentation:** child cards are rendered in a way that makes containment visually obvious without becoming cluttered as depth grows
>
> ## Interaction Features (Developer-Toggleable)
>
> **Collapsibility** — any card can be collapsed to hide its children and content, expanded to reveal them.
>
> **Drag & drop reordering**, with three independently controllable scopes:
> - *Same-level reordering* — moving a card among its siblings
> - *Cross-level movement* — moving a card to a different depth (a level-1 card becomes a level-2 child of another card, etc.)
> - *Global movement* — any card to anywhere in the tree, regardless of original level or parent
>
> Each scope has its own toggle, so a developer can allow same-level reordering while forbidding cross-level moves, or any other combination.
>
> ## CRUD Capabilities (Developer-Toggleable)
>
> ### Add
> - **Add a child card** under any existing card
> - **Add a sibling card** next to an existing one at the same level
> - **Add a flat field** to any card
> - **Add a predefined-key element** using the typed vocabulary, so it stays format-portable
> - **Insertion position** — new cards can be placed at a specific order index, not just appended
>
> ### Edit
> - **Edit field values** in flat fields
> - **Edit field keys** (with protection against colliding with predefined reserved keys)
> - **Edit predefined-key content** — modify inner content of typed elements (e.g., change the code or declared language inside a `codearea`)
> - **Edit meta information** without affecting the visible card
> - **Edit card identity/order** — adjust the order index or identifier
>
> ### Remove
> - **Remove a field** from a card
> - **Remove a predefined-key element**
> - **Remove a card**, with a defined policy for its children: either *cascade* (children are deleted too) or *promote* (children move up under the deleted card's parent). Developer chooses the default and whether users can override per-deletion.
> - **Remove meta entries**
>
> ### Per-Capability Toggles
> Each capability above is independently switchable. Realistic combinations include fully editable, append-only (add allowed, edit/remove off), edit-only (no structural changes), read-only, or any granular mix — e.g., allow editing field values but not renaming keys.
>
> ### Permission Scoping
> Edit permissions can be applied at three scopes:
> - **Per-level rules** — e.g., level-1 cards locked, level-2+ editable
> - **Per-card rules** — individual cards marked locked/unlocked via meta information, overriding level defaults
> - **Per-predefined-key rules** — certain typed elements (like a system-generated meta block) can be non-editable even when the rest of the card is editable
>
> ## Format Round-Tripping
>
> A critical property: any change made through the UI must be **representable in both input formats**. The component can serialize the updated tree back out as either JSON or markdown, and the result must be structurally equivalent to what would have been produced if the user had hand-written that final state from scratch. The editor never produces a state that "only works in JSON" or "only works in markdown" — the structural contract between the two formats is preserved through every edit.
>
> ## Change Events
>
> The component emits structured change events the host application can hook into:
> - *Card added / removed / moved*
> - *Field added / edited / removed*
> - *Meta changed*
> - *Tree reordered*
>
> Each event carries enough information — which card, what changed, old vs. new value, path in the tree — for the host to persist, validate, undo, or sync the change.
>
> ## Companion Editor Features
>
> - **Undo / redo** — a history stack of CRUD operations
> - **Validation hooks** — developer-supplied rules that approve or reject a proposed add/edit/remove before it commits (e.g., "this field must be a number," "this card type can't be nested deeper than 3")
> - **Bulk operations** — duplicate a card with all its children, cut/paste subtrees, multi-select delete
> - **Dirty state tracking** — a flag indicating the tree has unsaved changes since the last load/save
>
> ## Summary of Developer Controls
>
> When integrating this component, a developer specifies:
>
> 1. The input data (JSON or markdown)
> 2. Which predefined keys are in use
> 3. Per-level style configuration
> 4. Per-predefined-key style configuration
> 5. Collapsibility on/off
> 6. Drag & drop scopes — each on/off independently
> 7. CRUD capabilities — add, edit, remove each on/off independently, with per-level / per-card / per-predefined-key permission overrides
> 8. Child-deletion policy (cascade vs. promote) and whether it's user-overridable
> 9. Whether undo/redo, validation hooks, bulk operations, and dirty tracking are active
> 10. Whether meta information is exposed in any UI affordance, and if so, how
> 11. Event handlers for change events
