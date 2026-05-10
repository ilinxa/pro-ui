# code-block — procomp plan

> Stage 2: how. The implementation contract.
>
> **Predecessor:** [`code-block-procomp-description.md`](./code-block-procomp-description.md), confirmed by user with "confirmed" — all 31 open-question recommendations accepted after a re-validation pass that surfaced 3 contradictions, 6 ambiguities, and 3 optimization calls — all resolved inline.

## Substrate decisions (locked)

| Decision | Choice | Source |
|---|---|---|
| Slug | `code-block` | Description Q1 |
| Category | new `code` category (added in `categories.ts`) | Description Q2 |
| Modes (v0.1.0) | `view` \| `edit` \| `terminal` — one component, switched by `mode` prop | Description in-scope |
| Viewer substrate | Shiki, fine-grained imports (`shiki/core` + `shiki/wasm`) + on-demand grammar loading | Description Q3 |
| Editor substrate | CodeMirror 6 + custom `HighlightStyle` approximating GitHub Light + GitHub Dark Default (P2 substrate-shift, locked 2026-05-10 — `@shikijs/codemirror` doesn't exist on npm). v0.2.0 upgrade path: hand-rolled Shiki→CodeMirror bridge (pixel-perfect). | Description Q4 (refined) |
| CodeMirror language packages | dynamic-import on first edit-mode use of each lang | Description Q26 |
| Theme system | Shiki **dual-theme CSS-variable** transformer — single tokenize, both themes embed as CSS variables; `.dark` class toggles which variables resolve. No re-tokenize on theme change. | Description optimization-pass B2 |
| Default theme pair | `'github-light'` + `'github-dark-default'` | Description Q19 |
| Theme override | `themes?: { light: string \| ShikiThemeObject; dark: string \| ShikiThemeObject }` | Description Q19 (refined) |
| Distribution variants | **client** (`@ilinxa/code-block`, ~300 KB gz initial) + **RSC** (`@ilinxa/code-block/server`, <10 KB gz, pre-tokenized HTML) | Description Q16 + optimization-pass A3 |
| Mode × variant compat | `edit` + `streaming` are **client-only**; passing them to the RSC variant throws a typed build error | Description in-scope (compatibility section) |
| Wrap default | `'scroll'` | Description Q6 |
| Line-numbers default | `false` (view), `true` (edit), `false` (terminal) | Description Q7 |
| Copy visibility | always-visible, default `showCopy={true}` | Description Q8 + Q9 |
| Streaming detection | explicit `streaming` prop (no auto-detect) | Description Q10 |
| `maxLines` collapse | default `undefined` (no collapse); consumer opt-in per block | Description Q11 |
| Filename → lang priority | `lang` > `filenameToLang()` > built-in ext map (~30 entries) > `'plaintext'` | Description Q12 + in-scope refinement |
| Default ext map size | ~30 entries (canonical pick per extension; documented in guide) | Description Q12 |
| `renderHeader` signature | curated args object `{ filename, lang, copyButton, expandButton, wrapButton, downloadButton, trafficLights, actions }`; each conditional part is `null` when its `show*` flag is off | Description Q13 (refined) |
| Standalone parts | `<CodeBlockHeader>`, `<CodeBlockFilename>`, `<CodeBlockLangPill>`, `<CodeBlockCopyButton>`, `<CodeBlockExpandButton>`, `<CodeBlockWrapButton>`, `<CodeBlockDownloadButton>`, `<CodeBlockTrafficLights>` | Description Q14 + Q15 |
| Traffic-lights | opt-in `showTrafficLights` prop, default `false` | Description Q15 |
| Diff support v0.1.0 | `lang='diff'` only (Shiki diff grammar); split-view defers to future `code-diff` sibling | Description Q17 |
| Annotations | built-in shadcn `<Tooltip>` with `info / warn / error` severity icons; replaceable via `renderAnnotation` | Description Q18 |
| Line highlight rendering | row tint (`--accent / 8%`) + 2 px vertical accent bar in gutter | Description Q20 |
| Cmd+S binding | edit mode only; silent no-op + dev warning when `onSave` not wired; view + terminal do NOT capture | Description Q21 (refined) |
| Font | JetBrains Mono override (project mandate) — applied to view (Shiki body) and edit (CodeMirror) | Description Q22 |
| Empty value | render empty block with chrome intact; optional `emptyMessage` prop | Description Q23 |
| Dummy fixtures | 6 fixtures covering view-TS, JSON config, streaming snippet, terminal `lines[]`, error trace + annotations, edit-mode controlled | Description Q24 |
| `showExpand` modal | opt-in, default `false`; inner `<CodeBlock>` instance gets `showExpand={false}` + `maxLines={undefined}` to prevent recursion | Description Q27 (refined) |
| Run callback | slot-only via `actions`; no built-in `<RunButton>` | Description Q28 |
| `useCodeBlock` hook | deferred to v0.2.0 | Description Q29 |
| Streaming demo affordance | "Replay streaming" button emits value in 10-char chunks at 50 ms intervals | Description Q30 |
| Filename editing | display-only in v0.1.0; deferred to v0.2.0 (Q31) | Description Q31 |
| Object-shape callbacks | `onChange`, `onCopy` (fires *after* clipboard write), `onSave`, `onDownload`, `onLineClick`, `onExpandedChange`, `onWrapChange` | Description F-cross-12 |

---

## Final API

### Public types — `types.ts`

```ts
import type { CSSProperties, ReactNode, Ref } from "react";
import type { Extension } from "@codemirror/state";

/** Render mode. */
export type CodeBlockMode = "view" | "edit" | "terminal";

/** Wrap behaviour. */
export type CodeBlockWrap = "wrap" | "scroll";

/** Annotation severity. */
export type CodeBlockAnnotationType = "info" | "warn" | "error";

/** Line range (inclusive both ends). */
export type CodeBlockLineRange = { from: number; to: number };

/** Single terminal line in the structured `lines` API. */
export type TerminalLineKind = "input" | "output" | "error";

export interface TerminalLine {
  kind: TerminalLineKind;
  text: string;
}

/** Inline annotation rendered as a gutter marker + tooltip. */
export interface CodeBlockAnnotation {
  line: number;                                              // 1-indexed
  type: CodeBlockAnnotationType;
  message: string;
}

/** Minimal Shiki theme object the consumer can pass (re-exported subset). */
export type ShikiThemeObject = {
  name: string;
  type: "light" | "dark";
  [key: string]: unknown;
};

/** Theme pair override. Each entry is either a Shiki bundled theme name or a theme object. */
export interface CodeBlockThemes {
  light: string | ShikiThemeObject;
  dark: string | ShikiThemeObject;
}

/** Imperative handle. */
export interface CodeBlockHandle {
  copy: () => Promise<boolean>;                              // resolves true on success
  focus: () => void;                                          // edit mode only — no-op otherwise
  getValue: () => string;
  scrollToLine: (line: number) => void;
}

// ─── Callback arg shapes (object-shape per F-cross-12) ───────────────────────

export interface CodeBlockChangeArgs           { value: string }
export interface CodeBlockCopyArgs             { value: string }
export interface CodeBlockSaveArgs             { value: string }
export interface CodeBlockDownloadArgs         { value: string; filename: string }
export interface CodeBlockLineClickArgs        { line: number }
export interface CodeBlockExpandedChangeArgs   { expanded: boolean }
export interface CodeBlockWrapChangeArgs       { wrap: CodeBlockWrap }
export interface CodeBlockFilenameToLangArgs   { filename: string }

// ─── Slot contexts ───────────────────────────────────────────────────────────

export interface CodeBlockHeaderContext {
  /** The current filename (undefined if not set). */
  filename: string | undefined;
  /** Resolved language id (e.g., 'tsx'). May differ from prop after filename derivation. */
  lang: string;
  /** Pre-rendered default subparts. Each is `null` when its `show*` flag is `false`. */
  copyButton: ReactNode;
  expandButton: ReactNode | null;
  wrapButton: ReactNode | null;
  downloadButton: ReactNode | null;
  trafficLights: ReactNode | null;
  /** Custom action slot passed by consumer (raw passthrough). */
  actions: ReactNode | null;
}

export interface CodeBlockAnnotationRenderArgs {
  annotation: CodeBlockAnnotation;
  defaultMarker: ReactNode;                                  // pre-rendered default icon
}

export interface CodeBlockExpandModalContext {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  /** Pre-rendered <CodeBlock> ready to drop into a Dialog body — already has showExpand=false + maxLines=undefined. */
  code: ReactNode;
}

// ─── Top-level props ─────────────────────────────────────────────────────────

export interface CodeBlockProps {
  // ── Content ──
  /** The code string. Required unless `mode='terminal'` with `lines` provided. */
  value?: string;
  /** Structured terminal lines. Terminal mode only. Overrides `value` when provided. */
  lines?: TerminalLine[];
  /** Default value for uncontrolled edit mode. */
  defaultValue?: string;

  // ── Language ──
  /** Explicit Shiki grammar id. If omitted, derived from `filename`. */
  lang?: string;
  /** Filename pill content. Also drives lang derivation when `lang` is omitted. */
  filename?: string;
  /** Consumer override for the filename → lang map. Returns a grammar id or undefined to fall back to defaults. */
  filenameToLang?: (args: CodeBlockFilenameToLangArgs) => string | undefined;

  // ── Mode ──
  /** Render mode. Default 'view'. */
  mode?: CodeBlockMode;
  /** Edit mode: marks the editor read-only without exiting edit mode (preserves chrome). Default false. */
  readOnly?: boolean;
  /** Streaming flag: enables append-only tokenization and tail cursor. Default false. Client variant only. */
  streaming?: boolean;

  // ── Edit-mode controls ──
  onChange?: (args: CodeBlockChangeArgs) => void;
  onSave?: (args: CodeBlockSaveArgs) => void;
  /** Tab character behaviour in edit mode. Default 4. */
  tabSize?: number;
  /** Extra CodeMirror extensions for advanced consumers (autocomplete, linting, vim mode, etc.). */
  editorExtensions?: Extension[];

  // ── Header config ──
  header?: boolean;                                          // default true
  showLanguage?: boolean;                                    // default true
  showCopy?: boolean;                                        // default true
  showExpand?: boolean;                                      // default false
  showWrap?: boolean;                                        // default false
  showDownload?: boolean;                                    // default false
  showTrafficLights?: boolean;                               // default false
  actions?: ReactNode;
  renderHeader?: (ctx: CodeBlockHeaderContext) => ReactNode;
  renderExpandModal?: (ctx: CodeBlockExpandModalContext) => ReactNode;

  // ── Footer ──
  footer?: ReactNode;

  // ── Body rendering ──
  /** Default depends on mode: view false, edit true, terminal false. */
  showLineNumbers?: boolean;
  /** Wrap or scroll. Controlled — falls back to default 'scroll'. */
  wrap?: CodeBlockWrap;
  /** Highlighted line numbers (1-indexed) or ranges. */
  highlightedLines?: Array<number | CodeBlockLineRange>;
  /** Gutter markers + tooltips. */
  annotations?: CodeBlockAnnotation[];
  renderAnnotation?: (args: CodeBlockAnnotationRenderArgs) => ReactNode;

  // ── Long-block collapse ──
  maxLines?: number;                                         // default undefined (no collapse)
  expanded?: boolean;                                        // controlled override
  defaultExpanded?: boolean;
  onExpandedChange?: (args: CodeBlockExpandedChangeArgs) => void;

  // ── Wrap toggle callback ──
  onWrapChange?: (args: CodeBlockWrapChangeArgs) => void;

  // ── Line click ──
  onLineClick?: (args: CodeBlockLineClickArgs) => void;

  // ── Copy + download ──
  onCopy?: (args: CodeBlockCopyArgs) => void;                // fires AFTER clipboard write succeeds
  onDownload?: (args: CodeBlockDownloadArgs) => void;        // when wired, replaces default download behaviour

  // ── Theme ──
  themes?: CodeBlockThemes;                                  // default { light: 'github-light', dark: 'github-dark-default' }

  // ── Sizing ──
  /** Optional max-height (CSS units). When set, body becomes scroll-y past this. */
  maxHeight?: number | string;

  // ── Empty state ──
  emptyMessage?: string;                                     // shown inside body when value === '' && !lines

  // ── Polymorphic ──
  className?: string;
  style?: CSSProperties;

  // ── ARIA / labels ──
  ariaLabel?: string;                                        // override default 'Code block — <lang>' / '<filename>'

  // ── i18n labels ──
  labels?: Partial<{
    copy: string;                                            // "Copy code"
    copied: string;                                          // "Copied"
    expand: string;                                          // "Expand"
    wrap: string;                                            // "Toggle wrap"
    download: string;                                        // "Download"
    showMore: string;                                        // "Show all ({n} more lines)"
    showLess: string;                                        // "Show less"
    streamingCursor: string;                                 // sr-only "Streaming..."
    closeModal: string;                                      // "Close"
    emptyDefault: string;                                    // "" (no message by default)
  }>;

  // ── Imperative handle ──
  ref?: Ref<CodeBlockHandle>;
}
```

### Exported names — `index.ts` (client variant)

```ts
export { CodeBlock } from "./code-block";
export { CodeBlockHeader } from "./parts/code-block-header";
export { CodeBlockFilename } from "./parts/code-block-filename";
export { CodeBlockLangPill } from "./parts/code-block-lang-pill";
export { CodeBlockCopyButton } from "./parts/code-block-copy-button";
export { CodeBlockExpandButton } from "./parts/code-block-expand-button";
export { CodeBlockWrapButton } from "./parts/code-block-wrap-button";
export { CodeBlockDownloadButton } from "./parts/code-block-download-button";
export { CodeBlockTrafficLights } from "./parts/code-block-traffic-lights";
export { resolveLang, FILENAME_TO_LANG_MAP } from "./lib/lang-resolution";
export type {
  CodeBlockProps,
  CodeBlockHandle,
  CodeBlockMode,
  CodeBlockWrap,
  CodeBlockAnnotation,
  CodeBlockAnnotationType,
  CodeBlockLineRange,
  CodeBlockThemes,
  TerminalLine,
  TerminalLineKind,
  // all callback / context types
} from "./types";
```

### Exported names — `server.ts` (RSC variant)

```ts
// No "use client" / no React hooks; async server-component entry.
// The CodeBlockServerProps type narrows the public surface so TypeScript
// rejects `mode='edit'` and `streaming` at compile time (instead of only at runtime).
export { CodeBlock } from "./code-block.server";
export type { CodeBlockServerProps } from "./types";
```

### Server-narrowed Props type (lives in `types.ts`)

```ts
/**
 * RSC-variant props. Compile-time narrowing of CodeBlockProps that removes
 * fields requiring client interactivity. Passing any of these on the server
 * variant is a TypeScript error; the runtime guard in code-block.server.tsx
 * is a backup for JS consumers.
 */
export type CodeBlockServerProps = Omit<
  CodeBlockProps,
  | "mode"               // omitted: defaults to "view"; "edit"/"terminal-with-cursor" needs client
  | "readOnly"           // edit-only
  | "streaming"          // client-only
  | "editorExtensions"   // edit-only
  | "onChange"           // edit-only
  | "onSave"             // edit-only
  | "tabSize"            // edit-only
  | "onWrapChange"       // wrap toggle is client-only
  | "showWrap"           // ditto
  | "expanded"           // collapse-toggle is client interactive
  | "defaultExpanded"
  | "onExpandedChange"
  | "ref"                // imperative handle is client-only
> & {
  /** RSC variant supports only 'view' and 'terminal' modes (default 'view'). */
  mode?: "view" | "terminal";
};
```

### Subpath import convention

The shadcn registry can ship multiple files in one sealed folder; consumers pick the import path:

- `@ilinxa/code-block` → installs the whole folder; default import is the client `<CodeBlock>`.
- `@ilinxa/code-block/server` → resolved by `./server.ts` inside the same installed folder. The registry-item `targets` entry maps `server.ts` to `components/code-block/server.ts`, so the consumer's tsconfig path or barrel re-export handles the subpath. (Documented in guide.md with a recipe for projects that need only the RSC variant.)

---

## File structure

Sealed folder under `src/registry/components/code/code-block/`:

```
code-block/
├── code-block.tsx                       client root <CodeBlock>
├── code-block.server.tsx                RSC variant root <CodeBlock> (async)
├── index.ts                             public client exports
├── server.ts                            public RSC exports
├── types.ts                             all public types (shared by client + RSC)
├── dummy-data.ts                        6 fixtures (separate registry item)
├── demo.tsx                             docs-site demo (NEVER shipped via registry)
├── usage.tsx                            docs-site usage notes (NEVER shipped)
├── meta.ts                              ComponentMeta (NEVER shipped)
│
├── parts/
│   ├── code-block-header.tsx            <CodeBlockHeader> orchestrator
│   ├── code-block-filename.tsx          <CodeBlockFilename> monospace pill
│   ├── code-block-lang-pill.tsx         <CodeBlockLangPill> muted label
│   ├── code-block-copy-button.tsx       <CodeBlockCopyButton> with success-toast feedback
│   ├── code-block-expand-button.tsx     <CodeBlockExpandButton> Dialog trigger
│   ├── code-block-wrap-button.tsx       <CodeBlockWrapButton> toggle
│   ├── code-block-download-button.tsx   <CodeBlockDownloadButton>
│   ├── code-block-traffic-lights.tsx    <CodeBlockTrafficLights> decoration
│   ├── code-block-footer.tsx            internal footer wrapper
│   ├── code-block-body-view.tsx         view-mode body (Shiki-tokenized HTML render)
│   ├── code-block-body-edit.tsx         edit-mode body (CodeMirror 6 mount)
│   ├── code-block-body-terminal.tsx     terminal-mode body (line array render)
│   ├── code-block-line-numbers.tsx      shared gutter component (view + terminal)
│   ├── code-block-line-highlight.tsx    overlay for highlighted-line tint + accent bar
│   ├── code-block-annotation-marker.tsx gutter marker + tooltip wrapper
│   ├── code-block-collapse-fade.tsx     fade-out gradient + "Show all" button
│   ├── code-block-streaming-cursor.tsx  blinking-tail cursor (client only)
│   ├── code-block-expand-modal.tsx      shadcn <Dialog> wrapper
│   └── code-block-empty.tsx             empty-state render
│
├── hooks/
│   ├── use-code-block-context.tsx       Provider + useCodeBlock context (internal)
│   ├── use-shiki-highlighter.ts         lazy-load Shiki + grammar cache + dual-theme tokenizer
│   ├── use-streaming-tokens.ts          append-only re-tokenize with rAF batching
│   ├── use-code-mirror.ts               mount/teardown CodeMirror 6 editor + extensions
│   ├── use-copy-to-clipboard.ts         clipboard write + execCommand fallback
│   ├── use-controllable-state.ts        local re-export of standard controlled/uncontrolled helper
│   └── use-resolved-theme.ts            reads .dark class via MutationObserver (informational only — tokens swap via CSS variables)
│
└── lib/
    ├── lang-resolution.ts               FILENAME_TO_LANG_MAP + resolveLang(lang, filename, override)
    ├── shiki-bundle.ts                  fine-grained Shiki imports + sync grammar set list
    ├── codemirror-langs.ts              dynamic-import map: lang id → @codemirror/lang-* package
    ├── line-utils.ts                    rangeToLines(highlightedLines) → number[]; splitToLines(value)
    ├── terminal-utils.ts                parseTerminalLines(value) → TerminalLine[]; promptDetect(line)
    ├── streaming-cache.ts               line-boundary-based diff cache
    └── codemirror-theme.ts              custom CodeMirror HighlightStyle approximating GitHub Light + GitHub Dark Default; dual-theme CSS variables
```

**Boundary rule:** every file in this folder is `type: "registry:component"` with `target: "components/code-block/<sub-path>"`. Never include `demo.tsx`, `usage.tsx`, or `meta.ts` in the registry item — those are docs-site only.

---

## Implementation specifics

### 1. Shiki tokenizer pipeline (client variant)

Use `shiki/core` + `shiki/wasm` for tree-shakeable import; never `import 'shiki'` (the wildcard barrel pulls every grammar / theme).

`lib/shiki-bundle.ts`:

```ts
import { createHighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import getWasm from "shiki/wasm";

// Sync-loaded grammars (the ~10 most common — bundled into initial chunk)
import tsGrammar from "shiki/langs/ts.mjs";
import tsxGrammar from "shiki/langs/tsx.mjs";
import jsGrammar from "shiki/langs/js.mjs";
import jsxGrammar from "shiki/langs/jsx.mjs";
import jsonGrammar from "shiki/langs/json.mjs";
import bashGrammar from "shiki/langs/bash.mjs";
import pyGrammar from "shiki/langs/python.mjs";
import mdGrammar from "shiki/langs/markdown.mjs";
import htmlGrammar from "shiki/langs/html.mjs";
import cssGrammar from "shiki/langs/css.mjs";

// Sync-loaded themes (small)
import githubLightTheme from "shiki/themes/github-light.mjs";
import githubDarkTheme from "shiki/themes/github-dark-default.mjs";

let cached: Promise<Highlighter> | null = null;

export function getCoreHighlighter(): Promise<Highlighter> {
  if (cached) return cached;
  cached = createHighlighterCore({
    engine: createOnigurumaEngine(getWasm),
    themes: [githubLightTheme, githubDarkTheme],
    langs: [tsGrammar, tsxGrammar, jsGrammar, jsxGrammar, jsonGrammar,
            bashGrammar, pyGrammar, mdGrammar, htmlGrammar, cssGrammar],
  });
  return cached;
}

const LAZY_LANG_LOADERS: Record<string, () => Promise<unknown>> = {
  rust: () => import("shiki/langs/rust.mjs"),
  go: () => import("shiki/langs/go.mjs"),
  sql: () => import("shiki/langs/sql.mjs"),
  yaml: () => import("shiki/langs/yaml.mjs"),
  diff: () => import("shiki/langs/diff.mjs"),
  java: () => import("shiki/langs/java.mjs"),
  c: () => import("shiki/langs/c.mjs"),
  cpp: () => import("shiki/langs/cpp.mjs"),
  // …
};

export async function ensureLangLoaded(highlighter: Highlighter, lang: string) {
  if (highlighter.getLoadedLanguages().includes(lang)) return;
  const loader = LAZY_LANG_LOADERS[lang];
  if (!loader) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[CodeBlock] Unknown lang "${lang}" — falling back to plaintext.`);
    }
    return;
  }
  const mod = (await loader()) as { default: unknown };
  await highlighter.loadLanguage(mod.default as never);
}
```

**Dual-theme tokenization** in `hooks/use-shiki-highlighter.ts`:

```ts
const html = highlighter.codeToHtml(value, {
  lang: resolvedLang,
  themes: {                                          // dual-theme mode
    light: themes.light,
    dark: themes.dark,
  },
  defaultColor: false,                                // emit both as CSS vars; no default color
  cssVariablePrefix: "--shiki-",
  transformers: [
    transformerNotationHighlight(),                  // honor `// [!code highlight]` if present
    customLineNumberTransformer(showLineNumbers),    // ours — adds line-number gutter spans
    customHighlightedLinesTransformer(rangeToLines(highlightedLines)),
  ],
});
```

`defaultColor: false` produces token markup like:

```html
<span style="color:var(--shiki-light);--shiki-dark:#abc123">foo</span>
```

A single CSS rule (in component CSS module) flips which variable resolves:

```css
.code-block-body .shiki-tokens span { color: var(--shiki-light); }
:where(.dark) .code-block-body .shiki-tokens span { color: var(--shiki-dark); }
```

Result: ONE tokenize, BOTH themes embedded, theme switch is a class toggle. No re-render, no flicker.

### 2. Streaming append-only tokenization

When `streaming={true}`, full re-tokenize on every keystroke or token append is wasteful. Algorithm:

```
cache = { prevValue, prevHtmlLines: string[], prevBoundary: number }

