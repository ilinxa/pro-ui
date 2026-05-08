# `markdown-editor` — Pro-component Guide (Stage 3)

> **Audience:** consumer using `<MarkdownEditor />` to edit GFM markdown with toolbar + preview + wikilink autocomplete.
>
> **Companion docs:** [description](markdown-editor-procomp-description.md) (what & why), [plan](markdown-editor-procomp-plan.md) (how it's built).

---

## When to use MarkdownEditor

- You need a **markdown editor** with three view modes (`edit` / `split` / `preview`) and a slot-able toolbar
- You need **`[[wikilink]]` autocomplete** with kind badges and runtime-updatable candidates
- You need **GFM** (tables, strikethrough, task lists, autolinks)
- You need **CodeMirror 6 keymaps** (Cmd+B / Cmd+I / Cmd+K / Cmd+S etc.) plus standard markdown shortcuts
- You're OK with a `~150 KB` CM6 substrate (~180 KB total install)
- You're OK with the host owning the markdown string (we don't persist; you do)

Examples that fit:
- Note editor in a knowledge-base app
- Description field on a graph node where you want wikilinks across nodes
- Inline doc editor inside `<DetailPanel>` (a paired host)
- Standalone "edit a doc" surface with split-view live preview
- Any field where `<textarea>` is too thin and `<TipTap>` / Lexical / Slate are too heavy

---

## When NOT to use MarkdownEditor

- **You need WYSIWYG.** This is markdown — users see syntax in edit mode. For TipTap / ProseMirror style WYSIWYG, see `<RichCard>` or `<ArticleBody>`.
- **You need collaborative editing.** No CRDT, no Yjs integration. Single-user only.
- **You need a non-markdown source language** (AsciiDoc, MDX, reStructuredText). The grammar is markdown-only.
- **Your app already bundles a different CM6 instance.** This component ships its own; loading two CM6 substrates wastes ~150 KB.
- **Your bundle ceiling is < 100 KB.** This component is ~180 KB total install — including CM6 (~150 KB), `marked` (~14 KB), our code (~16 KB).
- **You need real-time markdown streaming** (LLM token-by-token rendering). Use `<ArticleBody>` or `<RichCard>` for that — they're optimized for the read path, not edit-mode CM6.

---

## The five-minute walkthrough

```tsx
"use client";

import { useState } from "react";
import { MarkdownEditor } from "@/components/markdown-editor";

export function NoteEditor() {
  const [value, setValue] = useState("# Hello\n\nThis is **markdown**.");

  return (
    <MarkdownEditor
      value={value}
      onChange={setValue}
      onSave={(v) => api.saveNote(v)}    // optional; Cmd/Ctrl+S
      placeholder="Start writing…"
      minHeight="20rem"
    />
  );
}
```

That's the minimal case — controlled value, save handler, default toolbar, default `edit` view. Cmd+S runs `onSave`; Cmd+B / Cmd+I / Cmd+K work via CM6's built-in keymaps.

---

## The mental model

`<MarkdownEditor>` is **value + onChange + a CM6 editor + a `marked` preview + an opt-in toolbar**. Internally:

1. **CM6 substrate** holds the document text. The component is a controlled wrapper — `value` from props is reflected into CM6 via a guarded effect that's safe against the consumer calling `setValue` from inside `onChange` (echo guard prevents infinite loops).
2. **Three view modes** — `edit` (CM6 only), `preview` (rendered HTML only), `split` (both side-by-side). Mode is controlled or uncontrolled; `showPreviewToggle={false}` locks to `initialView` and hides the toggle.
3. **Wikilink autocomplete** — `[[` triggers a popover with candidates (max 50, alphabetical by label, kind-badged). `wikilinkCandidates` is host-owned; the component listens for runtime updates via a CM6 `StateField` (no remount when candidates change).
4. **Wikilink decoration** — in edit mode, every `[[label]]` token is decorated. Broken-link styling kicks in when no candidate matches. In preview, every wikilink renders as a clickable span (or static if no `onWikilinkClick` is supplied).
5. **Toolbar** — `defaultMarkdownToolbar` exports an 8-item array (bold / italic / code / link / lists / blockquote / heading-cycle). Pass `toolbar={[...]}` to replace; pass `toolbar={false}` to hide.
6. **Preview parsing** — uses a per-instance `marked` parser (avoids global mutation of `marked` extensions). `useDeferredValue(value)` keeps preview scroll smooth on huge docs.
7. **Bundle ≤ 180 KB** — CM6 (~150 KB) + marked (~14 KB) + our code (~16 KB). The biggest piece in this registry.

