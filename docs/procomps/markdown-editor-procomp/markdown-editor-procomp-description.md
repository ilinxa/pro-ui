# `markdown-editor` — Pro-component Description

> **Status:** **draft v0.1 — pending validation + sign-off.** Stage 2 (`markdown-editor-procomp-plan.md`) authoring is blocked until this signs off.
> **Slug:** `markdown-editor`
> **Category:** `forms`
> **Created:** 2026-04-28
> **Last updated:** 2026-04-28 (initial draft; 10 open questions surfaced with recommendations)
> **Owner:** ilinxa team
> **Parent system:** [graph-system](../../systems/graph-system/graph-system-description.md) — Tier 1 (generic; no graph dependency at the registry level)

This is Stage 1 of the [procomp gate](../README.md). It answers *should we build this at all, and what shape should it be?* It does NOT specify implementation — that's Stage 2 (`markdown-editor-procomp-plan.md`).

The system-level constraints in [graph-system-description.md §8](../../systems/graph-system/graph-system-description.md) (decisions #19, #20, #25, #26, #30, #35, #36, #37) are inherited as constraints; this doc does not re-litigate them.

---

## 1. Problem

Several surfaces in the system — and in any future docs/notes/composer UI — need a **markdown editor** that goes beyond a plain `<textarea>` but stops well short of a full word-processor:

- **`force-graph` v0.5 doc-node editor** — when a `kind: "doc"` node is selected and the user has edit permission, the detail panel hosts a markdown editor whose content is the doc's body. On save, force-graph reconciles `[[wikilink]]` references against the graph (decision #36).
- **`detail-panel` body slot** for doc-kind entities — same shape, just slotted differently (host responsibility per decision #35).
- **Personal Obsidian-like KG mode** — every node carries a markdown body; the editor IS the primary write surface.
- **Hybrid documenter mode** — system-sourced nodes are read-only on canonical fields, but user-authored markdown annotations are writable; that markdown lives behind this editor.
- **Generic notes / readme / changelog surfaces** in the registry's docs site or any future tool.

The pattern repeats: a focused single-document editor with markdown syntax highlighting, a small toolbar (bold/italic/code/list/link), `[[wikilink]]` autocomplete against a host-supplied candidate list, an Edit / Preview toggle, Cmd+S save, and theming that follows the project's design tokens. Reimplementing this — especially the wikilink-autocomplete piece — is non-trivial: token parsing, popup positioning, keyboard navigation, kind-aware result rendering. Hand-rolling on a `<textarea>` produces a worse UX every time; building on the wrong abstraction (Slate, ProseMirror, Lexical) over-pays in bundle weight and incidental complexity for a markdown-first editor.

In the graph-system specifically, **wikilink autocomplete is the load-bearing feature**: doc nodes link to other entities via `[[Node Label]]` syntax, and force-graph v0.5 reconciles these on save (decision #36). Without a generic markdown-editor that ships native wikilink autocomplete, force-graph would either reimplement it on top of `<textarea>` (poor UX, wikilink popup positioning is fiddly) or pull a heavier editor framework just for this surface. Neither matches the registry pattern of "fully-composed pro-components built on the right primitive."

**A reusable, CodeMirror-6-backed markdown-editor closes this gap.** Decision #19 picks CodeMirror 6 as the substrate (mature, lightweight relative to ProseMirror/Slate, native extension API for the wikilink popup); decision #26 accepts the ~150KB bundle weight as the cost. The editor wraps CM6, ships a default toolbar (decision #20), exposes a `wikilinkCandidates` slot for autocomplete, and provides edit / preview / split modes — strictly the v0.1 scope locked by decision #30.

---

## 2. In scope (v0.1)

Per [decision #30](../../systems/graph-system/graph-system-description.md): v0.1 is **strictly** CodeMirror 6 + standard toolbar + wikilink autocomplete + preview toggle. Slash commands, drag-drop image insertion, and live wikilink hover preview are explicitly v0.2+.

- **CodeMirror 6 substrate** ([decision #19](../../systems/graph-system/graph-system-description.md)). The editor wraps a CM6 instance configured with the markdown language package, the autocomplete extension, the search extension, and a project-specific theme. No "build from scratch" markdown editor.
- **Pure controlled `value` / `onChange`** — host owns the markdown string. Same pattern as `properties-form`, `filter-stack`, `entity-picker`.
- **`readOnly` mode** — when `true`, the editor is non-editable but still renders markdown syntax highlighting (CM6 read-only mode, NOT preview mode). Distinct from preview mode.
- **Preview toggle** — the editor renders three view modes: `"edit"`, `"preview"`, `"split"`. Toggle controlled by host (`view` + `onViewChange`) or uncontrolled (`initialView` + internal state). Preview is rendered markdown HTML; edit is the CM6 instance.
- **Default toolbar** ([decision #20](../../systems/graph-system/graph-system-description.md)) with: bold, italic, code, link, unordered list, ordered list, blockquote, heading-cycle. Each toolbar action wraps/unwraps the current selection or inserts a snippet.
- **Slot-able toolbar** ([decision #20](../../systems/graph-system/graph-system-description.md)). The `toolbar` prop accepts: (a) `false` (hide), (b) `ToolbarItem[]` (replace items, layout chrome stays), (c) render fn (full custom). Default = built-in toolbar.
- **`[[wikilink]]` autocomplete** — when the user types `[[`, an autocomplete popup appears showing entries from the host-supplied `wikilinkCandidates` array, filtered by label substring (case-insensitive). Selection inserts the chosen candidate's `label` (or a host-supplied `linkText`) into the document, surrounded by `[[...]]`. Kind badges render in the popup if candidates carry a `kind` field (mirroring `entity-picker` style — but the underlying widget is CM6's autocomplete, not the entity-picker component, per decision #35).
- **Wikilink rendering in preview** — preview-mode markdown rendering recognizes `[[...]]` tokens and renders them as clickable spans. Click calls `onWikilinkClick(target)`. Unresolved wikilinks (target not in `wikilinkCandidates`) render with a "broken link" affordance.
- **Wikilink decoration in edit mode** — CM6 decoration overlays mark `[[...]]` tokens visually (subtle background or color) so they're distinguishable from prose. No live preview chrome inside the editor; just a decoration.
- **`onSave(value)` callback** triggered by **Cmd/Ctrl+S** explicitly. Host wires this to whatever persistence + reconciliation pipeline they need ([decision #36](../../systems/graph-system/graph-system-description.md): `force-graph` v0.5 wires save to wikilink reconciliation).
- **Standard markdown editing keymap** — Cmd+B (bold), Cmd+I (italic), Cmd+K (link prompt), Cmd+E (code), Cmd+Shift+K (delete line; CM6 default), Cmd+Z / Cmd+Shift+Z (undo/redo, CM6 default).
- **GitHub-Flavored Markdown** — tables, strikethrough, task lists, autolink. CommonMark base + GFM extension via `@codemirror/lang-markdown`'s GFM option.
- **Theming via CSS variables** — a thin CM6 theme maps to the project's tokens from [globals.css](../../../src/app/globals.css) (decision #37). Switching dark/light flips automatically with no remount.
- **Imperative ref handle** — `focus()`, `undo()`, `redo()`, `insertText(text)`, `getSelection()`, `getValue()`, `getView()` (escape hatch returning the underlying CM6 `EditorView`). Plan stage locks exact shape.
- **CM6 extension extension point** — `extensions?: ReadonlyArray<Extension>` for power users to plug in additional CM6 extensions (vim mode, custom keymap, etc.). Host owns the lifetime; the component just merges them into its own extension stack.
- **A11y baseline** — CM6 ships a usable ARIA/keyboard implementation for the editor surface; toolbar buttons carry `aria-label` and `aria-pressed` (when applicable). The view-mode toggle is a `role="tablist"` group.
- **Generic typing for wikilink candidates**: `WikilinkCandidate = { id: string; label: string; kind?: string; linkText?: string }`. Plan stage locks whether this is a strict shape or generic-parameterized like `entity-picker` (Q8).

---

## 3. Out of scope (deferred)

Locked by [decision #30](../../systems/graph-system/graph-system-description.md) for v0.1; revisitable in v0.2+:

- **Slash commands** (`/heading`, `/code`, etc.). Useful pattern but explicitly out of v0.1 per decision #30. v0.2 lands a slash-command extension.
- **Drag-and-drop image / file insertion.** v0.1 has no image affordance. Hosts wanting images use a custom toolbar item that calls `insertText` with the markdown image syntax. v0.2 adds drop-handler hook.
- **Live wikilink hover preview** (hover a `[[link]]` in edit mode → popup with the linked node's summary). Requires the host to resolve the target and supply preview content; non-trivial. Deferred to v0.2 ([decision #30](../../systems/graph-system/graph-system-description.md)).
- **Auto-save / debounced background save.** v0.1 fires `onSave` on Cmd+S only. Hosts wanting auto-save implement it externally: receive `onChange`, debounce, call their own save. v0.2 adds opt-in `autoSave: { debounceMs }`.
- **Async wikilink candidate resolver** (`loadCandidates(query) => Promise<...>`). v0.1 expects a static array. v0.2 ships async — same deferral pattern as `entity-picker` Q (async loading deferred).
- **WYSIWYG / Typora-style inline rendering** — heading sizes, hidden markdown chars, etc. CM6's standard markdown highlighting is the v0.1 visual language. WYSIWYM is v0.2+ if real demand surfaces.
- **Collaborative editing** (CRDT, Yjs, OT). The CM6 ecosystem supports this via `y-codemirror.next`; out of v0.1 scope. The component remains pure-controlled, so external sync layers can be wired by the host.
- **Find/replace UI chrome.** CM6 ships `@codemirror/search`'s built-in panel — we include the extension so Cmd+F works, but we don't decorate it with custom UI. Theming the panel is plan-stage detail.
- **Spell check.** Browsers handle `<contenteditable>` spell check inconsistently; CM6 doesn't ship native spell check. Out of v0.1.
- **Markdown linting / writing-style hints.** Out of scope; consumer concern.
- **Multi-document tabs / sessions.** The component edits ONE document at a time. Multi-doc UIs compose multiple instances at the host level.

---

## 4. Target consumers

In dependency order:

1. **`force-graph` v0.5 doc-node editor** (Tier 2) — the **primary driver**. When a `kind: "doc"` node is selected and `canEdit === true`, force-graph slots a `<MarkdownEditor>` into its detail-panel body. `wikilinkCandidates` are derived from the current graph (all nodes' labels + ids). `onSave` triggers wikilink reconciliation per [decision #36](../../systems/graph-system/graph-system-description.md).
2. **`detail-panel` body slot** for doc-kind entities (Tier 1, but the wiring happens at Tier 3 / host level per decision #35). The host computes `canEdit` from its permission resolver and passes the editor in via `<DetailPanel.Body>`.
3. **Tier 3 graph-system page** — composes the above; supplies `wikilinkCandidates` from the graph snapshot; routes `onWikilinkClick` to focus-and-select the target node.
4. **Standalone notes / wiki surfaces** — any future Tier 3 page or app surface needing markdown authoring with wikilinks (a personal notes app, a developer wiki, the docs site's own README/changelog editor).
5. **Generic markdown editing surfaces** outside the graph system — README editor, changelog editor, post composer. Wikilinks just stay disabled (no `wikilinkCandidates` provided → autocomplete trigger is inert; `[[...]]` tokens still render but no popup appears).

markdown-editor has zero graph dependency at the registry level. This is per [system decision #35](../../systems/graph-system/graph-system-description.md): Tier 1 components are independent — none imports another. force-graph and the Tier 3 page would each *consume* markdown-editor without markdown-editor importing them.

---

## 5. Rough API sketch

```ts
import type { Extension } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

interface WikilinkCandidate {
  id: string;
  label: string;
  kind?: string;
  linkText?: string;     // text inserted between [[ ]]; defaults to label
}

interface KindMeta {
  label: string;
  color?: string;         // CSS variable name or OKLCH value
}

type ViewMode = "edit" | "preview" | "split";

interface ToolbarItem {
  id: string;
  label: string;          // tooltip + aria-label
  icon?: ReactNode;       // optional; defaults provided for built-in items
  shortcut?: string;      // displayed hint, e.g. "⌘B"
  isActive?: (ctx: ToolbarCtx) => boolean;   // for toggle states (bold-on, etc.)
  run: (ctx: ToolbarCtx) => void;
}

interface ToolbarCtx {
  view: EditorView;
  value: string;
  insertText: (text: string) => void;
  wrapSelection: (before: string, after?: string) => void;
  toggleLinePrefix: (prefix: string) => void;
}

interface MarkdownEditorProps {
  // Document
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;                          // default false

  // View modes
  view?: ViewMode;                             // controlled
  onViewChange?: (view: ViewMode) => void;
  initialView?: ViewMode;                      // uncontrolled default; default "edit"
  showPreviewToggle?: boolean;                 // default true; if false, view is locked to "edit" (or readOnly's read view)

  // Wikilinks
  wikilinkCandidates?: ReadonlyArray<WikilinkCandidate>;
  onWikilinkClick?: (target: string) => void;  // fires from preview-mode wikilink span clicks
  kinds?: Record<string, KindMeta>;            // for kind badges in the autocomplete popup + preview rendering

  // Toolbar
  toolbar?: false | ReadonlyArray<ToolbarItem> | ((ctx: ToolbarCtx) => ReactNode);
  // false = hide; array = replace items (default chrome stays); fn = full custom

  // CM6 extension point
  extensions?: ReadonlyArray<Extension>;       // appended to the component's own extension stack

  // Lifecycle
  onSave?: (value: string) => void;            // Cmd/Ctrl+S; force-graph v0.5 wires this to reconciliation

  // A11y / styling
  ariaLabel?: string;
  className?: string;
  placeholder?: string;                        // shown when value is empty
  minHeight?: string | number;                 // default "12rem"
  maxHeight?: string | number;                 // default unset (grows with content)
}

interface MarkdownEditorHandle {
  focus(): void;
  undo(): void;
  redo(): void;
  insertText(text: string): void;
  getSelection(): { from: number; to: number; text: string };
  getValue(): string;
  getView(): EditorView;                        // escape hatch for power consumers
}
```

Built-in toolbar items (default set, in display order): `bold`, `italic`, `code`, `link`, `bullet-list`, `numbered-list`, `blockquote`, `heading`. Each has a documented `id` that hosts can reference when supplying a custom array (e.g., to keep most defaults but add a "save" button — host re-supplies the array; plan-stage decides whether to ship a `defaultToolbar` exported constant or a "spread defaults" affordance).

---

## 6. Example usages

### 6.1 force-graph v0.5 doc-node editor (showcase — graph-system primary driver)

```tsx
const wikilinkCandidates = useMemo(
  () => graph.nodes.map((n) => ({ id: n.id, label: n.label, kind: n.kind })),
  [graph.nodes]
);

<MarkdownEditor
  value={selectedDocNode.body ?? ""}
  onChange={(value) => setDocNodeBody(selectedDocNode.id, value)}
  readOnly={!canEditDocNode(selectedDocNode)}
  wikilinkCandidates={wikilinkCandidates}
  onWikilinkClick={(target) => focusNodeByLabel(target)}
  kinds={{
    doc: { label: "doc", color: "var(--chart-1)" },
    person: { label: "person", color: "var(--chart-2)" },
    concept: { label: "concept", color: "var(--chart-3)" },
  }}
  initialView="edit"
  onSave={(value) => {
    persistDocNodeBody(selectedDocNode.id, value);
    reconcileWikilinks(selectedDocNode.id, value);  // decision #36
  }}
  ariaLabel={`Edit body of ${selectedDocNode.label}`}
/>
```

The showcase case. Wikilink autocomplete fires when the user types `[[`, filtered by node labels, with kind badges. Saving fires reconciliation per decision #36. `readOnly` flips when the user lacks edit permission (system-sourced doc nodes in DB-visualizer mode).

### 6.2 detail-panel body slot for a doc node (host-level composition)

```tsx
<DetailPanel
  state={selectionState}
  selection={selection}
  renderBody={(ctx) => {
    if (!ctx.entity || ctx.entity.kind !== "doc") return null;
    return (
      <MarkdownEditor
        value={ctx.entity.body ?? ""}
        onChange={(value) => ctx.dispatch({ type: "setBody", id: ctx.entity.id, value })}
        readOnly={!ctx.canEdit}
        wikilinkCandidates={ctx.wikilinkCandidates}
        onSave={(value) => ctx.dispatch({ type: "saveDoc", id: ctx.entity.id, value })}
        toolbar={[
          ...defaultMarkdownToolbar,
          {
            id: "save",
            label: "Save",
            shortcut: "⌘S",
            run: (toolbarCtx) => ctx.dispatch({ type: "saveDoc", id: ctx.entity.id, value: toolbarCtx.value }),
          },
        ]}
      />
    );
  }}
/>
```

Demonstrates host-level composition (decision #35: detail-panel does NOT import markdown-editor; the host slots one into the other) and the additive-toolbar pattern.

### 6.3 Standalone README editor (non-graph use)

```tsx
const [readme, setReadme] = useState(initialReadme);

<MarkdownEditor
  value={readme}
  onChange={setReadme}
  initialView="split"
  showPreviewToggle
  onSave={(value) => saveReadmeToDisk(value)}
  placeholder="# Project name\n\nA short description…"
  ariaLabel="README editor"
  toolbar={[
    { id: "bold", label: "Bold", shortcut: "⌘B", run: (c) => c.wrapSelection("**", "**") },
    { id: "italic", label: "Italic", shortcut: "⌘I", run: (c) => c.wrapSelection("*", "*") },
    { id: "code", label: "Code", shortcut: "⌘E", run: (c) => c.wrapSelection("`", "`") },
    { id: "link", label: "Link", shortcut: "⌘K", run: (c) => c.wrapSelection("[", "](url)") },
  ]}
/>
```

No wikilinks (none supplied), reduced toolbar, split-view default. Demonstrates the editor outside the graph system and the toolbar-array slot.

---

## 7. Success criteria

The component is "done" for v0.1 when:

1. **Used by `force-graph` v0.5 doc-node editing flow** (§6.1) with no API additions or workarounds. Wikilink autocomplete fires correctly, kind badges render in the popup, save triggers reconciliation per decision #36.
2. **`detail-panel` body-slot integration tested** (§6.2). The host wires `<MarkdownEditor>` into `<DetailPanel.Body>` cleanly with an additive toolbar item and `canEdit`-driven `readOnly`.
3. **Cmd/Ctrl+S triggers `onSave`** consistently across browsers (Chrome, Firefox, Safari) without conflicting with the browser's native save dialog (`preventDefault` correctly).
4. **Wikilink autocomplete UX**: typing `[[` opens the popup, filtering by label substring; ↑/↓/Enter/Esc work; selection inserts `[[label]]` (or `linkText` if provided); popup positions correctly near the caret.
5. **Wikilink rendering in preview**: `[[...]]` tokens in preview mode render as clickable spans calling `onWikilinkClick`. Unresolved wikilinks (target not in `wikilinkCandidates`) render with a distinct "broken link" style.
6. **Toolbar slot** accepts all three forms — `false` (hidden), array (replace items), render fn (custom chrome) — and round-trips a host-built save button (§6.2).
7. **All three view modes** (edit, preview, split) render correctly. Split-view shows editor + preview side-by-side at desktop widths.
8. **Theming follows globals.css**: switching dark/light updates editor colors without remount; signal-lime accent visible on focus ring; Onest font for prose, JetBrains Mono for code blocks (decision #37).
9. **Bundle weight ≤ 180KB** (minified + gzipped) — decision #26 budgets ~150KB; we permit some headroom for the wikilink extension + theme. Plan stage locks the exact dep manifest.
10. **A11y audit passes**: editor surface has appropriate `role="textbox"` + `aria-multiline="true"`, toolbar buttons carry `aria-label` and `aria-pressed` where relevant, view-mode toggle is a `role="tablist"`, screen-reader announces autocomplete results.
11. **`tsc + lint + build` clean** with no React Compiler warnings. The CM6 lifecycle is wrapped in a single effect with proper cleanup.
12. **Demo at `/components/markdown-editor`** demonstrates: edit / preview / split modes, wikilink autocomplete with kind badges, custom toolbar, hidden toolbar, readOnly mode, save callback, and the imperative handle (focus / insertText buttons).

---

## 8. Open questions (10)

Each question carries a recommendation. Recommendations are subject to validation; locks happen at sign-off and may shift then. Mark high-impact questions explicitly so they get focused review.

| # | Question | Recommendation | Impact |
|---|---|---|---|
| 1 | Toolbar slot shape | `false \| ToolbarItem[] \| (ctx) => ReactNode` | **High** — affects every host that customizes |
| 2 | Default keymap | Fixed set: B/I/code/link/list/blockquote + CM6 defaults; no disable prop | Medium |
| 3 | View modes & split-view sizing | Three modes (edit/preview/split); split is fixed 50/50; stacks vertically <640px; no resizable splitter | Medium |
| 4 | Wikilink rendering in preview | Clickable `<span>`s; `onWikilinkClick(target)`; unresolved wikilinks styled "broken" | **High** — affects host wiring |
| 5 | CM6 theming approach | Thin CM6 theme mapping to CSS variables from globals.css; flips with class | Medium |
| 6 | Bundle weight discipline | Explicit dep manifest (no `codemirror` mega-bundle); plan locks deps + audit | Medium |
| 7 | Save semantics | Cmd/Ctrl+S only in v0.1; auto-save deferred to v0.2 | Medium |
| 8 | `wikilinkCandidates` shape | Static array in v0.1; async resolver deferred to v0.2 | Medium |
| 9 | Imperative handle surface | `focus / undo / redo / insertText / getSelection / getValue / getView` | Medium |
| 10 | Markdown flavor | GFM by default (CommonMark + tables, strikethrough, task lists, autolink) | **High** — affects parser + reconciler |

### 8.1 Toolbar slot shape (Q1, high impact)

**Recommendation:** `toolbar?: false | ReadonlyArray<ToolbarItem> | ((ctx: ToolbarCtx) => ReactNode)`. Default = built-in toolbar.

- `false` → hide chrome entirely (CM6 surface only).
- `ToolbarItem[]` → replace items, layout chrome stays. Hosts spread `defaultMarkdownToolbar` and add their own (§6.2).
- Render fn → full custom chrome; host owns layout, styling, ordering. Receives `ToolbarCtx` with `view`, `value`, `insertText`, `wrapSelection`, `toggleLinePrefix`.

**Trade-off:** A render-fn-only API is more flexible but forces every host to reimplement layout. An array-only API can't express custom dividers / dropdown groups / non-button elements. Both is the entity-picker / properties-form pattern (slot ladder) and produces minimal call-site code for the common case.

**Downstream change cost if revised:** Switching to render-fn-only later is a breaking change; switching from render-fn-only to "both" later is additive. Picking "both" up front is the safer default.

### 8.2 Default keymap (Q2)

**Recommendation:** Ship a fixed default markdown keymap layered ON TOP of CM6's built-in keymap. Keys: Cmd+B (bold), Cmd+I (italic), Cmd+E (code span), Cmd+K (link prompt), Cmd+Shift+. (blockquote). CM6 defaults handle undo/redo (Cmd+Z / Cmd+Shift+Z), search (Cmd+F), line manipulation, etc. No prop to disable individual shortcuts in v0.1; hosts wanting to override use the `extensions` slot with `Prec.high(keymap.of([...]))`.

**Trade-off:** A configurable keymap prop is bikeshed-prone (every host wants slightly different shortcuts). The CM6 `extensions` escape hatch is a clean industrial mechanism for power users.

**Downstream change cost if revised:** Adding a configurable keymap prop later is additive (non-breaking).

### 8.3 View modes & split-view sizing (Q3)

**Recommendation:** Three view modes — `"edit" | "preview" | "split"`. Toggle is controlled (`view` + `onViewChange`) or uncontrolled (`initialView`, defaulting to `"edit"`). `showPreviewToggle?: boolean` (default `true`) toggles the visibility of the mode-switcher chrome. Split-view is a **fixed 50/50** in v0.1; stacks editor-on-top + preview-below at viewport widths under 640px. **No resizable splitter** in v0.1 — hosts wanting resize wrap the editor in `workspace`.

**Trade-off:** A resizable splitter would be nicer UX but adds drag-handle complexity, persistence, and a non-trivial test surface. The `workspace` component already exists for resizable layouts; users who need it compose. Fixed 50/50 covers the common case.

**Downstream change cost if revised:** Adding a `resizable?: boolean` prop in v0.2 is additive. Hosts that wrap in `workspace` today won't break.

### 8.4 Wikilink rendering in preview (Q4, high impact)

**Recommendation:** Preview-mode renderer recognizes `[[token]]` and renders as `<span class="wikilink">` (or `wikilink--unresolved` when `token` doesn't resolve to any candidate by label). Click fires `onWikilinkClick(target: string)` with the bracketed label. Unresolved wikilinks remain clickable (host can use the click to trigger creation), just visually distinct.

Alternative considered: render as plain `<a href="#">` — rejected because the URL semantics don't match (wikilinks aren't URLs, they're entity references; the host resolves the meaning).

**Trade-off:** A `renderWikilink` slot would be ultra-flexible but invites every host to reimplement; a fixed rendering with `onWikilinkClick` covers ≥95% of cases. v0.2 can add `renderWikilink?: (ctx) => ReactNode` if real demand surfaces.

**Downstream change cost if revised:** Adding `renderWikilink` later is additive. Removing it later would break consumers.

### 8.5 CM6 theming approach (Q5)

**Recommendation:** A thin CM6 theme that maps CM6 token classes to CSS variables from [globals.css](../../../src/app/globals.css). Specifically:

- `.cm-editor` → `var(--background)` background, `var(--foreground)` text
- `.cm-content` → `font-family: var(--font-sans)`
- `.cm-content` (code blocks / inline code) → `font-family: var(--font-mono)`
- `.cm-cursor` → `var(--foreground)`
- `.cm-selectionBackground` → `var(--accent)` with reduced alpha
- `.cm-activeLine` → `var(--muted)` background
- syntax tokens (heading, link, code, quote, emphasis) → mapped to `var(--chart-1..5)` and weight/style adjustments

This means dark/light theme switching via Tailwind's `dark:` class flips the editor automatically with no remount.

**Trade-off:** CM6's theme API uses inline styles (high specificity) — fighting it with Tailwind classes is fragile. Mapping at the CM6 theme layer (which IS the recommended approach) keeps the design tokens flowing through cleanly.

**Downstream change cost if revised:** Theme rewrites are local to one file; non-breaking for consumers.

### 8.6 Bundle weight discipline (Q6)

**Recommendation:** Lock an explicit dependency list at plan stage. Likely:

- `@codemirror/state`
- `@codemirror/view`
- `@codemirror/commands`
- `@codemirror/language`
- `@codemirror/lang-markdown`
- `@codemirror/autocomplete`
- `@codemirror/search`
- `@lezer/markdown` (and `@lezer/highlight` for syntax classes)

**Forbidden**: the `codemirror` umbrella package (drags in unused legacy modes). Plan stage adds a bundle-size check (e.g., `size-limit` or manual `pnpm build --analyze`) with the 180KB target from §7. Decision #26 caps acceptance at ~150KB; the 30KB headroom is for the wikilink extension + theme + toolbar.

**Trade-off:** The umbrella package is convenient but pulls in ~80KB of unused content. The explicit list is more verbose but auditable.

**Downstream change cost if revised:** Adding/removing CM6 packages is a plan-level concern; consumers don't care.

### 8.7 Save semantics (Q7)

**Recommendation:** Cmd/Ctrl+S explicit only in v0.1. Fires `onSave(value)` with the current document. Browser default (`preventDefault`) suppressed. Auto-save / debounced background save deferred to v0.2 (`autoSave?: { debounceMs: number }`).

Hosts wanting auto-save TODAY implement it externally:

```tsx
<MarkdownEditor
  value={value}
  onChange={(v) => { setValue(v); scheduleAutoSave(v); }}
  onSave={save}
/>
```

**Trade-off:** Auto-save is a feature consumers will want; deferring asks force-graph v0.5 to either run with explicit-save UX or implement auto-save host-side. Force-graph v0.5 is fine with explicit save (Obsidian / VS Code precedent); explicit save also matches the "reconciliation runs on save" mental model from decision #36.

**Downstream change cost if revised:** Adding `autoSave` in v0.2 is additive (non-breaking). Consumers using explicit save continue working.

### 8.8 `wikilinkCandidates` shape (Q8)

**Recommendation:** Static array in v0.1: `wikilinkCandidates?: ReadonlyArray<WikilinkCandidate>`. Async resolver (`loadCandidates(query) => Promise<...>`) deferred to v0.2.

For force-graph v0.5, the candidate set is "all node labels" — derivable from the snapshot in O(N), fine for graphs up to ~10k nodes (the v0.1 force-graph target). Larger graphs and async-fetch surfaces wait for v0.2.

**Trade-off:** Async resolver is more flexible but introduces loading states, race conditions, and a more complex testing surface. Same deferral pattern as `entity-picker` async loading (Q3 of that procomp).

**Downstream change cost if revised:** Adding `loadCandidates` in v0.2 is additive (non-breaking; either can be supplied, with `loadCandidates` taking precedence when both are present).

### 8.9 Imperative handle surface (Q9)

**Recommendation:** `MarkdownEditorHandle` exposes:

- `focus()` — focus the CM6 editor surface
- `undo()` / `redo()` — proxy to CM6 history
- `insertText(text)` — insert at current selection / caret
- `getSelection()` → `{ from, to, text }` — caret offsets and selected text
- `getValue()` — current document (same as `value` prop, but useful when consumer doesn't memoize)
- `getView()` → CM6 `EditorView` — escape hatch for power users (custom commands, dispatch direct transactions)

**Trade-off:** Exposing `getView()` leaks the CM6 abstraction; consumers can do anything (including dangerous things like swapping extensions at runtime). It's the right escape hatch — without it, consumers needing CM6-specific behavior either fork the component or lobby for new prop surfaces.

**Downstream change cost if revised:** Adding handle methods is additive. Removing `getView` later would break power consumers — but we're confident in keeping it long-term (CM6 is the substrate per decision #19).

### 8.10 Markdown flavor (Q10, high impact)

**Recommendation:** Ship **GitHub-Flavored Markdown** by default — CommonMark base + GFM extensions: tables, strikethrough, task lists, autolink. Configured via `@codemirror/lang-markdown`'s GFM option for editor highlighting; preview-mode rendering uses a GFM-capable parser (likely `marked` or `markdown-it` with the GFM plugin — final pick locked at plan stage based on bundle and security audit).

**Trade-off:** Pure CommonMark is simpler but "no tables" feels archaic in 2026; users will assume tables work. GFM is the de facto industry expectation. Other flavors (MyST, Obsidian-flavored markdown with `==highlight==`, embedded math) are out of scope for v0.1; v0.2 can add via a `flavor` prop or extension.

**Downstream change cost if revised:** Switching from GFM to pure CommonMark later is breaking (tables would stop rendering). Sticking with GFM up front is the safer default.

### 8.11 Cross-cutting concerns surfaced by the questions above

These aren't open questions per se but are downstream consequences worth noting for the plan stage:

- **Wikilink token grammar.** Q4 + Q10 + Q1 all touch on it. Plan stage locks: `[[label]]` and `[[label|alias]]` (Obsidian-compatible). `[[label#anchor]]` deferred. Square-bracket inside the label not supported (no nesting).
- **Reconciliation contract.** Decision #36 says force-graph v0.5 reconciles on save. The markdown editor's contract is just "call `onSave` on Cmd+S"; reconciliation logic lives in force-graph. This doc does NOT specify the reconciliation algorithm.
- **CM6 lifecycle in React 19 + React Compiler.** The editor mounts a CM6 `EditorView` in `useEffect` and disposes on unmount. The compiler should leave this alone (effect with cleanup, stable refs). Plan stage validates with the compiler enabled.

---

## 9. Sign-off checklist

Each item must be checked before this doc is considered signed off and Stage 2 (`markdown-editor-procomp-plan.md`) authoring may begin.

- [ ] Problem framing correct (§1)
- [ ] Scope boundaries defensible (§2 in / §3 out) and consistent with [decision #30](../../systems/graph-system/graph-system-description.md)
- [ ] CodeMirror 6 substrate ([decision #19](../../systems/graph-system/graph-system-description.md)) confirmed; no "build from scratch" temptation
- [ ] Slot-able toolbar ([decision #20](../../systems/graph-system/graph-system-description.md)) shape (Q1) confirmed
- [ ] Target consumers complete (force-graph v0.5 primary; detail-panel body slot; standalone surfaces)
- [ ] API sketch covers the three example use cases (§6)
- [ ] Wikilink rendering + click contract (Q4) confirmed
- [ ] Markdown flavor (Q10) confirmed
- [ ] Bundle weight target (~180KB ceiling, decision #26 ~150KB acceptance) confirmed
- [ ] Imperative handle surface (Q9) confirmed
- [ ] Success criteria (§7) measurable
- [ ] Open questions §8 — all 10 resolved on sign-off

**On sign-off**, this header's status flips to "signed off YYYY-MM-DD"; §8 reformats to "Resolved questions (locked on sign-off YYYY-MM-DD)" with each Q rewritten as **Locked: X.** + reasoning; a `## 8.5 Plan-stage tightenings` section captures issues caught during review that the plan must address; and the §9 sub-doc map in [graph-system-description.md](../../systems/graph-system/graph-system-description.md#L425) is updated to point at this signed-off doc.

After this signs off, **all five Tier 1 procomp descriptions are locked** and the `force-graph` (Tier 2) description is unblocked per the [system §9 authoring order](../../systems/graph-system/graph-system-description.md#L437).