on new value v:
  if !v.startsWith(cache.prevValue):
    // Not append — content replaced. Full retokenize.
    cache.prevHtmlLines = tokenize(v).splitLines()
    cache.prevBoundary = v.length
  else:
    appendedTail = v.slice(cache.prevValue.length)
    // Stable boundary = last newline in prevValue
    lastNewline = cache.prevValue.lastIndexOf('\n')
    if lastNewline >= 0:
      stableLines = cache.prevHtmlLines.slice(0, /* count of newlines up to lastNewline */)
      tailToTokenize = v.slice(lastNewline + 1)
    else:
      stableLines = []
      tailToTokenize = v
    tokenizedTail = tokenize(tailToTokenize).splitLines()
    cache.prevHtmlLines = [...stableLines, ...tokenizedTail]
  cache.prevValue = v
  // Coalesce — only commit to DOM once per rAF
  scheduleRender(cache.prevHtmlLines.join(''))
```

`hooks/use-streaming-tokens.ts` owns this:

- Holds the cache in `useRef`.
- Re-tokenize via `getCoreHighlighter()` (which caches across calls — sub-ms after warm-up).
- `scheduleRender` debounces to next `requestAnimationFrame`; coalesces multiple rapid updates into one DOM write.
- On `streaming` flipping from `true` → `false`, fires one final full re-tokenize (cleans up any boundary edge cases).
- Renders a `<span class="streaming-cursor" />` after the last token while `streaming === true`.

**Demo affordance** (`code-block-streaming-cursor.tsx` + demo file): a "Replay streaming" button emits `value` in 10-char chunks at 50 ms intervals, demonstrating the algorithm stays smooth.

### 3. CodeMirror 6 integration (edit mode)

`hooks/use-code-mirror.ts`:

```ts
useEffect(() => {
  let view: EditorView | null = null;
  let cancelled = false;

  async function mount() {
    const ext: Extension[] = [
      basicSetup,                                            // line numbers, indent, etc.
      wrapCompartment.of(wrap === "wrap" ? EditorView.lineWrapping.of(true) : []),
      themeCompartment.of(buildCodeMirrorTheme(themes)),
      keymap.of([
        { key: "Tab",       run: indentMore },                // @codemirror/commands — real command
        { key: "Shift-Tab", run: indentLess },
      ]),
      EditorState.tabSize.of(tabSize),
      EditorView.editable.of(!readOnly),
      EditorView.updateListener.of((u) => {
        if (u.docChanged) onChange?.({ value: u.state.doc.toString() });
      }),
      keymap.of([{ key: "Mod-s", run: () => {
        if (onSave) { onSave({ value: view!.state.doc.toString() }); return true; }
        if (process.env.NODE_ENV !== "production") {
          console.warn("[CodeBlock] Cmd+S pressed but `onSave` is not wired — no-op.");
        }
        return true;                                          // captures the event regardless
      }}]),
    ];

    // Dynamic lang extension
    const langExt = await loadCodeMirrorLang(resolvedLang);
    if (langExt) ext.push(langExt);

    // CodeMirror theme (custom HighlightStyle approximating GitHub Light + Dark Default)
    ext.push(buildCodeMirrorTheme(themes));

    // Consumer extensions last so they can override
    if (editorExtensions) ext.push(...editorExtensions);

    if (cancelled) return;
    view = new EditorView({
      state: EditorState.create({ doc: value ?? defaultValue ?? "", extensions: ext }),
      parent: containerRef.current!,
    });
    setView(view);
  }

  mount();
  return () => { cancelled = true; view?.destroy(); };
}, [/* deliberately exclude `value` — handled via controlled update below */]);

