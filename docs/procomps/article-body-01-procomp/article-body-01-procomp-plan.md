# article-body-01 — procomp plan

> Stage 2: how. Implementation blueprint for [`article-body-01-procomp-description.md`](./article-body-01-procomp-description.md).
>
> ## v0.2 plan addendum (2026-05-02)
>
> Layered four features on top of the v0.1 architecture without touching the editor/viewer split or the JSON storage convention:
>
> **(1) Lowlight syntax highlighting** — added [`lib/lowlight-instance.ts`](../../../src/registry/components/data/article-body-01/lib/lowlight-instance.ts) with selective language registration (15 langs cover ~95% of realistic article code blocks; selective registration keeps bundle ~30KB gzip vs `lowlight/all`'s ~250KB). Wired via `CodeBlockPlugin.configure({ options: { lowlight }, node: { component } })` in BOTH [`plugins/editor-kit.ts`](../../../src/registry/components/data/article-body-01/plugins/editor-kit.ts) and [`plugins/viewer-kit.ts`](../../../src/registry/components/data/article-body-01/plugins/viewer-kit.ts). Token CSS classes (`.hljs-keyword`, `.hljs-string`, etc) added to [`src/app/globals.css`](../../../src/app/globals.css) mapped to `--chart-1` … `--chart-5` (signal-lime palette analogous chain). Decision: write our own minimal token theme using pro-ui tokens, NOT import a stock highlight.js theme — lower CSS weight + design-system-native colors. CodeSyntaxPlugin (already registered) handles the per-leaf decoration; lowlight just feeds it.
>
> **(2) HTML serialization escape hatch** — added [`lib/serialize-html.ts`](../../../src/registry/components/data/article-body-01/lib/serialize-html.ts) wrapping `serializeHtml(editor)` from `platejs/static`. Async (uses `react-dom/server`); server-only. Defaults to `stripDataAttributes: true` for clean export output. Composes the same `articleBodyViewerPlugins` plugin set as the static viewer for renderer-pipeline parity. Exported from [`index.ts`](../../../src/registry/components/data/article-body-01/index.ts) as the public API.
>
> **(3) Image resize + inline caption** — extracted [`parts/image-element.tsx`](../../../src/registry/components/data/article-body-01/parts/image-element.tsx) from `parts/element-renderers.tsx` (re-exported from there for editor-kit import continuity). Self-contained component using `useEditorRef` + `useNodePath(element)` to update node attributes. Resize: tracked via `useState<draftWidthPct | null>` during drag; commits on mouseup via `editor.tf.setNodes({ width: "${pct}%" }, { at: path })`. Caption: native `<input>` controlled by `element.caption`, updates via `setNodes({ caption })`. Read-only mode hides the resize handle and renders caption as `<figcaption>`. **Did NOT use** `@platejs/resizable`'s `Resizable` / `ResizableProvider` / `ResizeHandle` UI primitives — the API surface is complex with sparse docs (`useResizable` requires `setNodeWidth` / `setWidth` callbacks that aren't documented), and a hand-rolled mouse-tracking resize is ~50 LOC and easier to reason about. **Did register** `CaptionPlugin` in editor-kit.ts via `CaptionPlugin.configure({ options: { query: { allow: [KEYS.img, ...] } } })` for forward compatibility with future caption-related features (e.g. caption-required validation), but caption rendering itself uses the inline-input pattern, not the package's `<CaptionTextarea>`. Static side: [`static-element-renderers.tsx`](../../../src/registry/components/data/article-body-01/static-elements/static-element-renderers.tsx) `StaticImage` reads `element.width` (string-as-percent or number-as-pixels) and `element.caption` for fidelity.
>
> **(4) Floating toolbar** — added [`parts/floating-toolbar.tsx`](../../../src/registry/components/data/article-body-01/parts/floating-toolbar.tsx). Uses `useEditorSelection()` to detect non-collapsed selections; uses `@floating-ui/react`'s `useFloating({ middleware: [offset(8), flip(), shift({ padding: 8 })], whileElementsMounted: autoUpdate })` with a virtual-element reference (`getBoundingClientRect: () => window.getSelection().getRangeAt(0).getBoundingClientRect()`). Visibility tracked via `useState`; updates on selection change + scroll/resize listeners. Cleaner architecture than re-implementing positioning manually: floating-ui handles edge-of-viewport collisions + scroll-tracking. **Refactor:** extracted shared `MarkButton`, `BlockButton`, `useBlockToggle` from `parts/editor-toolbar.tsx` to [`parts/toolbar-buttons.tsx`](../../../src/registry/components/data/article-body-01/parts/toolbar-buttons.tsx) so both fixed + floating toolbars consume the same primitives. Floating uses `size="sm"` variant of `MarkButton`. **Lint suppressions:** two intentional `eslint-disable-next-line` comments — (a) `react-hooks/set-state-in-effect` on the early `setVisible(false)` in the effect (truly external-system sync, the rule's escape-hatch case); (b) `react-hooks/refs` on `<div ref={refs.setFloating}>` — `setFloating` is a stable ref-callback function, not a `.current` property access; the lint rule can't tell the difference. Both documented inline.
>
> **New deps in v0.2:** `lowlight@^3.3.0`, `highlight.js@^11.11.1` (peer of lowlight), `@platejs/caption@^53.0.0`, `@platejs/resizable@^53.0.0` (registered as a dep but not directly used — kept for forward compatibility with v0.3 work that may layer on Plate's resize primitives), `@floating-ui/react@^0.27.19`. All MIT.
>
> **Files added in v0.2:** `lib/lowlight-instance.ts`, `lib/serialize-html.ts`, `parts/image-element.tsx`, `parts/toolbar-buttons.tsx`, `parts/floating-toolbar.tsx`. Files modified: `article-body-01.tsx` (mount FloatingToolbar), `parts/editor-toolbar.tsx` (refactored to import from toolbar-buttons), `parts/element-renderers.tsx` (re-export ImageElement from new module), `static-elements/static-element-renderers.tsx` (StaticImage reads width + caption), `plugins/editor-kit.ts` (configure CodeBlock with lowlight + register CaptionPlugin), `plugins/viewer-kit.ts` (configure CodeBlock with lowlight), `index.ts` (export `serializeArticleBodyToHtml` + `SerializeHtmlOptions`), `meta.ts` (v0.1.0 → v0.2.0 + new feature list + new npm deps), `dummy-data.ts` (added `ARTICLE_BODY_01_DUMMY_IMAGE` fixture + lang-tagged code-block fixtures), `demo.tsx` (8 sub-tabs covering all v0.2 features), `src/app/globals.css` (highlight.js token CSS classes mapped to chart palette).
>
> **Verification:** tsc + lint + build clean (1 pre-existing rich-card warning, no new); 27 routes prerendered; SSR HTTP 200 with default editor tab content rendering. Lowlight server-side render not directly verified — Radix Tabs lazy-mounts inactive tabs, so the Code tab fixture renders client-side only on tab click. Build success + plugin set type-checks both ways = lowlight wiring correct; runtime visual verification deferred to in-browser smoke.
>
> ## v0.1 plan (below)

## File map

```
src/registry/components/data/article-body-01/
├── article-body-01.tsx              # ArticleBodyEditor — "use client", main editor
├── article-body-viewer.tsx          # ArticleBodyViewer — RSC-friendly viewer
├── plugins/
│   ├── editor-kit.ts                # plugins for the editor side (PlateElement-bound)
│   └── viewer-kit.ts                # plugins for the static side (bare-HTML-bound)
├── parts/
│   ├── editor-toolbar.tsx           # the fixed top toolbar
│   ├── element-renderers.tsx        # editor element components (use PlateElement)
│   └── leaf-renderers.tsx           # editor leaf components (use PlateLeaf)
├── static-elements/
│   └── static-element-renderers.tsx # static element + leaf components (bare HTML)
├── types.ts                         # public types + sentinels
├── dummy-data.ts                    # 5 sample article values
├── demo.tsx                         # 5 sub-tabs
├── usage.tsx
├── meta.ts
└── index.ts
```

12 files. Largest pro-component shipped to date by file count alongside markdown-editor (28 files), but smaller per-file — Plate carries most of the heavy lifting.

## Public API

```ts
// types.ts
import type { ReactNode } from "react";
import type { Value } from "platejs";

export type ArticleBodyValue = Value;

export interface ImageUploadResult {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
}

export type ImageUploader = (file: File) => Promise<ImageUploadResult>;

export interface ArticleBodyEditorProps {
  value?: ArticleBodyValue;
  defaultValue?: ArticleBodyValue;
  onChange?: (value: ArticleBodyValue) => void;
  onSave?: (value: ArticleBodyValue) => void | Promise<void>;
  readOnly?: boolean;
  placeholder?: string;
  onImageUpload?: ImageUploader;
  className?: string;
  toolbarClassName?: string;
  contentClassName?: string;
  containerClassName?: string;
  hideToolbar?: boolean;
  autoFocus?: boolean;
}

export interface ArticleBodyViewerProps {
  value: ArticleBodyValue;
  className?: string;
  fallback?: ReactNode;
}
```

`ARTICLE_BODY_EMPTY_VALUE` and `ARTICLE_BODY_DEFAULT_PLACEHOLDER` are exported as sentinels.

## Plugin kits

Two parallel modules:

### `plugins/editor-kit.ts` (live editor)

Each block plugin binds a React-side component via `Plugin.withComponent(LiveComponent)`. The components live in `parts/element-renderers.tsx` and use `PlateElement` (which uses client-only hooks: `useNodeAttributes`, `useFocused`, etc).

Plugin set:

| Plugin | From | Live component |
|---|---|---|
| `ParagraphPlugin` | `platejs/react` | `ParagraphElement` |
| `H1Plugin` … `H4Plugin` | `@platejs/basic-nodes/react` | `H1Element` … `H4Element` |
| `BlockquotePlugin` | `@platejs/basic-nodes/react` | `BlockquoteElement` |
| `HorizontalRulePlugin` | `@platejs/basic-nodes/react` | `HrElement` |
| `ListPlugin` | `@platejs/list/react` | `ListElement` (renders `<ul>` / `<ol>` based on `listStyleType`) |
| `CodeBlockPlugin` + `CodeLinePlugin` + `CodeSyntaxPlugin` | `@platejs/code-block/react` | `CodeBlockElement` + `CodeLineElement` |
| `TablePlugin` + `TableRowPlugin` + `TableCellPlugin` + `TableCellHeaderPlugin` | `@platejs/table/react` | `TableElement` + `TableRowElement` + `TableCellElement` + `TableCellHeaderElement` |
| `ImagePlugin` + `MediaEmbedPlugin` | `@platejs/media/react` | `ImageElement` + `MediaEmbedElement` |
| `LinkPlugin` | `@platejs/link/react` | `LinkElement` |
| `BoldPlugin` … `KbdPlugin` | `@platejs/basic-nodes/react` | leaf renderers in `parts/leaf-renderers.tsx` for `Code`, `Highlight`, `Kbd` |
| `FontFamilyPlugin` / `FontSizePlugin` / `FontColorPlugin` / `FontBackgroundColorPlugin` | `@platejs/basic-styles/react` | mark plugins (no element component) |
| `IndentPlugin` | `@platejs/indent/react` | configured to inject into paragraph / heading / blockquote / code block |

### `plugins/viewer-kit.ts` (static viewer)

Same plugin set, but each component is the static counterpart from `static-elements/static-element-renderers.tsx`. Static renderers don't use `PlateElement` / `PlateLeaf` — they render bare HTML with `props.attributes` spread (the `data-slate-*` metadata is just data attributes). This avoids client hooks entirely; the viewer is server-renderable.

## Element renderer pattern (live side)

Plate's `<PlateElement as="X">` uses a discriminated union over `as` types, where each branch narrows `attributes` to the corresponding HTML element's attributes shape. When we forward `props.attributes` (typed for the wider element kind), TS rejects the narrower target.

Solution: a `withAs<As>(props, as)` helper that casts `attributes` to `never`:

```ts
function withAs<As extends string>(
  props: ElementProps,
  as: As
): ElementProps & { as: As } {
  return {
    ...props,
    as,
    attributes: props.attributes as never,
  } as ElementProps & { as: As };
}
```

One central cast keeps the noise local. The runtime payload is just data-slate-* attributes — fine on any HTML element.

## Static renderer pattern

Static renderers don't use `SlateElement` from `platejs/static` — its strict discriminated-union typing fights us the same way `PlateElement` does. Instead: render bare HTML with `props.attributes` spread (after stripping `ref` which TS can't narrow across element types):

