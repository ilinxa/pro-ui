# Loop state — `code-block` (U-loop)

<!-- This file IS the state machine: a fresh session resumes from the first unchecked gate.
     Update the Status header at EVERY stage transition. Never tick a box before its stage
     closes (2026-08-18 retro: a pre-ticked plan doc is a lying state doc). -->

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **minor** — additive API + two behaviour fixes) |
| **Current stage** | **CLOSED** — shipped, GATE 3 Pass with follow-ups |
| **Sign-off policy** | **delegated by user** (context: *"re validate them and fix them as well"*, 2026-08-18) |
| **Version target** | v0.1.4 → **v0.2.0** |
| **Model roster** | architect: main session · finder: fresh Sonnet 5 (minor class = 1 finder + dependents axis) |
| **Started / updated** | 2026-08-18 / 2026-08-18 |

**Trigger:** external integrator report *"The Soft-Failure Gap"* (JSON CMS / `simple-cms`) against
`code-block` 0.1.4, **plus one finding of my own** that the report got wrong in its own favour.

---

## U0 — Intake & re-validation

All four items re-verified against HEAD this run. The report's own table claims 3 of 4 documented
soft-failure modes are implemented; **that is wrong — only 2 are.**

### F-1 (report, Fix) — view-mode highlight failure renders nothing · **CONFIRMED**

`html` initialises to `""` (`hooks/use-shiki-highlighter.ts:93`) and is only ever replaced on a
successful tokenize (`:172`). `setReady(true)` likewise fires only after success (`:173`), so a
rejected `getHighlighter()` leaves both untouched forever; the rejection is swallowed by the safety
net at `:183`, which warns **only outside production**.

`parts/code-block-body-view.tsx:52` destructures **only `{ html }`** — the `ready` flag the hook
returns has **zero uses anywhere outside the hook** (verified by grep across the component). The
body renders `dangerouslySetInnerHTML={{ __html: visibleHtml }}` (`:148`) and `value` is *never*
rendered as text, so the result is an empty code area.

The irony the reporter noted is real: `:109-112` explicitly guards the *theme* path against
"leaving the block permanently blank". The engine path — the one an embedder can trigger through
their own CSP — was not guarded.

### F-2 (mine, Fix) — the documented CodeMirror fallback does not exist · **CONFIRMED, worse than reported**

The report's table marks this "✓ recoverable — inline error + 'Reload as view-only'". It does not
exist: zero matches for `view-only` / `Reload as` / init-failure handling anywhere in the component;
`hooks/use-code-mirror.ts` contains **no `catch`, `throw`, or `Error` in 241 lines**.