// Controlled value sync (separate effect)
useEffect(() => {
  if (!view || value === undefined) return;
  const current = view.state.doc.toString();
  if (current === value) return;
  view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
}, [value, view]);
```

`lib/codemirror-langs.ts` is the dynamic-import dispatcher:

```ts
const CM_LANG_LOADERS: Record<string, () => Promise<Extension>> = {
  ts:   async () => (await import("@codemirror/lang-javascript")).javascript({ typescript: true, jsx: false }),
  tsx:  async () => (await import("@codemirror/lang-javascript")).javascript({ typescript: true, jsx: true }),
  js:   async () => (await import("@codemirror/lang-javascript")).javascript({ jsx: false }),
  jsx:  async () => (await import("@codemirror/lang-javascript")).javascript({ jsx: true }),
  json: async () => (await import("@codemirror/lang-json")).json(),
  py:   async () => (await import("@codemirror/lang-python")).python(),
  python: async () => (await import("@codemirror/lang-python")).python(),
  html: async () => (await import("@codemirror/lang-html")).html(),
  css:  async () => (await import("@codemirror/lang-css")).css(),
  markdown: async () => (await import("@codemirror/lang-markdown")).markdown(),
  // …
};

export async function loadCodeMirrorLang(lang: string): Promise<Extension | null> {
  const loader = CM_LANG_LOADERS[lang];
  if (!loader) return null;
  return loader();
}
```

**Edit mode + view-mode visual continuity (P2 substrate, locked 2026-05-10):** `@shikijs/codemirror` does not exist on npm despite the name; instead we ship a custom `lib/codemirror-theme.ts` that produces a CodeMirror `Extension` containing (a) `EditorView.theme({...})` for the editor chrome (background, gutters, selection, cursor — driven by ilinxa tokens) and (b) a `HighlightStyle` mapping the standard CodeMirror `@lezer/highlight` tag set (`tags.keyword`, `tags.string`, `tags.comment`, `tags.number`, `tags.variableName`, `tags.typeName`, `tags.function(...)`, etc.) to colors approximating Shiki's GitHub Light + GitHub Dark Default palettes. Colors are emitted as CSS variables so the `.dark` class toggles the active palette without re-mounting:

```ts
// lib/codemirror-theme.ts (sketch)
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";