```ts
function spreadAttrs(attributes: Record<string, unknown> | undefined): Attrs {
  if (!attributes) return {};
  const { ref: _ref, ...rest } = attributes as { ref?: unknown };
  return rest as Attrs;
}

export function StaticH1(props: StaticElementProps) {
  return (
    <h1 {...spreadAttrs(props.attributes)} className={cn("...", props.className)}>
      {props.children}
    </h1>
  );
}
```

`SlateElement` would add no runtime value here — it's a wrapper for hooks-bound static rendering, but our static renderers are pure and stateless.

## Toolbar

A fixed top bar with role `"toolbar"` + `aria-label="Article body editor toolbar"`. Internal layout: `<ToolbarGroup>` clusters separated by `<ToolbarSeparator />`.

### Mark buttons

Use `useMarkToolbarButtonState` + `useMarkToolbarButton` (first-party Plate hooks):

```tsx
function MarkButton({ nodeType, icon: Icon, label }) {
  const state = useMarkToolbarButtonState({ nodeType });
  const { props } = useMarkToolbarButton(state);
  return (
    <Button
      type="button" variant="ghost" size="icon"
      className={cn("h-8 w-8", state.pressed && "bg-muted text-foreground")}
      title={label} aria-label={label} aria-pressed={state.pressed}
      onMouseDown={props.onMouseDown}
      onClick={props.onClick}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
```