Worse than "missing a fallback": `use-code-mirror.ts:166` is `void mount();` — a **floating promise
with no `.catch()`**. `mount()` awaits a dynamic `loadCodeMirrorLang()` import and then constructs
`new EditorView(...)`. Either can reject/throw (a failed chunk fetch is the same CSP/network class
that triggered the reporter's bug), and the result is an unhandled rejection plus a permanently
empty editor. **Same failure shape as F-1, on the other mode.**

So the honest count is **2 of 4 documented soft-failure modes unimplemented**, not 1 of 4.
(Rows 1 and 3 verified genuinely implemented: `plaintext` fallback in `lib/lang-resolution.ts`;
clipboard `execCommand` → `copyFailed` → X icon + title + SR status in `use-copy-to-clipboard.ts`
and `parts/code-block-copy-button.tsx`.)

### F-3 (report, Docs) — wasm/CSP requirement undocumented · **CONFIRMED**

Zero matches for `wasm-unsafe-eval`, `Content-Security`, or `CSP` across the component **and** its
three planning docs. `shiki/wasm` appears only as a bundling strategy and a size budget. A
self-hosted app with a strict CSP is exactly the audience most likely to hit this.

### F-4 (report, Option) — regex engine hard-wired · **CONFIRMED, with a caveat the report missed**

`lib/shiki-bundle.ts:108` hard-wires `engine: createOnigurumaEngine(wasm)`; `types.ts` exposes no
override. Shiki **4.0.2** does ship the alternative — `./engine/javascript` is a real export
(verified in the installed package's `exports` map).

**Caveat the report did not see:** `getHighlighter()` memoises into a single module-level
`cachedHighlighter` (`:97-114`) with no key. Adding an engine option therefore cannot be a
pass-through parameter — the first caller would win and every later block would silently get the
wrong engine. The cache must be keyed by engine.

### Blast radius

| Surface | Action |
|---|---|
| `code-block` shipped source | hook, view body, edit body, code-mirror hook, shiki-bundle, types, labels |
| **Dependents** — `json-form`, `media-library`, `code-block-fixtures` | additive only; smoke `code-block` + 1 dependent (ladder: minor) |
| Interop | none — no clipboard envelope / shared kit / cross-component context |
| Docs | description §soft-failure + §CSP, plan, guide, `registry.json` roster (new files?), STATUS row, component-versions |
| Docs debt created by the bump | several docs say "deferred to **v0.2.0**" for features NOT in this release (RSC `/server` variant, pixel-perfect Shiki→CM bridge, token hook, editable filename). Shipping 0.2.0 makes those read as broken promises → reword to "a later minor". |

### Owed follow-ups consulted

`.claude/procomp-loop.config.md` fix-on-touch ledger: no `code-block` cohort; F-cross-15 and the
popover-width audit do not apply (no popover, no lazy-vs-static carrier here).

---

## U1 — Change contract

### Invariants (regression targets, written testable)

| # | Invariant | Verified by |
|---|---|---|
| I1 | View mode **never renders an empty body when `value` is non-empty** — if there is no highlight HTML, the raw code is shown as text. | component test: hook stubbed to fail → code still in DOM |
| I2 | A successful highlight still renders highlighted HTML (no regression to permanent plaintext). | existing + new component test |
| I3 | Edit mode never dies silently: a CodeMirror init failure renders an inline error **and** a working "Reload as view-only" control. | component test: `loadCodeMirrorLang` forced to reject |
| I4 | `mount()` can no longer produce an unhandled rejection. | test asserts no unhandled rejection + error state set |
| I5 | The engine is selectable, and two blocks asking for different engines each get their own highlighter (cache keyed, not first-wins). | lib test on the cache key |
| I6 | Default behaviour is unchanged for every existing consumer (engine defaults to oniguruma; no required props added). | full suite + consumer tsc |

### Bump target

**v0.2.0** (semver-while-0.x: additive API ⇒ minor). Status stays `alpha`.

### Slices

- [x] **S1** — view-mode plaintext fallback (F-1) + hook exposes failure
- [x] **S2** — CodeMirror init-failure fallback + "Reload as view-only" (F-2)
- [x] **S3** — selectable regex engine, cache keyed by engine (F-4)
- [x] **S4** — docs: CSP/wasm requirement, soft-failure table corrected, v0.2.0 wording debt
- [x] **S5** — tests for I1–I5
- [x] **S6** — registry roster diff, version bump, STATUS, review file

## U3 — gate numbers

tsc **0** · lint **0 errors / 14 warnings** (baseline) · meta-deps **64/64** · registry validators
**0 high** · no-control-chars clean · registry:build **0** · artifact-size **103.82 / 110 KB** ·
`pnpm build` **0** · tests **19 files / 126 passed** under `NODE_ENV=production`.

The barrel gate earned its keep: it caught `CodeBlockRegexEngine` referenced by an exported type
but not importable from `index.ts` — a consumer could have used the prop and never named its type.

## U4 — findings

1 fresh finder, 7 axes. **3 CONFIRMED** (2 High, 1 Medium — all mine), 5 axes clean on hard
evidence. Full table in the [review file](reviews/2026-08-18-v0.2.0-spotcheck.md).

Headline: the finder **reproduced** Finding 1 against the real module — a module-global
`loadedLangs` Set that was correct only while there was exactly one highlighter, and became a
cross-instance lie the moment the engine became selectable. Every fix was then falsified by
breaking it and watching the right tests go red.

## U5 — runtime & smoke

Local artifacts on :4499, CLI 4.18.0. `code-block` + the `json-form` dependent installed;
the vendored copy carries all three review fixes; **consumer `tsc` 0 errors**. Harness restored.

## U7 — retro

Two runs in a row an external report was a **lower bound** on its own scope: card-tree's F1 was 5
components not 1, and here the report's own table claimed a fallback that did not exist at all.
**Measure the class before fixing the instance** is now twice-earned.

New this run: *a cache that is correct only because there is exactly one of something breaks the
moment you add a second.* I added multi-engine caching and did not audit the other module-global
state that assumed a single highlighter. The finder caught it by reproducing, not by reading.