// GitHub Light → GitHub Dark Default colour map. Each tag emits inline
// `color: var(--cb-fg-keyword)` style; CSS variables resolve via the .dark class.
const TOKEN_VARS = {
  keyword:   { light: "#cf222e", dark: "#ff7b72" },
  string:    { light: "#0a3069", dark: "#a5d6ff" },
  number:    { light: "#0550ae", dark: "#79c0ff" },
  comment:   { light: "#6e7781", dark: "#8b949e" },
  variable:  { light: "#1f2328", dark: "#e6edf3" },
  typeName:  { light: "#953800", dark: "#ffa657" },
  function:  { light: "#8250df", dark: "#d2a8ff" },
  operator:  { light: "#0550ae", dark: "#79c0ff" },
  // …
};

export function buildCodeMirrorTheme(_themes: CodeBlockThemes): Extension {
  const style = HighlightStyle.define([
    { tag: t.keyword,                color: "var(--cb-fg-keyword)" },
    { tag: t.string,                 color: "var(--cb-fg-string)" },
    { tag: t.number,                 color: "var(--cb-fg-number)" },
    { tag: t.comment,                color: "var(--cb-fg-comment)", fontStyle: "italic" },
    { tag: [t.variableName, t.propertyName], color: "var(--cb-fg-variable)" },
    { tag: [t.typeName, t.className], color: "var(--cb-fg-typeName)" },
    { tag: t.function(t.variableName), color: "var(--cb-fg-function)" },
    { tag: [t.operator, t.punctuation], color: "var(--cb-fg-operator)" },
    // …
  ]);

  const chrome = EditorView.theme({
    "&": {
      backgroundColor: "transparent",
      color: "var(--cb-fg-variable)",
      fontFamily: "var(--font-mono)",
      fontSize: "0.875rem",
      lineHeight: "1.6",
    },
    ".cm-gutters": { backgroundColor: "transparent", border: "none", color: "var(--muted-foreground)" },
    ".cm-activeLine": { backgroundColor: "color-mix(in oklch, var(--accent) 4%, transparent)" },
    ".cm-selectionBackground": { backgroundColor: "color-mix(in oklch, var(--accent) 25%, transparent)" },
    ".cm-cursor": { borderLeftColor: "var(--foreground)" },
  });

  return [chrome, syntaxHighlighting(style)];
}
```

A single global stylesheet (lives in `code-block.tsx`'s CSS-module / inline `<style>`) defines the CSS variables for both themes, toggled by `.dark`:

```css
.code-block-editor { /* light defaults */
  --cb-fg-keyword: #cf222e;
  --cb-fg-string: #0a3069;
  /* … */
}
:where(.dark) .code-block-editor {
  --cb-fg-keyword: #ff7b72;
  --cb-fg-string: #a5d6ff;
  /* … */
}
```

Result: theme switch is instant (CSS-variable swap; no CodeMirror reconfig needed for the colors themselves). The `Compartment` is reserved for genuine extension-set changes (e.g., live wrap toggle, language hot-swap).

**v0.2.0 upgrade path:** replace `lib/codemirror-theme.ts` with a hand-rolled Shiki→CodeMirror bridge that tokenizes the doc with Shiki on change (debounced via rAF) and applies tokens as a `StateField<DecorationSet>`. Pixel-perfect parity with view mode; ~150 lines; no API change.

`use-resolved-theme.ts` is still used (informational only — to e.g., announce theme changes to assistive tech).

```ts
import { Compartment } from "@codemirror/state";