The reducer-equivalent (CM6 state) is private; consumers see only the imperative handle.

---

## Composition patterns

### Pattern 1: minimal markdown editor

```tsx
const [v, setV] = useState("");
<MarkdownEditor value={v} onChange={setV} />
```

Edit mode, default toolbar, no save handler, no preview toggle hidden. The simplest case.

### Pattern 2: split-view with auto-save

```tsx
const [v, setV] = useState("");
useDebouncedEffect(() => api.autoSave(v), 1000, [v]);

<MarkdownEditor
  value={v}
  onChange={setV}
  initialView="split"
  showPreviewToggle
  minHeight="30rem"
/>
```

Cmd+S still works for explicit save (debounced auto-save complements rather than replaces). The user can flip between edit / split / preview via the toggle.

### Pattern 3: wikilink editor with kind-badged candidates

```tsx
import type { WikilinkCandidate } from "@/components/markdown-editor";

interface MyCandidate extends WikilinkCandidate {
  description?: string;
}

const CANDIDATES: ReadonlyArray<MyCandidate> = [
  { id: "n1", label: "Project Bedrock", kind: "project", description: "Q3 launch" },
  { id: "n2", label: "Aria Montgomery",  kind: "person",  description: "Owner" },
  { id: "n3", label: "design-tokens",     kind: "doc",     description: "Lib" },
];

<MarkdownEditor
  value={v}
  onChange={setV}
  wikilinkCandidates={CANDIDATES}
  onWikilinkClick={(target) => router.push(`/n/${slugify(target)}`)}
  kinds={{
    project: { label: "Project", color: "var(--chart-1)" },
    person:  { label: "Person",  color: "var(--chart-2)" },
    doc:     { label: "Doc",     color: "var(--muted-foreground)" },
  }}
/>
```

Type `[[` in edit mode → autocomplete popover lists matching candidates with kind badges. Selecting one inserts `[[label]]`. In preview, every wikilink renders as a clickable span; clicking calls `onWikilinkClick(target)`.

### Pattern 4: custom toolbar with extension

The default toolbar is exported. Spread + append:

```tsx
import { Sparkles } from "lucide-react";
import {
  MarkdownEditor,
  defaultMarkdownToolbar,
  type ToolbarItem,
} from "@/components/markdown-editor";

const toolbar: ReadonlyArray<ToolbarItem> = [
  ...defaultMarkdownToolbar,
  { id: "sep-2", label: "", run: () => {} },        // empty-string label = separator (sentinel)
  {
    id: "callout",
    label: "Insert callout",
    icon: <Sparkles />,
    run: (ctx) => ctx.insertText("\n> [!note]\n> "),
  },
];

<MarkdownEditor value={v} onChange={setV} toolbar={toolbar} />
```

`ctx` (the `ToolbarCtx`) gives:
- `view`: the live CM6 `EditorView` (escape hatch for advanced ops)
- `value`: current document
- `insertText(text)`: insert at caret
- `wrapSelection(before, after)`: wrap currently-selected range (no-op if no selection)
- `toggleLinePrefix(prefix)`: toggle the prefix on the current line (used by lists, blockquote)

### Pattern 5: read-only viewer with preview-only