Buttons cluster (left-to-right): bold / italic / underline / strikethrough / inline-code / highlight / subscript / superscript.

### Block buttons

Custom `useBlockToggle(blockType)` hook composes `useEditorRef` + `useEditorSelector`:

```ts
function useBlockToggle(blockType: string) {
  const editor = useEditorRef();
  const isActive = useEditorSelector(
    (e) => e.api.block()?.[0]?.type === blockType,
    [blockType]
  );
  const toggle = useCallback(() => {
    editor.tf.toggleBlock(blockType);
    editor.tf.focus();
  }, [editor, blockType]);
  return { isActive, toggle };
}
```

Buttons: H1 / H2 / H3 / blockquote / code-block. Insert-only buttons: HR / bullet list / ordered list / link / image / table.

### Insert image flow

```ts
async function handleClick() {
  if (onImageUpload) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const result = await onImageUpload(file);
      editor.tf.insertNodes({
        type: ImagePlugin.key,
        url: result.src,
        alt: result.alt ?? file.name,
        width: result.width,
        height: result.height,
        children: [{ text: "" }],
      });
    };
    input.click();
    return;
  }
  // Fallback: prompt for URL
  const url = window.prompt("Image URL");
  if (!url) return;
  editor.tf.insertNodes({
    type: ImagePlugin.key,
    url,
    children: [{ text: "" }],
  });
}
```

