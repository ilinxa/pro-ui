# `code-block` — Pro-component Guide (Stage 3)

> **Status:** shipped · current version **0.2.0** · maturity `alpha` · category `code`
> **Planning trio:** [description](code-block-procomp-description.md) · [plan](code-block-procomp-plan.md) · this guide
> **Reviews:** [v0.1.0 spotcheck](reviews/2026-05-11-v0.1.0-spotcheck.md) · [v0.2.0 spotcheck](reviews/2026-08-18-v0.2.0-spotcheck.md)
> **Loop record:** [code-block-loop.md](code-block-loop.md)
>
> This guide was written on 2026-08-18, closing **FU-1** of the v0.2.0 review — the component had
> shipped v0.1.0 → v0.2.0 with a planning *duo*. It documents the component **as it actually
> behaves at 0.2.0**, including the parts of the public surface that are declared but not yet
> implemented (§17). Where this guide and the older planning docs disagree, this guide is right.

---

## 1. What it is

`CodeBlock` is the **code-surface substrate** for the library — the single component every
"render code professionally" surface is built on: chat assistants streaming a response, fenced
blocks in a markdown viewer, JSON/config viewers, card-tree `code` sections, terminal
walkthroughs, and snippet editors.

One component, three modes:

| Mode | Body | Engine | Use for |
|---|---|---|---|
| `view` (default) | Read-only tokenized HTML | **Shiki** (dual-theme) | Docs, chat output, markdown fences, diffs |
| `edit` | Live editor | **CodeMirror 6** | Playgrounds, snippet workbenches, config editors |
| `terminal` | Kind-tagged lines | none (plain) | Install/deploy walkthroughs, log output |

It is a **client component** (`"use client"`) that server-renders its first paint fine under
Next.js. It is deliberately *not* a compound in the `media-library` sense — see §14.

---

## 2. When to use / when NOT to use

### Use when

- You need syntax-highlighted code that respects light **and** dark theme without a flash.
- The content is code, config, a diff, or terminal output — anything monospaced and tokenized.
- You want copy / download / wrap / expand affordances without rebuilding them.
- You are streaming code in (chat assistants) and need incremental tokenization.
- You need an editable code surface but do not want to own a CodeMirror integration.

### Skip when

- **You need a side-by-side diff.** `lang="diff"` renders *unified* diff text only. Split-view is
  a planned sibling component (`code-diff`), not a mode here.
- **You need a full IDE** — multi-file tabs, LSP, go-to-definition. This is a block, not an editor
  product. `editorExtensions` is the escape hatch, but you are on your own past that.
- **You need a real terminal.** `mode="terminal"` is a *presentational* transcript. There is no
  PTY, no input handling, no ANSI escape parsing.
- **The content is prose.** Use `expandable-text` or the markdown renderer.
- **You are inside a React Server Component and want zero client JS.** See §17.1 — the `/server`
  variant is declared in the types but **does not exist yet**.

---

## 3. Installation

### 3.1 Inside the ilinxa-ui-pro repo

```tsx
import { CodeBlock } from "@/registry/components/code/code-block";
```

### 3.2 As a consumer (registry install)

```bash
pnpm dlx shadcn@latest add @ilinxa/code-block
# optional demo fixtures:
pnpm dlx shadcn@latest add @ilinxa/code-block-fixtures
```

Lands at `components/code-block/`. Import from the folder barrel:

```tsx
import { CodeBlock } from "@/components/code-block";
```

**Registry dependencies** (auto-installed): `button`, `dialog`, `tooltip`.

**npm dependencies** (auto-installed): `shiki`, `lucide-react`, and the CodeMirror 6 set
(`@codemirror/state`, `view`, `commands`, `language`, `autocomplete`, `@lezer/highlight`, plus
`lang-javascript` / `lang-json` / `lang-python` / `lang-html` / `lang-css` / `lang-markdown`).