```tsx
<MarkdownEditor
  value={article.markdown}
  onChange={() => {}}              // unused; readOnly disables edits
  readOnly
  initialView="preview"
  showPreviewToggle={false}
/>
```

The host can disable editing entirely via `readOnly`. Pair with `initialView="preview"` + `showPreviewToggle={false}` to render a pure markdown viewer. (For pure-viewer use cases, also consider `<ArticleBody>` — lighter, no CM6.)

### Pattern 6: extending CM6 with custom extensions

Pass CM6 extensions via `extensions`. They're appended LAST in the precedence chain; ours win conflicts by default. To override our defaults, escalate via `Prec.high`:

```tsx
import { Prec } from "@codemirror/state";
import { keymap } from "@codemirror/view";

const extensions = [
  keymap.of([
    {
      key: "Mod-Shift-x",
      run: (view) => {
        // your custom keybind
        return true;
      },
    },
  ]),
  // To override our handler precedence:
  Prec.high(yourExtensionThatNeedsToWin),
];

<MarkdownEditor value={v} onChange={setV} extensions={extensions} />
```

### Pattern 7: imperative handle for parent-driven control

```tsx
"use client";

import { useRef } from "react";
import { MarkdownEditor, type MarkdownEditorHandle } from "@/components/markdown-editor";

export function ParentDrivenEditor() {
  const ref = useRef<MarkdownEditorHandle>(null);

  return (
    <div className="space-y-2">
      <MarkdownEditor ref={ref} value={v} onChange={setV} />
      <div className="flex gap-2">
        <Button onClick={() => ref.current?.insertText("\n---\n")}>Insert HR</Button>
        <Button onClick={() => ref.current?.undo()}>Undo</Button>
        <Button onClick={() => {
          const sel = ref.current?.getSelection();
          if (sel?.text) navigator.clipboard.writeText(sel.text);
        }}>Copy selection</Button>
      </div>
    </div>
  );
}
```

Available methods: `focus()`, `undo()`, `redo()`, `insertText(text)`, `getSelection()`, `getValue()`, `getView()`.

---

## Gotchas

### `wikilinkCandidates` reference must be stable

Inline `wikilinkCandidates={[{ id: ... }]}` re-creates the array each render. Effects:
- Wikilink decoration recomputes more than necessary
- React Compiler memoizes literal arrays in this repo; **NPM consumers without it must memoize manually**

```tsx
// ✓ Module scope
const CANDIDATES: ReadonlyArray<WikilinkCandidate> = [/* ... */];

// ✓ useMemo
const candidates = useMemo(() => filterByVisibility(allCandidates, viewerRole), [allCandidates, viewerRole]);

// ✗ Inline
<MarkdownEditor wikilinkCandidates={[/* ... */]} ... />
```

Same footgun pattern as `data-table` columns, `properties-form` schemas, `entity-picker` items, `filter-stack` categories.

### `value` round-trip is echo-guarded

Calling `setValue(...)` from inside `onChange` is safe — the component detects the echo and doesn't re-emit `onChange`. No infinite loops.

But: passing a NEW `value` from the host that's NOT echo-related (e.g. external sync from a server) does correctly update CM6. The guard distinguishes the cases via internal annotations.

### `getView()` returns `null` pre-mount and post-unmount

```ts
getView(): EditorView | null
```

Plan §3.3 documents this. Common mistake:

```tsx
useEffect(() => {
  ref.current?.getView()?.dispatch(/* ... */);  // ✓ optional chain handles null
}, []);
```

```tsx
const view = ref.current.getView();
view.dispatch(/* ... */);  // ✗ throws if pre-mount
```

In dev, `getView()` called before mount logs `console.warn` once per session (the F-cross-08-allowed `process.env.NODE_ENV !== "production"` gate).

### Empty-string label is the toolbar separator sentinel

Plan §3.1 documents this convention:

