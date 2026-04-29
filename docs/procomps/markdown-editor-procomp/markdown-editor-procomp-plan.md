# `markdown-editor` — v0.1 Plan (Stage 2)

> **Status:** **signed off 2026-04-29.** Validate-pass refinements applied (10 fixes: 4 substantive + 6 minor — **`new Marked()` per-instance** to avoid global `marked` mutation; **CM6 `StateField` + `StateEffect` for runtime-updatable wikilinkCandidates** so decoration plugin reacts to candidates changes (was: baked-in at extension creation; broke on host graph mutations); **Q-P8 reasoning fix** — earlier-in-array = higher CM6 default precedence (was inverted; conclusion correct, reasoning wrong); **wikilink span keyboard a11y** — `tabindex="0"` + Enter/Space activation via PreviewPane delegation; `marked` v15+ outdated mention dropped; `marked` token typing via interface (drop cast); `WIKILINK_PATTERN` source string + factory for fresh `g`-flag regex instances; Q-P3 sentinel locked CM6 `Completion` shape (`apply: closeCompletion`, `type: "text"`, `boost: -100`); Q-P7 uses React 19 `useDeferredValue` for preview parse (no debounce needed); `lastSyncedValueRef` initialization locked as `useRef(value)`. All 10 Q-Ps locked.
> **Slug:** `markdown-editor` · **Category:** `forms` · **Tier:** 1 (generic; no graph dependency at the registry level)
> **Parent description:** [markdown-editor-procomp-description.md](markdown-editor-procomp-description.md) (signed off 2026-04-28)
> **Parent system:** [graph-system](../../systems/graph-system/graph-system-description.md) — Tier 1 (independent at the registry level per [decision #35](../../systems/graph-system/graph-system-description.md))
> **Sibling completion:** unblocks the [`force-graph` v0.5 plan-lock](../force-graph-procomp/force-graph-procomp-description.md) (doc nodes + wikilink reconciliation phase; 2w focused). **Tier 1 plan-lock cascade now COMPLETE — 5 of 5 done** (`properties-form`, `detail-panel`, `filter-stack`, `entity-picker` all signed off 2026-04-29). With this sign-off, **the system Stage 2 plan (`graph-system-plan.md`) becomes authorable for the first time** ([system §9](../../systems/graph-system/graph-system-description.md#9-sub-document-map)).

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
- **`[[wikilink]]` autocomplete** — typing `[[` opens CM6 autocomplete with host-supplied `wikilinkCandidates`; case-insensitive label substring match (no debounce per description Q3 lock + §8.5 #15); kind badges in popup; result limit cap of 50 with "+ N more" sentinel per Q-P3.
- **Wikilink decoration in edit mode** — CM6 `MatchDecorator` + `ViewPlugin` overlays `[[...]]` tokens (subtle background per Q-P5 lock); **candidates exposed via CM6 `StateField`** so runtime updates from host (e.g., new graph nodes) reflect in broken-link styling without remount.
- **Wikilink rendering in preview** — clickable spans; `onWikilinkClick(target)` passes the part BEFORE `|` (description Q4 lock); broken-link style for unresolved (case-insensitive + whitespace-trimmed + exact label match per description Q4); image embeds (`![[...]]`) NOT parsed (literal text per description §3 + Q4); **keyboard-accessible** (`role="link"` + `tabindex="0"` + Enter/Space activation per validate-pass refinement #4).
- **Symmetric wikilink grammar** (description §8.5 #12) — single canonical pattern in `lib/wikilink-grammar.ts`; `WIKILINK_PATTERN` source string + `makeWikilinkRegex()` factory for fresh `g`-flag instances per validate-pass refinement #7. CM6 `MatchDecorator` + autocomplete trigger + preview parser ALL reference it. Q-P2 lock.
- **GitHub-Flavored Markdown** (description Q10) — tables, strikethrough, task lists (non-interactive in preview; v0.2 adds toggle), autolink. CM6 highlighter via `@codemirror/lang-markdown` GFM option; preview parser via `marked` (Q-P1 lock; **per-instance `new Marked()` to avoid global mutation** per validate-pass refinement #1).
- **`onSave(value)` on Cmd/Ctrl+S** (description Q7) — `preventDefault` only when `onSave` supplied (description §8.5 #4). Payload is current CM6 doc, NOT React `value` prop (description §8.5 #5).
- **Standard markdown keymap** (description Q2) — Cmd+B/I/E/K layered atop CM6 defaults. Cmd+K wraps as `[sel](url)` with cursor in url slot (§8.5 #1).
- **Theming via CSS variables** (description Q5) — thin CM6 theme maps editor surface, cursor, selection, syntax tokens to `var(--*)` from globals.css. Dark/light flip with no remount.
- **`extensions` prop merge precedence** (Q-P8 lock) — user extensions appended LAST so OUR defaults win conflicts by default (CM6: earlier-in-array = higher default precedence); users escalate via `Prec.high(...)` to override.
- **Imperative ref handle** (description Q9) — `focus()`, `undo()`, `redo()`, `insertText(text)`, `getSelection()`, `getValue()`, `getView()` (escape hatch returning the underlying CM6 `EditorView`; substrate-leak risk acknowledged per §8.5 #6 + decision #19).
- **React 19 ref-as-prop** — same pattern as Tier 1 siblings (Q-P10).
- **Generic typing** — `<MarkdownEditor<TCandidate extends WikilinkCandidate>>` per description Q8 + §3.1.
- **A11y contract** — CM6 ships usable ARIA/keyboard for the editor surface; toolbar buttons have `aria-label` + `aria-pressed`; view-mode toggle is `role="tablist"` (shadcn `Tabs`); preview wikilinks are `role="link"` + keyboard-activatable.
- **Bundle ≤ 180KB total** (description success #9); CM6 substrate ~150KB + `marked` ~14KB + our code ~16KB.

**Doesn't ship in v0.1** (per description §3 + decision #30): slash commands, drag-drop image insertion, image-embed parsing, GFM task-list interactivity, live wikilink hover preview, auto-save, async wikilink candidate resolver, WYSIWYG inline rendering, collaborative editing, custom find/replace UI, spell check, lint, multi-document tabs. All v0.2+ are designed as additive — none change the v0.1 API.

**Implementation budget:** ~3 weeks focused (per system §10.2). Heaviest of the 5 Tier 1 components.

---

## 3. Final v0.1 API (locked)

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
  extensions?: ReadonlyArray<Extension>;                             // appended LAST; OUR defaults win by default; user escalates via Prec.high

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
- No `previewDebounceMs` — Q-P7 uses React 19 `useDeferredValue` for parse scheduling instead (validate-pass refinement #9).
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
  lastSyncedValueRef: React.MutableRefObject<string>;                // initialized via useRef(value) at first render
}
```

`viewRef` is a ref, not state — CM6 owns its own internal state machine; we treat the EditorView as opaque. We re-render only when our React-owned state changes (`internalView` for uncontrolled view-mode, or props change).

`lastSyncedValueRef` is initialized via `useRef(value)` per validate-pass refinement #10 — at first render the ref equals the initial value; the first sync effect's "skip if equal" check fires correctly without explicit mount-time initialization in the effect body.

### 4.2 CM6 lifecycle (Q-P9)

```
Mount:
  1. Build extension stack (theme + lang-markdown + GFM + wikilink (with StateField) + autocomplete + search + keymap + user extensions LAST)
  2. Create EditorState.create({ doc: value, extensions })
  3. Create EditorView({ state, parent: editorPaneNode })
  4. Attach updateListener that dispatches onChange(view.state.doc.toString()) when doc changes (skip when transactions carry SyncAnnotation; Q-P9 echo guard)
  5. Store EditorView in viewRef; lastSyncedValueRef.current = value (already correct from useRef(value); set explicitly for clarity)
Update (props change):
  - If `value !== lastSyncedValueRef.current && value !== view.state.doc.toString()`:
      dispatch a transaction replacing the doc with `value`; set `SyncAnnotation.of(true)` to suppress onChange echo
  - If `readOnly` changed: dispatch readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly))
  - If `wikilinkCandidates` changed: dispatch setCandidatesEffect.of(buildCandidatesMap(candidates))
      (StateField update; plugin reads field per render — see §6.2 + validate-pass refinement #2)
  - If `extensions` reference changed: full extension reconfigure via userExtensionsCompartment.reconfigure(extensions)
  - If `value` matches lastSyncedValueRef OR matches doc: no dispatch
Unmount:
  - view.destroy() — cleans up DOM + listeners
```

The **echo guard** (Q-P9 lock) prevents an `onChange` dispatch from React → host's setState → React re-render with new `value` prop → our update effect → CM6 dispatch → CM6 updateListener → `onChange` fires AGAIN. The guard:

1. CM6 transactions carry an `Annotation` (we define `SyncAnnotation`).
2. When dispatching from our update effect, set `SyncAnnotation.of(true)` on the transaction.
3. The updateListener checks `update.transactions.some(t => t.annotation(SyncAnnotation))` and skips `onChange` if true.

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

Preview pane parses `value` to HTML via a per-instance `marked` (Q-P1 lock). **Re-render strategy: parse the deferred value via React 19's `useDeferredValue` + `useMemo`** per validate-pass refinement #9. `useDeferredValue` schedules the parse at lower priority — user typing in split view stays fluid; preview catches up when idle. No internal debounce; React handles it.

```tsx
const deferredValue = useDeferredValue(value);
const html = useMemo(
  () => parseMarkdown(deferredValue, { wikilinkCandidates, kinds, hasClickHandler: Boolean(onWikilinkClick) }),
  [deferredValue, wikilinkCandidates, kinds, Boolean(onWikilinkClick)]
);
```

Wikilink resolution (clickable spans + broken-link detection) happens INSIDE `parseMarkdown` via a custom `marked` extension (Q-P5 + Q-P2 lock). The output is HTML-string-with-data-attributes; `<PreviewPane>` injects via `dangerouslySetInnerHTML` and attaches click + keyboard handlers via event delegation per §6.5.

`hasClickHandler` is forwarded so the renderer can conditionally emit `role="link"` + `tabindex="0"` only when the host actually wires a click handler (validate-pass refinement #4).

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

  // Wikilink — StateField (candidates) + ViewPlugin (decoration) per Q-P5 + validate-pass refinement #2
  ...wikilinkExtension,                                              // [candidatesField, wikilinkPlugin]

  // Autocomplete (CM6's autocomplete extension; wikilink completion source reads from candidatesField)
  autocompletion({ override: [wikilinkCompletionSource] }),

  // Theme (Q5 lock: CSS variables; lib/extensions/theme.ts)
  markdownEditorTheme,

  // Keymaps — order matters (most-specific first; each item's "run" returns true to stop further keymaps)
  keymap.of([
    ...saveKeymap(onSaveRef),                                        // Cmd+S → onSave
    ...markdownKeymap(onSaveRef),                                    // Cmd+B/I/E/K
    ...defaultKeymap,                                                // CM6 defaults (cursor moves, undo, redo, etc.)
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

  // User extensions (Q-P8 lock — appended LAST; OUR defaults win conflicts by default per CM6 precedence;
  //   user uses Prec.high(...) to escalate above ours)
  userExtensionsCompartment.of(props.extensions ?? []),
];
```

`onSaveRef` and `onChangeRef` are stable refs holding the latest callbacks (avoids reconfiguration on every render). `readOnlyCompartment` and `userExtensionsCompartment` are CM6 `Compartment`s that let us reconfigure those parts without rebuilding the full extension stack. `wikilinkExtension` is a `[candidatesField, wikilinkPlugin]` array per §6.2 — both consumed via the candidates StateField.

### 5.2 Value-prop sync (Q-P9)

Per §4.2, the CM6 lifecycle effect handles four update types (one more than draft — wikilinkCandidates added per validate-pass refinement #2):

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
  // 2. ReadOnly sync
  viewRef.current?.dispatch({
    effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly ?? false)),
  });
}, [readOnly]);

useEffect(() => {
  // 3. wikilinkCandidates sync (validate-pass refinement #2)
  const view = viewRef.current;
  if (!view) return;
  view.dispatch({
    effects: setCandidatesEffect.of(buildCandidatesMap(props.wikilinkCandidates ?? [])),
  });
}, [props.wikilinkCandidates]);

useEffect(() => {
  // 4. Extensions sync (full reconfigure on reference change)
  viewRef.current?.dispatch({
    effects: userExtensionsCompartment.reconfigure(props.extensions ?? []),
  });
}, [props.extensions]);
```

Four separate effects keyed on the relevant prop. Compartments + StateField isolate the parts that need reconfiguration without rebuilding the full extension stack. `buildCandidatesMap` constructs the lowercased+trimmed lookup map used by the decoration plugin's broken-link check.

### 5.3 Save keymap (description §8.5 #4)

`saveKeymap(onSaveRef)` returns a CM6 keymap entry that fires `onSave(view.state.doc.toString())` on Cmd/Ctrl+S **only when `onSave` is supplied**:

```ts
function saveKeymap(onSaveRef: RefObject<((value: string) => void) | undefined>): KeyBinding[] {
  return [{
    key: "Mod-s",
    preventDefault: false,                                            // we let CM6's run-returning-true mark handled
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
2. **Decoration** in edit mode — visual mark on `[[...]]` tokens, with runtime-updatable broken-link detection.
3. **Autocomplete** — popup when user types `[[`.
4. **Preview rendering** — clickable, keyboard-accessible spans + broken-link detection.

### 6.1 Symmetric grammar (Q-P2 lock)

`lib/wikilink-grammar.ts` exports a SOURCE STRING and a factory function (validate-pass refinement #7 — avoids shared `g`-flag `lastIndex` state pollution):

```ts
// Canonical wikilink pattern (locked per Q-P2 + description §8.5 #18):
// - [[label]]
// - [[label|alias]]
// - NOT image embeds (![[...]]) — caller must check isImageEmbed
// - NO nested square brackets
// - NO #anchor (deferred to v0.2)
export const WIKILINK_PATTERN = "\\[\\[([^\\[\\]\\n|]+?)(?:\\|([^\\[\\]\\n]+?))?\\]\\]";

export function makeWikilinkRegex(): RegExp {
  return new RegExp(WIKILINK_PATTERN, "g");
}

export interface WikilinkMatch {
  full: string;                                                      // "[[label]]" or "[[label|alias]]"
  label: string;                                                     // resolution target (BEFORE |), TRIMMED
  alias: string | undefined;                                         // display text (AFTER |), TRIMMED
  start: number;                                                     // offset in source
  end: number;                                                       // offset in source
}

export function findWikilinks(text: string): WikilinkMatch[] {
  const matches: WikilinkMatch[] = [];
  for (const m of text.matchAll(makeWikilinkRegex())) {              // matchAll creates a fresh iterator each call
    if (m.index === undefined) continue;
    if (isImageEmbed(text, m.index)) continue;                       // skip ![[...]]
    matches.push({
      full: m[0],
      label: m[1].trim(),                                            // captures are trimmed (Q4 description lock)
      alias: m[2]?.trim(),
      start: m.index,
      end: m.index + m[0].length,
    });
  }
  return matches;
}

export function isImageEmbed(text: string, matchStart: number): boolean {
  return matchStart > 0 && text.charAt(matchStart - 1) === "!";
}
```

`findWikilinks` uses `text.matchAll(makeWikilinkRegex())` — `matchAll` returns a fresh iterator each call so `lastIndex` state is never shared across modules. Image embeds (`![[...]]`) are skipped via `isImageEmbed`. Captures are TRIMMED per description Q4 lock (whitespace-trimmed exact label match).

This module is the SINGLE source of truth — imported by:
- `lib/extensions/wikilink.ts` (CM6 `MatchDecorator` builds its regex via `makeWikilinkRegex()`)
- `lib/extensions/wikilink-autocomplete.ts` (CM6 autocomplete trigger detection — uses a different anchored pattern, not the global one)
- `lib/parse-markdown.ts` (preview parser custom `marked` extension — uses an anchored pattern for tokenizer)

### 6.2 CM6 decoration with runtime-updatable candidates (Q-P5; validate-pass refinement #2)

`lib/extensions/wikilink.ts` exposes a StateField + ViewPlugin pair so the host can update candidates at runtime (e.g., force-graph adds a new node while editor is open):

```ts
import { StateField, StateEffect } from "@codemirror/state";
import { ViewPlugin, EditorView, Decoration, DecorationSet, MatchDecorator, ViewUpdate } from "@codemirror/view";
import { makeWikilinkRegex, isImageEmbed } from "../wikilink-grammar";
import type { WikilinkCandidate } from "../../types";

// Effect to update candidates at runtime
export const setCandidatesEffect = StateEffect.define<Map<string, WikilinkCandidate>>();

// Field holding the current candidates Map (lowercased+trimmed labels → candidate)
export const candidatesField = StateField.define<Map<string, WikilinkCandidate>>({
  create: () => new Map(),
  update: (value, tr) => {
    for (const effect of tr.effects) {
      if (effect.is(setCandidatesEffect)) return effect.value;
    }
    return value;
  },
});

// Helper: build the lookup Map from a candidates array
export function buildCandidatesMap(candidates: ReadonlyArray<WikilinkCandidate>): Map<string, WikilinkCandidate> {
  return new Map(candidates.map(c => [c.label.toLowerCase().trim(), c]));
}

// ViewPlugin: reads candidates from field; rebuilds decorations on doc OR field change
const wikilinkPlugin = ViewPlugin.fromClass(class {
  decorations: DecorationSet;
  matcher: MatchDecorator;

  constructor(view: EditorView) {
    this.matcher = new MatchDecorator({
      regexp: makeWikilinkRegex(),                                    // fresh regex per plugin instance
      decoration: (match, view, pos) => {
        const text = view.state.doc.toString();
        if (isImageEmbed(text, pos)) return null;                     // skip image embeds
        const label = match[1].trim();                                // trimmed per Q-P2
        const candidates = view.state.field(candidatesField);
        const resolved = candidates.has(label.toLowerCase());
        return Decoration.mark({
          class: resolved ? "cm-wikilink" : "cm-wikilink cm-wikilink-broken",
        });
      },
    });
    this.decorations = this.matcher.createDeco(view);
  }

  update(update: ViewUpdate) {
    const oldCandidates = update.startState.field(candidatesField, false);
    const newCandidates = update.state.field(candidatesField, false);
    if (update.docChanged || oldCandidates !== newCandidates) {
      // Rebuild from scratch on candidate change (broken-link state changes); incremental on doc-only
      this.decorations = oldCandidates !== newCandidates
        ? this.matcher.createDeco(update.view)
        : this.matcher.updateDeco(update, this.decorations);
    }
  }
}, { decorations: v => v.decorations });

// Combined export — both pieces must be in the extension stack
export const wikilinkExtension: readonly Extension[] = [candidatesField, wikilinkPlugin];
```

Theme styles `.cm-wikilink` and `.cm-wikilink-broken` map to design tokens (signal-lime accent for resolved; `--destructive` desaturated for broken). The plugin's incremental update is preserved when only the doc changes; full rebuild only on candidates change (rare relative to keystrokes).

### 6.3 CM6 autocomplete source

`lib/extensions/wikilink-autocomplete.ts` exports a completion source that reads candidates from the same StateField:

```ts
import { CompletionContext, CompletionResult, closeCompletion } from "@codemirror/autocomplete";
import { candidatesField } from "./wikilink";

export function wikilinkCompletionSource(context: CompletionContext): CompletionResult | null {
  // Trigger: the user typed `[[` and is inside an open wikilink (anchored pattern, NOT global)
  const before = context.matchBefore(/\[\[([^\[\]\n|]*)$/);
  if (!before) return null;

  const query = before.text.slice(2);                                 // strip the "[[" prefix
  const candidatesMap = context.state.field(candidatesField);
  const candidates = Array.from(candidatesMap.values());
  const filtered = filterCandidates(candidates, query);               // case-insensitive substring on label

  // Cap to 50 results per Q-P3 lock
  const capped = filtered.slice(0, 50);
  const overflow = filtered.length > 50 ? filtered.length - 50 : 0;

  return {
    from: before.from + 2,                                            // start AFTER [[
    to: context.pos,
    options: [
      ...capped.map(c => ({
        label: c.label,
        apply: (view, _completion, from, to) => {
          const insert = c.alias ? `${c.label}|${c.alias}` : c.label;
          view.dispatch({
            changes: { from, to, insert: `${insert}]]` },             // close brackets atomically
            selection: { anchor: from + insert.length + 2 },          // place cursor AFTER ]]
          });
        },
        info: () => renderInfoPanel(c),                               // returns DOM node with kind badge + label
      })),
      ...(overflow > 0
        ? [{
            label: `…and ${overflow} more (refine search)`,
            apply: (view: EditorView) => closeCompletion(view),       // sentinel: closes popup; doesn't insert
            type: "text" as const,                                    // visual differentiator
            boost: -100,                                              // sort to bottom
          }]
        : []),
    ],
    validFor: /^[^\[\]\n|]*$/,                                        // popup stays open while user types within token
  };
}
```

Q-P3 sentinel locked CM6 representation per validate-pass refinement #8: `apply: (view) => closeCompletion(view)` (closes popup without inserting); `type: "text"` (visual differentiator from real candidates); `boost: -100` (sorts to bottom). Hosts with massive candidate lists (10k+) get a usable popup at the cost of needing to refine the query.

`renderInfoPanel(c)` builds a DOM node with the kind badge (using `kinds[c.kind]`) + the label. CM6's autocomplete shows this in the side panel — better than overcrowding the row.

The autocomplete source is registered ONCE in the extension stack (`autocompletion({ override: [wikilinkCompletionSource] })`); it reads candidates via `context.state.field(candidatesField)` so runtime updates flow through naturally without re-registering the source.

### 6.4 Preview rendering — wikilinks via per-instance `marked` (Q-P1)

`lib/parse-markdown.ts` uses a **per-instance `Marked`** to avoid global state mutation (validate-pass refinement #1):

```ts
import { Marked, type Tokens } from "marked";
import { isImageEmbed } from "./wikilink-grammar";
import type { WikilinkCandidate, KindMeta } from "../types";

interface WikilinkToken extends Tokens.Generic {
  type: "wikilink";
  raw: string;
  label: string;
  alias: string | undefined;
}

const wikilinkExtension = {
  extensions: [{
    name: "wikilink",
    level: "inline" as const,
    start: (src: string) => src.indexOf("[["),
    tokenizer(src: string): WikilinkToken | undefined {
      const match = src.match(/^\[\[([^\[\]\n|]+?)(?:\|([^\[\]\n]+?))?\]\]/);
      if (!match) return undefined;
      return {
        type: "wikilink",
        raw: match[0],
        label: match[1].trim(),
        alias: match[2]?.trim(),
      };
    },
    renderer(token: WikilinkToken): string {
      const display = token.alias ?? token.label;
      // Resolution + broken-link detection happen at render time via dataset attributes;
      // <PreviewPane> attaches click + keyboard handlers via event delegation
      return `<span class="wikilink" data-wikilink-target="${escapeHtml(token.label)}">${escapeHtml(display)}</span>`;
    },
  }],
};

// Per-instance Marked — created once at module load; private to markdown-editor.
// Avoids the global `marked.use()` mutation that would pollute every other consumer of `marked` in the bundle.
const customMarked = new Marked();
customMarked.use({ gfm: true, breaks: false }, wikilinkExtension);

interface ParseOpts {
  wikilinkCandidates?: ReadonlyArray<WikilinkCandidate>;
  kinds?: Record<string, KindMeta>;
  hasClickHandler: boolean;                                           // forwarded for ARIA conditional
}

export function parseMarkdown(source: string, opts: ParseOpts): string {
  const html = customMarked.parse(source, { async: false }) as string;

  // Post-process: mark broken wikilinks via dataset; conditionally add role+tabindex when interactive
  if (!opts.wikilinkCandidates) {
    return opts.hasClickHandler
      ? html.replace(/<span class="wikilink" data-wikilink-target="([^"]+)">/g,
          (_, target) => `<span class="wikilink" role="link" tabindex="0" data-wikilink-target="${target}">`)
      : html;
  }
  const labelSet = new Set(opts.wikilinkCandidates.map(c => c.label.toLowerCase().trim()));
  const interactive = opts.hasClickHandler;
  return html.replace(/<span class="wikilink" data-wikilink-target="([^"]+)">/g, (_, target) => {
    const resolved = labelSet.has(target.toLowerCase().trim());
    const classes = `wikilink${resolved ? "" : " wikilink-broken"}`;
    const roleAttr = interactive ? ' role="link" tabindex="0"' : "";
    return `<span class="${classes}"${roleAttr} data-wikilink-target="${target}">`;
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[ch]!);
}
```

Per-instance `Marked` is module-scoped — created once at module load; same config across all markdown-editor mounts in the bundle (safe — same config). Alternative (per-component-mount instance via `useMarkdownParser()` hook) is more isolated but unnecessary; module-scope is simpler and correct.

The renderer uses a typed `WikilinkToken` interface (validate-pass refinement #6) — no `as` cast.

The `hasClickHandler` flag drives conditional `role="link"` + `tabindex="0"` (validate-pass refinement #4) — only marked interactive when host actually wires `onWikilinkClick`. Without it, spans render styled but inert; not focusable; no fake link affordance for screen readers.

Image embed handling: `marked`'s built-in image tokenizer matches `![alt](src)` for normal markdown images; `![[wikilink-style]]` is not matched by either the image tokenizer OR our wikilink tokenizer (because our regex doesn't allow leading `!`). It falls through to plain-text rendering. ✓ matches description §3 + Q4 lock.

### 6.5 Click + keyboard handling in preview (validate-pass refinement #4)

`<PreviewPane>` uses event delegation on its root container for both mouse AND keyboard activation:

```tsx
function PreviewPane({ html, onWikilinkClick }: PreviewPaneProps) {
  const handleActivation = useCallback((target: HTMLElement) => {
    const span = target.closest("[data-wikilink-target]");
    if (!span) return;
    const wikilinkTarget = span.getAttribute("data-wikilink-target");
    if (wikilinkTarget && onWikilinkClick) {
      onWikilinkClick(wikilinkTarget);
    }
  }, [onWikilinkClick]);

  const onClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();                                               // suppress any default link behavior
    handleActivation(e.target as HTMLElement);
  }, [handleActivation]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const target = e.target as HTMLElement;
    if (!target.matches("[data-wikilink-target]")) return;
    e.preventDefault();
    handleActivation(target);
  }, [handleActivation]);

  return (
    <div
      className="markdown-preview"
      role="article"
      onClick={onClick}
      onKeyDown={onKeyDown}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

`role="link"` + `tabindex="0"` on the spans (when interactive) makes them keyboard-focusable; Tab cycles through wikilinks in the preview pane. Enter and Space activate the link (matching native `<a>` behavior).

Inert spans (when `onWikilinkClick` is undefined): no `role` or `tabindex`; spans remain visually styled but are not focusable and not announced as links. No phantom-link UX.

XSS posture: `marked` escapes user-supplied HTML in default content; we additionally escape `target` and `display` in the renderer; no untrusted HTML enters. `dangerouslySetInnerHTML` is acceptable here because the content is OUR-rendered HTML.

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

The constant is `ReadonlyArray` so hosts can't accidentally mutate it (which would affect every consumer in the same module).

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

Layout: flex-row with optional separators (host can interleave `{ id: "sep", label: "" }` items — rendered as a thin vertical line via §13.5 #7 refinement).

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
│   ├── preview-pane.tsx               # markdown-rendered HTML; click + keyboard delegation for wikilinks
│   ├── view-toggle.tsx                # edit/preview/split tabs (shadcn Tabs)
│   ├── toolbar.tsx                    # toolbar layout (renders ToolbarItem[])
│   ├── toolbar-button.tsx             # single button + Tooltip + active state
│   └── kind-badge.tsx                 # Badge wrapper for autocomplete popup info panel
├── hooks/
│   ├── use-codemirror.ts              # CM6 lifecycle: mount, value sync, readOnly sync, candidates sync, extensions sync
│   ├── use-imperative-handle.ts       # builds the MarkdownEditorHandle (focus/undo/redo/insertText/etc.)
│   ├── use-view-mode.ts               # controlled-or-uncontrolled view-mode dispatch
│   └── use-toolbar-state.ts           # useSyncExternalStore for CM6 selection-change tracking
├── lib/
│   ├── extensions/
│   │   ├── theme.ts                   # CM6 theme mapping to globals.css CSS variables (Q5 + §8.5 #5)
│   │   ├── wikilink.ts                # CM6 candidatesField + setCandidatesEffect + wikilinkPlugin (Q-P5)
│   │   ├── wikilink-autocomplete.ts   # CM6 autocomplete source reading candidatesField (§6.3 of plan)
│   │   ├── save-keymap.ts             # Cmd/Ctrl+S → onSave (§5.3 of plan)
│   │   ├── markdown-keymap.ts         # Cmd+B/I/E/K (§5.4 of plan)
│   │   └── compartments.ts            # readOnlyCompartment, userExtensionsCompartment exports
│   ├── parse-markdown.ts              # GFM markdown → HTML via per-instance `new Marked()` + wikilink extension (§6.4)
│   ├── wikilink-grammar.ts            # WIKILINK_PATTERN string + makeWikilinkRegex factory (Q-P2; §6.1)
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
- `lib/wikilink-grammar.ts` — `WIKILINK_PATTERN` source string + `makeWikilinkRegex()` factory + `findWikilinks` + `isImageEmbed` (single source of truth; consumed by 3 downstream modules)
- `lib/sync-annotation.ts` — echo-guard annotation
- `lib/extensions/compartments.ts` — Compartment exports
- `lib/extensions/theme.ts` — CSS-variable theme mapping (Q5 + §8.5 #5; verify dark/light flip with no remount in Phase B)
- `lib/extensions/save-keymap.ts`, `lib/extensions/markdown-keymap.ts` — keymaps with onSaveRef
- `lib/extensions/wikilink.ts` — `candidatesField` + `setCandidatesEffect` + `wikilinkPlugin` per §6.2
- `lib/extensions/wikilink-autocomplete.ts` — completion source reading candidatesField (§6.3)
- `lib/parse-markdown.ts` — per-instance `new Marked()` + wikilink extension + post-process broken-link + interactive-role marking (§6.4)
- `lib/toolbar-actions.ts` — wrapSelection / toggleLinePrefix / insertText / cycleHeading
- `hooks/use-codemirror.ts` — CM6 lifecycle (mount/destroy + 4 sync effects per §5.2: value, readOnly, candidates, extensions)
- `hooks/use-view-mode.ts` — controlled/uncontrolled dispatch
- `hooks/use-toolbar-state.ts` — useSyncExternalStore for selection-change tracking
- `hooks/use-imperative-handle.ts` — handle builder
- **Phase A end gate:** smoke-test the canonical `wikilink-grammar.ts` regex against a fixture covering `[[label]]`, `[[label|alias]]`, `![[image.png]]` (image — must not match), `[[label with spaces]]`, `[[]]` (empty — must not match), `[[label]] [[label2]]` (adjacent — both match), `[[outer[[inner]]]]` (nested — outer not matched). Verify CM6 `MatchDecorator`, autocomplete trigger, and `marked` extension all agree on token boundaries. **Smoke-test value-sync echo guard** with a host that calls `setValue` from inside `onChange` (no infinite loop expected). **Smoke-test runtime candidates update** — open editor with `wikilinkCandidates=[A, B]`; type `[[A]]` (resolved, not broken); update prop to `wikilinkCandidates=[]`; verify decoration flips to broken-link styling without remount.
- Unit-testable in isolation when Vitest lands; v0.1 verification is demo-driven.

**Phase B — rendering (~5 days):**
- `parts/kind-badge.tsx` — KindMeta → Badge with color
- `parts/toolbar-button.tsx` — Button + Tooltip + active state
- `parts/toolbar.tsx` — toolbar layout
- `parts/view-toggle.tsx` — shadcn Tabs wrapper
- `parts/editor-pane.tsx` — CM6 host (mounts EditorView via use-codemirror hook)
- `parts/preview-pane.tsx` — html injection + click + keyboard delegation (§6.5)
- `default-toolbar.tsx` — 8 built-in items
- `markdown-editor.tsx` — main component (overload for ref-as-prop generic; extension stack composition; view-mode dispatch; wires all parts; `useDeferredValue` for preview parse input)
- Phase B end: `axe-core` smoke run for editor surface + toolbar + view-toggle + wikilink-keyboard-accessibility (Tab cycles through preview wikilinks; Enter/Space activates). Verify dark/light theme flip with no remount. Verify split-view container-query stacking on a narrow container fixture (description §8.5 #2). Verify the wikilink-autocomplete popup positions correctly near the caret.

**Phase C — demos + integration (~5 days):**
- `demo.tsx` (8 sub-demos covering description success #12), `dummy-data.ts`, `usage.tsx`, `meta.ts`, `index.ts`
- Verify `tsc + lint + build` clean
- Verify all 12 success-criteria items
- Verify the force-graph v0.5 integration recipe in `usage.tsx` matches force-graph's plan-locked actions (re-validation gate when force-graph v0.5 plan-lock cascades)
- **Verify bundle weight via `size-limit`** (description §8.5 #11) — CM6 substrate ~150KB + `marked` ~14KB + our code ~16KB ≤ 180KB ceiling

---

## 9. ARIA contract

Per description success #10. CM6 ships usable ARIA/keyboard for the editor surface; our additions are toolbar + view-toggle + autocomplete-popup ARIA + interactive wikilink spans (validate-pass refinement #4).

| Element | ARIA |
|---|---|
| Component root | `<div className="markdown-editor">` no implicit role; `aria-label={ariaLabel}` if supplied |
| Toolbar | `<div role="toolbar" aria-label="Markdown editor toolbar">` |
| Toolbar button | `<button aria-label={item.label}>`; `aria-pressed={isActive ? "true" : "false"}` when `isActive` defined; `aria-keyshortcuts={item.shortcut}` |
| View toggle | shadcn `<Tabs>` provides `role="tablist"`; each `<TabsTrigger>` is `role="tab"` |
| Editor pane (CM6) | CM6 provides `role="textbox"` + `aria-multiline="true"` natively; `aria-label={ariaLabel}` overlay |
| Preview pane | `<div role="article">` with the rendered markdown; `onClick` + `onKeyDown` event delegation for wikilinks |
| Split view | `role="group" aria-label="Editor and preview"` on the wrapper |
| Wikilink span (preview) — interactive | `<span class="wikilink" role="link" tabindex="0" data-wikilink-target="...">`; rendered when `onWikilinkClick` is supplied; Enter/Space activates via PreviewPane delegation |
| Wikilink span (preview) — inert | `<span class="wikilink" data-wikilink-target="...">` (NO role, NO tabindex); rendered when `onWikilinkClick` is undefined; styled but not focusable / not announced as link |
| Broken wikilink (preview) | adds `wikilink-broken` class; same role/tabindex behavior as resolved (interactive iff onWikilinkClick) |
| Wikilink autocomplete popup | CM6's autocomplete provides `role="listbox"` + `role="option"` + `aria-activedescendant`; we add the kind-badge inside the info panel |
| "+ N more" overflow row | `apply: closeCompletion` (sentinel); `type: "text"` + `boost: -100` for visual differentiator + bottom-sort |

CM6's built-in keyboard (cursor moves, undo, redo, history, search, indent) operates inside the editor pane. Toolbar button shortcuts operate globally within the component (Tab focus order: toolbar → editor → view-toggle → preview pane links).

Focus management:
- **`focus()` ref method** → `view.focus()` (focus moves into editor pane).
- **View-mode change** → focus stays where it was if possible (CM6 retains focus through prop changes).
- **Toolbar button click** → focus returns to editor pane after action via `view.focus()` in each action's tail.
- **Wikilink keyboard activation** → `onWikilinkClick(target)` fires; focus stays on the wikilink span (host's choice whether to navigate elsewhere).

---

## 10. Edge cases (locked)

| Case | Handling |
|---|---|
| `value` prop changes externally while user is mid-typing | Echo-guard (§4.2) skips `onChange` for sync transactions; CM6 dispatches the new doc; cursor position best-effort (CM6 maps selection through changes). Rare in single-user UIs. |
| User presses Cmd+S with no `onSave` supplied | Browser's native save dialog fires (description §8.5 #4). No surprise behavior. |
| User presses Cmd+S with `onSave` supplied AND CM6 has uncommitted typing | `onSave(view.state.doc.toString())` fires with current CM6 doc value (description §8.5 #5) — fresher than React `value` prop in case of batching. |
| `wikilinkCandidates` is empty | Autocomplete trigger still fires when user types `[[`, but the popup shows no results. CM6 closes the popup automatically. Plain `[[...]]` text passes through and renders broken in preview. |
| `wikilinkCandidates` has 10k+ entries | Cap to 50 visible per Q-P3 lock with "+ N more (refine search)" sentinel. Hosts refine via query. |
| Duplicate `label` in `wikilinkCandidates` | `Map` lookup uses last-write-wins (later entries shadow earlier). Dev-only `console.warn` once per session per duplicate label. Reconciliation tiebreaking lives in force-graph v0.5 per [decision #36](../../systems/graph-system/graph-system-description.md), NOT here. |
| `wikilinkCandidates` is referentially unstable (inline arrow) | Same footgun as filter-stack's `categories` and entity-picker's `items`. Each render dispatches a new `setCandidatesEffect`; CM6 handles cleanly but unnecessary churn. Mitigated by React Compiler in-repo; documented in usage for NPM consumers. See §11.1.1. |
| `wikilinkCandidates` change at runtime (host adds new graph node) | StateField update via `setCandidatesEffect`; decoration plugin rebuilds decorations; broken-link styling flips to resolved without remount. Phase A end gate verifies. |
| `onWikilinkClick` undefined | Wikilink spans render styled but inert (no role/tabindex; no click handler dispatched). |
| `onWikilinkClick` defined but resolves to no-op (host's choice) | Span fires `onWikilinkClick(target)`; host decides what to do (navigate, log, etc.). |
| Image embed (`![[image.png]]`) in source | Renders as literal text in preview (description §3 + Q4); CM6 grammar matches `[[image.png]]` portion but `MatchDecorator`'s `isImageEmbed` check skips when prefix is `!`. |
| `[[label#anchor]]` | NOT supported in v0.1 per description §8.5 #18. Anchor portion treated as part of the label by current regex; reconciliation behavior is host's concern. v0.2 adds anchor parsing. |
| `[[label]] [[label2]]` adjacent wikilinks | Both decorated independently; both autocomplete-trigger correctly when typing into either. Verified via Phase A grammar smoke test. |
| Empty selection + `wrapSelection("**", "**")` | Inserts `****` and places cursor between the markers. Subsequent typing produces bold text. |
| Empty selection + `toggleLinePrefix("> ")` | Adds `> ` to the current line; if already prefixed, removes. |
| Multi-line selection + `toggleLinePrefix` | Per §7.2: adds prefix to every line; if all already have it, removes from every line. |
| `view="split"` on a narrow container (<480px) | Stacks vertically via container query (description §8.5 #2). Editor pane on top, preview pane below; each takes 50% of the container's height. |
| `readOnly: true` + user types | CM6's read-only mode rejects the input; no `onChange` fires. |
| `readOnly: true` + `view="edit"` | Editor renders with syntax highlighting but is non-editable (description §8.5 #3). |
| `extensions` reference changes mid-life | Full extension reconfigure via `userExtensionsCompartment.reconfigure(...)`. CM6 handles cleanly; no remount needed. |
| User extension conflicts with our keymap (e.g., Cmd+B) | OUR keymap wins by default (earlier-in-array per CM6 precedence per Q-P8 lock). User uses `Prec.high(keymap.of([...]))` to override. |
| `getView()` called before mount | Returns `null`; dev-only `console.warn` once per session. |
| `getView()` called after unmount | Returns `null`; dev-only `console.warn`. |
| `insertText("")` (empty string) | No-op; dispatches an empty change which CM6 treats as identity. |
| Long markdown doc (50KB+) | `marked` parses ~50ms; React 19 `useDeferredValue` schedules at low priority so typing stays fluid; preview catches up when idle. CM6 handles editing with native virtualization. |
| `value` contains special CM6-significant characters (e.g., line separators, carriage returns) | CM6 normalizes line endings to `\n` internally; on `getValue()` we return CM6's normalized form. Documented. Hosts that need original line endings preserve them externally. |
| Rapid `value` prop changes (host typing into a textarea elsewhere that mirrors here) | Each prop change triggers a sync dispatch; CM6 handles fast updates well. Cursor maps through changes. Echo guard prevents loops. |
| Wikilink span keyboard nav (Tab order) | Spans with `role="link" tabindex="0"` are reachable via Tab in the preview pane; Enter/Space activates. Broken links are also focusable but `onWikilinkClick(target)` resolves at host (typically navigate to creation flow or no-op). |

---

## 11. Performance + bundle

### 11.1 Performance

- **CM6 native virtualization** — `EditorView` only renders lines visible in the viewport; long documents (10k+ lines) remain fluid.
- **`marked` preview parsing** — synchronous, ~5ms for typical docs / ~50ms for 50KB. Scheduled via `useDeferredValue` (low priority); won't block typing.
- **`MatchDecorator` for wikilinks** — incremental updates on doc changes; only re-runs against changed regions, not the whole doc. Full rebuild only on candidates change (rare).
- **Toolbar active state** — `useSyncExternalStore` keyed on a CM6-update counter; only re-renders on selection-change events (NOT every keystroke unless the keystroke also moves selection, which it does for typing).
- **Wikilink candidate index** — `Map<string, T>` keyed on lowercased+trimmed label; built once per `wikilinkCandidates` reference change via the StateField setCandidatesEffect dispatch.
- **Echo-guard ref `lastSyncedValueRef`** — avoids unnecessary `view.state.doc.toString()` calls on every value-prop change.

#### 11.1.1 `wikilinkCandidates` reference stability (host responsibility)

Same footgun as [filter-stack's `categories`](../filter-stack-procomp/filter-stack-procomp-plan.md#1011-categories-reference-stability-host-responsibility), [properties-form's `schema`](../properties-form-procomp/properties-form-procomp-plan.md#1111-schema-reference-stability-host-responsibility), and [entity-picker's `items`](../entity-picker-procomp/entity-picker-procomp-plan.md#1011-items-reference-stability-host-responsibility). Hosts that pass an inline `wikilinkCandidates={[...]}` literal create new candidate object references on every parent render. Without reference stability, our useEffect dispatches `setCandidatesEffect` on every render — extra CM6 work, but the StateField pattern handles it cleanly (no remount; just decoration rebuild).

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
| Wikilink grammar mismatches between CM6 and preview parser | **Phase A end gate** smoke-tests the canonical regex against a fixture; both the CM6 `MatchDecorator` and the `marked` extension import from `lib/wikilink-grammar.ts`. Single source of truth via `WIKILINK_PATTERN` string + `makeWikilinkRegex()` factory (validate-pass refinement #7 — fresh `g`-flag regex per use). |
| Per-instance `Marked` somehow leaks state between mounts | Module-scoped `customMarked` is created once at module load; same config across mounts; no per-mount mutation. Verified by inspection — `customMarked.use()` is called at module-init time, not at parse time. |
| Wikilink decoration doesn't update on candidates change | StateField + setCandidatesEffect pattern (validate-pass refinement #2) — Phase A end gate verifies via "open editor with candidates=[A]; type [[A]]; clear candidates; verify decoration flips to broken-link." |
| `marked` extension API changes between minor versions | Pin `marked` to a specific minor version in `package.json`; document the upgrade path. `marked`'s extension API has been stable for ~2 years. |
| Theme dark/light flip causes editor remount | CM6 styles use `var(--*)` references (Q5 + §8.5 #5); browser updates the computed values at the document level without notifying CM6. Phase B verifies via demo with theme toggle. If broken, switch to a `EditorView.theme()` that's reconfigured via Compartment on theme change (more code, same outcome). |
| Cmd+S conflicts with browser save when `onSave` is supplied | `preventDefault: false` in the keymap entry; CM6's `run` returning `true` is the standard mechanism (CM6 handles preventDefault internally when run returns true). |
| Split-view container-query stacking doesn't work in older Safari | Container queries are supported in Safari 16+; we don't support older. Documented; if real consumers report issues, add a viewport-query fallback. |
| Toolbar tooltip `Tooltip` install is needed but not yet in repo | Tooltip is queued by [properties-form Phase A](../properties-form-procomp/properties-form-procomp-plan.md#82-build-order-within-v01) — first sibling to install lands it for everyone. If markdown-editor implements before properties-form, run that install in markdown-editor's Phase A pre-flight too. |
| Wikilink span keyboard activation breaks under custom CSS | `<PreviewPane>`'s `onKeyDown` delegation reads `target.matches("[data-wikilink-target]")` — works regardless of CSS. axe-core verifies in Phase B. |
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
- **Module-level `marked.use(...)` pollution** — rejected on validate pass; per-instance `new Marked()` keeps our config private (validate-pass refinement #1).
- **Bake candidates into wikilink plugin at extension-creation time** — rejected on validate pass; doesn't react to runtime updates. StateField + StateEffect is the canonical CM6 pattern (validate-pass refinement #2).
- **Roll-our-own debounced preview** — rejected; React 19's `useDeferredValue` handles the typical case (validate-pass refinement #9). v0.2 may add explicit `previewDebounceMs` if real consumers need finer control.

---

## 13. Resolved plan-stage questions (locked on sign-off 2026-04-29)

All 10 questions resolved at sign-off. **Q-P1 + Q-P5 + Q-P7 + Q-P8 refined on validate pass** (Q-P1: per-instance `new Marked()` instead of global `marked.use()`; Q-P5: StateField + StateEffect for runtime-updatable candidates instead of bake-in; Q-P7: `useDeferredValue` instead of "no debounce"; Q-P8: reasoning rewritten — earlier-in-array = HIGHER CM6 default precedence). **High-impact:** Q-P1 (preview parser; refined on validate pass), Q-P2 (symmetric wikilink grammar), Q-P5 (CM6 wikilink extension architecture; refined on validate pass), Q-P9 (CM6 value-prop sync + echo guard). **Medium:** Q-P3 (autocomplete result limit), Q-P6 (toolbar action implementation), Q-P7 (preview re-render strategy; refined on validate pass), Q-P8 (extensions prop merge precedence; refined on validate pass). **Low:** Q-P4 (default toolbar export), Q-P10 (ref-as-prop pattern consistency).

### Q-P1 (from description §8.5 #9; refined on validate pass) — Preview parser: `marked` vs `markdown-it`

**Locked: `marked` via per-instance `new Marked()`** per §6.4. `marked` is ~14KB minified+gzipped; `markdown-it` is ~40KB with default plugins. Both support GFM (description Q10); `marked`'s extension API is stable, well-documented, and lets us register a custom `wikilink` inline tokenizer cleanly.

**Refined on validate pass:** the original recommendation showed `marked.use(...)` at module load — but `marked.use()` mutates the **global** `marked` instance. Any other consumer of `marked` in the same bundle (a docs-site README parser, a different markdown surface, a third-party library) inherits our wikilink extension AND our GFM/breaks config. Real production bug. Fix: `const customMarked = new Marked(); customMarked.use({ gfm: true, breaks: false }, wikilinkExtension);` — module-scoped private instance; same config across all markdown-editor mounts; no global pollution.

Bundle weight is the tiebreaker. `markdown-it` has a richer ecosystem (more plugins) but we don't need any of them in v0.1; `marked` covers tables, strikethrough, task lists, autolink natively.

**Impact:** high — fixes the preview-parser library, drives the wikilink-extension API and the bundle audit. Refined on validate pass for instance-isolation correctness.
**Trade-off:** if v0.2 needs a feature only `markdown-it` ecosystem provides (e.g., footnotes via `markdown-it-footnote`), migrating is a Phase B-level rewrite of `lib/parse-markdown.ts`. Acceptable; description §3 currently has no such feature in the v0.2 roadmap.

### Q-P2 (from description §8.5 #12) — Symmetric wikilink grammar

**Locked: single canonical `WIKILINK_PATTERN` source string + `makeWikilinkRegex()` factory in `lib/wikilink-grammar.ts`** per §6.1. The factory returns fresh `g`-flag regex instances to avoid shared `lastIndex` state pollution across modules (validate-pass refinement #7). Three downstream consumers import:

1. `lib/extensions/wikilink.ts` (CM6 `MatchDecorator` builds its regex via `makeWikilinkRegex()`)
2. `lib/extensions/wikilink-autocomplete.ts` (uses an anchored variant for trigger detection)
3. `lib/parse-markdown.ts` (uses an anchored variant in the `marked` tokenizer)

Captures are TRIMMED via the `findWikilinks` helper per description Q4 lock (whitespace-trimmed exact label match).

**Phase A end gate** smoke-tests the regex against a fixture: `[[label]]` (match, label-only), `[[label|alias]]` (match, label + alias), `![[image.png]]` (image; match but `isImageEmbed` filters), `[[label with spaces]]` (match), `[[]]` (empty; must NOT match), `[[label]] [[label2]]` (adjacent; both match), `[[outer[[inner]]]]` (nested; outer NOT matched per Q-P2 lock — no nested brackets per description §8.5 #18).

**Impact:** high — defines the wikilink contract across edit / autocomplete / preview surfaces.
**Trade-off:** any change to the pattern must update the fixture and re-run smoke tests; v0.2 additions like `[[label#anchor]]` (description §8.5 #18) require coordinated changes across all 3 consumers. Single source of truth makes this manageable; documented.

### Q-P3 (from description §8.5 #16) — Wikilink autocomplete result limit

**Locked: cap visible results to 50, with "+ N more (refine search)" sentinel** as the last item per §6.3. Sentinel CM6 representation: `{ label: "…and N more (refine search)", apply: (view) => closeCompletion(view), type: "text", boost: -100 }` — closes popup without inserting; visually distinct from real results; sorts to bottom. Matches validate-pass refinement #8.

Hosts with 10k+ candidates get a usable popup (no virtualization in v0.1; deferred to v0.2 per description §3). Refining the query narrows results below the cap.

**Impact:** medium — affects scalability + UX for large candidate sets.
**Trade-off:** users with very common label prefixes (e.g., 200 nodes with "person" prefix) hit the cap quickly. Documented; v0.2 adds opt-in virtualization or `popupMaxResults?: number` prop.

### Q-P4 (from description §8.5 #20) — Default toolbar export

**Locked: export `defaultMarkdownToolbar: ReadonlyArray<ToolbarItem>`** as a named constant from `default-toolbar.tsx`, re-exported from `index.ts` per §7.1. Hosts spread + extend per description §6.2.

The constant is `ReadonlyArray` so hosts can't accidentally mutate it (which would affect every consumer in the same module).

**Impact:** low — primarily a discoverability + ergonomic affordance.
**Trade-off:** none — additive export, no API surface change.

### Q-P5 (NEW; refined on validate pass) — Wikilink CM6 extension architecture

**Locked: `MatchDecorator` + `ViewPlugin` for decoration; `@codemirror/autocomplete` `CompletionSource` for autocomplete; both consume candidates via a CM6 `StateField` + `StateEffect`** per §6.2 + §6.3. Two separate extensions, both reading from the same StateField:

1. **`candidatesField` (StateField)** — holds the current `Map<string, WikilinkCandidate>`; updated via `setCandidatesEffect` dispatched from React's value-sync effect on `wikilinkCandidates` prop change (validate-pass refinement #2).
2. **`wikilinkPlugin` (ViewPlugin)** — uses `MatchDecorator(makeWikilinkRegex())` to mark `[[...]]` tokens; checks `candidatesField` for broken-link styling. Rebuilds decorations on doc OR field change (incremental update on doc; full rebuild on field change).
3. **`wikilinkCompletionSource` (CompletionSource)** — reads `context.state.field(candidatesField)` per completion request; filters case-insensitive substring; caps to 50 with sentinel.

**Refined on validate pass:** the original recommendation baked candidates into the plugin at extension-creation time. When `wikilinkCandidates` change at runtime (host adds a new graph node), the decoration plugin would use the OLD Map — broken-link styling stale until full extension reconfigure. StateField + StateEffect is the canonical CM6 pattern for runtime-updatable data. Phase A end gate verifies via "open editor with candidates=[A]; type [[A]]; clear candidates; verify decoration flips to broken-link without remount."

Alternatives considered:
- **Bake candidates into plugin at extension-creation time** — rejected on validate pass per above.
- **Lezer parser extension** for wikilinks — proper grammar integration; would let CM6's syntax tree include wikilink nodes, enabling things like "highlight inside wikilink differently from prose." But: complex to implement; the `MatchDecorator` covers the v0.1 needs (visual mark on tokens). Rejected for v0.1; v0.2 may upgrade if structural-tree access is needed.
- **Single combined extension** (decoration + autocomplete in one ViewPlugin) — rejected for separation of concerns; CM6's autocomplete extension is a separate concern from decoration.

**Impact:** high — defines the CM6 integration shape; touches every wikilink interaction. Refined on validate pass for runtime-updatability correctness.
**Trade-off:** `MatchDecorator` is regex-based, so it doesn't survive structural transformations (e.g., a hypothetical "auto-fix wikilink" feature in v0.2 would need parser-tree access). Acceptable for v0.1.

### Q-P6 (NEW) — Toolbar action / `ToolbarCtx` implementation

**Locked: `ToolbarCtx` exposes `view` + `value` + 3 helpers (`insertText`, `wrapSelection`, `toggleLinePrefix`)** per §7.2. Helpers live in `lib/toolbar-actions.ts` and dispatch CM6 transactions directly. Default toolbar items use the same helpers (no separate "default" API; symmetric with custom items).

`buildToolbarCtx(view)` is called per toolbar render; the ctx object is fresh each time but the dispatch helpers are stable closures over `view`.

**Impact:** medium — defines the toolbar extension contract.
**Trade-off:** the helpers operate on the current view; if a toolbar item needs the doc value at the time of click (vs the doc value at render time), it reads `ctx.value` (which is a snapshot at ctx-build time) — close enough for typical use. Hosts wanting the absolute-freshest value use `ctx.view.state.doc.toString()` directly.

### Q-P7 (NEW; refined on validate pass) — Preview rendering re-render strategy

**Locked: `useDeferredValue` + `useMemo` for the parse input** per §4.5. React 19's `useDeferredValue(value)` schedules the parse at lower priority — user typing in split view stays fluid; preview catches up when idle. No internal debounce; React handles it. v0.2 deferral of `previewDebounceMs` is REMOVED (no longer needed; React handles the typical case natively).

**Refined on validate pass:** the original recommendation was "parse on every value change via `useMemo`; no internal debounce." For split-view typing on large docs (~50KB), `marked` parsing on every keystroke produces visible jank. `useDeferredValue` is React 19's idiomatic solution — the parse runs at a lower priority than user input; perceived typing latency stays low.

**Impact:** medium — affects perceived typing-while-preview-visible UX.
**Trade-off:** for >100KB docs, parsing could still feel sluggish (~100ms+) — but `useDeferredValue` lets React interleave parsing with input, smoothing the experience. v0.2 may add explicit `previewDebounceMs` if real consumers report jank on extreme doc sizes.

### Q-P8 (NEW; refined on validate pass) — `extensions` prop merge precedence

**Locked: user extensions appended LAST in the extension stack** per §5.1. **Refined on validate pass:** earlier-in-array = HIGHER CM6 default precedence (per CM6 extension-resolution docs). User-LAST means OUR defaults are checked first by default; our keymap wins built-in-key conflicts. Hosts override via `Prec.high(keymap.of([...]))` to escalate above our defaults. For new bindings (keys we don't bind), user's keymap fires normally because our keymap doesn't intercept.

The original draft's reasoning ("later extensions override earlier ones for keymap conflicts") had CM6 semantics inverted. The CONCLUSION (user-LAST) was correct (= our defaults win by default), but the mechanism was misstated. Refined wording on validate pass.

```ts
const extensions = [
  ...ourExtensions,                                                    // theme, lang-markdown, autocomplete, wikilink, search, history, our keymap (FIRST = HIGHEST default precedence)
  ...(props.extensions ?? [])                                          // user extensions LAST (LOWER default precedence; user uses Prec.high to override)
];
```

**Impact:** medium — defines the extension-conflict behavior visible to power users.
**Trade-off:** if a user passes an extension that conflicts with our wikilink decoration (rare), our defaults win. Documented in usage; users wanting to disable a specific built-in feature use `Prec.high` or the `getView()` escape hatch.

### Q-P9 (NEW) — CM6 value-prop sync + echo guard

**Locked: four separate effects for value / readOnly / wikilinkCandidates / extensions sync, each with `Compartment.reconfigure()` or `StateEffect.of()` dispatch; `SyncAnnotation` echo guard on the value-sync transaction; `lastSyncedValueRef` initialized via `useRef(value)`** per §4.2 + §5.2 + validate-pass refinement #10.

The echo guard:
1. Define `SyncAnnotation = Annotation.define<boolean>()` in `lib/sync-annotation.ts`.
2. Value-sync effect dispatches `view.dispatch({ changes: ..., annotations: SyncAnnotation.of(true) })`.
3. `EditorView.updateListener` checks `update.transactions.some(t => t.annotation(SyncAnnotation))` and skips `onChange` if true.
4. `lastSyncedValueRef = useRef(value)` initialized at first render — ref equals initial value; first sync effect's "skip if equal" check fires correctly without explicit mount-time initialization.

The four sync effects (validate-pass added wikilinkCandidates as the fourth):
- value sync → dispatch with SyncAnnotation
- readOnly sync → readOnlyCompartment.reconfigure
- wikilinkCandidates sync → setCandidatesEffect.of(buildCandidatesMap(candidates))
- extensions sync → userExtensionsCompartment.reconfigure

**Impact:** high — defines the controlled-component contract; the wrong implementation produces infinite render loops.
**Trade-off:** standard CM6 pattern; well-tested. **Phase A end gate** smoke-tests a host that calls `setValue` from inside `onChange` (no infinite loop expected).

### Q-P10 (NEW) — Imperative handle ref-as-prop pattern (consistency)

**Locked: React 19 ref-as-prop pattern** consistent with [`properties-form` plan §13.5 #8](../properties-form-procomp/properties-form-procomp-plan.md#135-plan-stage-refinements-surfaced-during-draft) and the other Tier 1 plans. Markdown-editor's component signature accepts `ref` as a regular prop; `useImperativeHandle(ref, () => ({ focus, undo, redo, ... }))` attaches the handle.

Generic typing: `<MarkdownEditor<TCandidate>>` per description Q8 + §3.2. React 19 ref-as-prop preserves generic inference; `forwardRef` would strip generics.

**Impact:** low — primarily a posture-consistency decision.
**Trade-off:** none; the pattern is sibling-uniform.

## 13.5 Plan-stage refinements (surfaced during draft + validate pass)

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
12. **`marked` security posture.** `marked.parse(source, { async: false })` with default options escapes user-supplied HTML. We don't install or enable optional plugins (`marked-mangle`, `marked-gfm-heading-id`, `marked-extended-tables`) that could weaken this posture (validate-pass refinement #5 — `mangle` and `headerIds` are no longer in `marked` core as of v9; clarified wording). Custom wikilink extension's renderer uses `escapeHtml` on `target` and `display`. `dangerouslySetInnerHTML` is safe because content is OUR-rendered.
13. **`view.focus()` after toolbar action.** Each `lib/toolbar-actions.ts` helper calls `view.focus()` at the end of dispatch. Otherwise focus stays on the toolbar button after click, breaking flow.
14. **`MarkdownEditorProps` `extensions` reference stability.** Same footgun as `wikilinkCandidates`. Documented in §11.1.1 alongside the candidates pattern.
15. **`view="split"` flex layout.** Editor pane and preview pane are flex-1 children of a flex container; `gap-4` between. Container query stacks them column → row at <480px container width per description §8.5 #2.
16. **Force-graph v0.5 integration recipe.** `usage.tsx` ships the description §6.1 example as a copy-paste recipe. When force-graph v0.5 plan-lock cascades, re-validate the recipe against force-graph's locked actions (`updateNode`, `reconcileWikilinks`, etc.).
17. **Wikilink keyboard a11y verification.** Phase B end gate: axe-core verifies preview wikilinks have `role="link"` + `tabindex="0"` (when interactive) and respond to Enter/Space activation. Validate-pass refinement #4.
18. **`marked` token typing.** `WikilinkToken extends marked.Tokens.Generic` with explicit `label`, `alias`, `raw`, `type` fields; renderer signature uses the typed interface — no `as` cast (validate-pass refinement #6).
19. **`useDeferredValue` for preview parse.** React 19's `useDeferredValue(value)` schedules the parse at low priority; user typing stays fluid; preview catches up when idle. No internal debounce (validate-pass refinement #9).
20. **StateField runtime update verification.** Phase A end gate: open editor with `wikilinkCandidates=[A, B]`; type `[[A]]` (resolved, not broken); update prop to `wikilinkCandidates=[]`; verify decoration flips to broken-link styling without remount (validate-pass refinement #2 verification).

---

## 14. Definition of "done" for THIS document (stage gate)

- [x] User reviewed §1–§12 (the locked plan body) and §13 (resolved Q-Ps + §13.5 refinements).
- [x] All 10 plan-stage questions resolved (Q-P1 to Q-P10); Q-P1 + Q-P5 + Q-P7 + Q-P8 refined on validate pass.
- [x] User said **"go ahead"** — sign-off applied. Stage 3 (implementation) unlocks: run §8.2 Phase A pre-flight (`pnpm add @codemirror/state @codemirror/view @codemirror/commands @codemirror/language @codemirror/lang-markdown @codemirror/autocomplete @codemirror/search @lezer/markdown @lezer/highlight marked`) FIRST, then `pnpm new:component forms/markdown-editor`.
- [x] `Recommendation:` form converted to `**Locked: X.**`; status header flipped; [system §9 sub-doc map](../../systems/graph-system/graph-system-description.md#9-sub-document-map) updated to mark `markdown-editor` plan ✓ signed off.

The plan is signed off when (a) v0.1 implementation can begin AND (b) the `force-graph` v0.5 plan-lock cascade unlocks AND (c) **all 5 Tier 1 plans are signed off** — making the system Stage 2 plan (`graph-system-plan.md`) authorable for the first time.

---

*End of v0.1 plan. Stage 3 (implementation) is unlocked subject to Phase A pre-flight.*