> This is a **heavy** component by design — Shiki *and* CodeMirror. Grammars beyond the core ten
> are dynamic-imported on first use (§6), and the CodeMirror language packages only load in
> `edit` mode. A `view`-only page never pays for the editor.

---

## 4. Runtime requirements — CSP and WebAssembly

**Read this before self-hosting.** This is the single most expensive thing to discover late; an
integrator lost about an hour to it, which is what produced v0.2.0.

The default Shiki regex engine (`oniguruma`) is **WebAssembly**. Under a strict
`Content-Security-Policy`, your `script-src` must include `'wasm-unsafe-eval'`:

```
Content-Security-Policy: script-src 'self' 'wasm-unsafe-eval';
```

Without it the browser refuses the compile outright — *"Wasm code generation disallowed by
embedder"* — and highlighting can **never** run. No component can override its host's CSP.

Two ways out:

1. **Widen the policy** (above), or
2. **Switch engines** — no wasm at all:

```tsx
<CodeBlock value={code} lang="ts" regexEngine="javascript" />
```

`regexEngine="javascript"` uses Shiki's pure-JS engine. The trade is slightly narrower grammar
construct coverage. Highlighters are cached **per engine**, so mixing both on one page is safe
and costs you two highlighter instances, not two per block.

Either way **the block never goes blank** — see §8.

---

## 5. Quick start

### 5.1 View (the default)

```tsx
<CodeBlock filename="app.tsx" value={code} />
```

`lang` is inferred from `filename`. Header, language pill and copy button are on by default.

### 5.2 Edit (controlled)

```tsx
<CodeBlock
  mode="edit"
  lang="ts"
  filename="greet.ts"
  value={code}
  onChange={({ value }) => setCode(value)}
  onSave={({ value }) => save(value)}
/>
```

`onSave` is wired to the editor's save keybinding (⌘/Ctrl-S). Line numbers default **on** in
`edit` mode.

### 5.3 Edit (uncontrolled)

```tsx
<CodeBlock mode="edit" lang="ts" defaultValue={initial} onSave={({ value }) => save(value)} />
```

### 5.4 Streaming (chat assistant)

```tsx
<CodeBlock lang="ts" value={partial} streaming={isStillStreaming} />
```

`streaming` is an **explicit prop** — never auto-detected from update frequency. While true, the
block tokenizes incrementally and shows a cursor; the final clean tokenize fires when you flip it
back to `false`. Forgetting to flip it back leaves the cursor on screen forever.

### 5.5 Terminal

```tsx
<CodeBlock
  mode="terminal"
  showTrafficLights
  lines={[
    { kind: "input",  text: "$ pnpm install" },
    { kind: "output", text: "Resolving... done" },
    { kind: "error",  text: "ENOENT: no such file" },
  ]}
/>
```

`lines` is terminal-only. In `terminal` mode `lines` wins over `value`; `copy` / `download`
operate on the joined text of all lines.

### 5.6 Full-feature view block

```tsx
<CodeBlock
  filename="server.ts"
  value={code}
  showExpand
  showWrap
  showDownload
  showLineNumbers
  maxLines={20}
  highlightedLines={[3, { from: 10, to: 14 }]}
  annotations={[{ line: 12, type: "warn", message: "N+1 query" }]}
  footer={<span className="text-xs text-muted-foreground">3 issues</span>}
  onLineClick={({ line }) => jumpTo(line)}
/>
```

---

## 6. Language resolution

Resolution order — **first hit wins**:

1. `lang` prop, if set.
2. `filenameToLang({ filename })` consumer override, if it returns a string.
3. Built-in extension map (`FILENAME_TO_LANG_MAP`) + filename overrides (`Dockerfile`, `Makefile`).
4. `"plaintext"`.

Aliases normalize: `javascript→js`, `typescript→ts`, `py→python`, `rb→ruby`, `rs→rust`,
`yml→yaml`, `sh`/`zsh`→`bash`, `md`/`mdx`→`markdown`.