```tsx
const toolbar: ToolbarItem[] = [
  ...defaultMarkdownToolbar,
  { id: "sep-1", label: "", run: () => {} },        // ← renders as a thin vertical divider
  { id: "ai", label: "AI assist", icon: <Sparkles />, run: (ctx) => { /* ... */ } },
];
```

The renderer detects `label === ""` and draws a divider instead of a button. Discriminated alternative (`type: "separator"`) was considered + deferred to v0.2.

### `Cmd+S` only `preventDefault`s if `onSave` is supplied

Without `onSave`, Cmd+S falls through to browser-default (save the page as HTML). With `onSave`, the keymap intercepts and calls your handler.

### `extensions` are appended LAST; ours win conflicts by default

Pass an extension that conflicts with our wikilink decoration (rare) and our defaults stand. To force consumer wins, wrap in `Prec.high(...)`. Alternatively, use the `getView()` escape hatch for surgical CM6 ops.

### Bundle is ≤ 180 KB; tree-shaking helps

CM6 (~150 KB) + marked (~14 KB) + our code (~16 KB). For viewer-only cases, prefer `<ArticleBody>` (~25 KB). The split is documented in description §6.

### `useDeferredValue` smooths preview rendering

Preview parses `value` via `useDeferredValue` so a fast keystroke stream doesn't block the preview pane. On very long docs, this means preview lags edit by 1-2 frames — by design.

### Dark mode and theming via CSS variables

The editor reads `--xy-*`-style theme variables from the consumer's `globals.css`. Light/dark flips happen without remount. To override the default token set, define `.markdown-editor-root { --me-* }` overrides in your stylesheet.

### Dev-only `process.env.NODE_ENV` warnings

Plan §12.5 #5 explicitly locks `process.env.NODE_ENV !== "production"` as the dev-warn gate. Bundlers strip the dead branches in production. F-cross-08 sweep-wide rule (component-guide §7) allows this pattern.

---

## Common operations cookbook

### Programmatically insert text

```tsx
ref.current?.insertText("\n\n---\n\n");
```

If a selection is active, `insertText` replaces the selection.

### Wrap selection (e.g. add `**bold**` markup)

```tsx
const view = ref.current?.getView();
if (view) {
  // Use ToolbarCtx-style helpers via a custom toolbar item, or inline:
  const { from, to } = view.state.selection.main;
  view.dispatch({
    changes: { from, to, insert: `**${view.state.sliceDoc(from, to)}**` },
  });
}
```

### Auto-save with debounce

```tsx
import { useDebouncedEffect } from "@/lib/hooks";

const [v, setV] = useState("");
useDebouncedEffect(() => api.saveDraft(v), 1500, [v]);

<MarkdownEditor value={v} onChange={setV} />
```

Cmd+S still triggers explicit `onSave` if provided — they coexist.

### Custom keybind via extensions

```tsx
import { keymap } from "@codemirror/view";

const customKeymap = keymap.of([
  {
    key: "Mod-Shift-l",
    run: () => {
      ref.current?.insertText("[link](url)");
      return true;
    },
  },
]);

<MarkdownEditor value={v} onChange={setV} extensions={[customKeymap]} />
```

### Conditionally enable preview toggle

```tsx
<MarkdownEditor
  value={v}
  onChange={setV}
  showPreviewToggle={user.canPreview}
  initialView={user.canPreview ? "split" : "edit"}
/>
```

### Render a static markdown preview (without the editor)

For a pure preview surface (no edit chrome), use the exported `parseMarkdown` helper:

```tsx
import { parseMarkdown } from "@/components/markdown-editor";

export function MarkdownPreview({ source }: { source: string }) {
  const html = parseMarkdown(source);
  return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />;
}
```

Lighter than mounting the full editor in `preview` mode. Use when you don't need the toolbar or view-mode toggle.

---

## Known limitations / deferred to v0.2

