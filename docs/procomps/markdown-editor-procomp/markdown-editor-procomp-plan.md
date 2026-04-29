# `markdown-editor` — v0.1 Plan (Stage 2)

> **Status:** **DRAFT 2026-04-29.** Pending user validate pass per project cadence (draft → validate → re-validate → sign off → commit). Recommendations below convert to `**Locked: X.**` form on sign-off.
> **Slug:** `markdown-editor` · **Category:** `forms` · **Tier:** 1 (generic; no graph dependency at the registry level)
> **Parent description:** [markdown-editor-procomp-description.md](markdown-editor-procomp-description.md) (signed off 2026-04-28)
> **Parent system:** [graph-system](../../systems/graph-system/graph-system-description.md) — Tier 1 (independent at the registry level per [decision #35](../../systems/graph-system/graph-system-description.md))
> **Sibling completion:** unblocks the [`force-graph` v0.5 plan-lock](../force-graph-procomp/force-graph-procomp-description.md) (doc nodes + wikilink reconciliation phase; 2w focused). Tier 1 plan-lock cascade after this: **5 of 5 done** (`properties-form`, `detail-panel`, `filter-stack`, `entity-picker` all signed off 2026-04-29). With this sign-off, **the system Stage 2 plan (`graph-system-plan.md`) becomes authorable** ([system §9](../../systems/graph-system/graph-system-description.md#9-sub-document-map)).

---

## 1. Inherited inputs (one paragraph)

Builds against [markdown-editor description §8 locked decisions](markdown-editor-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28) (10 questions; Q1 reversed, Q4 + Q8 refined on review) and [§8.5 plan-stage tightenings](markdown-editor-procomp-description.md#85-plan-stage-tightenings-surfaced-during-description-review--re-validation) — **20 surfaced** (the largest §8.5 set across all Tier 1 plans, reflecting the substrate complexity). Inherits system constraints: [decision #19](../../systems/graph-system/graph-system-description.md) (CodeMirror 6 substrate; no build-from-scratch), [#20](../../systems/graph-system/graph-system-description.md) (slot-able toolbar), [#25](../../systems/graph-system/graph-system-description.md) (per-component permission resolver — N/A; markdown-editor is origin-agnostic per §8.5 #13), [#26](../../systems/graph-system/graph-system-description.md) (~150KB CM6 bundle accepted), [#30](../../systems/graph-system/graph-system-description.md) (strict v0.1 scope: CM6 + standard toolbar + wikilink autocomplete + preview toggle), [#35](../../systems/graph-system/graph-system-description.md) (Tier 1 independence — markdown-editor imports no other Tier 1 component; `detail-panel` body-slot integration is host-side composition), [#36](../../systems/graph-system/graph-system-description.md) (wikilink reconciliation lives in `force-graph` v0.5+, NOT in markdown-editor; the editor's contract is `onSave(value)` only), [#37](../../systems/graph-system/graph-system-description.md) (design-system mandate). Pattern parity: mirrors [`entity-picker` plan §3.2](../entity-picker-procomp/entity-picker-procomp-plan.md#32-component-props-discriminated-by-mode-consumed-via-overloads--q-p1) generic-typing posture (`<MarkdownEditor<TCandidate extends WikilinkCandidate>>`); mirrors [`filter-stack` plan §10.1.1](../filter-stack-procomp/filter-stack-procomp-plan.md#1011-categories-reference-stability-host-responsibility) reference-stability footgun (`wikilinkCandidates` here); mirrors all Tier 1 siblings on size-limit posture and React 19 ref-as-prop pattern.

---

## 2. v0.1 scope summary

The deliverable is a single Tier 1 pro-component at `src/registry/components/forms/markdown-editor/`. **Heaviest pro-component by bundle weight** (~180KB ceiling per description success #9; ~150KB is CM6 substrate per decision #26). Surface area:

- **CodeMirror 6 substrate** (decision #19) — `@codemirror/state` + `@codemirror/view` + `@codemirror/commands` + `@codemirror/language` + `@codemirror/lang-markdown` (with GFM option) + `@codemirror/autocomplete` + `@codemirror/search` + `@lezer/markdown` + `@lezer/highlight`. NPM peer-installed; no `codemirror` umbrella package (forbidden per Q6 lock — drags in unused legacy modes).
- **Pure controlled `value` / `onChange`** — host owns the markdown string. CM6 internal value synced via dispatch on prop changes per Q-P9 lock (avoids onChange echo).
- **`readOnly` mode** — CM6 read-only mode (NOT preview-only); syntax highlighting still active.
- **Origin-agnostic** (description §8.5 #13) — component does NOT inspect `origin`; host computes `readOnly` via permission resolver and passes it.
- **Three view modes** — `"edit"` / `"preview"` / `"split"`; controlled (`view` + `onViewChange`) or uncontrolled (`initialView`, default `"edit"`); fixed 50/50 split; container-query stacking on narrow containers (description Q3 + §8.5 #2).
- **Default toolbar** (decision #20) — 8 built-in items: bold, italic, code, link, bullet-list, numbered-list, blockquote, heading-cycle.
- **Slot-able toolbar** (Q1 lock; reversed on description re-validation) — `toolbar?: false | ReadonlyArray<ToolbarItem>`. Render-fn form deferred to v0.2 per description Q1.
- **`defaultMarkdownToolbar` exported constant** (description §8.5 #20) — hosts spread + extend per §6.2 of description.
- **`[[wikilink]]` autocomplete** — typing `[[` opens CM6 autocomplete with host-supplied `wikilinkCandidates`; case-insensitive label substring match (no debounce per description Q3 lock + §8.5 #15); kind badges in popup; result limit cap of 50 with "+ N more" affordance per Q-P3.
- **Wikilink decoration in edit mode** — CM6 `MatchDecorator` + `ViewPlugin` overlays `[[...]]` tokens (subtle background per Q-P5 lock).
- **Wikilink rendering in preview** — clickable spans; `onWikilinkClick(target)` passes the part BEFORE `|` (description Q4 lock); broken-link style for unresolved (case-insensitive + whitespace-trimmed + exact label match per description Q4); image embeds (`![[...]]`) NOT parsed (literal text per description §3 + Q4).
- **Symmetric wikilink grammar** (description §8.5 #12) — single canonical regex/grammar in `lib/wikilink-grammar.ts`; CM6 `MatchDecorator` + autocomplete trigger + preview parser ALL reference it. Q-P2 lock.
- **GitHub-Flavored Markdown** (description Q10) — tables, strikethrough, task lists (non-interactive in preview; v0.2 adds toggle), autolink. CM6 highlighter via `@codemirror/lang-markdown` GFM option; preview parser via `marked` (Q-P1 lock).
- **`onSave(value)` on Cmd/Ctrl+S** (description Q7) — `preventDefault` only when `onSave` supplied (description §8.5 #4). Payload is current CM6 doc, NOT React `value` prop (description §8.5 #5).
- **Standard markdown keymap** (description Q2) — Cmd+B/I/E/K layered atop CM6 defaults. Cmd+K wraps as `[sel](url)` with cursor in url slot (§8.5 #1).
- **Theming via CSS variables** (description Q5) — thin CM6 theme maps editor surface, cursor, selection, syntax tokens to `var(--*)` from globals.css. Dark/light flip with no remount.
- **`extensions` prop merge precedence** (Q-P8 lock) — user extensions appended AFTER our stack so they win conflicts; users can `Prec.high(...)` to escalate further.
- **Imperative ref handle** (description Q9) — `focus()`, `undo()`, `redo()`, `insertText(text)`, `getSelection()`, `getValue()`, `getView()` (escape hatch returning the underlying CM6 `EditorView`; substrate-leak risk acknowledged per §8.5 #6 + decision #19).
- **React 19 ref-as-prop** — same pattern as Tier 1 siblings (Q-P10).
- **Generic typing** — `<MarkdownEditor<TCandidate extends WikilinkCandidate>>` per description Q8 + §3.1.
- **A11y contract** — CM6 ships usable ARIA/keyboard for the editor surface; toolbar buttons have `aria-label` + `aria-pressed`; view-mode toggle is `role="tablist"` (shadcn `Tabs`).
- **Bundle ≤ 180KB total** (description success #9); CM6 substrate ~150KB + `marked` ~14KB + our code ~16KB.

**Doesn't ship in v0.1** (per description §3 + decision #30): slash commands, drag-drop image insertion, image-embed parsing, GFM task-list interactivity, live wikilink hover preview, auto-save, async wikilink candidate resolver, WYSIWYG inline rendering, collaborative editing, custom find/replace UI, spell check, lint, multi-document tabs. All v0.2+ are designed as additive — none change the v0.1 API.

**Implementation budget:** ~3 weeks focused (per system §10.2). Heaviest of the 5 Tier 1 components.

---

## 3. Final v0.1 API (recommended)

Builds out [description §5](markdown-editor-procomp-description.md#5-rough-api-sketch) into final shapes.

### 3.1 Wikilink + kind + view + toolbar shapes

```ts
import type { Extension } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

interface WikilinkCandidate {
  id: string;
  label: string;                                                     // resolution target; the part BEFORE `|` per spec §3.10
  kind?: string;
  alias?: string;                                                    // when set, autocomplete inserts [[label|alias]]
}

interface KindMeta {
  label: string;
  color?: string;                                                    // CSS variable name or OKLCH literal
}

type ViewMode = "edit" | "preview" | "split";

interface ToolbarCtx {
  view: EditorView;
  value: string;
  insertText: (text: string) => void;
  wrapSelection: (before: string, after?: string) => void;
  toggleLinePrefix: (prefix: string) => void;
}

interface ToolbarItem {
  id: string;
  label: string;                                                     // tooltip + aria-label
  icon?: ReactNode;                                                  // optional; defaults provided for built-in items
  shortcut?: string;                                                 // displayed hint, e.g. "⌘B"
  isActive?: (ctx: ToolbarCtx) => boolean;                           // for toggle states (bold-on, etc.)
  run: (ctx: ToolbarCtx) => void;
}
```

### 3.2 Component props

```ts
interface MarkdownEditorProps<TCandidate extends WikilinkCandidate = WikilinkCandidate> {
  // Document
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;                                                // default false

  // View modes (controlled or uncontrolled per Q-P9 lock pattern)
  view?: ViewMode;                                                   // controlled
  onViewChange?: (view: ViewMode) => void;
  initialView?: ViewMode;                                            // uncontrolled default; default "edit"
  showPreviewToggle?: boolean;                                       // default true; if false, view is locked to initialView

  // Wikilinks
  wikilinkCandidates?: ReadonlyArray<TCandidate>;
  onWikilinkClick?: (target: string) => void;                        // target = part BEFORE `|`; omitted = inert spans
  kinds?: Record<string, KindMeta>;                                  // kind badges in popup + preview rendering

  // Toolbar (Q1 lock)
  toolbar?: false | ReadonlyArray<ToolbarItem>;                      // false = hide; array = replace items

  // CM6 extension point (Q-P8)
  extensions?: ReadonlyArray<Extension>;                             // appended LAST; user extensions win conflicts

  // Lifecycle
  onSave?: (value: string) => void;                                  // Cmd/Ctrl+S; force-graph v0.5 wires reconciliation

  // A11y / styling
  ariaLabel?: string;
  className?: string;
  placeholder?: string;
  minHeight?: string | number;                                       // default "12rem"
  maxHeight?: string | number;                                       // default unset (grows with content)
}
```

### 3.3 Imperative ref handle

```ts
interface MarkdownEditorHandle {
  focus(): void;                                                     // focus the CM6 editor surface
  undo(): void;                                                      // proxy to CM6 history
  redo(): void;                                                      // proxy to CM6 history
  insertText(text: string): void;                                    // replace selection if non-empty; insert at caret if empty
  getSelection(): { from: number; to: number; text: string };
  getValue(): string;                                                // current CM6 doc — may be marginally fresher than React `value`
  getView(): EditorView;                                             // escape hatch (substrate-leak risk per §8.5 #6 + decision #19)
}
```

### 3.4 What's NOT on the API

- No `loadCandidates(query)` — async resolver is v0.2 per description §3.
- No `autoSave: { debounceMs }` — explicit save only in v0.1 per description Q7.
- No `flavor: "commonmark" | "gfm" | "myst"` — GFM hardcoded per description Q10.
- No `setSelection(from, to)` on the handle — deferred per §8.5 #8 unless real consumers need it.
- No render-fn `toolbar` form — additive in v0.2 per description Q1.
- No `resizable: boolean` for split-view — use `workspace` per description Q3.

---

## 4. State model

CM6 is the source of truth for the document; React `value` mirrors via dispatch. View-mode is controlled-or-uncontrolled per Tier 1 sibling pattern. Toolbar state (which buttons are active) is derived from CM6 selection state per render — no separate state cache.

### 4.1 Internal state shape

```ts
interface MarkdownEditorInternalState {
  // CM6's EditorView is created in useEffect; held in a ref (NOT React state) since
  // we don't re-render on view internals — only on prop changes that force dispatch.
  viewRef: React.MutableRefObject<EditorView | null>;

  // Used only when view mode is uncontrolled (view prop omitted)
  internalView: ViewMode;                                            // initialized from initialView ?? "edit"

  // Tracks last-known external value to detect prop-driven sync points (Q-P9)
  lastSyncedValueRef: React.MutableRefObject<string>;
}
```

`viewRef` is a ref, not state — CM6 owns its own internal state machine; we treat the EditorView as opaque. We re-render only when our React-owned state changes (`internalView` for uncontrolled view-mode, or props change).

### 4.2 CM6 lifecycle (Q-P9)

```
Mount:
  1. Build extension stack (theme + lang-markdown + GFM + wikilink + autocomplete + search + keymap + user extensions)
  2. Create EditorState.create({ doc: value, extensions })
  3. Create EditorView({ state, parent: editorPaneNode })
  4. Attach updateListener that dispatches onChange(view.state.doc.toString()) when doc changes (skip when programmatic sync; Q-P9 echo guard)
  5. Store EditorView in viewRef; lastSyncedValueRef.current = value
Update (props change):
  - If `value !== lastSyncedValueRef.current && value !== view.state.doc.toString()`:
      dispatch a transaction replacing the doc with `value`; set `__syncing` annotation to suppress onChange echo
  - If `readOnly` changed: dispatch an EditorState.readOnly.of() reconfigure
  - If `extensions` reference changed: full extension reconfigure via Compartment.reconfigure()
  - If `value` matches lastSyncedValueRef OR matches doc: no dispatch
Unmount:
  - view.destroy() — cleans up DOM + listeners
```

The **echo guard** (Q-P9 lock) prevents an `onChange` dispatch from React → host's setState → React re-render with new `value` prop → our update effect → CM6 dispatch → CM6 updateListener → `onChange` fires AGAIN. The guard:

1. CM6 transactions carry an `Annotation` (we define `Sync` annotation).
2. When dispatching from our update effect, set `Sync.of(true)` on the transaction.
3. The updateListener checks `update.transactions.some(t => t.annotation(Sync))` and skips `onChange` if true.

This is a standard CM6 pattern. The alternative (compare `value === view.state.doc.toString()` before dispatching) misses the case where the host's reducer transformed the value (e.g., trim trailing whitespace) — we'd dispatch, which would be redundant but not echoing.

`lastSyncedValueRef` lets us skip the comparison entirely for the common "value didn't change" case.

### 4.3 View-mode dispatch

```ts
const isControlled = props.view !== undefined;
const viewValue = isControlled ? props.view : internalView;

const handleViewChange = useCallback((next: ViewMode) => {
  if (isControlled) {
    props.onViewChange?.(next);
  } else {
    setInternalView(next);
    props.onViewChange?.(next);   // fire even in uncontrolled if host supplied callback
  }
}, [isControlled, props.onViewChange]);
```

Standard controlled-with-uncontrolled-fallback (mirrors entity-picker Q-P9 + detail-panel Q-P1). Locked at `useViewMode()` hook in `hooks/use-view-mode.ts`.

### 4.4 Toolbar active-state derivation

Toolbar items can declare `isActive?: (ctx: ToolbarCtx) => boolean`. Re-evaluated on every CM6 state change — but since CM6 changes are frequent (every keystroke), a naive impl re-renders the toolbar on every keystroke.

**Pattern:** `<Toolbar>` subscribes to CM6's selection-change events via `EditorView.updateListener` (filtered to `update.selectionSet || update.docChanged`); only re-renders when CM6 fires a relevant update. Implementation: `useSyncExternalStore` keyed on a CM6-update-counter ref. ~30 LOC; cleaner than `useEffect` with manual deps.

This avoids React Compiler concerns since `useSyncExternalStore` is the canonical pattern for external mutable sources.

### 4.5 Preview rendering (Q-P7)

Preview pane parses `value` to HTML via `marked` (Q-P1 lock). **Re-render strategy: parse on every value change, memoized via `useMemo`** keyed on `value`. No internal debounce — `marked` is fast (~5ms for typical docs, ~50ms for 50KB docs); React Compiler handles the memoization automatically; v0.2 adds opt-in debounce if real consumers report jank.

```tsx
const html = useMemo(() => parseMarkdown(value, { wikilinkCandidates, kinds }), [value, wikilinkCandidates, kinds]);
```

Wikilink resolution (clickable spans + broken-link detection) happens INSIDE `parseMarkdown` via a custom `marked` extension (Q-P5 + Q-P2 lock). The output is HTML-string-with-data-attributes; `<PreviewPane>` injects via `dangerouslySetInnerHTML` and attaches click handlers via event delegation per §6.6.

---

## 5. CM6 integration

### 5.1 Extension stack composition

The full extension stack assembled in `markdown-editor.tsx`:

```ts
const extensions: Extension[] = [
  // Layout + UX
  EditorView.lineWrapping,
  EditorState.tabSize.of(2),
  highlightActiveLine(),
  highlightSelectionMatches(),

  // Language + syntax
  markdown({ codeLanguages: languages, addKeymap: true, base: markdownLanguage, extensions: [GFM] }),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),

  // History + commands
  history(),

  // Search
  search({ top: true }),

  // Autocomplete (CM6's autocomplete extension; wikilink source plugged in)
  autocompletion({ override: [wikilinkCompletionSource(wikilinkCandidates, kinds)] }),

  // Wikilink decoration (Q-P5: ViewPlugin + MatchDecorator)
  wikilinkDecorationPlugin(wikilinkCandidates),

  // Theme (Q5 lock: CSS variables; lib/extensions/theme.ts)
  markdownEditorTheme,

  // Keymaps — order matters (most-specific first; each item's "run" returns true to stop further keymaps)
  keymap.of([
    ...saveKeymap(onSaveRef),                          // Cmd+S → onSave (Q-P9 echo guard not needed here)
    ...markdownKeymap(onSaveRef),                      // Cmd+B/I/E/K
    ...defaultKeymap,                                  // CM6 defaults (cursor moves, undo, redo, etc.)
    ...historyKeymap,
    ...searchKeymap,
    ...closeBracketsKeymap,
    indentWithTab,
  ]),

  // Read-only compartment (reconfigured on readOnly prop change)
  readOnlyCompartment.of(EditorState.readOnly.of(props.readOnly ?? false)),

  // Echo-guard annotation listener (Q-P9)
  EditorView.updateListener.of((update) => {
    if (update.docChanged && !update.transactions.some(t => t.annotation(SyncAnnotation))) {
      onChangeRef.current(update.state.doc.toString());
    }
  }),

  // User extensions (Q-P8 lock — appended LAST so user extensions win conflicts)
  ...(props.extensions ?? []),
];
```

`onSaveRef` and `onChangeRef` are stable refs holding the latest callbacks (avoids reconfiguration on every render). `readOnlyCompartment` is a CM6 `Compartment` that lets us reconfigure read-only without a full extension rebuild.

### 5.2 Value-prop sync (Q-P9)

Per §4.2, the CM6 lifecycle effect handles three update types:

```ts
useEffect(() => {
  const view = viewRef.current;
  if (!view) return;

  // 1. Value sync
  if (value !== lastSyncedValueRef.current && value !== view.state.doc.toString()) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
      annotations: SyncAnnotation.of(true),
    });
  }
  lastSyncedValueRef.current = value;
}, [value]);

useEffect(() => {
  const view = viewRef.current;
  if (!view) return;

  // 2. ReadOnly sync
  view.dispatch({
    effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly ?? false)),
  });
}, [readOnly]);

useEffect(() => {
  const view = viewRef.current;
  if (!view) return;

  // 3. Extensions sync (full reconfigure on reference change)
  view.dispatch({ effects: userExtensionsCompartment.reconfigure(props.extensions ?? []) });
}, [props.extensions]);
```

Three separate effects keyed on the relevant prop. Compartments isolate the parts that need reconfiguration without rebuilding the full extension stack.

### 5.3 Save keymap (description §8.5 #4)

`saveKeymap(onSaveRef)` returns a CM6 keymap entry that fires `onSave(view.state.doc.toString())` on Cmd/Ctrl+S **only when `onSave` is supplied**:

```ts
function saveKeymap(onSaveRef: RefObject<((value: string) => void) | undefined>): KeyBinding[] {
  return [{
    key: "Mod-s",
    preventDefault: false,                                            // we set preventDefault MANUALLY only when onSave handles it
    run: (view) => {
      const onSave = onSaveRef.current;
      if (!onSave) return false;                                      // let browser default save fire
      onSave(view.state.doc.toString());
      return true;                                                    // mark handled; CM6 will preventDefault
    },
  }];
}
```

When `onSave` is undefined, returning `false` lets the browser's native save dialog fire — matches description §8.5 #4 lock.

Payload is `view.state.doc.toString()` (current CM6 doc), NOT the React `value` prop — matches description §8.5 #5 lock (avoids stale-by-React-batching freshness issues).

### 5.4 Markdown keymap

`markdownKeymap(onSaveRef)` covers description Q2:

| Key | Action |
|---|---|
| Mod-b | wrapSelection("**", "**") — bold |
| Mod-i | wrapSelection("*", "*") — italic |
| Mod-e | wrapSelection("`", "`") — inline code |
| Mod-k | wrapSelection("[", "](url)"), then move cursor to inside `(url)` slot — link wrap (§8.5 #1) |
| Mod-Shift-period | toggleLinePrefix("> ") — blockquote |

Each binding returns `true` to stop further keymap processing. `wrapSelection` and `toggleLinePrefix` dispatch CM6 transactions per §7.2.

---

## 6. Wikilink architecture (Q-P2 + Q-P5)

The single most complex feature in v0.1. Three concerns:

1. **Grammar** — what counts as a wikilink token? (Q-P2)
2. **Decoration** in edit mode — visual mark on `[[...]]` tokens.
3. **Autocomplete** — popup when user types `[[`.
4. **Preview rendering** — clickable spans + broken-link detection.

### 6.1 Symmetric grammar (Q-P2 lock)

`lib/wikilink-grammar.ts` exports a single canonical regex:

```ts
// Canonical wikilink pattern (locked per Q-P2 + description §8.5 #18):
// - [[label]]
// - [[label|alias]]
// - NOT image embeds (![[...]]) — caller must handle the image-prefix strip BEFORE matching
// - NO nested square brackets
// - NO #anchor (deferred to v0.2)
export const WIKILINK_REGEX = /\[\[([^\[\]\n|]+?)(?:\|([^\[\]\n]+?))?\]\]/g;

export interface WikilinkMatch {
  full: string;                                                      // "[[label]]" or "[[label|alias]]"
  label: string;                                                     // resolution target (BEFORE |)
  alias: string | undefined;                                         // display text (AFTER |)
  start: number;                                                     // offset in source
  end: number;                                                       // offset in source
}

export function findWikilinks(text: string): WikilinkMatch[] { /* iterates regex; strips ! prefix instances */ }

export function isImageEmbed(text: string, matchStart: number): boolean {
  return matchStart > 0 && text.charAt(matchStart - 1) === "!";
}
```

Image embeds (`![[...]]`) are NOT parsed (description §3 + Q4); the regex matches them but `isImageEmbed` callers skip them.

This module is the SINGLE source of truth — imported by:
- `lib/extensions/wikilink.ts` (CM6 ViewPlugin/MatchDecorator)
- `lib/extensions/wikilink-autocomplete.ts` (CM6 autocomplete trigger detection)
- `lib/parse-markdown.ts` (preview parser custom `marked` extension)

### 6.2 CM6 decoration (Q-P5)

`lib/extensions/wikilink.ts` exports `wikilinkDecorationPlugin(candidates)`:

```ts
export function wikilinkDecorationPlugin(candidates: ReadonlyArray<WikilinkCandidate>): Extension {
  const candidatesByLabel = new Map(candidates.map(c => [c.label.toLowerCase().trim(), c]));

  const matcher = new MatchDecorator({
    regexp: WIKILINK_REGEX,                                          // imported from lib/wikilink-grammar
    decoration: (match, view, pos) => {
      // Skip image embeds
      const text = view.state.doc.toString();
      if (isImageEmbed(text, pos)) return null;

      const label = match[1];
      const resolved = candidatesByLabel.has(label.toLowerCase().trim());
      return Decoration.mark({
        class: resolved ? "cm-wikilink" : "cm-wikilink cm-wikilink-broken",
      });
    },
  });

  return ViewPlugin.fromClass(class {
    decorations: DecorationSet;
    constructor(view: EditorView) { this.decorations = matcher.createDeco(view); }
    update(update: ViewUpdate) {
      this.decorations = matcher.updateDeco(update, this.decorations);
    }
  }, { decorations: v => v.decorations });
}
```

Theme styles `.cm-wikilink` and `.cm-wikilink-broken` map to design tokens (see §11 of the description re: signal-lime accent for resolved; `--destructive` desaturated for broken).

`MatchDecorator` is the standard CM6 pattern for regex-based decoration — efficient incremental updates on doc changes; well-tested.

### 6.3 CM6 autocomplete source

`lib/extensions/wikilink-autocomplete.ts` exports `wikilinkCompletionSource(candidates, kinds)`:

```ts
export function wikilinkCompletionSource<TC extends WikilinkCandidate>(
  candidates: ReadonlyArray<TC>,
  kinds?: Record<string, KindMeta>,
): CompletionSource {
  return (context) => {
    // Trigger: the user typed `[[` and is inside an open wikilink
    const before = context.matchBefore(/\[\[([^\[\]\n|]*)$/);
    if (!before) return null;

    const query = before.text.slice(2);                              // strip the "[[" prefix
    const filtered = filterCandidates(candidates, query);            // case-insensitive substring

    // Cap to 50 results per Q-P3 lock
    const capped = filtered.slice(0, 50);
    const overflow = filtered.length > 50 ? filtered.length - 50 : 0;

    return {
      from: before.from + 2,                                         // start AFTER [[
      to: context.pos,
      options: [
        ...capped.map(c => ({
          label: c.label,
          apply: (view, completion, from, to) => {
            const insert = c.alias ? `${c.label}|${c.alias}` : c.label;
            view.dispatch({
              changes: { from, to, insert: `${insert}]]` },          // close brackets atomically
              selection: { anchor: from + insert.length + 2 },       // place cursor AFTER ]]
            });
          },
          info: () => renderInfoPanel(c, kinds),                     // returns DOM node with kind badge + label
        })),
        ...(overflow > 0
          ? [{ label: `…and ${overflow} more (refine search)`, apply: () => {} }]
          : []),
      ],
      validFor: /^[^\[\]\n|]*$/,                                     // popup stays open while user types within token boundary
    };
  };
}
```

`renderInfoPanel(c, kinds)` builds a DOM node with the kind badge (using `kinds[c.kind]`) + the label. CM6's autocomplete shows this in the side panel — better than overcrowding the row.

Q-P3 lock: cap to 50 visible results with "+ N more (refine search)" sentinel as a non-selectable last item. Hosts with massive candidate lists (10k+) get a usable popup at the cost of needing to refine the query.

### 6.4 Preview rendering — wikilinks via `marked` extension

`lib/parse-markdown.ts`:

```ts
import { marked } from "marked";
import { WIKILINK_REGEX, findWikilinks, isImageEmbed } from "./wikilink-grammar";

const wikilinkExtension: marked.MarkedExtension = {
  extensions: [{
    name: "wikilink",
    level: "inline",
    start: (src) => src.indexOf("[["),
    tokenizer(src) {
      const match = src.match(/^\[\[([^\[\]\n|]+?)(?:\|([^\[\]\n]+?))?\]\]/);
      if (!match) return undefined;
      return {
        type: "wikilink",
        raw: match[0],
        label: match[1].trim(),
        alias: match[2]?.trim(),
      };
    },
    renderer(token) {
      const t = token as { label: string; alias: string | undefined };
      const display = t.alias ?? t.label;
      // Resolution + broken-link detection happen at render time via dataset attributes;
      // <PreviewPane> attaches click handlers via event delegation
      return `<span class="wikilink" data-wikilink-target="${escapeHtml(t.label)}">${escapeHtml(display)}</span>`;
    },
  }],
};

export function parseMarkdown(source: string, opts: { wikilinkCandidates?: ReadonlyArray<WikilinkCandidate>; kinds?: Record<string, KindMeta> }): string {
  marked.use({ gfm: true, breaks: false }, wikilinkExtension);
  const html = marked.parse(source, { async: false }) as string;

  // Post-process: mark broken wikilinks via dataset
  // Done as a string replace rather than a DOM walk — cheap, deterministic, no DOM dep at parse time
  if (!opts.wikilinkCandidates) return html;
  const labelSet = new Set(opts.wikilinkCandidates.map(c => c.label.toLowerCase().trim()));
  return html.replace(/<span class="wikilink" data-wikilink-target="([^"]+)">/g, (_, target) => {
    const resolved = labelSet.has(target.toLowerCase().trim());
    return `<span class="wikilink${resolved ? "" : " wikilink-broken"}" data-wikilink-target="${target}">`;
  });
}
```

Image embed handling: `marked`'s built-in image tokenizer matches `![alt](src)` for normal markdown images; `![[wikilink-style]]` is not matched by either the image tokenizer OR our wikilink tokenizer (because our regex doesn't allow leading `!`). It falls through to plain-text rendering. ✓ matches description §3 + Q4 lock.

### 6.5 Click handling in preview

`<PreviewPane>` uses event delegation on its root container:

```tsx
function PreviewPane({ html, onWikilinkClick }: PreviewPaneProps) {
  const onClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const wikilinkSpan = target.closest("[data-wikilink-target]");
    if (!wikilinkSpan) return;
    const wikilinkTarget = wikilinkSpan.getAttribute("data-wikilink-target");
    if (wikilinkTarget && onWikilinkClick) {
      e.preventDefault();
      onWikilinkClick(wikilinkTarget);
    }
  }, [onWikilinkClick]);

  return (
    <div className="markdown-preview" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
```

Inert spans (when `onWikilinkClick` is undefined): click event bubbles up; no handler invoked; spans remain visually styled but non-interactive.

XSS posture: `marked` escapes HTML in user content by default; we escape `target` and `display` ourselves in the renderer; no untrusted HTML enters. `dangerouslySetInnerHTML` is acceptable here because the content is OUR-rendered HTML, not user-supplied.

---

## 7. Toolbar implementation (Q-P4 + Q-P6)

### 7.1 Default toolbar export (Q-P4 lock per description §8.5 #20)

`default-toolbar.tsx` exports `defaultMarkdownToolbar` as a typed array constant:

```tsx
import { Bold, Italic, Code, Link, List, ListOrdered, Quote, Heading } from "lucide-react";

export const defaultMarkdownToolbar: ReadonlyArray<ToolbarItem> = [
  {
    id: "bold",
    label: "Bold",
    icon: <Bold className="h-4 w-4" />,
    shortcut: "⌘B",
    isActive: (ctx) => isInlineMarkActive(ctx, "**"),
    run: (ctx) => ctx.wrapSelection("**", "**"),
  },
  // ...similar for italic, code, link, bullet-list, numbered-list, blockquote
  {
    id: "heading",
    label: "Heading",
    icon: <Heading className="h-4 w-4" />,
    run: (ctx) => cycleHeading(ctx),                                 // H1 → H2 → H3 → none cycle
  },
];
```

Hosts spread + extend per description §6.2:

```tsx
toolbar={[
  ...defaultMarkdownToolbar,
  { id: "save", label: "Save", shortcut: "⌘S", run: (c) => myHandler(c.value) },
]}
```

### 7.2 ToolbarCtx implementation (Q-P6)

`lib/toolbar-actions.ts` exposes the CM6-dispatch helpers that `<Toolbar>` builds into the `ToolbarCtx`:

```ts
export function wrapSelection(view: EditorView, before: string, after = before): void {
  const { from, to } = view.state.selection.main;
  const selectedText = view.state.sliceDoc(from, to);

  view.dispatch({
    changes: { from, to, insert: `${before}${selectedText}${after}` },
    selection: from === to
      ? { anchor: from + before.length }                             // empty selection: cursor between markers
      : { anchor: from + before.length, head: from + before.length + selectedText.length },
  });
  view.focus();
}

export function toggleLinePrefix(view: EditorView, prefix: string): void {
  // Add prefix to every line in the selection; if all already have it, remove
  const { from, to } = view.state.selection.main;
  const startLine = view.state.doc.lineAt(from).number;
  const endLine = view.state.doc.lineAt(to).number;

  const lines: { from: number; to: number; text: string }[] = [];
  for (let n = startLine; n <= endLine; n++) {
    const line = view.state.doc.line(n);
    lines.push({ from: line.from, to: line.to, text: line.text });
  }

  const allHavePrefix = lines.every(l => l.text.startsWith(prefix));
  const changes = lines.map(l =>
    allHavePrefix
      ? { from: l.from, to: l.from + prefix.length, insert: "" }
      : { from: l.from, insert: prefix }
  );

  view.dispatch({ changes });
  view.focus();
}

export function insertText(view: EditorView, text: string): void {
  const { from, to } = view.state.selection.main;
  view.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length },
  });
  view.focus();
}
```

These compose into `ToolbarCtx`:

```ts
function buildToolbarCtx(view: EditorView): ToolbarCtx {
  return {
    view,
    value: view.state.doc.toString(),
    insertText: (text) => insertText(view, text),
    wrapSelection: (before, after) => wrapSelection(view, before, after),
    toggleLinePrefix: (prefix) => toggleLinePrefix(view, prefix),
  };
}
```

Custom toolbar items receive this ctx; built-in items use the same surface internally (no hidden API).

### 7.3 Toolbar rendering

`parts/toolbar.tsx` renders `ToolbarItem[]` as a flex-row of `<ToolbarButton>` components. Each button:
- `<Tooltip>` wrapping (using shadcn `Tooltip`, queued by properties-form Phase A — no install needed in markdown-editor's pre-flight).
- `<Button variant="ghost" size="sm">` with the icon.
- `aria-label={item.label}`, `aria-pressed={isActive(ctx)}` (when `isActive` defined).
- Shortcut hint rendered in tooltip (e.g., "Bold (⌘B)").

Layout: flex-row with optional separators (host can interleave `{ id: "sep", ... }` items — TBD in §11.1 risks).

### 7.4 Toolbar `false` (hide) handling

When `props.toolbar === false`, the toolbar pane doesn't render. View toggle still renders. Host owns full chrome via the `getView()` ref handle escape hatch (description §6.3 standalone README example shows this).

---

## 8. Files and parts

### 8.1 File-by-file plan

```
src/registry/components/forms/markdown-editor/
├── markdown-editor.tsx                # main component (CM6 mount; props; ref handle; view toggle)
├── default-toolbar.tsx                # exports defaultMarkdownToolbar (8 built-in items)
├── types.ts                           # WikilinkCandidate, KindMeta, ViewMode, ToolbarItem,
│                                       #   ToolbarCtx, MarkdownEditorProps, MarkdownEditorHandle
├── parts/
│   ├── editor-pane.tsx                # CM6 host (mounts EditorView; receives extension stack)
│   ├── preview-pane.tsx               # markdown-rendered HTML; click delegation for wikilinks
│   ├── view-toggle.tsx                # edit/preview/split tabs (shadcn Tabs)
│   ├── toolbar.tsx                    # toolbar layout (renders ToolbarItem[])
│   ├── toolbar-button.tsx             # single button + Tooltip + active state
│   └── kind-badge.tsx                 # Badge wrapper for autocomplete popup info panel
├── hooks/
│   ├── use-codemirror.ts              # CM6 lifecycle: mount, value sync, readOnly sync, extensions sync
│   ├── use-imperative-handle.ts       # builds the MarkdownEditorHandle (focus/undo/redo/insertText/etc.)
│   ├── use-view-mode.ts               # controlled-or-uncontrolled view-mode dispatch
│   └── use-toolbar-state.ts           # useSyncExternalStore for CM6 selection-change tracking
├── lib/
│   ├── extensions/
│   │   ├── theme.ts                   # CM6 theme mapping to globals.css CSS variables (Q5 + §8.5 #5)
│   │   ├── wikilink.ts                # CM6 ViewPlugin + MatchDecorator (Q-P5; §6.2 of plan)
│   │   ├── wikilink-autocomplete.ts   # CM6 autocomplete source (§6.3 of plan)
│   │   ├── save-keymap.ts             # Cmd/Ctrl+S → onSave (§5.3 of plan)
│   │   ├── markdown-keymap.ts         # Cmd+B/I/E/K (§5.4 of plan)
│   │   └── compartments.ts            # readOnlyCompartment, userExtensionsCompartment exports
│   ├── parse-markdown.ts              # GFM markdown → HTML via marked + wikilink extension (§6.4 of plan)
│   ├── wikilink-grammar.ts            # canonical wikilink regex/grammar (Q-P2 lock; §6.1 of plan)
│   ├── toolbar-actions.ts             # wrapSelection / toggleLinePrefix / insertText / cycleHeading helpers
│   └── sync-annotation.ts             # CM6 SyncAnnotation for echo-guard (Q-P9)
├── dummy-data.ts                      # sample markdown documents with wikilinks, GFM features
├── demo.tsx                           # 8 demos per description success #12 (single page, internal switch)
├── usage.tsx                          # consumer-facing patterns + force-graph + detail-panel recipes
├── meta.ts                            # registry meta
└── index.ts                           # MarkdownEditor + types + defaultMarkdownToolbar + parseMarkdown re-export
```

**File count: 28.** Largest pro-component plan to date — properties-form (22), entity-picker (18), filter-stack (17), detail-panel (17). Reflects the substrate complexity (CM6 has dozens of moving parts; we expose a clean API but ship 6 internal extensions + a separate preview parser pipeline). Comparable to `workspace` v0.1 (26 files). Smaller than rich-card v0.4 (53 files; rich-card has an editor of its own).

### 8.2 Build order within v0.1

Three internal phases, ~5 days each (~3 weeks total):

**Phase A — types + lib + extensions (foundational; ~5 days):**
- **Pre-flight (must precede everything else):** install CodeMirror 6 + preview-parser dependencies via npm:
  ```
  pnpm add @codemirror/state @codemirror/view @codemirror/commands @codemirror/language @codemirror/lang-markdown @codemirror/autocomplete @codemirror/search @lezer/markdown @lezer/highlight marked
  ```
  10 packages. **State of `package.json` verified at plan-write time (2026-04-29):** none of these are installed. No shadcn primitives need installing for markdown-editor specifically — `Button`, `Badge`, `Tabs` are already in repo; `Tooltip` is queued by [`properties-form` plan §8.2 Phase A](../properties-form-procomp/properties-form-procomp-plan.md#82-build-order-within-v01) (cumulative install across all signed-off Tier 1 plans). Commit the npm install separately so the install diff stays distinct.
- `types.ts` — full type surface
- `lib/wikilink-grammar.ts` — canonical regex (single source of truth; consumed by 3 downstream modules)
- `lib/sync-annotation.ts` — echo-guard annotation
- `lib/extensions/compartments.ts` — Compartment exports
- `lib/extensions/theme.ts` — CSS-variable theme mapping (Q5 + §8.5 #5; verify dark/light flip with no remount in Phase B)
- `lib/extensions/save-keymap.ts`, `lib/extensions/markdown-keymap.ts` — keymaps with onSaveRef
- `lib/extensions/wikilink.ts` — ViewPlugin + MatchDecorator
- `lib/extensions/wikilink-autocomplete.ts` — completion source
- `lib/parse-markdown.ts` — `marked` + wikilink extension + post-process broken-link marking
- `lib/toolbar-actions.ts` — wrapSelection / toggleLinePrefix / insertText / cycleHeading
- `hooks/use-codemirror.ts` — CM6 lifecycle (mount/destroy + 3 sync effects per §5.2)
- `hooks/use-view-mode.ts` — controlled/uncontrolled dispatch
- `hooks/use-toolbar-state.ts` — useSyncExternalStore for selection-change tracking
- `hooks/use-imperative-handle.ts` — handle builder
- **Phase A end gate:** smoke-test the canonical `wikilink-grammar.ts` regex against a fixture covering `[[label]]`, `[[label|alias]]`, `![[image.png]]` (image — must not match), `[[label with spaces]]`, `[[]]` (empty — must not match), `[[label]] [[label2]]` (adjacent — both match). Verify CM6 `MatchDecorator`, autocomplete trigger, and `marked` extension all agree on token boundaries. **Smoke-test value-sync echo guard** with a host that calls `setValue` from inside `onChange` (no infinite loop expected).
- Unit-testable in isolation when Vitest lands; v0.1 verification is demo-driven.

**Phase B — rendering (~5 days):**
- `parts/kind-badge.tsx` — KindMeta → Badge with color
- `parts/toolbar-button.tsx` — Button + Tooltip + active state
- `parts/toolbar.tsx` — toolbar layout
- `parts/view-toggle.tsx` — shadcn Tabs wrapper
- `parts/editor-pane.tsx` — CM6 host (mounts EditorView via use-codemirror hook)
- `parts/preview-pane.tsx` — html injection + click delegation
- `default-toolbar.tsx` — 8 built-in items
- `markdown-editor.tsx` — main component (overload for ref-as-prop generic; extension stack composition; view-mode dispatch; wires all parts)
- Phase B end: `axe-core` smoke run for editor surface + toolbar + view-toggle. Verify dark/light theme flip with no remount. Verify split-view container-query stacking on a narrow container fixture (description §8.5 #2). Verify the wikilink-autocomplete popup positions correctly near the caret.

**Phase C — demos + integration (~5 days):**
- `demo.tsx` (8 sub-demos covering description success #12), `dummy-data.ts`, `usage.tsx`, `meta.ts`, `index.ts`
- Verify `tsc + lint + build` clean
- Verify all 12 success-criteria items
- Verify the force-graph v0.5 integration recipe in `usage.tsx` matches force-graph's plan-locked actions (re-validation gate when force-graph v0.5 plan-lock cascades)
- **Verify bundle weight via `size-limit`** (description §8.5 #11) — CM6 substrate ~150KB + `marked` ~14KB + our code ~16KB ≤ 180KB ceiling

---

## 9. ARIA contract

Per description success #10. CM6 ships usable ARIA/keyboard for the editor surface; our additions are toolbar + view-toggle + autocomplete-popup ARIA.

| Element | ARIA |
|---|---|
| Component root | `<div className="markdown-editor">` no implicit role; `aria-label={ariaLabel}` if supplied |
| Toolbar | `<div role="toolbar" aria-label="Markdown editor toolbar">` |
| Toolbar button | `<button aria-label={item.label}>`; `aria-pressed={isActive ? "true" : "false"}` when `isActive` defined; `aria-keyshortcuts={item.shortcut}` |
| View toggle | shadcn `<Tabs>` provides `role="tablist"`; each `<TabsTrigger>` is `role="tab"` |
| Editor pane (CM6) | CM6 provides `role="textbox"` + `aria-multiline="true"` natively; `aria-label={ariaLabel}` overlay |
| Preview pane | `<div role="article">` with the rendered markdown |
| Split view | `role="group" aria-label="Editor and preview"` on the wrapper |
| Wikilink span (preview) | `<span class="wikilink" data-wikilink-target="...">`; click handler is on the parent (event delegation); each span is `role="link"` if `onWikilinkClick` is supplied, no role otherwise |
| Wikilink autocomplete popup | CM6's autocomplete provides `role="listbox"` + `role="option"` + `aria-activedescendant`; we add the kind-badge inside the info panel |
| "+ N more" overflow row | `role="option" aria-disabled="true"` so it's not selectable |
| Broken wikilink | `<span class="wikilink wikilink-broken" data-wikilink-target="..." title="Unresolved link">` |

CM6's built-in keyboard (cursor moves, undo, redo, history, search, indent) operates inside the editor pane. Toolbar button shortcuts operate globally within the component (Tab focus order: toolbar → editor → view-toggle → preview pane links).

Focus management:
- **`focus()` ref method** → `view.focus()` (focus moves into editor pane).
- **View-mode change** → focus stays where it was if possible (CM6 retains focus through prop changes).
- **Toolbar button click** → focus returns to editor pane after action via `view.focus()` in each action's tail.

---

## 10. Edge cases (locked)

| Case | Handling |
|---|---|
| `value` prop changes externally while user is mid-typing | Echo-guard (§4.2) skips `onChange` for sync transactions; CM6 dispatches the new doc; cursor position best-effort (CM6 maps selection through changes). Rare in single-user UIs. |
| User presses Cmd+S with no `onSave` supplied | Browser's native save dialog fires (description §8.5 #4). No surprise behavior. |
| User presses Cmd+S with `onSave` supplied AND CM6 has uncommitted typing | `onSave(view.state.doc.toString())` fires with current CM6 doc value (description §8.5 #5) — fresher than React `value` prop in case of batching. |
| `wikilinkCandidates` is empty | Autocomplete trigger still fires when user types `[[`, but the popup shows no results. CM6 closes the popup automatically. Plain `[[...]]` text passes through. |
| `wikilinkCandidates` has 10k+ entries | Cap to 50 visible per Q-P3 lock with "+ N more (refine search)" sentinel. Hosts refine via query. |
| Duplicate `label` in `wikilinkCandidates` | `Map` lookup uses last-write-wins (later entries shadow earlier). Dev-only `console.warn` once per session per duplicate label. Reconciliation tiebreaking lives in force-graph v0.5 per [decision #36](../../systems/graph-system/graph-system-description.md), NOT here. |
| `wikilinkCandidates` is referentially unstable (inline arrow) | Same footgun as filter-stack's `categories` and entity-picker's `items`. CM6 reconfigures on candidates change → potential popup churn. Mitigated by React Compiler in-repo; documented in usage for NPM consumers. See §11.1.1. |
| `onWikilinkClick` undefined | Wikilink spans render styled but inert (no click handler dispatched). |
| Image embed (`![[image.png]]`) in source | Renders as literal text in preview (description §3 + Q4); CM6 grammar matches `[[image.png]]` portion but `MatchDecorator` skips when `isImageEmbed(text, pos)` returns true. |
| `[[label#anchor]]` | NOT supported in v0.1 per description §8.5 #18. Anchor portion treated as part of the label by current regex; reconciliation behavior is host's concern. v0.2 adds anchor parsing. |
| `[[label]] [[label2]]` adjacent wikilinks | Both decorated independently; both autocomplete-trigger correctly when typing into either. Verified via Phase A grammar smoke test. |
| Empty selection + `wrapSelection("**", "**")` | Inserts `****` and places cursor between the markers. Subsequent typing produces bold text. |
| Empty selection + `toggleLinePrefix("> ")` | Adds `> ` to the current line; if already prefixed, removes. |
| Multi-line selection + `toggleLinePrefix` | Per §7.2: adds prefix to every line; if all already have it, removes from every line. |
| `view="split"` on a narrow container (<480px) | Stacks vertically via container query (description §8.5 #2). Editor pane on top, preview pane below; each takes 50% of the container's height. |
| `readOnly: true` + user types | CM6's read-only mode rejects the input; no `onChange` fires. |
| `readOnly: true` + `view="edit"` | Editor renders with syntax highlighting but is non-editable (description §8.5 #3). |
| `extensions` reference changes mid-life | Full extension reconfigure via `userExtensionsCompartment.reconfigure(...)`. CM6 handles cleanly; no remount needed. |
| User extension conflicts with our keymap (e.g., Cmd+B) | User extensions appended LAST per Q-P8; user wins. If user wants explicit override, they use `Prec.high(keymap.of([...]))`. |
| `getView()` called before mount | Returns `null`; dev-only `console.warn` once per session. |
| `getView()` called after unmount | Returns `null`; dev-only `console.warn`. |
| `insertText("")` (empty string) | No-op; dispatches an empty change which CM6 treats as identity. |
| Long markdown doc (50KB+) | `marked` parses ~50ms; React Compiler memoizes via `useMemo(value)`; CM6 handles with native virtualization (`EditorView` only renders visible lines). Performance acceptable. v0.2 may add preview debounce if real consumers push past 100KB. |
| `value` contains special CM6-significant characters (e.g., line separators, carriage returns) | CM6 normalizes line endings to `\n` internally; on `getValue()` we return CM6's normalized form. Documented. Hosts that need original line endings preserve them externally. |
| Rapid `value` prop changes (host typing into a textarea elsewhere that mirrors here) | Each prop change triggers a sync dispatch; CM6 handles fast updates well. Cursor maps through changes. Echo guard prevents loops. |

---

## 11. Performance + bundle

### 11.1 Performance

- **CM6 native virtualization** — `EditorView` only renders lines visible in the viewport; long documents (10k+ lines) remain fluid.
- **`marked` preview parsing** — synchronous, ~5ms for typical docs / ~50ms for 50KB. Memoized via `useMemo(value, ...)`.
- **`MatchDecorator` for wikilinks** — incremental updates on doc changes; only re-runs against changed regions, not the whole doc.
- **Toolbar active state** — `useSyncExternalStore` keyed on a CM6-update counter; only re-renders on selection-change events (NOT every keystroke unless the keystroke also moves selection, which it does for typing).
- **Wikilink candidate index** — `Map<string, T>` keyed on lowercased+trimmed label; built once per `wikilinkCandidates` reference change.
- **Echo-guard ref `lastSyncedValueRef`** — avoids unnecessary `view.state.doc.toString()` calls on every value-prop change.

#### 11.1.1 `wikilinkCandidates` reference stability (host responsibility)

Same footgun as [filter-stack's `categories`](../filter-stack-procomp/filter-stack-procomp-plan.md#1011-categories-reference-stability-host-responsibility), [properties-form's `schema`](../properties-form-procomp/properties-form-procomp-plan.md#1111-schema-reference-stability-host-responsibility), and [entity-picker's `items`](../entity-picker-procomp/entity-picker-procomp-plan.md#1011-items-reference-stability-host-responsibility). Hosts that pass an inline `wikilinkCandidates={[...]}` literal create new candidate object references on every parent render. Without reference stability, our candidates-Map memo invalidates and CM6's autocomplete source reconfigures.

**In-repo mitigation:** React Compiler ([CLAUDE.md tech stack](../../../CLAUDE.md)) auto-memoizes JSX-literal arrays at the call site. Inline `wikilinkCandidates={[...]}` is fine for in-repo consumers.

**NPM-extraction concern:** consumers without React Compiler must memoize manually. Two patterns documented in `usage.tsx`:

1. **Module-scope candidates** (preferred for static lists):
   ```tsx
   const CANDIDATES = [/* ... */] satisfies WikilinkCandidate[];
   <MarkdownEditor wikilinkCandidates={CANDIDATES} ... />
   ```
2. **`useMemo` candidates** (for derived lists):
   ```tsx
   const wikilinkCandidates = useMemo(() => deriveFromGraph(graph), [graph]);
   <MarkdownEditor wikilinkCandidates={wikilinkCandidates} ... />
   ```

Same dev-only runtime warning posture: fires when `wikilinkCandidates` reference changes more than 5 times in succession (avoiding false positives on first-mount churn).

### 11.2 Bundle audit

Budget: **≤ 180KB minified + gzipped** per description success #9. Tightest budget across the registry — reflects the CM6 substrate's intrinsic cost (decision #26 ~150KB acceptance).

**State of `package.json` at plan-write time** (verified 2026-04-29): no CodeMirror packages, no `marked`. **Phase A pre-flight installs all 10 npm packages** via the single `pnpm add` command in §8.2.

Realistic breakdown (per description §8.5 #11 + Q6):

| Item | Min+gz Size |
|---|---|
| `@codemirror/state` | ~10KB |
| `@codemirror/view` | ~50KB |
| `@codemirror/commands` | ~5KB |
| `@codemirror/language` | ~10KB |
| `@codemirror/lang-markdown` | ~20KB (incl. Lezer) |
| `@codemirror/autocomplete` | ~12KB |
| `@codemirror/search` | ~10KB |
| `@lezer/markdown` | (already pulled by lang-markdown) |
| `@lezer/highlight` | ~5KB |
| **CM6 substrate subtotal** | **~122KB** (description #26 says ~150KB; actual is somewhat lower due to tree-shaking) |
| `marked` (preview parser; Q-P1 lock) | ~14KB |
| Our code (theme + 5 extensions + 6 parts + 4 hooks + main + preview + actions) | **~16-20KB** |
| **Markdown-editor-attributable total** | **~152-156KB**, ceiling 180KB providing ~24-28KB headroom |

The ceiling has reasonable but not generous headroom. Phase B end gate runs `size-limit` to verify; if we cross 180KB, candidates for cut in §12.1 risks.

`Tooltip` (cumulative install across Tier 1 plans), `Button`, `Badge`, `Tabs` are registry-shared infrastructure and are NOT markdown-editor-attributable.

Wired via `size-limit` (or equivalent) at v0.1 implementation start — same posture as the other Tier 1 plans.

---

## 12. Risks & alternatives

### 12.1 Risks

| Risk | Mitigation |
|---|---|
| Bundle exceeds 180KB | Audit at end of Phase B. Specific cut candidates in priority order: (1) drop `@codemirror/search` if find/replace isn't a v0.1 must-have (~10KB; description §3 already deferred custom search UI but the panel still ships); (2) replace `marked` with `micromark` (~10KB but fewer extension hooks; rebuild wikilink integration); (3) inline `kind-badge.tsx` into autocomplete info-panel renderer (~0.3KB structural cost). Don't cut the wikilink decoration extension or the theme. |
| CM6 lifecycle interactions with React 19 + React Compiler | All effects use cleanup; refs hold stable values; React Compiler should leave alone. **Phase A end gate** smoke-tests with the compiler enabled. If issues surface, add explicit `'use no memo'` directive to `use-codemirror.ts`. |
| Echo-guard fails (infinite render loop) | Phase A end gate smoke-tests a host that calls `setValue` from inside `onChange`. The `SyncAnnotation` correctly suppresses; the `lastSyncedValueRef` provides a second-line defense. If we still loop, fall back to comparing `value === view.state.doc.toString()` before dispatching. |
| Wikilink grammar mismatches between CM6 and preview parser | **Phase A end gate** smoke-tests the canonical regex against a fixture; both the CM6 `MatchDecorator` and the `marked` extension import from `lib/wikilink-grammar.ts`. Single source of truth. |
| `marked` extension API changes between minor versions | Pin `marked` to a specific minor version in `package.json`; document the upgrade path. `marked`'s extension API has been stable for ~2 years. |
| Theme dark/light flip causes editor remount | CM6 styles use `var(--*)` references (Q5 + §8.5 #5); browser updates the computed values at the document level without notifying CM6. Phase B verifies via demo with theme toggle. If broken, switch to a `EditorView.theme()` that's reconfigured via Compartment on theme change (more code, same outcome). |
| Cmd+S conflicts with browser save when `onSave` is supplied | `preventDefault: false` in the keymap entry; we set `preventDefault` manually only when `onSave` handles the save. CM6's `run` returning `true` is the standard mechanism. |
| Split-view container-query stacking doesn't work in older Safari | Container queries are supported in Safari 16+; we don't support older. Documented; if real consumers report issues, add a viewport-query fallback. |
| Toolbar tooltip `Tooltip` install is needed but not yet in repo | Tooltip is queued by [properties-form Phase A](../properties-form-procomp/properties-form-procomp-plan.md#82-build-order-within-v01) — first sibling to install lands it for everyone. If markdown-editor implements before properties-form, run that install in markdown-editor's Phase A pre-flight too. |
| `getView()` substrate-leak risk | Documented; decision #19 locks CM6. Removing `getView()` would be a major-version bump. Acknowledged tradeoff. |

### 12.2 Alternatives considered, rejected

- **Build markdown editor from scratch on `<textarea>`** — rejected per decision #19; produces inferior UX for wikilink autocomplete + syntax highlighting.
- **ProseMirror substrate** — heavier (~250KB), more complex extension API, overkill for markdown-first editor. Rejected per decision #19.
- **Slate substrate** — similar weight; no native markdown mode (would need custom plugin). Rejected per decision #19.
- **Lexical (Meta's editor)** — newer, less mature; complex collaborative-first design. Rejected per decision #19.
- **`codemirror` umbrella package** — rejected per Q6; ~80KB of unused legacy modes.
- **`markdown-it` preview parser** — rejected per Q-P1; ~40KB with default plugins vs `marked` ~14KB. `marked` covers GFM and has a clean extension API.
- **`react-markdown`** — abstracts over a parser but adds React-rendering wrapping overhead; we want raw HTML for the wikilink span injection pattern. Rejected.
- **Auto-save on every change** — rejected per description Q7; explicit save matches Obsidian/VS Code mental model and decision #36 reconciliation timing.
- **Render-fn `toolbar` form in v0.1** — rejected per description Q1 reversal; `false | array` is sufficient + consistent with siblings.
- **`Intl.Collator` for case-insensitive label matching in autocomplete** — rejected per entity-picker Q-P2 precedent; `toLowerCase()` for v0.1.
- **Roll-our-own debounced preview** — rejected for v0.1 per Q-P7; React Compiler memoization handles the typical case; v0.2 adds opt-in if real consumers report jank.

---

## 13. Resolved plan-stage questions (recommendations; convert on sign-off)

10 questions. **High-impact:** Q-P1 (preview parser), Q-P2 (symmetric wikilink grammar), Q-P5 (CM6 wikilink extension architecture), Q-P9 (CM6 value-prop sync + echo guard). **Medium:** Q-P3 (autocomplete result limit), Q-P6 (toolbar action implementation), Q-P7 (preview re-render strategy), Q-P8 (extensions prop merge precedence). **Low:** Q-P4 (default toolbar export), Q-P10 (ref-as-prop pattern consistency).

### Q-P1 (from description §8.5 #9) — Preview parser: `marked` vs `markdown-it`

**Recommendation: `marked`** for the preview parser per §6.4. `marked` is ~14KB minified+gzipped; `markdown-it` is ~40KB with default plugins. Both support GFM (description Q10); both have extension APIs. `marked`'s extension API is stable, well-documented, and lets us register a custom `wikilink` inline tokenizer cleanly.

Bundle weight is the tiebreaker. `markdown-it` has a richer ecosystem (more plugins) but we don't need any of them in v0.1; `marked` covers tables, strikethrough, task lists, autolink natively.

**Impact:** high — fixes the preview-parser library, drives the wikilink-extension API and the bundle audit.
**Trade-off:** if v0.2 needs a feature only `markdown-it` ecosystem provides (e.g., footnotes via `markdown-it-footnote`), migrating is a Phase B-level rewrite of `lib/parse-markdown.ts`. Acceptable; description §3 currently has no such feature in the v0.2 roadmap.

### Q-P2 (from description §8.5 #12) — Symmetric wikilink grammar

**Recommendation: single canonical regex in `lib/wikilink-grammar.ts`** per §6.1. `WIKILINK_REGEX = /\[\[([^\[\]\n|]+?)(?:\|([^\[\]\n]+?))?\]\]/g` with helper functions `findWikilinks(text)` and `isImageEmbed(text, pos)`. Three downstream consumers import from this module:

1. `lib/extensions/wikilink.ts` (CM6 `MatchDecorator`)
2. `lib/extensions/wikilink-autocomplete.ts` (CM6 autocomplete trigger detection)
3. `lib/parse-markdown.ts` (`marked` extension tokenizer)

**Phase A end gate** smoke-tests the regex against a fixture: `[[label]]` (match, label-only), `[[label|alias]]` (match, label + alias), `![[image.png]]` (image; match but `isImageEmbed` filters), `[[label with spaces]]` (match), `[[]]` (empty; must NOT match), `[[label]] [[label2]]` (adjacent; both match), `[[outer[[inner]]]]` (nested; outer NOT matched per Q-P2 lock — no nested brackets per description §8.5 #18).

**Impact:** high — defines the wikilink contract across edit / autocomplete / preview surfaces.
**Trade-off:** any change to the regex must update the fixture and re-run smoke tests; v0.2 additions like `[[label#anchor]]` (description §8.5 #18) require coordinated changes across all 3 consumers. Single source of truth makes this manageable; documented.

### Q-P3 (from description §8.5 #16) — Wikilink autocomplete result limit

**Recommendation: cap visible results to 50, with "+ N more (refine search)" sentinel** as the last item per §6.3. Sentinel is `aria-disabled="true"` so it's not selectable; visually distinct from real results.

Hosts with 10k+ candidates get a usable popup (no virtualization in v0.1; deferred to v0.2 per description §3). Refining the query narrows results below the cap.

**Impact:** medium — affects scalability + UX for large candidate sets.
**Trade-off:** users with very common label prefixes (e.g., 200 nodes with "person" prefix) hit the cap quickly. Documented; v0.2 adds opt-in virtualization or `popupMaxResults?: number` prop.

### Q-P4 (from description §8.5 #20) — Default toolbar export

**Recommendation: export `defaultMarkdownToolbar: ReadonlyArray<ToolbarItem>`** as a named constant from `default-toolbar.tsx`, re-exported from `index.ts` per §7.1. Hosts spread + extend per description §6.2:

```tsx
toolbar={[...defaultMarkdownToolbar, { id: "save", label: "Save", run: ... }]}
```

The constant is `ReadonlyArray` so hosts can't accidentally mutate it (which would affect every consumer in the same module).

**Impact:** low — primarily a discoverability + ergonomic affordance.
**Trade-off:** none — additive export, no API surface change.

### Q-P5 (NEW) — Wikilink CM6 extension architecture

**Recommendation: `MatchDecorator` + `ViewPlugin` for decoration; `@codemirror/autocomplete` `CompletionSource` for autocomplete** per §6.2 + §6.3. Two separate extensions:

1. **Decoration**: `wikilinkDecorationPlugin(candidates)` returns a `ViewPlugin` that uses `MatchDecorator(WIKILINK_REGEX)` to mark `[[...]]` tokens with `Decoration.mark({ class: "cm-wikilink" })`. Broken links get an additional `cm-wikilink-broken` class via candidate-Map lookup at decoration time.
2. **Autocomplete**: `wikilinkCompletionSource(candidates, kinds)` returns a CM6 `CompletionSource` that triggers when the cursor follows `[[`. Filters candidates via case-insensitive substring; renders kind badges in the info panel; caps to 50 results per Q-P3.

Alternatives considered:
- **Lezer parser extension** for wikilinks — proper grammar integration; would let CM6's syntax tree include wikilink nodes, enabling things like "highlight inside wikilink differently from prose." But: complex to implement; the `MatchDecorator` covers the v0.1 needs (visual mark on tokens). Rejected for v0.1; v0.2 may upgrade if structural-tree access is needed.
- **Single combined extension** (decoration + autocomplete in one ViewPlugin) — rejected for separation of concerns; CM6's autocomplete extension is a separate concern from decoration.

**Impact:** high — defines the CM6 integration shape; touches every wikilink interaction.
**Trade-off:** `MatchDecorator` is regex-based, so it doesn't survive structural transformations (e.g., a hypothetical "auto-fix wikilink" feature in v0.2 would need parser-tree access). Acceptable for v0.1.

### Q-P6 (NEW) — Toolbar action / `ToolbarCtx` implementation

**Recommendation: `ToolbarCtx` exposes `view` + `value` + 3 helpers (`insertText`, `wrapSelection`, `toggleLinePrefix`)** per §7.2. Helpers live in `lib/toolbar-actions.ts` and dispatch CM6 transactions directly. Default toolbar items use the same helpers (no separate "default" API; symmetric with custom items).

`buildToolbarCtx(view)` is called per toolbar render; the ctx object is fresh each time but the dispatch helpers are stable closures over `view`.

**Impact:** medium — defines the toolbar extension contract.
**Trade-off:** the helpers operate on the current view; if a toolbar item needs the doc value at the time of click (vs the doc value at render time), it reads `ctx.value` (which is a snapshot at ctx-build time) — close enough for typical use. Hosts wanting the absolute-freshest value use `ctx.view.state.doc.toString()` directly.

### Q-P7 (NEW) — Preview rendering re-render strategy

**Recommendation: parse on every value change via `useMemo`; no internal debounce** per §4.5. `marked` is fast (~5ms typical, ~50ms for 50KB docs); React Compiler memoizes the `useMemo` automatically; v0.2 adds opt-in debounce (`previewDebounceMs?: number`) if real consumers report jank on large docs.

**Impact:** medium — affects perceived typing-while-preview-visible UX.
**Trade-off:** for >100KB docs, parsing on every keystroke could feel sluggish (~100ms+). Acceptable for v0.1 — preview-while-typing is a niche pattern (most users edit in `view="edit"` and toggle to preview); documented in §10 edge cases. v0.2 adds debounce.

### Q-P8 (NEW) — `extensions` prop merge precedence

**Recommendation: user extensions appended LAST in the extension stack per §5.1.** CM6 resolves extensions in order; later extensions override earlier ones for keymap conflicts. Users can escalate via `Prec.high(keymap.of([...]))` if they need to override CM6's defaults too.

```ts
const extensions = [
  ...ourExtensions,           // theme, lang-markdown, autocomplete, wikilink, search, history, our keymap
  ...(props.extensions ?? [])  // user extensions LAST
];
```

**Impact:** medium — defines the extension-conflict behavior visible to power users.
**Trade-off:** if a user passes an extension that conflicts with our wikilink decoration (rare), the user wins. Documented in usage; users wanting to disable a specific built-in feature use a Compartment-based approach via `getView()` post-mount.

### Q-P9 (NEW) — CM6 value-prop sync + echo guard

**Recommendation: three separate effects for value / readOnly / extensions sync, each with `Compartment.reconfigure()` or transaction dispatch; `SyncAnnotation` echo guard on the value-sync transaction** per §4.2 + §5.2.

The echo guard:
1. Define `SyncAnnotation = Annotation.define<boolean>()` in `lib/sync-annotation.ts`.
2. Value-sync effect dispatches `view.dispatch({ changes: ..., annotations: SyncAnnotation.of(true) })`.
3. `EditorView.updateListener` checks `update.transactions.some(t => t.annotation(SyncAnnotation))` and skips `onChange` if true.
4. `lastSyncedValueRef` provides a second-line defense — if the host's reducer transformed the value, we still skip dispatch when our last-known synced value matches the incoming prop.

**Impact:** high — defines the controlled-component contract; the wrong implementation produces infinite render loops.
**Trade-off:** standard CM6 pattern; well-tested. **Phase A end gate** smoke-tests a host that calls `setValue` from inside `onChange` (no infinite loop expected).

### Q-P10 (NEW) — Imperative handle ref-as-prop pattern (consistency)

**Recommendation: React 19 ref-as-prop pattern** consistent with [`properties-form` plan §13.5 #8](../properties-form-procomp/properties-form-procomp-plan.md#135-plan-stage-refinements-surfaced-during-draft) and the other Tier 1 plans. Markdown-editor's component signature accepts `ref` as a regular prop; `useImperativeHandle(ref, () => ({ focus, undo, redo, ... }))` attaches the handle.

Generic typing: `<MarkdownEditor<TCandidate>>` per description Q8 + §3.2. React 19 ref-as-prop preserves generic inference; `forwardRef` would strip generics.

**Impact:** low — primarily a posture-consistency decision.
**Trade-off:** none; the pattern is sibling-uniform.

## 13.5 Plan-stage refinements (surfaced during draft)

These bake into implementation but worth flagging:

1. **`SyncAnnotation` echo-guard smoke test.** Phase A end gate: write a host that calls `setValue` from inside `onChange`. Verify no infinite loop. This is the most subtle CM6-React integration concern; getting it right is non-negotiable.
2. **Wikilink grammar fixture coverage.** Phase A end gate: smoke-test 7 cases per §6.1 — `[[label]]`, `[[label|alias]]`, `![[image.png]]` (image; not matched as wikilink), `[[label with spaces]]`, `[[]]` (empty; not matched), `[[label]] [[label2]]` (adjacent; both matched), `[[outer[[inner]]]]` (nested; outer not matched per §8.5 #18).
3. **Theme CSS-variable smoke test.** Phase B end gate: toggle dark/light via the demo's theme switcher; verify CM6 editor colors update without remount. If broken, fall back to Compartment-reconfigured `EditorView.theme()` on theme change.
4. **`size-limit` enforcement.** Phase A end (after npm install) installs `size-limit` and configures the 180KB ceiling. Phase B end runs the audit; cuts per §12.1 risks if over.
5. **Production-build warning suppression.** Dev-only `console.warn` calls (duplicate wikilink labels, getView-called-pre-mount, etc.) are gated by `process.env.NODE_ENV !== "production"`. Bundlers strip the dead code.
6. **`onSave` ref capture.** `useEffect`-scoped CM6 keymap captures `onSave` once at mount; updates via `onSaveRef.current = onSave` on every render. Avoids reconfiguring the extension stack on every render.
7. **Toolbar separator support.** Plan-stage refinement: support `{ id: "sep-N", label: "" }` items as visual separators (rendered as a thin vertical line). Default toolbar uses one between `link` and `bullet-list`. Hosts can include their own separators.
8. **Heading-cycle implementation.** `cycleHeading(ctx)` toggles the current line through `# ` → `## ` → `### ` → no-prefix → `# `. Inspired by Obsidian's heading toggle. Documented in `default-toolbar.tsx` source.
9. **`getView()` no-op on null.** Returns `null` when called before mount or after unmount. Dev-only `console.warn` once per session.
10. **GFM task-list checkboxes are static in preview.** `marked` GFM extension renders `- [ ]` as `<input type="checkbox" disabled>`. We don't override; toggling requires write-back to source (description §3 + Q10 deferral). Documented.
11. **`@codemirror/search`'s built-in panel.** Cmd+F opens it; we don't decorate or restyle the panel in v0.1 (description §3 — out of scope). Plan-stage adds a CSS rule mapping the panel's colors to our design tokens (one-line theme addition).
12. **`marked` security posture.** `marked.parse(source, { async: false })` with default options escapes user-supplied HTML. We don't enable `mangle`, `headerIds`, or other HTML-injection-prone options. Custom wikilink extension's renderer uses `escapeHtml` on `target` and `display`. `dangerouslySetInnerHTML` is safe because content is OUR-rendered.
13. **`view.focus()` after toolbar action.** Each `lib/toolbar-actions.ts` helper calls `view.focus()` at the end of dispatch. Otherwise focus stays on the toolbar button after click, breaking flow.
14. **`MarkdownEditorProps` `extensions` reference stability.** Same footgun as `wikilinkCandidates`. Documented in §11.1.1 alongside the candidates pattern.
15. **`view="split"` flex layout.** Editor pane and preview pane are flex-1 children of a flex container; `gap-4` between. Container query stacks them column → row at <480px container width per description §8.5 #2.
16. **Force-graph v0.5 integration recipe.** `usage.tsx` ships the description §6.1 example as a copy-paste recipe. When force-graph v0.5 plan-lock cascades, re-validate the recipe against force-graph's locked actions (`updateNode`, `reconcileWikilinks`, etc.).

---

## 14. Definition of "done" for THIS document (stage gate)

- [ ] User reviewed §1–§12 (the plan body) and §13 (Q-Ps + §13.5 refinements).
- [ ] All 10 plan-stage questions resolved (Q-P1 to Q-P10).
- [ ] User said **"go ahead"** — sign-off applied. Stage 3 (implementation) unlocks: run §8.2 Phase A pre-flight (`pnpm add @codemirror/state @codemirror/view @codemirror/commands @codemirror/language @codemirror/lang-markdown @codemirror/autocomplete @codemirror/search @lezer/markdown @lezer/highlight marked`) FIRST, then `pnpm new:component forms/markdown-editor`.
- [ ] `Recommendation:` form converted to `**Locked: X.**`; status header flipped; [system §9 sub-doc map](../../systems/graph-system/graph-system-description.md#9-sub-document-map) updated to mark `markdown-editor` plan ✓ signed off.

The plan is signed off when (a) v0.1 implementation can begin AND (b) the `force-graph` v0.5 plan-lock cascade unlocks AND (c) **all 5 Tier 1 plans are signed off** — making the system Stage 2 plan (`graph-system-plan.md`) authorable for the first time.

---

*End of v0.1 plan draft. Pause for user validate pass per project cadence (draft → validate → re-validate → sign off → commit).*