const themeCompartment = new Compartment();
const wrapCompartment  = new Compartment();   // also used for live wrap toggle

// On theme change (observed via MutationObserver):
view.dispatch({
  effects: themeCompartment.reconfigure(isDark ? darkExt : lightExt),
});

// On wrap toggle (header button):
view.dispatch({
  effects: wrapCompartment.reconfigure(
    nextWrap === "wrap" ? EditorView.lineWrapping.of(true) : []
  ),
});
```

Compartments are the idiomatic CodeMirror 6 pattern for live extension reconfiguration without remounting the editor.

### 4. RSC variant mechanics

`code-block.server.tsx`:

```tsx
import "server-only";                                        // hard-block client import
import { resolveLang } from "./lib/lang-resolution";
import { getServerHighlighter } from "./lib/shiki-bundle";

export async function CodeBlock(props: CodeBlockServerProps) {
  // Runtime guard — backstop for JS consumers who bypass the typed narrowing.
  // TypeScript already rejects mode='edit' / streaming via CodeBlockServerProps.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyProps = props as any;
  if (anyProps.mode === "edit" || anyProps.streaming) {
    throw new Error(
      `[CodeBlock/server] mode='edit' or streaming=true requires the client variant. ` +
      `Import from '@ilinxa/code-block' instead of '@ilinxa/code-block/server'.`
    );
  }

  const lang = resolveLang(props.lang, props.filename, props.filenameToLang);
  const highlighter = await getServerHighlighter();
  await ensureLangLoaded(highlighter, lang);

  const html = highlighter.codeToHtml(props.value ?? "", {
    lang,
    themes: props.themes ?? DEFAULT_THEMES,
    defaultColor: false,
    cssVariablePrefix: "--shiki-",
    transformers: [/* same as client */],
  });

  return (
    <CodeBlockShell {...props} resolvedLang={lang}>
      <div
        className="shiki-tokens"
        // Server-rendered tokens; no client Shiki bundle needed
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </CodeBlockShell>
  );
}
```

The shell (`CodeBlockShell`) is a Server Component that renders chrome — header, footer, line numbers, gutter — as static markup. Interactive bits (copy button, wrap toggle, expand modal) are **client islands**, each marked `'use client'` and lazy-imported. So the RSC consumer's tree is:

```
<CodeBlock.Server (RSC)>
  <CodeBlockShell (RSC)>
    <CodeBlockTrafficLights (RSC) />           // pure decoration
    <CodeBlockFilename (RSC) />                 // pure text
    <CodeBlockLangPill (RSC) />                 // pure text
    <CodeBlockCopyButton (client island) />     // hydrates with onClick
    <pre><code dangerouslySetInnerHTML={html} /></pre>   // server-rendered
  </CodeBlockShell>
</CodeBlock.Server>
```

Streaming and edit are unreachable here by construction (throw at build/runtime). Long-block collapse is opt-in via `maxLines` — also implemented as a client island (`code-block-collapse-fade.tsx`).

### 5. Theme system (dual-theme CSS variables)

Already described in §1; key invariants:

- One tokenize emits both themes inlined per token as CSS variables.
- A single CSS rule (component-scoped) chooses which variable to resolve based on the active `.dark` ancestor.
- Theme switch = class toggle = no tokenize, no re-render, no flicker.
- Edit mode mirrors this via CSS variables defined on the editor host element (`--cb-fg-keyword`, `--cb-fg-string`, etc.); the same `.dark` class flips which palette resolves. CodeMirror is not re-mounted or reconfigured on theme change.

### 6. Terminal mode rendering

`parts/code-block-body-terminal.tsx`:

- Accepts either `lines: TerminalLine[]` (preferred) or `value: string`.
- For `value`, runs `parseTerminalLines(value)`: splits on `\n`, runs `promptDetect(line)` on each. Lines starting with `'$ '`, `'> '`, or `'# '` (with one space) are kind `'input'`; others default `'output'`. ANSI escape codes pass through as raw text (no parsing in v0.1.0; documented in guide).
- Renders an unstyled `<pre>` with `role="log"` (terminal output is a log surface) and `aria-live="off"` by default (consumer opts into live with a separate prop if they're streaming a live log).
- Per-line styling:
  - `input`: `<span class="terminal-prompt">$ </span><span class="terminal-input-text">{rest}</span>` — prompt muted, input bright.
  - `output`: muted-foreground.
  - `error`: `--destructive`.
- No syntax highlighting; no Shiki invocation.
- **Streaming in terminal mode** — independent of the Shiki append-only path. Algorithm: hold the previous parsed `lines: TerminalLine[]` in a ref; on new `value` / `lines`, compute the diff (length-prefix common, append new tail). DOM updates are rAF-batched to avoid thrash during high-frequency log writes. Blinking cursor renders after the last `input` line (or the last line of any kind if no `input` present). When `streaming` flips to `false`, no special reflow — the parsed lines are already final.

### 7. Long-block collapse + expand modal

- `maxLines` computed against total line count of `value` (post-`splitToLines`).
- When exceeded, render only the first `maxLines` lines + `<CodeBlockCollapseFade />`:
  - Bottom 40 px gradient from transparent to `--card`.
  - Centered "Show all (N more lines)" button.
- Click → `onExpandedChange({ expanded: true })`. Controlled or uncontrolled.
- When expanded, render full value + "Show less" button at the bottom.
- `showExpand` prop is independent — it opens a fullscreen `<Dialog>`. The modal's inner `<CodeBlock>` inherits all props except `showExpand={false}` and `maxLines={undefined}` (prevents recursion + always shows full content).
- `renderExpandModal` slot receives `{ open, onOpenChange, code }` where `code` is the pre-built inner instance.

### 8. Line highlights + annotations

- `highlightedLines` accepts `(number | { from, to })[]`; `lib/line-utils.ts#rangeToLines` flattens to a `Set<number>`.
- Shiki transformer wraps each highlighted line's `<span class="line">` with `data-highlighted="true"`.
- CSS:
  ```css
  [data-highlighted="true"] {
    background: color-mix(in oklch, var(--accent) 8%, transparent);
    box-shadow: inset 2px 0 0 var(--accent);
  }
  ```