**View mode (Shiki)** ships these ten grammars eagerly:
`ts` `tsx` `js` `jsx` `json` `bash` `python` `markdown` `html` `css`

and dynamic-imports these on first use:
`rust` `go` `sql` `yaml` `diff` `java` `c` `cpp` `csharp` `ruby` `php` `swift` `kotlin` `graphql`
`toml` `ini` `scss` `dockerfile` `makefile` `patch`

An unknown language falls back to `plaintext` with a dev-only console warning.

**Edit mode (CodeMirror) supports fewer languages** — only
`ts` `tsx` `js` `jsx` `json` `python` `html` `css` `markdown`.

> ⚠️ **Gotcha.** Editing `rust` gives you a working editor with **no syntax highlighting** — the
> language loader returns `null` and the editor degrades silently. View mode highlights the same
> file fine. This asymmetry surprises people; if your product edits a language outside the
> CodeMirror nine, say so in your own UI.

---

## 7. Props reference

### Content

| Prop | Type | Default | Notes |
|---|---|---|---|
| `value` | `string` | — | The code. Controlled in `edit` mode. |
| `defaultValue` | `string` | — | Uncontrolled initial value (`edit` mode). |
| `lines` | `TerminalLine[]` | — | **`terminal` mode only.** Wins over `value`. |

### Language

| Prop | Type | Default | Notes |
|---|---|---|---|
| `lang` | `string` | inferred | Highest-priority language source. |
| `filename` | `string` | — | Shown in the header; drives inference + download name. |
| `filenameToLang` | `(args: { filename }) => string \| undefined` | — | Consumer override, beats the built-in map. |

### Mode

| Prop | Type | Default | Notes |
|---|---|---|---|
| `mode` | `"view" \| "edit" \| "terminal"` | `"view"` | |
| `readOnly` | `boolean` | `false` | `edit` mode: editor rendered but not writable. |
| `streaming` | `boolean` | `false` | Explicit. See §5.4. |

### Edit

| Prop | Type | Default | Notes |
|---|---|---|---|
| `onChange` | `(args: { value }) => void` | — | |
| `onSave` | `(args: { value }) => void` | — | ⌘/Ctrl-S. |
| `tabSize` | `number` | `4` | **INITIAL-ONLY** — see §16. |
| `editorExtensions` | `Extension[]` | — | **INITIAL-ONLY** — see §16. |

### Header

| Prop | Type | Default |
|---|---|---|
| `header` | `boolean` | `true` |
| `showLanguage` | `boolean` | `true` |
| `showCopy` | `boolean` | `true` |
| `showExpand` | `boolean` | `false` |
| `showWrap` | `boolean` | `false` |
| `showDownload` | `boolean` | `false` |
| `showTrafficLights` | `boolean` | `false` |
| `actions` | `ReactNode` | — |
| `renderHeader` | `(ctx: CodeBlockHeaderContext) => ReactNode` | — |
| `renderExpandModal` | `(ctx: CodeBlockExpandModalContext) => ReactNode` | — |

### Body

| Prop | Type | Default | Notes |
|---|---|---|---|
| `showLineNumbers` | `boolean` | `edit` → `true`, else `false` | Explicit value always wins. |
| `wrap` | `"wrap" \| "scroll"` | `"scroll"` | Passing it makes wrap **controlled** — §16. |
| `highlightedLines` | `Array<number \| { from, to }>` | — | 1-indexed, inclusive. |
| `annotations` | `CodeBlockAnnotation[]` | — | `{ line, type: "info" \| "warn" \| "error", message }`. |
| `renderAnnotation` | `(args: { annotation, defaultMarker }) => ReactNode` | — | |
| `onLineClick` | `(args: { line }) => void` | — | View mode. |
| `footer` | `ReactNode` | — | |

### Collapse / sizing

