# code-block — procomp description

> Stage 1: what & why. The "should we build this at all?" doc.
>
> **Greenfield component.** Not a migration. First component in a "code surface" family. Anticipated future siblings: `code-diff` (split / unified diff view), `notebook` (multi-cell variant), `terminal-emulator` (true xterm.js wrapper for live shells). `code-block` lands first because it is the substrate every chat / docs / rich-card surface needs *now*, and its decisions (substrate, theming, callback shapes, header/footer slot grammar) will lock in for the family.

## Problem

Every internal surface that displays code — chat panels, docs sites, markdown editors, rich-card content sections, JSON viewers, log readers, snippet libraries, API explorers, virtual terminals, error-trace renderers — needs the same surface: **a syntax-highlighted, themed, chrome-wrapped code block with a header (filename + language + actions), a body (line numbers, wrap/scroll, optional line highlights), and a footer (caption / status), behaving sensibly in light + dark and at any width**.

Today's options all fail one way:

- **Roll your own with `<pre><code>`** — works for raw display; the moment you need syntax highlighting, copy-to-clipboard, line numbers, line highlights, wrap toggle, header chrome, dark-mode-aware tokenization, expand/collapse for long blocks, or streaming-friendly re-render, you are wiring up Prism / Shiki / highlight.js by hand and re-inventing the chrome. Every consumer rebuilds the same code with subtle visual / a11y / contrast bugs.
- **`react-syntax-highlighter`** — covers the highlighting layer, but ships with a pre-1990s look-and-feel out of the box. Its themes do not align with ilinxa tokens; it has no chrome (no header, no copy button, no filename pill, no line-highlight overlay), and consumers end up wrapping it in their own div soup. Bundle weight is also significant (lowlight + all grammars) without fine-grained import.
- **`react-shiki` / `bright` / `next-mdx-remote`'s shiki integration** — all good highlighters but each is highlighter-only. None ship the *block* (chrome + actions + footer). Each comes with a different SSR / RSC / streaming story, often forcing the consumer to pick one for their whole app.
- **shadcn / Radix primitives** — there is no `code-block`. Closest is `<pre>` styling in `typography` blocks; that is read-only, themeless, and offers zero affordances.
- **MDX `<CodeBlock>` recipes scattered in design-system docs** — every team copy-pastes from the Vercel, Tailwind, or Radix docs site, then drifts. None are reusable across consumers.
- **Per-app rebuilds** — what teams actually do today. The result: chat panels render code one way, docs renders another, rich-card content cards render a third, virtual terminals render a fourth — each with subtly different copy UX, different theme handling, different long-line behavior, different streaming/re-render perf, different a11y.

This component closes that gap with one opinionated, themeable, chrome-complete code surface that drops into chat messages, MD renderers, JSON viewers, terminal-style readouts, rich-card content sections, and any other "show some code" need — same look-and-feel, same affordances, same a11y, same theming, same callback grammar, in either view or edit mode.

## In scope

- **Three render modes** — `view` (default; read-only, syntax-highlighted), `edit` (full editor via CodeMirror 6, syntax-aware, controlled `value` + `onChange`), `terminal` (monospace, prompt-prefixed lines, output-styled lines, no syntax highlighting). Mode is a single `mode` prop with sensible defaults; a consumer can flip between view and edit at runtime without remounting.
- **Language-agnostic** — `lang?: string` prop accepts any TextMate-grammar identifier (`'ts'`, `'tsx'`, `'js'`, `'json'`, `'python'`, `'bash'`, `'rust'`, `'go'`, `'sql'`, `'yaml'`, `'css'`, `'html'`, `'markdown'`, `'diff'`, `'jsx'`, `'java'`, `'c'`, `'cpp'`, `'csharp'`, `'php'`, `'ruby'`, `'swift'`, `'kotlin'`, `'graphql'`, `'dockerfile'`, `'toml'`, `'ini'`, plus a `'plaintext'` fallback). Component lazily loads grammars on demand. Unknown languages fall back to plaintext + console.warn in dev. Aliases supported (`'js' | 'javascript'`, `'py' | 'python'`, etc.).
- **Filename → language resolution** — explicit priority chain: `lang` prop (if set) wins; else `filenameToLang(filename)` consumer override (if provided); else built-in extension map; else `'plaintext'`. When an extension maps to multiple grammars, the canonical pick is used (documented in guide.md; consumer overrides via `filenameToLang` for app-specific disambiguation).
- **Mode compatibility** — `mode='view'` and `mode='terminal'` work in both client and RSC variants. `mode='edit'` requires the client variant (CodeMirror needs DOM). `streaming={true}` also requires the client variant (tokens append over time). The RSC variant (`/server` import) pre-tokenizes once at build / request time; passing `mode='edit'` or `streaming` to it throws at build with a typed error.
- **Window chrome (header)** — slim header strip above the code body. Default contents (each gated by a boolean prop):
  - **Filename pill** (`filename?: string`, monospace, left-aligned)
  - **Language label** (`showLanguage`, default `true`; auto-derived from `lang`; lowercase, monospace, muted)
  - **Copy button** (`showCopy`, default `true`; clipboard write via `navigator.clipboard.writeText`; visual confirmation — icon swap to checkmark for ~1.5 s + announce to live region)
  - **Custom action slot** (`actions?: ReactNode` — consumer-supplied buttons; rendered after copy)
  - **Expand / collapse-toggle button** (`showExpand`, default `false`; opens the code in a fullscreen `<Dialog>` modal — slot replaceable)
  - **Wrap-toggle button** (`showWrap`, default `false`; toggles wrap vs scroll for long lines)
  - **macOS-style traffic-light decoration** (`showTrafficLights`, default `false`; opt-in; renders three muted circles like Claude/macOS Terminal — purely decorative)
  - Replaceable wholesale via `renderHeader` slot. Set `header={false}` to hide.