- Annotations render as a small icon in the line-number gutter (positioned absolutely by line index). Hover/focus shows shadcn `<Tooltip>` with the message.
- `renderAnnotation` slot replaces the marker; receives `{ annotation, defaultMarker }`.

### 9. Copy + clipboard fallback

`hooks/use-copy-to-clipboard.ts`:

```ts
async function copy(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through to legacy path */ }

  // Legacy fallback
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch { return false; }
}
```

Copy button:
- Click → call `copy(value)` → on success: fire `onCopy({ value })`, swap icon (Copy → Check) for 1.5 s, announce "Copied" via `role="status"` live region.
- On failure: tooltip "Copy failed — select and copy manually."
- Keyboard: focusable, Enter/Space triggers.

### 10. Filename → lang resolution

`lib/lang-resolution.ts`:

```ts
export const FILENAME_TO_LANG_MAP: Record<string, string> = {
  ts: "ts", tsx: "tsx", js: "js", jsx: "jsx", mjs: "js", cjs: "js",
  json: "json", jsonc: "json", json5: "json",
  py: "python", pyw: "python", ipynb: "json",
  rb: "ruby", rake: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  c: "c", h: "c",
  cpp: "cpp", cxx: "cpp", cc: "cpp", hpp: "cpp",
  cs: "csharp",
  php: "php",
  swift: "swift",
  kt: "kotlin", kts: "kotlin",
  sh: "bash", bash: "bash", zsh: "bash",
  yml: "yaml", yaml: "yaml",
  toml: "toml",
  ini: "ini",
  md: "markdown", mdx: "markdown",
  html: "html", htm: "html",
  css: "css", scss: "scss",
  graphql: "graphql", gql: "graphql",
  sql: "sql",
  diff: "diff", patch: "diff",
  dockerfile: "dockerfile",
  txt: "plaintext", log: "plaintext",
};

export function resolveLang(
  lang: string | undefined,
  filename: string | undefined,
  override: ((args: { filename: string }) => string | undefined) | undefined,
): string {
  if (lang) return lang;
  if (!filename) return "plaintext";

  // Special-case: dockerfile / Makefile have no extension
  const lowered = filename.toLowerCase();
  if (lowered === "dockerfile") return "dockerfile";
  if (lowered === "makefile") return "makefile";

  const overridden = override?.({ filename });
  if (overridden) return overridden;

  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return FILENAME_TO_LANG_MAP[ext] ?? "plaintext";
}
```

Exported so consumers can call `resolveLang(...)` outside the block if they need to label a file.

### 11. Accessibility wiring

- Outer wrapper: `role="region"`, `aria-label={ariaLabel ?? "Code block — " + lang}` (or filename if set).
- View body: `<pre>` wraps `<code class="shiki-tokens">…</code>`. `<code>` gets `role="code"` (implicit; explicit not strictly needed but harmless).
- Edit mode: CodeMirror's built-in a11y posture; we add `aria-label="Code editor — <filename ?? lang>"` on the host div.
- Terminal mode: outer body `role="log"` + configurable `aria-live`.
- Buttons: every header / footer button has `aria-label` from `labels`; tooltips on hover/focus.
- Copy success: `<div role="status" aria-live="polite" class="sr-only">{labels.copied}</div>` appended on success, removed after 1.5 s.
- Focus rings honor `--ring` token (signal-lime). Tab order: outer region (single stop) → header buttons in order → body (in edit mode, focus enters editor; in view/terminal, focus is informational only) → footer.
- Streaming cursor: decorative; `aria-hidden="true"`. Live-region announcement on `streaming` flipping to `false`: "Code complete."
- Contrast: verified ≥ AA in both themes for: header text, line numbers, copy icon, body code tokens. Lighthouse a11y on demo ≥ 95.

### 12. Empty state

When `value === ''` and no `lines`:

- Body renders a single empty line height (~`rowHeight`) to prevent layout collapse.
- If `emptyMessage` is set, renders centered muted text.
- If `streaming === true`, renders just the blinking cursor (preserves "I'm waiting for content" UX).

### 13. Dev-mode guardrails

- Unknown `lang` → `console.warn`.
- `mode='edit'` + `value === undefined` + `defaultValue === undefined` → `console.warn` ("controlled prop missing").
- `streaming=true` on RSC variant → throw at runtime (server-only enforcement).
- `expanded` prop without `onExpandedChange` → silent (allowed for read-only-controlled).
- Cmd+S in edit mode without `onSave` → `console.warn` once per session.

---

## Demo composition — `demo.tsx`

The docs-site demo organizes into 8 sections, each demonstrating a specific capability:

1. **Hero (view, TypeScript, ~30 lines)** — A polished default render: filename "app.tsx", lang "tsx", copy button, GitHub theme. Sets the visual standard.
2. **Line highlights + annotations** — Same TS sample, `highlightedLines={[12, 13, 14]}` + 2 annotations (one warn, one error). Demonstrates the docs / error-trace use case.
3. **Streaming demo** — A "Replay streaming" button. On click, emits the value in 10-char chunks at 50 ms intervals. `streaming={isStillStreaming}` toggled by demo state. Shows append-only tokenization stays smooth (no flicker).
4. **JSON config view** — Pretty-printed JSON object, `showLineNumbers={true}`, `maxLines={20}` (forces collapse with "Show all"). Demonstrates JSON viewer + long-block UX.
5. **Terminal mode** — Structured `lines: TerminalLine[]` array showing `pnpm install` → output → `pnpm dev` → output. `showTrafficLights={true}` + `filename="zsh"`. Demonstrates the virtual-terminal use case.
6. **Edit mode** — Controlled `<CodeBlock mode="edit">` with starter TS code. `onSave` wired to a toast "Saved." Demonstrates the edit / playground use case + theme continuity with view mode.
7. **Custom header (run button)** — `renderHeader` slot example with a "Run" button in `actions`. Demonstrates the slot pattern.
8. **Inside rich-card-style composition** — A faux rich-card wrapper showing how the block lives inside a content card. Documents the primary integration point.

Each section has a short caption explaining the demonstrated capability.

---

## `dummy-data.ts`

Six fixtures, shipped as the `code-block-fixtures` registry-item sibling:

```ts
export const SAMPLE_TS = `// app.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Counter() {
  const [n, setN] = useState(0);
  return (
    <div className="flex items-center gap-3">
      <Button onClick={() => setN(n - 1)}>−</Button>
      <span className="font-mono">{n}</span>
      <Button onClick={() => setN(n + 1)}>+</Button>
    </div>
  );
}
`;

export const SAMPLE_JSON = JSON.stringify(
  {
    name: "ilinxa-ui-pro",
    version: "0.1.0",
    private: true,
    dependencies: {
      next: "^16.2.0",
      react: "^19.2.0",
      shiki: "^1.20.0",
    },
  },
  null,
  2,
);

export const SAMPLE_STREAM_CHUNKS: string[] = [
  /* full code split into 10-char chunks for the streaming demo */
];

export const SAMPLE_TERMINAL: TerminalLine[] = [
  { kind: "input",  text: "$ pnpm install" },
  { kind: "output", text: "Resolving... done" },
  { kind: "output", text: "Adding 247 packages..." },
  { kind: "input",  text: "$ pnpm dev" },
  { kind: "output", text: "  ▲ Next.js 16.2.x ready on http://localhost:3000" },
];

export const SAMPLE_ERROR_TRACE = `at Object.<anonymous> (/app/src/utils.ts:42:12)
at Module._compile (node:internal/modules/cjs/loader.js:1234:30)
TypeError: Cannot read property 'name' of undefined
    at processUser (/app/src/users.ts:7:24)
    at /app/src/index.ts:15:3