| Prop | Type | Default | Notes |
|---|---|---|---|
| `maxLines` | `number` | — | Opt-in collapse: fade + "Show all (N more lines)". |
| `expanded` | `boolean` | — | Controlled. |
| `defaultExpanded` | `boolean` | `false` | |
| `onExpandedChange` | `(args: { expanded }) => void` | — | |
| `maxHeight` | `number \| string` | — | Independent of `maxLines`. |

### Everything else

| Prop | Type | Default | Notes |
|---|---|---|---|
| `themes` | `{ light, dark }` | `github-light` / `github-dark-default` | Shiki theme name or object. |
| `regexEngine` | `"oniguruma" \| "javascript"` | `"oniguruma"` | **v0.2.0.** See §4. |
| `onCopy` / `onDownload` | callbacks | — | `onDownload` **replaces** the built-in download. |
| `onWrapChange` | `(args: { wrap }) => void` | — | |
| `emptyMessage` | `string` | `""` | Shown for empty non-streaming value. |
| `ariaLabel` | `string` | derived | See §15. |
| `labels` | `CodeBlockLabels` | English defaults | All keys optional. |
| `className` / `style` | | | Applied to the outer `<section>`. |
| `ref` | `Ref<CodeBlockHandle>` | — | §13. React 19 prop-ref, no `forwardRef`. |

---

## 8. The soft-failure policy (v0.2.0)

**The contract: a `CodeBlock` never renders an empty panel.** Every dependency it has can fail,
and each failure degrades to something legible instead of nothing.

This was documented from v0.1.0 but only **half-implemented** until 0.2.0 — two of the four modes
did not exist, which is exactly how a CSP-blocked host got blank boxes with nothing in the console.

| Failure | Behaviour | How to detect |
|---|---|---|
| **Highlighter unavailable** (CSP block, wasm refusal, chunk 404) | Raw code renders as plain-text rows, correct line numbers, correct geometry | `[data-highlight="failed"]` on the body |
| **Not yet tokenized** (first paint) | Same raw-code rows — no flash of empty | `[data-highlight="pending"]` |
| **Highlighted normally** | Shiki HTML | `[data-highlight="ready"]` |
| **Editor mount failure** (`edit`) | Inline `role="alert"` with the `editorFailed` label **plus a working "Reload as view-only" control** that swaps in the view body | `[role="alert"]` inside the block |
| **Copy failure** (no clipboard, insecure origin) | Button shows the `copyFailed` label — *"Copy failed — select and copy manually"* | — |
| **Download failure** | Silent no-op; download is best-effort | — |
| **Unknown language** | `plaintext`, dev-only console warning | — |

Two consequences worth internalizing:

- **`data-highlight` is a real hook.** Style degraded blocks, assert on them in tests, or count
  them in telemetry to find CSP problems in production.
- **The plaintext fallback is not "unstyled".** Fallback rows carry `.line` and
  `data-highlighted`, so `highlightedLines` tinting still works on a degraded block. (A v0.2.0
  review finding: without them, the gutter number bolded while the row stayed plain.)

### Recovering from an editor failure

The "Reload as view-only" control sets a **component-local** flag — it does not mutate your `mode`
prop, because `mode` is yours. The flag **resets whenever `mode` changes**, so a host with an
Edit/Preview toggle gets its editor back on the next flip. (Before 0.2.0's review this was a
one-way trap whose only escape was a `key` remount.)

---

## 9. Modes in depth

### 9.1 View

Shiki dual-theme output — both themes are embedded in the HTML and switched via CSS variables, so
there is no re-tokenize and no flash when the theme changes.

`highlightedLines` accepts bare numbers and inclusive ranges together:

```tsx
highlightedLines={[3, { from: 10, to: 14 }, 22]}
```

Annotations render a per-line marker; `renderAnnotation` gets both the annotation and the
`defaultMarker` so you can wrap rather than replace:

```tsx
renderAnnotation={({ annotation, defaultMarker }) => (
  <Tooltip content={annotation.message}>{defaultMarker}</Tooltip>
)}
```

### 9.2 Edit

CodeMirror 6. Language packages load per language, in `edit` mode only. `readOnly` renders the
editor without write access — use it when you want CodeMirror's selection/scroll behaviour but no
mutation.

Edit↔view colour continuity is a **near-match**, not pixel-perfect: the editor uses a custom
`HighlightStyle` approximating GitHub Light / Dark Default. A true Shiki→CodeMirror theme bridge
is deferred.

### 9.3 Terminal

Presentational transcript. Each line carries `kind: "input" | "output" | "error"`, styled
accordingly. `showTrafficLights` adds the macOS-window dots to the header.

Not a terminal: no input, no PTY, no ANSI parsing. Pre-format your text.

---

## 10. Collapse and the expand modal

They are **independent features** and frequently confused:

- **`maxLines`** — collapses *in place*, with a fade and a "Show all (N more lines)" button.
- **`showExpand`** — adds a header button that opens the block in a **modal**, at full size.
- **`maxHeight`** — a hard CSS ceiling with scroll. Unrelated to either.

Inside the modal the block re-renders itself with `showExpand={false}`, `maxLines={undefined}`,
`maxHeight={undefined}` — so the modal copy is always the full, uncollapsed code. Your `ref` is
**not** re-passed to that inner clone; the outer instance stays the sole handle owner.

`renderExpandModal` replaces the default `Dialog` entirely:

```tsx
renderExpandModal={({ open, onOpenChange, code }) => (
  <MyDrawer open={open} onOpenChange={onOpenChange}>{code}</MyDrawer>
)}
```

---

## 11. Controlled vs uncontrolled

Three independent controllable pieces, each following the same `prop` / `defaultProp` / `onChange`
convention:

| State | Controlled by | Uncontrolled default | Change callback |
|---|---|---|---|
| Value (`edit` only) | `value` | `defaultValue` | `onChange` |
| Wrap | `wrap` | `"scroll"` | `onWrapChange` |
| Expanded | `expanded` | `defaultExpanded` | `onExpandedChange` |

> ⚠️ **`value` is only controlled in `edit` mode.** In `view` / `terminal` the value is display-only
> and passed straight through — there is no internal copy to get out of sync.

---

## 12. Header composition

The default header renders: traffic lights → filename → language pill → actions → wrap → download →
expand → copy, each gated by its `show*` flag.

`renderHeader` hands you the *already-constructed* buttons so you can re-arrange without
rebuilding behaviour:

```tsx
renderHeader={({ filename, lang, copyButton, expandButton, actions }) => (
  <div className="flex items-center justify-between border-b px-3 py-2">
    <div className="flex items-center gap-2">
      <FileIcon /> <span>{filename ?? lang}</span>
    </div>
    <div className="flex items-center gap-1">{actions}{expandButton}{copyButton}</div>
  </div>
)}
```

Each slot is `ReactNode | null` — `null` when its `show*` flag is off. **Check for null**; don't
assume `copyButton` exists.

### Building your own chrome from scratch

Every part is exported and reads from context, so you can drop `header={false}` and compose:

```tsx
import {
  CodeBlock, CodeBlockHeader, CodeBlockFilename, CodeBlockLangPill,
  CodeBlockCopyButton, CodeBlockExpandButton, CodeBlockWrapButton,
  CodeBlockDownloadButton, CodeBlockTrafficLights, useCodeBlock,
} from "@/components/code-block";
```

`useCodeBlock()` exposes `value`, `filename`, `lang`, `mode`, `streaming`, `wrap`,
`showLineNumbers`, `expanded`, `setExpanded`, `setWrap`, `modalOpen`, `setModalOpen`, `labels`,
`copy`, `copied`, `copyFailed`, `download`, and `handle`. Parts must be rendered **inside** a
`<CodeBlock>` — the hook throws outside the provider.