### Font controls

Native `<select>` + `<input type="color">`. Cheaper than building a Popover-driven dropdown for v0.1 and keeps the dep count low. v0.2 candidate: shadcn DropdownMenu wrappers for richer UX.

`onMouseDown={(e) => e.preventDefault()}` on every selector to preserve editor selection on click.

`removeMark` (NOT `unsetMark` — that doesn't exist in Plate v53) is used to clear a font-family / font-size mark.

## Editor root

```tsx
"use client";

export function ArticleBodyEditor(props) {
  const { value, defaultValue, onChange, onSave, ... } = props;

  const initialValue = value ?? defaultValue ?? ARTICLE_BODY_EMPTY_VALUE;

  const editor = usePlateEditor({
    plugins: articleBodyPlugins,
    value: initialValue,
    autoSelect: autoFocus ? "end" : undefined,
  });

  // Echo-guarded value sync via useRef (NOT useState — react-hooks/set-state-in-effect lint)
  const lastSyncedValueRef = useRef(initialValue);
  useEffect(() => {
    if (controlledValue && controlledValue !== lastSyncedValueRef.current) {
      editor.tf.setValue(controlledValue);
      lastSyncedValueRef.current = controlledValue;
    }
  }, [controlledValue, editor]);

  const handleChange = useCallback(({ value }) => {
    lastSyncedValueRef.current = value;
    onChange?.(value);
  }, [onChange]);

  // Cmd/Ctrl+S → onSave with live editor.children, NOT React value prop
  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s" && onSave) {
      e.preventDefault();
      const current = editor.children as ArticleBodyValue;
      Promise.resolve(onSave(current)).catch(console.error);
    }
  }, [editor, onSave]);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Plate editor={editor} onChange={handleChange} readOnly={readOnly}>
        {!hideToolbar && !readOnly ? <EditorToolbar onImageUpload={onImageUpload} /> : null}
        <div className="max-h-150 overflow-y-auto px-6 py-4">
          <PlateContent
            placeholder={placeholder}
            className="min-h-50 focus:outline-none prose prose-sm dark:prose-invert max-w-none"
            onKeyDown={handleKeyDown}
            spellCheck
          />
        </div>
        {!readOnly && onSave ? <SaveHint /> : null}
      </Plate>
    </div>
  );
}
```

## Viewer root

```tsx
// no "use client" — server component
export function ArticleBodyViewer({ value, className, fallback }) {
  if (!value || value.length === 0) {
    if (fallback !== undefined) return <>{fallback}</>;
    return <div className={cn(VIEWER_PROSE_CLASSES, className)}><p className="text-muted-foreground">No content.</p></div>;
  }

  const editor = createStaticEditor({
    plugins: articleBodyViewerPlugins,
    value,
  });

  return (
    <div className={cn(VIEWER_PROSE_CLASSES, className)}>
      <PlateStatic editor={editor} value={value} />
    </div>
  );
}
```

`createStaticEditor` returns a non-React editor object. `PlateStatic` walks the value and dispatches each node to its registered renderer. No client hooks; Next 16 prerenders this happily.

## Phase A end-gate (verified during spike)

1. ✅ `pnpm tsc --noEmit` clean
2. ✅ `pnpm lint` clean (1 pre-existing rich-card warning OK)
3. ✅ `pnpm build` clean — 27 routes prerendered including `/components/article-body-01`
4. ✅ SSR `HTTP 200` (~94KB) on `/components/article-body-01` with 5 demo tabs
5. ✅ Dummy article content "How sustainable cities…" appears server-rendered (proves PlateStatic works in RSC)
6. ✅ `/components` index lists the new entry

## Risks / known unknowns (deferred validation)

1. **Browser interactivity not validated.** Hydration, toolbar button clicks, mark toggles, block toggles, image-upload flow, Cmd/Ctrl+S, table editing, font selectors — all need real-browser smoke. This codebase has no test runner; validation is demo-driven. Documented in STATUS.
2. **Echo-guarded value sync** — pattern works in static analysis but real-world edge case (host calls `setValue` from inside `onChange`) needs browser test.
3. **Image upload + URL.createObjectURL** in the demo — fake uploader returns object URLs that break across page navigations. Demo-only concern.
4. **Plate v53 fast-moving.** Major version bumps roughly quarterly. Pin exact versions in `registry.json` (already done). Re-verify SSR + image upload on each major bump.
5. **Code block syntax highlighting not wired.** `CodeSyntaxPlugin` is registered but `lowlight` isn't installed. Code blocks render as unstyled `<pre><code>`. v0.2: wire `lowlight` + a syntax theme.
6. **Heading-3 is the deepest toolbar heading.** Plugin set supports H1–H4; toolbar exposes H1–H3 only. Consumers wanting H4 use a custom toolbar or markdown-style autoformat (v0.2).
7. **No floating-toolbar / slash-command for v0.1.** Documented in description.
8. **Tables are insert-only via toolbar.** Adding/removing rows + columns is keyboard-driven (Plate's table plugin handles it). No menu UI for table ops in v0.1.

## Bundle envelope (estimated, not measured)

- Editor: ~145–165KB gzip — within the ~150KB precedent set by `markdown-editor` (CodeMirror substrate). Actual measurement deferred to a future audit pass with `size-limit` or `next-bundle-analyzer`.
- Viewer: ~28–35KB gzip — purely the `platejs/static` runtime + element renderers.

## Out of plan (v0.2 candidates)

- Wire `lowlight` for code-block syntax highlighting
- Floating toolbar (`@platejs/floating-toolbar`)
- Slash command menu (`@platejs/slash-command`)
- DnD block reordering (`@platejs/dnd`)
- Mention autocomplete (`@platejs/mention`)
- Math blocks (`@platejs/math`)
- Comments / suggestions (`@platejs/comment` + `@platejs/suggestion`)
- Image resizing (`@platejs/resizable`)
- Plate UI registry components (replace native `<select>` selectors with shadcn DropdownMenu wrappers)
- AI features (smart suggestions, autocomplete from LLM)
- Collaborative editing (Yjs / Liveblocks)
- HTML serialization escape hatch in the public API
- Markdown autoformat (`@platejs/autoformat`)
- Caption editing UI on images

## Plan deviations during the spike

1. **Phase 0 spike ran impl-first.** Procomp description + plan retrofitted after implementation, since the architectural decisions (editor + viewer split, JSON storage, Plate substrate) were already locked in the prior session. This deviates from the standard description-first gate but was authorized by the user's "go ahead and create it." Future Plate-based pro-components should still run the description-first gate.
2. **Plate's `<PlateElement as="X">` type narrowing** required a centralized `withAs<As>()` helper — see element renderers above.
3. **`editor.tf.unsetMark` doesn't exist** in Plate v53 — used `removeMark(key)` instead. Updated toolbar font-family / font-size selectors.
4. **Static renderers use bare HTML, not `SlateElement`** — `SlateElement`'s strict typing fights the same discriminated-union problem as `PlateElement`. Bare HTML + spread `attributes` is simpler and equivalent at runtime.
5. **Selectors are native HTML `<select>` + `<input type="color">`** rather than shadcn DropdownMenu wrappers. v0.1 keeps the dep count low; v0.2 can upgrade.