- **No `[ ] task list` interactivity in preview.** Task lists render statically (per GFM); checkbox interactions are read-only.
- **No mermaid / footnotes.** GFM is the parser scope; v0.2+ may add an extension hook for `marked` extensions.
- **No collaborative editing.** Single-user only.
- **No `query` access for wikilink popover.** Internal-only at v0.1; v0.2 may expose for async candidate loading.
- **No mobile keyboard tweaks.** Default CM6 mobile UX; soft-keyboard shortcuts may surprise. Consider gating preview-only mode for mobile breakpoints.
- **`getView()` is a substrate-leak escape hatch.** Documented; using it ties your code to CM6's API. v1.0 may reframe but not remove.

---

## Migration notes

This is the v0.1.0 component. No prior version.

If migrating from a `<textarea>`:
- Replace with `<MarkdownEditor value={v} onChange={setV} />`
- The toolbar adds keyboard shortcuts you didn't have; document or hide via `toolbar={false}`
- Preview is OPT-IN via `view="split"` or `"preview"` — it doesn't enforce a layout

If migrating from TipTap / ProseMirror / Lexical:
- This is markdown-source, not WYSIWYG. Users see syntax (bold becomes `**bold**` in edit mode).
- Bundle is smaller (~180 KB vs 250+ KB for TipTap).
- Wikilink autocomplete is a built-in feature; in TipTap you'd write a custom extension.

If migrating from `react-markdown`:
- `react-markdown` is preview-only; this component is editor + preview.
- For viewer-only use cases, `<ArticleBody>` (lighter) or the exported `parseMarkdown` helper are closer matches.

---

## Open follow-ups

- v0.2 task-list interactivity (checkbox toggle in preview persists to the markdown source)
- v0.2 marked-extensions hook for footnotes / mermaid / GFM extensions
- v0.2 `onWikilinkQuery` for async candidate loading
- Documented compose patterns with `detail-panel` + `properties-form` (the canonical paired hosts)

---

## Reference

### Public exports

```ts
// from @/components/markdown-editor
export { MarkdownEditor } from "./markdown-editor";
export { defaultMarkdownToolbar } from "./default-toolbar";
export { parseMarkdown } from "./lib/parse-markdown";
export type {
  KindMeta,
  MarkdownEditorHandle,
  MarkdownEditorProps,
  ToolbarCtx,
  ToolbarItem,
  ViewMode,
  WikilinkCandidate,
} from "./types";
export { meta } from "./meta";
```

### Imperative handle

```ts
interface MarkdownEditorHandle {
  focus(): void;
  undo(): void;
  redo(): void;
  insertText(text: string): void;
  getSelection(): { from: number; to: number; text: string };
  getValue(): string;
  getView(): EditorView | null;     // escape hatch — null pre-mount/post-unmount
}
```

### Toolbar item shape

```ts
interface ToolbarItem {
  id: string;
  label: string;          // "" = render as separator (sentinel)
  icon?: ReactNode;
  shortcut?: string;
  isActive?: (ctx: ToolbarCtx) => boolean;
  run: (ctx: ToolbarCtx) => void;
}

interface ToolbarCtx {
  view: EditorView;
  value: string;
  insertText: (text: string) => void;
  wrapSelection: (before: string, after?: string) => void;
  toggleLinePrefix: (prefix: string) => void;
}
```

### Install

```bash
pnpm dlx shadcn@latest add @ilinxa/markdown-editor
```

Then import from `@/components/markdown-editor`.

### Related

- `article-body-01` — Plate-substrate alternative for richer WYSIWYG editing (heavier; different tradeoffs)
- `properties-form` — host this editor as a `renderer` for textarea-shaped fields that want richer formatting
- `detail-panel` — the canonical inline-editing host
- `entity-picker` — for typed reference fields adjacent to markdown content
- `workspace` — when this editor needs to be one tile in a multi-pane layout