---

## 13. Imperative handle

```tsx
const ref = useRef<CodeBlockHandle>(null);
<CodeBlock ref={ref} mode="edit" value={code} onChange={({ value }) => setCode(value)} />

ref.current?.copy();      // Promise<boolean>
ref.current?.focus();     // focuses the editor (edit mode)
ref.current?.getValue();  // live editor value, or the display value
```

React 19 prop-ref — there is no `forwardRef`.

> ⚠️ **`scrollToLine(line)` is currently a no-op.** It is in the type, and `meta.ts` advertises it.
> It does nothing. See §17.2.

---

## 14. Why this is not a compound

The [compound-structure rule](../../../.claude/rules/compound-component-structure.md) applies to
multi-part artifacts where a consumer might want a subset. `code-block` is a **single mountable
surface** with optional chrome, not three mountable regions — you never want "just the body" on its
own. It ships the middle path: one assembly component (`<CodeBlock>`) **plus** flat exports of every
header part and a context hook, which covers re-composition (§12) without inventing a `Root` that
would have exactly one child.

---

## 15. Accessibility

- Root is `<section role="region">` with a derived `aria-label`:
  `"Code block — <filename>"`, else `"Code block — <lang>"` (`plaintext` renders as `"text"`).
  Override with `ariaLabel`.
- Header controls are real `<button>`s with tooltips; every label is in `labels` for i18n.
- Copy announces state change through the `copied` / `copyFailed` label swap.
- The editor-failure notice is `role="alert"`, so it is announced when it appears, and the
  recovery is a focusable button — not a hint to reload the page.
- Line numbers are presentational and excluded from the copy/download payload.

---

## 16. Gotchas

1. **`tabSize` and `editorExtensions` are INITIAL-ONLY.** Both are baked into the `EditorState` at
   editor creation. Changing them later does nothing. Remount with a React `key` to apply.

2. **Passing `wrap` makes wrap controlled.** The wrap button will then appear to do nothing unless
   you also handle `onWrapChange`. Want a working button with a non-default start? There is no
   `defaultWrap` — hold it in state yourself.

3. **`onDownload` replaces the built-in download**, it does not observe it. Omit it if you want the
   blob download; supply it to take over entirely.

4. **`streaming` must be flipped back to `false`.** The final clean tokenize is triggered by the
   transition, and the streaming cursor persists until it happens.

5. **Edit mode highlights fewer languages than view mode** (§6) — silently.

6. **`lines` is terminal-only.** In `view` / `edit` it is ignored; use `value`.

7. **Uncontrolled edit + the view fallback.** If the editor fails in uncontrolled `edit` mode, the
   fallback view renders the *live editor value*, not your (possibly undefined) `value` prop.

8. **Mixing `regexEngine` values on one page is supported** — highlighters are cached per engine.
   This was a real 0.2.0 bug: a module-global "loaded languages" Set, harmless while there was
   exactly one highlighter, became a cross-instance lie the moment the engine became selectable
   and left the second instance permanently in plaintext. Fixed by asking each highlighter what it
   has loaded. If you extend this component, **any module-level `Set`/`Map`/`let` is suspect.**

9. **Empty value renders the empty state, not an empty block** — unless `streaming` is true, where
   an empty value is a legitimate pre-first-token state.

---

## 17. Known limitations — declared but NOT implemented

> These are public surfaces that exist in the types and would reasonably be assumed to work.
> They do not. Both were "deferred to v0.2.0" in the planning docs; **v0.2.0 shipped without
> either.** Documented here rather than quietly left for a consumer to find.

### 17.1 `CodeBlockServerProps` — there is no `/server` entry point

`CodeBlockServerProps` is exported from the barrel and narrows the props to the RSC-safe subset.
It was shipped in v0.1.0 as a "public scaffold so consumers can prepare for the v0.2.0 RSC export".

