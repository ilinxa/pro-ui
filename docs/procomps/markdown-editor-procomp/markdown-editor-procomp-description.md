# `markdown-editor` — Pro-component Description

> **Status:** **signed off 2026-04-28.** Stage 2 (`markdown-editor-procomp-plan.md`) authoring may begin.
> **Slug:** `markdown-editor`
> **Category:** `forms`
> **Created:** 2026-04-28
> **Last updated:** 2026-04-28 (signed off; Q1 reversed and Q4 + Q8 refined on re-validation; §6.1 + §5 corrected per [original spec §3.10](../../../graph-visualizer-old.md); all 10 open questions resolved)
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
- **`origin`-agnostic.** The component does NOT inspect node `origin` ([system §4.1](../../systems/graph-system/graph-system-description.md#41-the-origin-field)). The host computes `readOnly` via its permission resolver ([decision #25](../../systems/graph-system/graph-system-description.md)) — typically `origin === "system" && !canAnnotate` resolves to `readOnly = true`. This keeps markdown-editor reusable outside the graph-system entirely.
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
- **Image embeds (`![[image.png]]`).** Per [original spec §3.10](../../../graph-visualizer-old.md), image embeds are NOT parsed in v0.1. The preview renderer treats them as literal text; the editor decoration treats them like any other markdown text. v0.2 may add image-embed support if hosts demand it.
- **GFM task-list interactivity.** Task-list checkboxes (`- [ ] todo`) render as static checkboxes in preview; clicking does NOT toggle the source. Toggling requires write-back to the markdown source — deferred to v0.2.
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
6. **`force-graph` v0.1–v0.4 doc-node preview** (Tier 2, secondary use) — markdown-editor in `view="preview"` + `readOnly={true}` could render the read-only doc body before the v0.5 editor lands. This keeps a single markdown-rendering path across the registry. Plan stage decides whether to lazy-load CM6 (mounting only when `view !== "preview"`) so the v0.1–v0.4 preview path doesn't drag in the full editor weight; the alternative is force-graph shipping a separate lighter preview, which fragments markdown rendering.

markdown-editor has zero graph dependency at the registry level. This is per [system decision #35](../../systems/graph-system/graph-system-description.md): Tier 1 components are independent — none imports another. force-graph and the Tier 3 page would each *consume* markdown-editor without markdown-editor importing them.

---

## 5. Rough API sketch

```ts
import type { Extension } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

interface WikilinkCandidate {
  id: string;
  label: string;         // resolution target; the part BEFORE `|` per original spec §3.10
  kind?: string;
  alias?: string;        // when set, autocomplete inserts [[label|alias]] (display text only;
                         // resolution still uses `label`). Omitting yields plain [[label]].
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

interface MarkdownEditorProps<TCandidate extends WikilinkCandidate = WikilinkCandidate> {
  // Document
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;                          // default false

  // View modes
  view?: ViewMode;                             // controlled
  onViewChange?: (view: ViewMode) => void;
  initialView?: ViewMode;                      // uncontrolled default; default "edit"
  showPreviewToggle?: boolean;                 // default true; if false, view is locked to initialView

  // Wikilinks
  wikilinkCandidates?: ReadonlyArray<TCandidate>;
  onWikilinkClick?: (target: string) => void;  // target = part BEFORE `|`; omitted callback = inert spans
  kinds?: Record<string, KindMeta>;            // kind badges in the autocomplete popup + preview rendering

  // Toolbar
  toolbar?: false | ReadonlyArray<ToolbarItem>;
  // false = hide; array = replace items (default chrome stays). Render-fn escape hatch deferred to v0.2.

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
// Wikilinks resolve to nodes OR groups per [original spec §3.10](../../../graph-visualizer-old.md);
// candidates are heterogeneous, mirroring entity-picker §6.1 linking-mode.
const wikilinkCandidates = useMemo(
  () => [
    ...graph.nodes.map((n) => ({ id: n.id, label: n.label, kind: n.kind ?? "node" })),
    ...graph.groups.map((g) => ({ id: g.id, label: g.name, kind: "group" as const })),
  ],
  [graph.nodes, graph.groups]
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
4. **Wikilink autocomplete UX**: typing `[[` opens the popup, filtering by label substring (case-insensitive); ↑/↓/Enter/Esc work; selection inserts `[[label]]` (or `[[label|alias]]` when `alias` is provided); popup positions correctly near the caret.
5. **Wikilink rendering in preview**: `[[...]]` and `[[Target|alias]]` tokens render as clickable spans; `onWikilinkClick(target)` receives the part before `|`. Unresolved wikilinks (target not matched in `wikilinkCandidates` by case-insensitive + whitespace-trimmed + exact label) render with a distinct "broken link" style. Image embeds (`![[...]]`) render as literal text.
6. **Toolbar slot** accepts both forms — `false` (hidden) and `ToolbarItem[]` (replace items, default chrome stays) — and round-trips a host-built save button (§6.2).
7. **All three view modes** (edit, preview, split) render correctly. Split-view shows editor + preview side-by-side; stacks vertically when the editor's CONTAINER is narrow (container queries, not viewport).
8. **Theming follows globals.css**: switching dark/light updates editor colors without remount; signal-lime accent visible on focus ring; Onest font for prose, JetBrains Mono for code blocks (decision #37).
9. **Bundle weight ≤ 180KB total** (minified + gzipped). [Decision #26](../../systems/graph-system/graph-system-description.md) accepts ~150KB for the CodeMirror 6 substrate; the additional ~30KB headroom covers our theme + wikilink extension + toolbar + preview parser (~14KB `marked` + ~16KB custom). Plan stage adds a per-import bundle audit and locks the budget breakdown.
10. **A11y audit passes**: editor surface has appropriate `role="textbox"` + `aria-multiline="true"`, toolbar buttons carry `aria-label` and `aria-pressed` where relevant, view-mode toggle is a `role="tablist"`, screen-reader announces autocomplete results.
11. **`tsc + lint + build` clean** with no React Compiler warnings. The CM6 lifecycle is wrapped in a single effect with proper cleanup.
12. **Demo at `/components/markdown-editor`** demonstrates: edit / preview / split modes, wikilink autocomplete with kind badges, custom toolbar, hidden toolbar, readOnly mode, save callback, and the imperative handle (focus / insertText buttons).

---

## 8. Resolved questions (locked on sign-off 2026-04-28)

All 10 questions resolved at sign-off. The recommendations below are the locked decisions for v0.1; Stage 2 (plan) builds against these. Q1 was reversed and Q4 + Q8 refined on re-validation. New questions surfacing during plan authoring land in a fresh `## 8.6 New open questions` section as needed.

1. **Toolbar slot shape — locked: `toolbar?: false | ReadonlyArray<ToolbarItem>`.** **Reversed from the original render-fn-inclusive recommendation on re-validation.** Reasoning: no other Tier 1 component takes "false | array | fn" — `properties-form`, `filter-stack`, `entity-picker` all use single render-fn slots, and `detail-panel` uses compound parts. The "all three forms" approach was unprecedented in the registry. The 95% case ("defaults + 1 button") is solved cleanly by `ToolbarItem[]` plus an exported `defaultMarkdownToolbar` constant (§6.2). The 5% case ("fully custom layout") works fine with `toolbar: false` plus rendering externally; `getView()` gives the host CM6 access for shortcut wiring. Render-fn escape hatch is **additive in v0.2** — non-breaking.

2. **Default keymap — locked: fixed set + CM6 defaults; no disable prop.** Cmd+B (bold), Cmd+I (italic), Cmd+E (inline code), Cmd+K (link wrap as `[sel](url)`), Cmd+Shift+. (blockquote) layered on top of CM6's built-in keymap (undo/redo, search, line manipulation). Hosts wanting overrides use the `extensions` slot with `Prec.high(keymap.of([...]))` — clean industrial mechanism. Adding a configurable keymap prop later is additive.

3. **View modes & split-view sizing — locked: 3 modes (`edit` / `preview` / `split`); fixed 50/50 split; stacks vertically on narrow containers; no resizable splitter.** Toggle is controlled (`view` + `onViewChange`) or uncontrolled (`initialView`, default `"edit"`). `showPreviewToggle?: boolean` (default `true`). Hosts wanting resize wrap the editor in `workspace`. Adding `resizable?: boolean` in v0.2 is additive.

4. **Wikilink rendering in preview — locked: clickable spans + `onWikilinkClick(target)`; "broken-link" style for unresolved; image embeds NOT parsed.** Refined on re-validation per [original spec §3.10](../../../graph-visualizer-old.md):
   - `target` passed to `onWikilinkClick` is the part **before** `|` (the resolution target). Alias (after `|`) renders as link text but does NOT affect resolution.
   - "Broken-link" detection uses the same matching rules as reconciliation: case-insensitive + whitespace-trimmed + **exact** label match (NOT substring). This keeps the editor's UX consistent with force-graph v0.5+ save-time reconciliation outcome ([decision #36](../../systems/graph-system/graph-system-description.md)).
   - **Image embeds (`![[image.png]]`) are NOT parsed**; render as literal text (§3 out-of-scope). Matches original spec §3.10.
   - When `onWikilinkClick` is omitted, spans render styled but inert (no click handler). Hosts opt into navigation by supplying the callback.

   A `renderWikilink?: (ctx) => ReactNode` slot is **additive in v0.2** if hosts need richer rendering.

5. **CM6 theming — locked: thin CM6 theme mapping to CSS variables from [globals.css](../../../src/app/globals.css).** Editor surface, cursor, selection, active line, and syntax tokens (heading, link, code, quote, emphasis) all map to `var(--*)`. Dark/light flip via Tailwind's `dark:` class works automatically with no remount because variables resolve at the document level. Plan stage locks the exact mapping table and adds a smoke test for the no-remount flip.

6. **Bundle weight discipline — locked: explicit dependency manifest; no `codemirror` umbrella.** Required deps (subject to plan-stage finalization): `@codemirror/state`, `@codemirror/view`, `@codemirror/commands`, `@codemirror/language`, `@codemirror/lang-markdown`, `@codemirror/autocomplete`, `@codemirror/search`, `@lezer/markdown`, `@lezer/highlight`, plus a markdown preview parser (most likely `marked` for bundle reasons). Forbidden: the `codemirror` umbrella package (~80KB of unused legacy modes). Plan stage adds `size-limit` (or equivalent) and locks the per-import budget breakdown.

7. **Save semantics — locked: Cmd/Ctrl+S explicit only in v0.1; auto-save deferred to v0.2.** `onSave(value)` fires on Cmd+S; browser default suppressed via `preventDefault`. Hosts wanting auto-save TODAY implement it externally via `onChange`. Force-graph v0.5 is fine with explicit save (Obsidian / VS Code precedent); explicit save also matches the "reconciliation runs on save" mental model from decision #36. Adding `autoSave: { debounceMs }` in v0.2 is additive.

8. **`wikilinkCandidates` shape — locked: static array + parameterized typing in v0.1; async resolver deferred.** Refined on re-validation: parameterize the component over `TCandidate extends WikilinkCandidate = WikilinkCandidate`. Mirrors `entity-picker` Q9, `properties-form` Q2, `filter-stack` Q5 locks — same "cheap one-time win, no migration cost" reasoning. `loadCandidates(query) => Promise<...>` deferred to v0.2 (additive; either source can be supplied, with `loadCandidates` taking precedence when both are present). For `force-graph` v0.5, the candidate set is "all nodes + all groups" — derivable from the snapshot, fine for graphs up to ~10k entities (the v0.1 force-graph target).

9. **Imperative handle surface — locked: `focus / undo / redo / insertText / getSelection / getValue / getView`.**
   - `focus()` — focus the CM6 editor surface
   - `undo()` / `redo()` — proxy to CM6 history
   - `insertText(text)` — replace selection if non-empty; insert at caret if empty
   - `getSelection()` → `{ from, to, text }` — caret offsets and selected text
   - `getValue()` — current CM6 doc (may be marginally fresher than the React `value` prop)
   - `getView()` → CM6 `EditorView` — escape hatch for power users

   `getView()` leaks the CM6 abstraction; that's the right tradeoff because [decision #19](../../systems/graph-system/graph-system-description.md) locks CM6 long-term. If substrate ever swaps, removing `getView` is a major-version bump (acknowledged risk).

10. **Markdown flavor — locked: GitHub-Flavored Markdown by default.** CommonMark base + GFM extensions: tables, strikethrough, task lists, autolink. Configured via `@codemirror/lang-markdown`'s GFM option for editor highlighting; preview-mode rendering uses a GFM-capable parser (likely `marked`; plan-stage final). **GFM task list checkboxes are non-interactive in v0.1 preview** — toggling requires write-back to markdown source, deferred to v0.2 (§3 out-of-scope). Wikilink parsing is a separate custom extension layered on top of GFM in BOTH the CM6 highlighter and the preview parser; plan stage locks the symmetric grammar so both sides agree on token boundaries. Other flavors (MyST, Obsidian `==highlight==`, embedded math) are out of v0.1 scope; v0.2 can add via a `flavor` prop or extension.

## 8.5 Plan-stage tightenings (surfaced during description review + re-validation)

These are NOT description-blocking, but plan authoring must address them:

1. **Cmd+K behavior.** Wraps the current selection as `[sel](url)` with the cursor positioned inside the `url` slot. No popup/dialog chrome.
2. **Split-view stacking breakpoint.** Use container queries (Tailwind v4 supports them natively), NOT viewport breakpoints. So a markdown-editor in a 320px sidebar stacks vertically regardless of overall viewport width.
3. **`readOnly={true}` × view-mode interaction.** Spelled out:
   - `readOnly + view="edit"` → CM6 editor in read-only mode (syntax highlighted, non-editable).
   - `readOnly + view="preview"` → standard rendered preview.
   - `readOnly + view="split"` → read-only CM6 + preview side-by-side.
4. **Cmd+S interception scope.** Cmd+S only intercepts when `onSave` is supplied; otherwise browser default save dialog fires unimpeded. Hosts that don't handle save get no surprise behavior.
5. **`onSave` payload freshness.** Receives the current CM6 doc value at the moment of save, not the React `value` prop (may be marginally fresher under React batching).
6. **`getView()` substrate-leak risk.** Document the long-term coupling: if substrate ever swaps (decision #19 locks CM6, but locks aren't immortal), removing `getView` is a major-version bump.
7. **`insertText(text)` selection semantics.** Replaces the current selection if non-empty; inserts at caret if empty. Lock the exact CM6 dispatch transaction.
8. **`setSelection(from, to)` on the handle.** Consider adding for "scroll-and-select-N" use cases (e.g., Tier 3 page jumping to a wikilink target's caret position). Not in v0.1 unless real consumers need it.
9. **Preview parser choice.** `marked` (~14KB minified+gzipped) vs `markdown-it` (~40KB with default plugins). Bundle weight is the tiebreaker; `marked` is the default lean. Plan stage validates that wikilink tokenization + image-embed-as-literal-text post-processing work cleanly with the chosen parser.
10. **CSS-variable theming smoke test.** Confirm dark/light flip updates editor colors without remount — a real risk if CM6 inlines computed styles at theme-registration time (it shouldn't with `var(--*)` references, but verify).
11. **Per-import bundle audit.** `size-limit` or equivalent with explicit weight breakdown: CM6 substrate (~150KB), preview renderer (~14KB `marked`), our theme + wikilink + toolbar (~16KB), total target ≤180KB.
12. **Symmetric wikilink grammar.** Wikilinks are NOT in GFM. The CM6 highlighter and the preview parser BOTH need a wikilink extension producing the same token boundaries. Plan stage locks the regex / grammar definition once, references it from both extensions.
13. **Origin-agnosticism recipe.** The component does NOT inspect `origin`. Host computes `readOnly` via its permission resolver ([decision #25](../../systems/graph-system/graph-system-description.md)) — typically `origin === "system" && !canAnnotate` → `readOnly = true`. Document the recipe in the procomp guide alongside the force-graph integration example.
14. **`getValue()` vs `value` prop guidance.** Plan documents when each is appropriate: `value` for render-time / state ownership; `getValue()` for save handlers / freshest snapshot before persisting.
15. **Wikilink autocomplete debounce.** Local filtering on host-supplied static array — recommendation: no debounce in v0.1 (matches `entity-picker` Q7 lock).
16. **Wikilink autocomplete result limit.** If `wikilinkCandidates` is large (10k entities), the autocomplete popup must virtualize OR cap visible results to (e.g.) 50. Plan stage decides; recommendation lean: cap to 50 with "+ N more" affordance.
17. **CM6 lifecycle in React 19 + React Compiler.** The editor mounts a CM6 `EditorView` in `useEffect` and disposes on unmount. The compiler should leave this alone (effect with cleanup, stable refs). Plan stage validates with the compiler enabled.
18. **Wikilink token grammar.** Plan locks: `[[label]]` and `[[label|alias]]` (Obsidian-compatible). `[[label#anchor]]` deferred. Square-bracket inside the label not supported (no nesting). Consistent across CM6 highlighter, autocomplete trigger, and preview parser.
19. **Reconciliation contract boundary.** Reconciliation logic lives in `force-graph` v0.5+ ([decision #36](../../systems/graph-system/graph-system-description.md)), NOT in markdown-editor. The editor's contract is just "call `onSave(value)` on Cmd+S"; force-graph parses, resolves, and reconciles.
20. **Default toolbar export.** Plan locks the form: `defaultMarkdownToolbar: ReadonlyArray<ToolbarItem>` exported alongside the component, so hosts can spread + extend (§6.2).

---

## 9. Sign-off checklist

- [x] Problem framing correct (§1)
- [x] Scope boundaries defensible (§2 in / §3 out) and consistent with [decision #30](../../systems/graph-system/graph-system-description.md)
- [x] CodeMirror 6 substrate ([decision #19](../../systems/graph-system/graph-system-description.md)) confirmed; no "build from scratch" temptation
- [x] Slot-able toolbar ([decision #20](../../systems/graph-system/graph-system-description.md)) shape (Q1) confirmed — render-fn form dropped from v0.1
- [x] Target consumers complete (force-graph v0.5 primary; detail-panel body slot; force-graph v0.1–v0.4 preview-only secondary; standalone surfaces)
- [x] API sketch covers the three example use cases (§6)
- [x] Wikilink rendering + click contract (Q4) confirmed; alias resolution + image-embed-as-literal-text + matching rules locked
- [x] Markdown flavor (Q10) confirmed (GFM)
- [x] Bundle weight target (~180KB total; decision #26 ~150KB CM6 acceptance) confirmed
- [x] Imperative handle surface (Q9) confirmed
- [x] Success criteria (§7) measurable
- [x] Open questions §8 — all 10 resolved on sign-off (Q1 reversed; Q4 + Q8 refined on re-validation)

**Signed off 2026-04-28.** Stage 2 (`markdown-editor-procomp-plan.md`) authoring may begin. Plan must build against the §8 locked decisions and address the §8.5 plan-stage tightenings, defining the file-by-file structure per the [component-guide.md anatomy](../../component-guide.md#5-anatomy-of-a-component-folder).

With this sign-off, **all five Tier 1 procomp descriptions are locked** (`properties-form`, `detail-panel`, `filter-stack`, `entity-picker`, `markdown-editor`). The `force-graph` (Tier 2) description is now unblocked per the [system §9 authoring order](../../systems/graph-system/graph-system-description.md#L437).