- **Window chrome (footer, optional)** — slim footer strip below the code body. Default empty (= rendered iff content provided). Consumer-driven via `footer?: ReactNode` slot. Common uses: caption, character/line counts, status indicators, "edited" pill, attribution.
- **Line numbers** — `showLineNumbers` (default: `false` for view, `true` for edit, `false` for terminal — terminals don't show them). Right-aligned, monospace, muted. Padded based on total line count (1–9 → 1 col, 10–99 → 2 cols, etc.). Click-on-number fires `onLineClick?: (args: { line }) => void` if wired; component does not copy anchor links or write to clipboard itself (consumer owns the URL / anchor semantics).
- **Line wrapping** — `wrap` prop: `'wrap' | 'scroll'` (default `'scroll'` to match Claude/ChatGPT precedent — most consumers prefer horizontal scroll for code; toggleable per block via the wrap button when `showWrap` is true).
- **Line highlights** — `highlightedLines?: number[] | LineRange[]` (1-indexed). Highlighted rows render with a subtle accent-bar in the gutter + tinted row background using `--accent / 8%`. Useful for focusing attention on specific lines (docs use cases, error traces).
- **Line annotations / messages** — `annotations?: { line: number; type: 'info' | 'warn' | 'error'; message: string }[]`. Renders a small inline marker in the gutter; hover or focus shows the message in a tooltip. Useful for compiler errors, lint warnings, reviewer notes.
- **Long-block collapse** — `maxLines?: number` (default `undefined`). When set and content exceeds the cap, render only the first `maxLines` lines + a fade-out gradient + a "Show all (N more lines)" expand button at the bottom. Click expands inline; click again collapses. State controlled via `expanded?: boolean` + `onExpandedChange` (or uncontrolled).
- **Streaming-friendly re-render** — explicit `streaming?: boolean` prop. When `true`: (a) suppresses re-tokenization on every partial-content append; instead, retokenizes in chunked rAF batches; (b) appends-only optimization (only the new tail is tokenized, prior tokens are reused); (c) shows a blinking cursor at the end while `streaming=true`. Toggling `streaming` to `false` triggers a final full re-tokenize. Critical for chat consumers (Claude/ChatGPT-style streaming responses).
- **Edit mode** — `mode='edit'` swaps the view-only renderer for a CodeMirror 6 instance. **Visual continuity with view mode is near-match** (same JetBrains Mono font, same line-height, close token colors) via a custom CodeMirror `HighlightStyle` that approximates Shiki's GitHub Light + GitHub Dark Default token palettes using dual-theme CSS variables — the same `.dark`-class swap mechanism as view mode. Pixel-perfect parity (full Shiki → CodeMirror bridge) defers to v0.2.0 as an additive replacement of the theme file. `value` + `onChange?: (args: { value }) => void` — controlled. `readOnly?: boolean` toggle. Editor extensions opt-in via `editorExtensions?: Extension[]` (escape hatch for consumers who want autocomplete, linting, vim mode, etc.). Editor inherits all chrome (header, footer, line numbers, wrap, highlights). Tab uses CodeMirror's `indentMore` / Shift+Tab uses `indentLess` (matches VS Code). Cmd+S / Ctrl+S fires `onSave` if wired.
- **Terminal mode** — `mode='terminal'` renders content as monospace lines with two row variants distinguished by line prefix:
  - Prompt rows: lines beginning with `'$ '`, `'> '`, or `'# '` render the prefix in `--muted-foreground` and the rest in `--foreground`.
  - Output rows: render in `--muted-foreground`.
  - Optional `lines: TerminalLine[]` array prop as alternative to raw string — `{ kind: 'input' | 'output' | 'error', text: string }`. When `lines` is provided, it overrides `value`. `kind: 'error'` renders in `--destructive`.
  - No syntax highlighting (terminal output is heterogeneous; a single grammar would distort).
  - Optional cursor at end if `streaming` and last line is an `input`.
  - `showLineNumbers` defaults to `false` in terminal mode (terminals don't show them).
- **Copy** — ships built-in (header copy button). Semantics: copy the entire `value` to clipboard. Visual confirmation: icon swap (Copy → Check) for 1.5 s + screen-reader announcement via live region. `onCopy?: (args: { value }) => void` fires *after* the clipboard write succeeds (analytics / logging hook — it does NOT replace the clipboard write). Setting `showCopy={false}` hides the button entirely.
- **Run / execute (slot only)** — no built-in run UX. Consumers (e.g., a JS playground, SQL workbench) add a "Run" button via the `actions` slot and own the execution. Code-block emits no run-related events; this stays a slot-only concern to keep the component pure-presentational.
- **Download** — opt-in `showDownload`, default `false`. When `true`, renders a download button in the header that triggers `onDownload?: (args: { value, filename }) => void`. Default behavior if no `onDownload` wired: synthesize a `Blob`, derive filename from `filename` prop (or `code.<ext>`), trigger browser download.
- **Theme** — light + dark via Shiki's dual-theme transformer (single tokenize, both themes inlined as CSS variables; toggled by the active `.dark` class on root — no re-tokenization on theme switch). Default theme pair is project-aligned: `'github-light'` for light, `'github-dark-default'` for dark — both have decent contrast on ilinxa's cool-graphite dark and cool-off-white light backgrounds. Token colors (chrome, borders, header text, line numbers, gutter) come from project tokens (`--card`, `--border`, `--muted-foreground`, etc.). Theme overridable via `themes?: { light: string | ShikiThemeObject; dark: string | ShikiThemeObject }` — string is a Shiki bundled theme name; object is a Shiki theme spec.
- **Polymorphic root** — accepts `className`, `style`. Component fills its parent's width; height is intrinsic to content unless `maxHeight` is set, in which case body becomes scroll-y.
- **Object-shape callbacks** from day one (per F-cross-12 lessons): `onChange`, `onCopy`, `onSave`, `onDownload`, `onLineClick`, `onExpandedChange`, `onWrapChange` — every callback takes a single `args` object.
- **Accessibility** — outer `role="region"` with `aria-label` (default: `"Code block — <lang>"` or `"Code block — <filename>"`). Inner code area `role="code"` (with `aria-readonly` in view mode). Header buttons all `aria-label`'d (`"Copy code"`, `"Toggle wrap"`, etc.); copy success announced via `role="status"` live region. Edit mode inherits CodeMirror 6's a11y posture (which is solid). Focus rings honor `--ring`. Contrast verified ≥ AA in both themes for all chrome (header text, line numbers, copy button, body code). Keyboard: copy via Cmd/Ctrl+Shift+C when the block has focus; expand-toggle via Enter/Space on the focused control.
- **Bundle posture** — two distribution variants with distinct budgets:
  - **Client variant** (`@ilinxa/code-block`) — Shiki imported via fine-grained `shiki/core` + `shiki/wasm` + on-demand grammar loading. Default ships ~10 most-common grammars synchronously (ts/tsx/js/jsx/json/python/bash/markdown/html/css); other grammars dynamic-import on first use. Theme bundles loaded synchronously. **Budget: ~300 KB gz initial chunk for view-only TS.** Comparable to `pdf-viewer`'s pdfjs payload; honest, not optimistic.
  - **RSC variant** (`@ilinxa/code-block/server`) — pre-tokenizes server-side; emits static HTML; client ships zero Shiki. **Budget: <10 KB gz initial chunk.** This is the bundle-delta incentive for docs / blog / marketing consumers who don't need edit / streaming.
- **SSR posture** — view-only mode is RSC-friendly because `<CodeBlock>` is `'use client'` but its body output is pre-rendered HTML on first paint (Next.js handles the boundary). v0.1.0 defers the dedicated `/server` zero-client-Shiki variant to v0.2.0 (it requires a separate client-island shell that omits the Shiki import; non-trivial). `CodeBlockServerProps` type is shipped as a public scaffold so consumers can prepare for the v0.2.0 RSC export without breaking changes. Edit + streaming are client-only by definition.
- **Soft-failure** — invalid `lang` falls back to plaintext + dev warning. CodeMirror init failure (edit mode) surfaces an inline error with a "Reload as view-only" button. Clipboard API unavailable: copy button still renders but click triggers a fallback `document.execCommand('copy')` path; on total failure, button shows a tooltip "Copy failed — select and copy manually."

## Out of scope

Explicitly deferred. Each is real demand we choose not to address now to keep scope tractable.

- **Diff view (split / unified)** — comparing two versions of code. Useful but it is a *different surface shape*: two code bodies aligned by hunks, with `+ / -` gutter markers. Defer to sibling `code-diff` component (anticipated future component). v0.1.0 supports `lang='diff'` which renders unified-diff text with `+ / -` line coloring via the diff grammar — that covers basic cases without committing to the split-view UI.
- **Multi-file tabs (codesandbox-style)** — a tabbed surface holding multiple code-blocks for related files. Useful for tutorial / playground consumers but is fundamentally a *layout* concern, not a code-block concern. Compose externally: `<Tabs>` from shadcn + multiple `<CodeBlock>` inside each `<TabsContent>`. v0.2.0 candidate: `code-tabs` sibling component that bundles this composition.
- **Search / find-in-code** — `Cmd+F` overlay inside the block. CodeMirror has a search extension; consumer can opt in via `editorExtensions`. View-mode search defer to v0.2 if demand surfaces.
- **True xterm.js terminal emulation** — terminal *mode* is presentational only (renders pre-recorded shell output as styled lines). Live-shell subscribers / PTY connections / ANSI escape parsing / cursor control are all out of scope; that is `terminal-emulator`'s territory (future component, xterm.js wrapper). v0.1.0 explicitly does not parse ANSI escape codes (e.g., colored output from `ls --color`); raw escapes will render as garbled text. We can add basic ANSI → token translation in v0.2.0 if real demand surfaces.
- **Code execution / run** — sandboxing untrusted code is a security concern beyond a component's purview. Consumers wire their own runner via the `actions` slot. We will not ship a `<RunButton>` part.
- **Language auto-detection** — guessing the language from content alone (`hljs.highlightAuto`-style). Unreliable; consumer has the context (filename, MIME, source). We require explicit `lang` or derivable filename.
- **Code folding (collapse arbitrary blocks of code)** — folding `{ ... }` blocks via CodeMirror folding extension. Defer; consumer can opt in via `editorExtensions` in edit mode. View mode does not support folding in v0.1.0.
- **Linting / autocomplete inline** — language servers, type checking, IntelliSense. Consumer's job (CodeMirror language packages plug in via `editorExtensions`).
- **Syntax-aware copy (Cmd+C with formatting)** — copying with HTML / RTF formatting preserved. Useful for paste-into-doc workflows but adds clipboard manager complexity; defer.
- **Codecells / Jupyter-style multi-cell** — different concept; out-of-scope. `notebook` future component.
- **Image / SVG embed** — `<img>` inside code blocks. Out of scope; treat as text.
- **Markdown rendering inside code-block** — code-blocks render code, not markdown. (Hosting the inverse: a markdown viewer that *embeds* code-blocks for fenced sections — that is `markdown-editor`'s job, and it composes us.)
- **Save shortcut binding when `onSave` not wired** — Cmd+S is captured *only in edit mode*. With no `onSave` handler, it is a silent no-op + dev warning (does NOT fall back to browser's "Save Page As"). View and terminal modes do NOT capture Cmd+S; the browser default fires.

## Target consumers

- **Chat panels** (in-flight `chat-panel` from active queue) — render assistant responses with code blocks. Streaming-friendly; copy button per block; filename when assistant suggests a file path. Most demanding consumer — drives the streaming + theming + chrome design.
- **Markdown viewers + editors** (existing `markdown-editor`, future `markdown-viewer`) — render fenced code blocks (` ```ts ... ``` `) inline. Filename from `lang:filename` syntax (e.g., ` ```ts:app.tsx`).
- **Rich-card "code section"** (existing `rich-card`) — composed inside rich-card as a content-section type. The user explicitly cited this as a primary use case.
- **JSON / config viewers** — pretty-printed JSON / YAML / TOML with copy + line numbers.
- **API explorers** — request / response code samples; runnable via consumer-supplied actions.
- **Snippet libraries** — reusable code snippets with copy + filename.
- **Error / log readers** — render stack traces + log lines; lang='plaintext' or lang='log'; line highlights for offending lines.
- **Virtual terminal surfaces** — terminal mode for command demos, deploy logs, install-recipe walkthroughs (e.g., a docs page showing `pnpm add` + its output).
- **Documentation sites** — fenced code blocks inside MDX content; line highlights for tutorial focus; expand button for long examples.
- **CMS / blog editors** — embed code blocks in long-form content.
- **Diff renderers (basic)** — `lang='diff'` mode renders unified diff text with `+/-` coloring; defer split-view to `code-diff`.

The consumer is a **frontend dev with code content (a string + a language) and the requirement "render this professionally, themed to match, with copy + line numbers + line highlights, and let me put it inside chat / docs / cards"**. They do not want to wire Shiki themselves, build chrome, or maintain streaming-tokenization perf.

## Rough API sketch

```tsx
// Simplest read-only block (filename derives lang from extension)
<CodeBlock filename="app.tsx" value={tsxCode} />

// Explicit lang + line highlights (docs use case)
<CodeBlock
  lang="python"
  value={pyCode}
  highlightedLines={[12, 13, 14]}
  showLineNumbers
/>

// Streaming code in a chat assistant response
<CodeBlock
  lang="ts"
  value={partial}
  streaming={isStillStreaming}
  showLineNumbers={false}
/>

// Long block with collapse
<CodeBlock
  lang="json"
  value={bigJson}
  maxLines={20}
/>

// Edit mode (controlled)
<CodeBlock
  mode="edit"
  lang="ts"
  filename="app.ts"
  value={editorValue}
  onChange={({ value }) => setEditorValue(value)}
  onSave={({ value }) => save(value)}
/>

// Terminal mode (raw string with $ prefix convention)
<CodeBlock
  mode="terminal"
  value={`$ pnpm install\nResolving... done\n$ pnpm dev\n  ▲ Next.js 16.2.x ready on http://localhost:3000`}
/>

// Terminal mode (structured lines API)
<CodeBlock
  mode="terminal"
  lines={[
    { kind: 'input',  text: '$ pnpm install' },
    { kind: 'output', text: 'Resolving... done' },
    { kind: 'input',  text: '$ pnpm dev' },
    { kind: 'output', text: '  ▲ Next.js 16.2.x ready on http://localhost:3000' },
    { kind: 'error',  text: 'EADDRINUSE: port 3000 already in use' },
  ]}
/>

// Custom action (e.g., "Run" button feeding consumer's runner)
<CodeBlock
  lang="js"
  value={js}
  actions={
    <Button size="sm" onClick={() => runner.execute(js)}>Run</Button>
  }
/>

// Header customization — only filename + copy
<CodeBlock
  lang="ts"
  filename="app.ts"
  value={code}
  showLanguage={false}
/>

// Header off
<CodeBlock lang="ts" value={code} header={false} />

// Custom header (full replacement)
<CodeBlock
  lang="ts"
  value={code}
  renderHeader={({ filename, lang, copyButton, trafficLights }) => (
    <MyToolbar>
      {trafficLights}
      <MyToolbar.Filename>{filename}</MyToolbar.Filename>
      <MyToolbar.LangPill>{lang}</MyToolbar.LangPill>
      <MyToolbar.Spacer />
      <MyButton onClick={runIt}>Run</MyButton>
      {copyButton}
    </MyToolbar>
  )}
/>

// macOS traffic-lights (chat / terminal aesthetic)
<CodeBlock
  mode="terminal"
  showTrafficLights
  filename="zsh"
  value={shellOutput}
/>

// Inside rich-card "code" section
<RichCard>
  <RichCard.Body>
    <RichCard.Section type="code">
      <CodeBlock lang="ts" value={code} />
    </RichCard.Section>
  </RichCard.Body>
</RichCard>

// RSC pre-tokenized (server-rendered, zero client-shiki)
import { CodeBlock } from '@ilinxa/code-block/server';
<CodeBlock lang="ts" value={code} />

// Annotations (compiler errors)
<CodeBlock
  lang="ts"
  value={code}
  annotations={[
    { line: 7, type: 'error', message: "Type 'string' is not assignable to type 'number'." },
    { line: 12, type: 'warn',  message: 'Unused variable: foo' },
  ]}
/>

// Theme override (consumer wants Solarized)
<CodeBlock
  lang="ts"
  value={code}
  themes={{ light: 'solarized-light', dark: 'solarized-dark' }}
/>
```

## Example usages (the six listed by user, expanded)

**1. Chat panel — assistant streaming a code response**

A chat surface receives an SSE / fetch-stream of an assistant reply. As tokens arrive, the consumer parses fenced code blocks (` ```ts ... ``` `) and renders each one as `<CodeBlock lang="ts" value={partial} streaming />`. Streaming flag suppresses thrash, shows blinking cursor at tail, and append-only-tokenizes for perf. When the block closes, the consumer flips `streaming={false}` for one final clean re-tokenize. Copy button appears in header from the start; user can copy mid-stream if they want. This is the demanding case that anchors the substrate choice.

**2. Markdown viewer — fenced code blocks in a `.md` file**

A markdown renderer (e.g., react-markdown / Plate's markdown deserializer) intercepts fenced code blocks and replaces them with `<CodeBlock lang={info} value={raw} filename={...} />`. Filename comes from the extended fence syntax `lang:filename` (e.g., ` ```ts:src/app.tsx`). Line highlights come from inline directive comments (e.g., `// hl:12-14`). Common in docs pages, blog posts, README rendering.

**3. JSON / config viewer**

A settings or API-explorer surface needs to show JSON pretty-printed with line numbers, copy, and possibly highlighted lines (e.g., the user's last edit). `<CodeBlock lang="json" value={JSON.stringify(obj, null, 2)} showLineNumbers highlightedLines={lastEditedLines} />`. No edit mode here; it is read-only display.

**4. Rich-card "code" section (the explicitly-cited primary case)**

`rich-card` already supports section types. Adding a `'code'` section type that renders `<CodeBlock>` internally gives content authors a first-class way to embed code samples in cards. Filename, lang, line highlights all configurable per section. Inherits rich-card's section spacing + theming. This is composition: code-block lands as the substrate; rich-card v0.5 (or v0.4.x patch) adds `type: 'code'` to its section discriminator.

**5. Virtual terminal — install / deploy walkthrough**

A docs page or onboarding flow shows the user a sequence of shell commands and their output as a terminal-styled block. `<CodeBlock mode="terminal" filename="zsh" showTrafficLights lines={installScript} />` with `lines` being a structured `TerminalLine[]` array — input rows render with prompt prefixes, output rows render in muted color, error rows in destructive. No live shell; the data is pre-baked in the docs source. Multiple terminal blocks can be composed for a multi-step walkthrough.

**6. Edit mode — code playground / snippet workbench**

A snippet editor surface wants the user to type / edit code in a themed editor matching the rest of the docs site. `<CodeBlock mode="edit" lang="ts" value={code} onChange={({ value }) => setCode(value)} onSave={save} />`. Editor inherits the same Shiki theme as view mode (visual continuity; user toggles between view and edit without losing visual context). Tab / autoindent / bracket matching come from CodeMirror defaults; advanced extensions (autocomplete, lint) opt-in via `editorExtensions`.

**Bonus example: error-trace renderer (extra utility)**

A debug overlay shows a JS stack trace. `<CodeBlock lang="js" value={traceText} highlightedLines={[errorLine]} annotations={[{ line: errorLine, type: 'error', message: errorMsg }]} maxLines={30} />`. Highlighted line draws the eye; annotation tooltip shows the message; long traces collapse to 30 lines with "Show all."

## Success criteria

The component is "done" when:

1. **View mode renders correctly** for the documented language set; tokenization is visually faithful (matches GitHub / VS Code's GitHub-themed rendering); fonts are JetBrains Mono throughout.
2. **Edit mode renders correctly** with CodeMirror 6 + a custom `HighlightStyle` approximating Shiki's GitHub themes; near-match visual continuity with view mode (same JetBrains Mono font, same line-height, close token colors via dual-theme CSS variables); `value` + `onChange` + `onSave` all work as documented. Pixel-perfect Shiki → CodeMirror bridge is deferred to v0.2.0.
3. **Terminal mode renders correctly** for both raw-string and structured-lines APIs; prompt detection (`$ `, `> `, `# `) works; output / error styling distinguishable; `showTrafficLights` opt-in renders three muted circles.
4. **Language list verified** — the documented ~30 languages all tokenize; aliases work (`'js'` and `'javascript'` both load JS grammar); plaintext fallback for unknown lang + dev warning fires.
5. **Filename → lang derivation** — extension map covers all documented languages; filename without ext renders as plaintext.
6. **Copy** — clipboard copy works in supported browsers; visual confirmation (icon swap + 1.5 s revert); live-region announcement; fallback path for browsers without `navigator.clipboard`.
7. **Line numbers** — render correctly aligned; padding scales with line count; click-on-number fires `onLineClick` if wired.
8. **Wrap toggle** — `showWrap` button toggles wrap / scroll behavior live; controlled `wrap` prop overrides.
9. **Line highlights** — `highlightedLines` array (numbers + ranges) renders correctly; tinted row background + accent gutter bar.
10. **Annotations** — gutter markers render per type; tooltip on hover/focus shows message.
11. **Long-block collapse** — `maxLines` triggers fade-out + "Show all" button; expand toggles inline; controlled `expanded` prop works.
12. **Streaming** — `streaming={true}` shows blinking cursor; append-only tokenization verified (no full re-tokenize on each char); `streaming={false}` triggers final clean tokenize; chat-panel-like streaming demo works smoothly.
13. **Header customization** — every header element gated by its boolean prop; `header={false}` hides; `renderHeader` slot replaces wholesale; standalone exported parts (`<CodeBlockHeader>`, `<CodeBlockFilename>`, `<CodeBlockLangPill>`, `<CodeBlockCopyButton>`, `<CodeBlockExpandButton>`, `<CodeBlockWrapButton>`) callable inside custom header.
14. **Footer slot** — `footer` content renders; absent when not provided.
15. **Theme** — light + dark verified; auto-switching via `.dark` class; custom theme override via `themes` prop works for both bundled names and theme objects.
16. **RSC variant** — `<CodeBlock.Server>` (or separate `/server` import) pre-tokenizes; consumer-side smoke verifies zero Shiki in client bundle when only the server variant is used.
17. **SSR posture** — client variant hydrates cleanly; no flash of unstyled code on view mode; CodeMirror in edit mode mounts client-only with a placeholder during hydration.
18. **Object-shape callbacks** throughout — no positional shapes.
19. **A11y** — `role="region"` + `aria-label`; copy button labeled; live-region status for copy; ≥ AA contrast in both themes for header text + line numbers + body; Lighthouse a11y ≥ 95 on demo page.
20. **Bundle posture** — client variant lands ~300 KB gz initial chunk for view-only TS; RSC variant lands <10 KB gz; on-demand grammars dynamic-import; `validate-meta-deps` clean (Shiki, `@shikijs/codemirror`, codemirror packages all declared).
21. **Smoke harness install + tsc pass** — `pnpm dlx shadcn add @ilinxa/code-block` against the smoke consumer; consumer-side `pnpm tsc --noEmit` clean.
22. **Procomp doc trio complete** — description (this), plan, guide. Demo demonstrates all major modes (view, edit, terminal, streaming, line highlights, annotations, long-block collapse, custom header, traffic-lights, RSC variant).
23. **Meta + manifest in sync; registry.json shipped** (base + fixtures items).
24. **Build clean** — `pnpm tsc --noEmit`, `pnpm lint`, `pnpm build`, `pnpm validate:meta-deps` all pass.
25. **GATE 3 spot-check review** — verdict ≥ "Pass with follow-ups."

## Open questions

> Each question has a recommended starting position. Reviewer should mark each open-question with their preferred resolution OR push back on the recommendation.

1. **Slug — `code-block` or `code-window`?** Existing pattern is mixed: composed-surface flagships drop the `-01` suffix (`data-table`, `markdown-editor`, `pdf-viewer`, `file-tree`); pattern-style numbered variants keep it (`media-carousel-01`, `kanban-board-01`). `code-block` is what the world calls this surface (Markdown, ChatGPT, Claude, Notion, GitHub all call it a "code block"). `code-window` would emphasize the chrome-wrapped framing but is less universal terminology. **Recommendation:** `code-block` (no `-01` suffix) — flagship primitive, anticipated to be referenced by name not numbered, aligned with `data-table` / `pdf-viewer` / `file-tree` / `markdown-editor` precedent.

2. **Category — `data`, `media`, or new `code`?** Code is technically content / data; pdf-viewer + video-player live in `media`. The closest categorical analogue is `media` (chrome-wrapped foreign-content renderer), but code is closer to text than to media. New `code` category would set up future siblings (`code-diff`, `terminal-emulator`, `notebook`) cleanly, mirroring how `navigation` was added for `file-tree` + future `command-palette`. **Recommendation:** new `code` category. Same precedent as the `navigation` decision two days ago for file-tree. Updating `categories.ts` is a 2-line edit.

3. **Viewer substrate — Shiki, Prism, or highlight.js?**
   - **Shiki** — VS Code-grade tokenization (TextMate grammars), highest visual fidelity, modern fine-grained imports (`shiki/core`, `shiki/wasm`), RSC-friendly via server tokenize. Bundle is heavier than Prism but acceptable with on-demand grammar loading.
   - **Prism** — lighter (~5 KB core), faster startup, smaller language coverage, lower-fidelity tokenization (regex-based, not TextMate).
   - **highlight.js** — similar to Prism, broader language coverage, similar fidelity.

   The user said "professional way like Claude or ChatGPT chat responses." Claude uses Shiki; ChatGPT uses a Prism variant. Shiki's GitHub-themed output IS the professional aesthetic the user references. **Recommendation:** **Shiki**. The fidelity gap is visible side-by-side; for a flagship "code-block" primitive this is the right call. We mitigate the bundle cost via fine-grained imports + dynamic grammar loading.

4. **Editor substrate — CodeMirror 6 or Monaco?** CodeMirror 6 is project-locked per memory ("CodeMirror stays as source-text editor"); `markdown-editor` already depends on it. Monaco is heavier (~2 MB), more featureful (full IntelliSense). **Recommendation:** **CodeMirror 6** — locked. Reuses existing project dep. Edit mode uses a custom `HighlightStyle` approximating Shiki's GitHub themes for near-match visual continuity (full Shiki→CodeMirror bridge defers to v0.2.0; the `@shikijs/codemirror` package referenced in earlier drafts of this doc does not exist on npm).

5. **Terminal mode — separate prop, or `lang='bash'` + presentation flags?** `mode='terminal'` is genuinely different from `lang='bash'`: terminal renders heterogeneous lines (input + output + error), no syntax highlighting on output, prompt-prefix detection, structured-lines API option. Squeezing it into a `lang` value would muddy semantics. **Recommendation:** **separate `mode` prop with three values: `'view' | 'edit' | 'terminal'`**. Default `'view'`. Terminal mode unlocks the structured `lines` API + traffic-light decoration + ANSI-defer story without polluting view-mode props.

6. **Default `wrap` behavior — `'wrap'` or `'scroll'`?** Claude wraps long lines (chat is narrow); ChatGPT scrolls (also narrow, but defers to monospace). Docs sites usually wrap. Code editors universally scroll. **Recommendation:** default `'scroll'`. Code naturally wants horizontal scroll for fidelity (line breaks change semantics). Consumers in narrow containers (chat) opt into `wrap='wrap'` per-block.

7. **Default `showLineNumbers` — `true` or `false`?** ChatGPT/Claude render code blocks WITHOUT line numbers by default (less visual noise in chat). VS Code / GitHub render WITH line numbers. **Recommendation:** default `false` for view + terminal, `true` for edit. View mode is for chat / docs / cards (less noise); edit mode reasonably benefits from line numbers; terminal output is meaningless with line numbers. Documented; consumer toggles at will.

8. **Default `showCopy` — `true` or `false`?** All chat / docs surfaces want copy; very few don't. **Recommendation:** default `true`. Setting `showCopy={false}` is the rare opt-out (e.g., visually-minimal embed in a marketing surface).

9. **Copy button visibility — always-visible or hover-reveal?** Claude shows copy always; ChatGPT shows on hover. Always-visible is more discoverable (especially for keyboard / screen-reader users); hover-reveal is more visually minimal. **Recommendation:** always-visible. Discoverability + a11y trump minimalism. Header is short anyway; one button does not crowd it.

10. **Streaming detection — explicit `streaming` prop or auto?** Auto-detection (e.g., debouncing re-tokenize when value updates faster than X ms) sounds nice but is brittle: legit consumer use cases (live-collaborative editors) update fast non-stream. **Recommendation:** **explicit `streaming` prop**. Consumers know whether they are streaming; we should not guess. Documented in guide.md as the streaming UX contract.

11. **`maxLines` collapse default — `undefined` or e.g., `50`?** Collapse-by-default (e.g., `maxLines={50}`) protects consumers from accidentally rendering 1000-line blocks; opt-in (default `undefined`) gives full control. **Recommendation:** **`undefined` default (no collapse)**. Consumer has the context to decide; a default cap surprises consumers who expect full content. Document the recipe in guide.md ("set `maxLines={50}` for chat consumers").

12. **Filename → lang derivation — opinionated mapping or consumer's job?** A built-in extension → language map covers the common case (`.tsx` → `'tsx'`, `.py` → `'python'`, `.go` → `'go'`). **Recommendation:** **ship a default map** (~30 entries); consumer can override via `filenameToLang?: (filename: string) => string | undefined`. Document the default map in guide.md. Mirrors `iconForNode` priority pattern from file-tree.

13. **`renderHeader` slot signature — what does it receive?** Three options: (a) full prop bag passthrough, (b) curated render args, (c) explicit slot parts. **Recommendation:** (b) curated args object: `{ filename, lang, copyButton: ReactNode, expandButton: ReactNode | null, wrapButton: ReactNode | null, downloadButton: ReactNode | null, trafficLights: ReactNode | null, actions: ReactNode | null }`. Each `*Button` / `trafficLights` is `null` when the corresponding `show*` flag is `false`, so consumers can conditionally compose without re-reading props. Consumer composes their own header layout while still being able to drop in our pre-built buttons.

14. **Standalone parts exported — which?** Per pdf-viewer + file-tree precedent, ship the parts as separately-exported atoms so consumers can reassemble subsets. **Recommendation:** export `<CodeBlockHeader>`, `<CodeBlockFilename>`, `<CodeBlockLangPill>`, `<CodeBlockCopyButton>`, `<CodeBlockExpandButton>`, `<CodeBlockWrapButton>`, `<CodeBlockDownloadButton>` as standalone parts. Document the composition pattern in guide.md.

15. **macOS traffic-light decoration — opt-in `showTrafficLights`, or separate `<CodeBlockTrafficLights>` part?** Traffic-lights are presentational only (no behavior); they show up most often in terminal-styled blocks and "Claude-aesthetic" chat blocks. **Recommendation:** **opt-in `showTrafficLights` boolean prop**. Default `false`. Renders at the top-left of the header. For full control (different position / style), consumer wraps via `renderHeader`.

16. **RSC story — separate `/server` import path or single component with auto-detect?** Auto-detection ("am I in RSC?") is anti-React-19. **Recommendation:** **separate import paths** — `import { CodeBlock } from '@ilinxa/code-block'` for the client variant; `import { CodeBlock } from '@ilinxa/code-block/server'` for the RSC variant. Documented; consumer chooses based on whether the block is interactive (edit, streaming, copy with click handlers ⇒ client) or pure-presentational (docs page paragraph ⇒ server).

17. **Diff support in v0.1.0 — built-in split-view or just `lang='diff'`?** Split-view is a different UI shape (two synced panes). **Recommendation:** v0.1.0 ships only `lang='diff'` (Shiki has a diff grammar; renders unified-diff text with `+/-` line coloring). Split-view defers to sibling `code-diff` component (future).

18. **Annotations slot — built-in tooltip or hidden behind a slot?** Built-in via `<Tooltip>` from shadcn primitives keeps the API simple. **Recommendation:** **built-in tooltip** with three severity icons (`info` → ⓘ, `warn` → ⚠, `error` → ⊗) using Lucide; consumer can fully replace via `renderAnnotation?: (args: { line, type, message }) => ReactNode`.

19. **Default theme pair — GitHub light/dark, or custom token-mapped?** Shiki ships ~50 bundled themes. GitHub Light + GitHub Dark Default look polished, are familiar, and match the "professional" aesthetic the user described. Building a custom token-mapped theme (signal-lime accent in token colors) is a deeper effort and risks looking gimmicky. **Recommendation:** **GitHub Light + GitHub Dark Default as default pair**. The chrome (header, borders, line-number gutter, copy button) uses ilinxa tokens and accent; the *code body* tokenization uses Shiki's GitHub themes. This separation matches Claude / GitHub / VS Code precedent. Consumer can override via `themes` prop. Document in guide.md.

20. **Line highlight rendering — full row or gutter-only?** Full-row tinted background reads more clearly; gutter-only (vertical accent bar) is more minimal. **Recommendation:** **both**: subtle row tint (`--accent / 8%`) + 2px vertical accent bar in the gutter. Matches Shiki's standard `highlight` transformer output.

21. **Cmd+S binding when `onSave` not wired — silent no-op or fall through to browser?** Browser default is "save page as" (always wrong here). **Recommendation:** **silent no-op + dev warning if `onSave` is not wired but Cmd+S is pressed in edit mode**. Prevents the wrong-thing-happening case.

22. **Default font — JetBrains Mono (project token) or Shiki's render font?** Project mandate is JetBrains Mono. Shiki's themes include font-family CSS but we will override with `font-family: var(--font-mono)`. **Recommendation:** **JetBrains Mono** (override Shiki's font hint) — design-system mandate.

23. **Empty state — render an empty block or hide?** Consumer may pass `value=''` (loading state, etc.). **Recommendation:** render an empty block with chrome intact + an optional `emptyMessage` prop (default empty body, no message). Chrome stays so layout doesn't collapse during streaming.

24. **What ships in `dummy-data.ts`?** Multiple realistic samples covering each demo case: a TS file (~30 lines for the "view" demo), a streaming snippet (Promise that emits chunks for the streaming demo), a JSON config (for the JSON demo), a terminal script as `TerminalLine[]` (for the terminal demo), an error trace (for the annotations demo). **Recommendation:** ship 5–6 fixtures totaling ~150 lines, mocking real-world content shapes.

25. **`pnpm validate:meta-deps` declarations — what gets declared?** Anticipated dep additions: `shiki`, `@shikijs/codemirror`, `@codemirror/state`, `@codemirror/view`, `@codemirror/commands`, `@codemirror/lang-javascript` (+ a small set of common langs), `lucide-react` (already a project dep, declared elsewhere). **Recommendation:** declare them all explicitly in `meta.ts`; verify clean run before commit.

26. **CodeMirror language packages — bundle them all or dynamic-import?** CodeMirror has separate `@codemirror/lang-<lang>` packages. Bundling all 20+ languages is heavy. **Recommendation:** **dynamic-import on first edit-mode use of a given language**. Initial edit-mode chunk includes only the requested language (or no language if `lang='plaintext'`). Document the trade-off in guide.md.

27. **Should the v0.1.0 include a "fullscreen modal" expand mode?** `showExpand` opens the block in a fullscreen `<Dialog>`. Useful for wide code blocks in narrow containers. **Recommendation:** **yes — opt-in `showExpand`, default `false`**. Implementation: shadcn `<Dialog>` containing a re-rendered `<CodeBlock>` that inherits all props from the outer block except `showExpand` (forced to `false` inside the modal to prevent infinite expand-button recursion) and `maxLines` (forced to `undefined` so the modal shows full content). Slot replaceable via `renderExpandModal?: (args: { open, onOpenChange, code: ReactNode }) => ReactNode`.

28. **Run callback — slot only, or also a built-in `<RunButton>` part?** Earlier in scope I declared run is slot-only. Confirming. **Recommendation:** **slot-only via `actions`**. No built-in run button. Keeps code-block pure-presentational.

29. **Should we export a hook (`useCodeBlock` / `useShikiTokens`) for advanced consumers?** Useful for building custom layouts that need access to tokens but not the full chrome. **Recommendation:** **defer to v0.2.0**. v0.1.0 ships components only. If real demand surfaces (rich-card asks for tokens to render its own chrome), revisit.

30. **Test fixtures for streaming — how do we manually verify append-only tokenization?** Developer affordance only — not user-facing. **Recommendation:** include a "stream simulator" toggle in the demo (button labeled "Replay streaming") that emits the value in 10-char chunks at 50 ms intervals; demo shows tokenization stays smooth (no full-block flicker on each chunk).

31. **Editable filename in edit mode?** IDEs let users click the filename tab to rename. **Recommendation:** **defer to v0.2.0**. v0.1.0 keeps `filename` display-only in all modes. Consumer wires their own rename UX outside the block (e.g., in a tab strip above). Revisit when a real consumer asks for in-block rename; lands as additive `onFilenameChange?: (args: { filename }) => void` without breaking v0.1.x consumers.

## Sign-off

**User confirmed 2026-05-10** — all 31 starting-position recommendations accepted (after re-validation pass surfaced 3 contradictions, 6 ambiguities, and 3 optimization calls — all resolved inline).

Locked decisions for Stage 2:

- **Slug:** `code-block`
- **Category:** new `code` category (added alongside `code-block`; future home for `code-diff`, `terminal-emulator`, `notebook`)
- **Modes (v0.1.0):** `view` | `edit` | `terminal` — single component, switched via `mode` prop
- **Viewer substrate:** Shiki with fine-grained imports + on-demand grammar loading + dual-theme CSS-variable transformer (single tokenize, both themes via `.dark` class — no re-tokenize on theme switch)
- **Editor substrate:** CodeMirror 6 + custom `HighlightStyle` approximating GitHub Light + GitHub Dark Default (P2 substrate-shift; locked 2026-05-10 after `@shikijs/codemirror` was found to not exist on npm). Pixel-perfect Shiki→CodeMirror bridge defers to v0.2.0. Language packages dynamic-import on first edit-mode use of each lang.
- **Distribution variants:** client (`@ilinxa/code-block`, ~300 KB gz initial chunk) + RSC (`@ilinxa/code-block/server`, <10 KB gz, pre-tokenized HTML). `edit` and `streaming` are client-only and throw a typed build error on the RSC variant.
- **Default theme pair:** `'github-light'` + `'github-dark-default'`; consumer override via `themes={{ light, dark }}` accepting either Shiki bundled-theme names or theme objects.
- **Wrap default:** `'scroll'`. Line-numbers default: `false` (view), `true` (edit), `false` (terminal). Copy: always-visible, default-on.
- **Streaming detection:** explicit `streaming` prop (no auto). Append-only tokenization while `streaming=true`; final clean re-tokenize when flipped to `false`.
- **Terminal mode:** raw-string + structured-`lines: TerminalLine[]` APIs; prompt detection on `$ `, `> `, `# `; opt-in `showTrafficLights`; no ANSI parsing in v0.1.0.
- **Diff:** v0.1.0 ships `lang='diff'` only (Shiki diff grammar); split-view defers to future `code-diff` sibling.
- **`maxLines` collapse:** default `undefined` (no collapse); consumer opt-in per block.
- **Filename → lang priority chain:** `lang` > `filenameToLang()` > built-in ext map (~30 entries) > `'plaintext'`.
- **Annotations:** built-in shadcn `<Tooltip>` with `info / warn / error` severity icons; replaceable via `renderAnnotation`.
- **Line highlights:** subtle row tint (`--accent / 8%`) + 2 px vertical accent bar in gutter.
- **Cmd+S:** captured only in edit mode; silent no-op + dev warning when `onSave` not wired; view + terminal do not capture.
- **`showExpand` modal:** opt-in, default `false`; inner `<CodeBlock>` instance gets `showExpand={false}` + `maxLines={undefined}` to prevent recursion.
- **Filename editing:** display-only in v0.1.0; deferred to v0.2.0 (Q31).
- **Run callback:** slot-only via `actions`; no built-in `<RunButton>` part.
- **`useCodeBlock` hook:** deferred to v0.2.0.
- **Object-shape callbacks** throughout: `onChange`, `onCopy` (fires after clipboard write), `onSave`, `onDownload`, `onLineClick`, `onExpandedChange`, `onWrapChange`.
- **Standalone parts exported:** `<CodeBlockHeader>`, `<CodeBlockFilename>`, `<CodeBlockLangPill>`, `<CodeBlockCopyButton>`, `<CodeBlockExpandButton>`, `<CodeBlockWrapButton>`, `<CodeBlockDownloadButton>`, `<CodeBlockTrafficLights>`.
- **`renderHeader` args:** `{ filename, lang, copyButton, expandButton, wrapButton, downloadButton, trafficLights, actions }` — each conditional part is `null` when its `show*` flag is `false`.
- **Font:** JetBrains Mono override (project mandate) — applied to both view (Shiki body) and edit (CodeMirror).
- **A11y:** `role="region"` + `aria-label`; `role="status"` live region for copy confirmation; ≥ AA contrast in both themes; Lighthouse a11y ≥ 95 on demo.
- **Demo fixtures:** 5–6 fixtures covering view-TS, streaming snippet, JSON config, terminal `lines[]`, error trace, edit-mode controlled.
- **All other Q-recommendations:** accepted as written.