**There is no `code-block.server.tsx` in the repo and no `server.ts` in the registry item.**
`import { CodeBlock } from "@ilinxa/code-block/server"` resolves to nothing. The type compiles;
nothing consumes it.

For now: the client component SSRs its first paint correctly under Next.js. You get server-rendered
HTML — you simply also ship the client bundle. If bundle size is the constraint, that constraint
is currently unmet.

### 17.2 `CodeBlockHandle.scrollToLine()` — a no-op

Declared on the handle, listed in `meta.ts` as a shipped feature, and implemented as an empty
function body with the comment *"v0.1.0: best-effort no-op; reserved for v0.2 CodeMirror
integration."* Calling it silently does nothing.

If you need to scroll to a line today, scroll the container yourself — rows are `.line` elements
in document order inside the body.

---

## 18. Follow-ups

Carried from the [v0.2.0 review](reviews/2026-08-18-v0.2.0-spotcheck.md), plus two logged while
writing this guide.

| # | Item | Severity | Target |
|---|---|---|---|
| ~~FU-1~~ | ~~No guide doc~~ — **closed by this document** (2026-08-18) | 🔸 Medium | ✅ |
| FU-2 | No shared negative cache: under a *persistent* CSP block every new block re-pays the full grammar+theme+engine cascade and fails again. Perf, not correctness. | 🔹 Low | v0.3.0 |
| FU-3 | The editor mount effect is keyed only on `[showLineNumbers]`, so a failed editor never auto-retries on `lang`/`value` change. Recovery is manual only. | 🔹 Low | v0.3.0 |
| FU-4 | `visibleHtml`'s `useMemo` returns `html` in both branches — vestigial. | 🔹 Low | v0.2.x |
| FU-5 | Gutter vs body row-height differ slightly (`text-[0.75rem]` vs `text-[0.8rem]`). Pre-existing, equal in both paths. | 🔹 Low | v0.3.0 |
| **FU-6** | **`CodeBlockServerProps` is an inert public type** (§17.1) — either implement the `/server` variant or deprecate the type. Same "declared but inert" class as `card-tree`'s `customPredefinedKeys`. | ⚠️ High | v0.3.0 |
| **FU-7** | **`scrollToLine()` is a no-op advertised as a feature** in `meta.ts` (§17.2) — implement it, or drop the claim and the method. | ⚠️ High | v0.3.0 |

---

## 19. Public exports reference

**Components** — `CodeBlock`, `CodeBlockHeader`, `CodeBlockFilename`, `CodeBlockLangPill`,
`CodeBlockCopyButton`, `CodeBlockExpandButton`, `CodeBlockWrapButton`, `CodeBlockDownloadButton`,
`CodeBlockTrafficLights`

**Hook** — `useCodeBlock()`

**Utilities** — `resolveLang()`, `FILENAME_TO_LANG_MAP`

**Types** — `CodeBlockProps`, `CodeBlockServerProps` *(inert — §17.1)*, `CodeBlockHandle`,
`CodeBlockMode`, `CodeBlockRegexEngine`, `CodeBlockWrap`, `CodeBlockAnnotation`,
`CodeBlockAnnotationType`, `CodeBlockLineRange`, `CodeBlockLabels`, `CodeBlockThemes`,
`CodeBlockChangeArgs`, `CodeBlockCopyArgs`, `CodeBlockSaveArgs`, `CodeBlockDownloadArgs`,
`CodeBlockLineClickArgs`, `CodeBlockExpandedChangeArgs`, `CodeBlockWrapChangeArgs`,
`CodeBlockFilenameToLangArgs`, `CodeBlockHeaderContext`, `CodeBlockAnnotationRenderArgs`,
`CodeBlockExpandModalContext`, `ShikiThemeObject`, `TerminalLine`, `TerminalLineKind`