`;

export const SAMPLE_ERROR_ANNOTATIONS: CodeBlockAnnotation[] = [
  { line: 3, type: "error", message: "Cannot read property 'name' of undefined" },
  { line: 7, type: "warn",  message: "Unhandled rejection in processUser" },
];

export const SAMPLE_EDIT_DEFAULT = `function greet(name: string) {
  return \`Hello, \${name}!\`;
}

greet("ilinxa");
`;
```

---

## Dependencies + `meta.ts`

New project deps (declared in `meta.ts` per F-cross-07):

```ts
// in meta.ts — pinned versions researched on 2026-05-10 via `pnpm view <pkg> version`
dependencies: {
  npm: {
    "shiki":                       "^4.0.2",
    "@shikijs/transformers":       "^4.0.2",
    "@codemirror/state":           "^6.6.0",
    "@codemirror/view":            "^6.42.1",
    "@codemirror/commands":        "^6.10.3",
    "@codemirror/language":        "^6.0.0",   // HighlightStyle + syntaxHighlighting
    "@lezer/highlight":            "^1.2.0",   // tag set used by HighlightStyle
    "@codemirror/lang-javascript": "^6.2.5",
    "@codemirror/lang-json":       "^6.0.2",
    "@codemirror/lang-python":     "^6.2.1",
    "@codemirror/lang-html":       "^6.4.11",
    "@codemirror/lang-css":        "^6.3.1",
    "@codemirror/lang-markdown":   "^6.5.0",
    "lucide-react":                "^1.11.0",
  },
  shadcn: ["button", "dialog", "tooltip"],
},
```

shadcn primitives consumed (auto-declared by registry build):

- `button`
- `dialog`
- `tooltip`
- `dropdown-menu` (for the lang pill if we make it a quick-switch later — defer; v0.1.0 uses plain text)

`pnpm validate:meta-deps` must report 0 drift before commit.

**Note on version research:** before commit, run `pnpm view shiki version` / `pnpm view @codemirror/state version` to pin actual current versions; the carets above are placeholders informed by the project's "research current versions before installing" memory.

---

## `registry.json` shape

Two items: base + fixtures (per locked target convention).

```jsonc
{
  "name": "code-block",
  "type": "registry:component",
  "title": "Code Block",
  "description": "Language-agnostic code surface with view / edit / terminal modes, Shiki tokenization, dual-theme CSS-variable theming, streaming-friendly re-render, copy / line-numbers / line-highlights / annotations chrome, and an RSC pre-tokenized variant.",
  "registryDependencies": ["button", "dialog", "tooltip"],
  "dependencies": [
    "shiki@^4.0.2",
    "@shikijs/transformers@^4.0.2",
    "@codemirror/state@^6.6.0",
    "@codemirror/view@^6.42.1",
    "@codemirror/commands@^6.10.3",
    "@codemirror/language@^6.0.0",
    "@lezer/highlight@^1.2.0",
    "@codemirror/lang-javascript@^6.2.5",
    "@codemirror/lang-json@^6.0.2",
    "@codemirror/lang-python@^6.2.1",
    "@codemirror/lang-html@^6.4.11",
    "@codemirror/lang-css@^6.3.1",
    "@codemirror/lang-markdown@^6.5.0",
    "lucide-react@^1.11.0"
  ],
  "files": [
    { "path": "src/registry/components/code/code-block/code-block.tsx",          "type": "registry:component", "target": "components/code-block/code-block.tsx" },
    { "path": "src/registry/components/code/code-block/code-block.server.tsx",   "type": "registry:component", "target": "components/code-block/code-block.server.tsx" },
    { "path": "src/registry/components/code/code-block/index.ts",                "type": "registry:component", "target": "components/code-block/index.ts" },
    { "path": "src/registry/components/code/code-block/server.ts",               "type": "registry:component", "target": "components/code-block/server.ts" },
    { "path": "src/registry/components/code/code-block/types.ts",                "type": "registry:component", "target": "components/code-block/types.ts" },

    { "path": "src/registry/components/code/code-block/parts/code-block-header.tsx",            "type": "registry:component", "target": "components/code-block/parts/code-block-header.tsx" },
    { "path": "src/registry/components/code/code-block/parts/code-block-filename.tsx",          "type": "registry:component", "target": "components/code-block/parts/code-block-filename.tsx" },
    { "path": "src/registry/components/code/code-block/parts/code-block-lang-pill.tsx",         "type": "registry:component", "target": "components/code-block/parts/code-block-lang-pill.tsx" },
    { "path": "src/registry/components/code/code-block/parts/code-block-copy-button.tsx",       "type": "registry:component", "target": "components/code-block/parts/code-block-copy-button.tsx" },
    { "path": "src/registry/components/code/code-block/parts/code-block-expand-button.tsx",     "type": "registry:component", "target": "components/code-block/parts/code-block-expand-button.tsx" },
    { "path": "src/registry/components/code/code-block/parts/code-block-wrap-button.tsx",       "type": "registry:component", "target": "components/code-block/parts/code-block-wrap-button.tsx" },
    { "path": "src/registry/components/code/code-block/parts/code-block-download-button.tsx",   "type": "registry:component", "target": "components/code-block/parts/code-block-download-button.tsx" },
    { "path": "src/registry/components/code/code-block/parts/code-block-traffic-lights.tsx",    "type": "registry:component", "target": "components/code-block/parts/code-block-traffic-lights.tsx" },
    { "path": "src/registry/components/code/code-block/parts/code-block-footer.tsx",            "type": "registry:component", "target": "components/code-block/parts/code-block-footer.tsx" },
    { "path": "src/registry/components/code/code-block/parts/code-block-body-view.tsx",         "type": "registry:component", "target": "components/code-block/parts/code-block-body-view.tsx" },
    { "path": "src/registry/components/code/code-block/parts/code-block-body-edit.tsx",         "type": "registry:component", "target": "components/code-block/parts/code-block-body-edit.tsx" },
    { "path": "src/registry/components/code/code-block/parts/code-block-body-terminal.tsx",     "type": "registry:component", "target": "components/code-block/parts/code-block-body-terminal.tsx" },
    { "path": "src/registry/components/code/code-block/parts/code-block-line-numbers.tsx",      "type": "registry:component", "target": "components/code-block/parts/code-block-line-numbers.tsx" },
    { "path": "src/registry/components/code/code-block/parts/code-block-line-highlight.tsx",    "type": "registry:component", "target": "components/code-block/parts/code-block-line-highlight.tsx" },
    { "path": "src/registry/components/code/code-block/parts/code-block-annotation-marker.tsx", "type": "registry:component", "target": "components/code-block/parts/code-block-annotation-marker.tsx" },
    { "path": "src/registry/components/code/code-block/parts/code-block-collapse-fade.tsx",     "type": "registry:component", "target": "components/code-block/parts/code-block-collapse-fade.tsx" },
    { "path": "src/registry/components/code/code-block/parts/code-block-streaming-cursor.tsx",  "type": "registry:component", "target": "components/code-block/parts/code-block-streaming-cursor.tsx" },
    { "path": "src/registry/components/code/code-block/parts/code-block-expand-modal.tsx",      "type": "registry:component", "target": "components/code-block/parts/code-block-expand-modal.tsx" },
    { "path": "src/registry/components/code/code-block/parts/code-block-empty.tsx",             "type": "registry:component", "target": "components/code-block/parts/code-block-empty.tsx" },

    { "path": "src/registry/components/code/code-block/hooks/use-code-block-context.tsx",  "type": "registry:component", "target": "components/code-block/hooks/use-code-block-context.tsx" },
    { "path": "src/registry/components/code/code-block/hooks/use-shiki-highlighter.ts",    "type": "registry:component", "target": "components/code-block/hooks/use-shiki-highlighter.ts" },
    { "path": "src/registry/components/code/code-block/hooks/use-streaming-tokens.ts",     "type": "registry:component", "target": "components/code-block/hooks/use-streaming-tokens.ts" },
    { "path": "src/registry/components/code/code-block/hooks/use-code-mirror.ts",          "type": "registry:component", "target": "components/code-block/hooks/use-code-mirror.ts" },
    { "path": "src/registry/components/code/code-block/hooks/use-copy-to-clipboard.ts",    "type": "registry:component", "target": "components/code-block/hooks/use-copy-to-clipboard.ts" },
    { "path": "src/registry/components/code/code-block/hooks/use-controllable-state.ts",   "type": "registry:component", "target": "components/code-block/hooks/use-controllable-state.ts" },
    { "path": "src/registry/components/code/code-block/hooks/use-resolved-theme.ts",       "type": "registry:component", "target": "components/code-block/hooks/use-resolved-theme.ts" },

    { "path": "src/registry/components/code/code-block/lib/lang-resolution.ts",       "type": "registry:component", "target": "components/code-block/lib/lang-resolution.ts" },
    { "path": "src/registry/components/code/code-block/lib/shiki-bundle.ts",          "type": "registry:component", "target": "components/code-block/lib/shiki-bundle.ts" },
    { "path": "src/registry/components/code/code-block/lib/codemirror-langs.ts",      "type": "registry:component", "target": "components/code-block/lib/codemirror-langs.ts" },
    { "path": "src/registry/components/code/code-block/lib/line-utils.ts",            "type": "registry:component", "target": "components/code-block/lib/line-utils.ts" },
    { "path": "src/registry/components/code/code-block/lib/terminal-utils.ts",        "type": "registry:component", "target": "components/code-block/lib/terminal-utils.ts" },
    { "path": "src/registry/components/code/code-block/lib/streaming-cache.ts",       "type": "registry:component", "target": "components/code-block/lib/streaming-cache.ts" },
    { "path": "src/registry/components/code/code-block/lib/codemirror-theme.ts", "type": "registry:component", "target": "components/code-block/lib/codemirror-theme.ts" }
  ]
}
```

Plus a sibling `code-block-fixtures` item that ships only `dummy-data.ts` and depends on `code-block`.

**Locked target convention** is fully honored: every file `type: "registry:component"`, every target under `components/code-block/<sub-path>`. NO `demo.tsx` / `usage.tsx` / `meta.ts` in the registry item.

---

## Verification checklist (pre-commit)

Run before committing v0.1.0:

- [ ] `pnpm tsc --noEmit` clean
- [ ] `pnpm lint` clean
- [ ] `pnpm validate:meta-deps` reports 37 → 38 slugs, 0 drift
- [ ] `pnpm build` succeeds
- [ ] `pnpm registry:build` regenerates `public/r/code-block.json` and `public/r/code-block-fixtures.json` cleanly
- [ ] Component renders at `/components` and `/components/code-block`
- [ ] All 8 demo sections render and interact correctly
- [ ] Light + dark theme verified manually (no FOUC; no token mismatch)
- [ ] Cmd+S in edit mode fires `onSave`; in view mode falls through to browser
- [ ] Streaming demo: chunked emission stays smooth (verify with React DevTools profiler — single tokenize call, multiple paints)
- [ ] RSC variant: open in a tmp Next.js consumer that imports `@ilinxa/code-block/server`; verify zero Shiki in the client bundle (`pnpm build` + bundle analyzer)
- [ ] Smoke harness path-b: `pnpm dlx shadcn@4.6.0 add @ilinxa/code-block` against `e:/tmp/ilinxa-smoke-consumer/`; consumer-side `pnpm tsc --noEmit` clean
- [ ] Lighthouse a11y on `/components/code-block` ≥ 95

---

## Manual test plan

For each mode + variant combination, verify:

| Test | View (client) | Edit (client) | Terminal (client) | View (RSC) | Terminal (RSC) |
|---|---|---|---|---|---|
| Renders default | ✓ | ✓ | ✓ | ✓ | ✓ |
| Theme swap (light ↔ dark) instant (no re-tokenize) | ✓ | ✓ | n/a | ✓ | n/a |
| Copy fires + announces | ✓ | ✓ | ✓ | ✓ | ✓ |
| Line numbers correct | ✓ | ✓ | n/a | ✓ | n/a |
| Wrap toggle live | ✓ | ✓ | n/a | ✓ | n/a |
| Line highlights render | ✓ | ✓ | n/a | ✓ | n/a |
| Annotations: tooltip on hover/focus | ✓ | ✓ | n/a | ✓ | n/a |
| Long-block collapse + expand | ✓ | n/a | n/a | ✓ | n/a |
| Fullscreen modal opens + closes | ✓ | ✓ | ✓ | ✓ | ✓ |
| Streaming: smooth append, cursor visible, final clean-tokenize on stop | ✓ | n/a | ✓ | throws | throws |
| Edit: controlled `value` sync; `onChange` fires | n/a | ✓ | n/a | n/a | n/a |
| Edit: Cmd+S fires `onSave` | n/a | ✓ | n/a | n/a | n/a |
| Edit: Cmd+S warns when no handler | n/a | ✓ | n/a | n/a | n/a |
| Edit + view visually consistent (same theme) | ✓ (compare) | ✓ (compare) | n/a | n/a | n/a |
| Terminal: prompt detect; output / error styling | n/a | n/a | ✓ | n/a | ✓ |
| Terminal: structured `lines` API renders kinds correctly | n/a | n/a | ✓ | n/a | ✓ |
| Filename → lang derivation (no `lang` prop) | ✓ | ✓ | n/a | ✓ | n/a |
| Unknown lang → plaintext + dev warn | ✓ | ✓ | n/a | ✓ | n/a |
| Empty value renders chrome only | ✓ | ✓ | ✓ | ✓ | ✓ |
| Keyboard focus ring on header buttons | ✓ | ✓ | ✓ | ✓ | ✓ |
| Lighthouse a11y ≥ 95 | ✓ (demo page) |

---

## GATE 3 readiness gates

Per `.claude/rules/component-readiness-review.md`, the v0.1.0 spot-check (4 fixed + 1 rotating dimension) must pass.

- **Fixed dimensions:** procomp planning docs sync ✓ — registry distribution ✓ — meta + manifest sync ✓ — verification (tsc/lint/build + smoke path-b) ✓.
- **Rotating dimension — proposed:** **public API** (slot/callback shapes; F-cross-12 lessons). This component introduces a lot of new public surface (callbacks, slot args, three modes × two variants), so API hygiene is the highest-signal rotating pick. Verify every callback is object-shape; verify slot args don't leak internal state; verify `renderHeader` / `renderExpandModal` / `renderAnnotation` are stable across re-renders; verify no `Args`-suffix proliferation (which F-cross-12 cleanup removed across the library).

Review file lives at `docs/procomps/code-block-procomp/reviews/2026-05-1?-v0.1.0-spotcheck.md`.

---

## Sign-off

**User confirmed 2026-05-10** — plan accepted after self-validation pass surfaced 5 refinements (R1–R5), R1–R4 fixed inline, R5 resolved as **R5-A: pin `lucide-react` to the project's actual installed version via `pnpm list lucide-react` before commit**.

Proceeding with implementation in this order:

1. Add the `code` category to `src/registry/categories.ts`.
2. `pnpm new:component code/code-block` to scaffold the sealed folder.
3. Install pinned versions of new deps (research current versions; pin to caret of latest stable).
4. Implement in pass order: lib utilities → hooks → parts (view body first, then edit, then terminal) → root `<CodeBlock>` → RSC variant → demo + dummy-data → meta + manifest entry → registry.json.
5. Run the verification checklist + GATE 3 spot-check review.
6. Update STATUS.md + decision file + Recent activity pointer.
