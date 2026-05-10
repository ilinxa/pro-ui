---
date: 2026-05-11
session: code-block v0.1.0 first-ship pipeline
phase: post-Phase-7 / GATE-3-rule era
type: ship
commits: pending (this session)
components: code-block (new), categories (new "code" category)
findings: F-01 streaming append-only deferred to v0.1.1, F-02 scrollToLine stub v0.1.1, F-03 RSC variant deferred to v0.2.0, F-04 guide.md v0.1.1, F-05 smoke path-b deferred post-deploy
status: open
---

# code-block v0.1.0 — first ship + P2 substrate shift + new `code` category

## What shipped

**`code-block` v0.1.0** — first component in the **new `code` category** (added alongside it; mirrors the `navigation` category precedent for `file-tree`). Substrate primitive for every "render code professionally" surface in the library: chat assistants, fenced markdown blocks, JSON / config viewers, rich-card code sections, virtual terminal walkthroughs, snippet editors.

Three modes in one component, switched by `mode` prop:

- **`view`** (default) — Shiki tokenization with **dual-theme CSS variables** (single tokenize, `.dark`-class toggle, zero re-render on theme switch). GitHub Light + GitHub Dark Default palettes by default; consumer overridable via `themes`.
- **`edit`** — CodeMirror 6 with a **custom HighlightStyle approximating GitHub colors** (P2 substrate-shift; see below). Same JetBrains Mono font + line-height as view; near-match token colors.
- **`terminal`** — Structured `lines: TerminalLine[]` API with `input` / `output` / `error` kinds, prompt detection on `$ ` / `> ` / `# ` prefixes, optional macOS traffic-light decoration.

Streaming-friendly: explicit `streaming` prop, rAF-batched re-tokenization, blinking tail cursor. Filename → lang resolution via `lang` > `filenameToLang()` > 30-entry built-in extension map > `plaintext` priority chain. Long-block collapse via `maxLines` + "Show all" fade-out. Line highlights via `highlightedLines` (numbers + ranges) emitted as Shiki transformer `data-highlighted="true"`. Annotations via gutter-icon + shadcn `<Tooltip>` with `info / warn / error` severities. Copy with `navigator.clipboard` + `document.execCommand('copy')` fallback. Download via `Blob` URL. Expand-to-modal via shadcn `<Dialog>` (inner `<CodeBlock>` clone forces `showExpand={false}` + `maxLines={undefined}`).

**42 files** in the sealed folder under `src/registry/components/code/code-block/`:
- Root: `code-block.tsx` (~300 lines, the orchestrator)
- 18 parts (8 standalone-exported header atoms + body view/edit/terminal + 7 internal helpers + expand modal)
- 6 hooks (Shiki highlighter, CodeMirror mount, copy-to-clipboard, controllable-state, resolved-theme, context provider)
- 8 lib utilities (lang resolution, line utils, terminal utils, Shiki bundle setup, CodeMirror lang loader, CodeMirror theme, streaming cache, types)
- demo (10 sections demonstrating every major capability), dummy-data (8 fixtures), usage, meta, index barrel

`registry.json` ships two items: `code-block` base + `code-block-fixtures` sibling (per locked target convention). 41 slugs total in the library now (40 + code-block; the `code` category sits between `media` (8) and `auth` (10), order 9).

## Why P2 substrate shift was necessary

The original plan locked **Shiki + `@shikijs/codemirror`** for visual continuity between view and edit modes. Mid-implementation, `pnpm view @shikijs/codemirror` returned 404 — **the package does not exist on npm despite the matching naming convention**. The official `@shikijs/*` namespace has `transformers`, `core`, `rehype`, etc., but no `codemirror` wrapper. Surfaced as a decision question to the user with 4 options (hand-roll Shiki→CM bridge / custom CM theme approximating GitHub / community `codemirror-shiki@0.3.0` / drop view↔edit continuity).

User picked **P2: custom CodeMirror theme approximating GitHub colors via dual-theme CSS variables**. Reasons:

- Zero community-pkg risk (project preference per `feedback_official_commands_and_version_research.md` and the broader "explicitly-declared third-party deps" mandate).
- Bundle stays lean (~50 lines of theme code vs `codemirror-shiki`'s 56 KB package or the hand-roll's ~150-line Shiki bridge).
- Visual gap is small in practice — same JetBrains Mono font, same line-height, same gutters; only token colors diverge slightly at the level of edge-case syntax classes that Shiki's TextMate grammars capture more precisely than CodeMirror's Lezer grammars.
- Defers the pixel-perfect Shiki → CodeMirror bridge to v0.2.0 as a purely additive replacement of `lib/codemirror-theme.ts` (no API change).
- Time-to-v0.1.0 shortest while keeping the substrate honest.

The shift was disclosed in description (in-scope §Edit mode + Q4 + sign-off summary) and plan (substrate table row + §3 implementation specifics) before continuing. Success criterion #2 was updated from "same theme, same tokens, same colors" to "near-match visual continuity… pixel-perfect parity defers to v0.2.0."

## RSC variant also deferred (F-03)

The plan committed to a dedicated `@ilinxa/code-block/server` export with zero-client-Shiki bundle. Building this properly requires a separate client-island shell (`parts/code-block-server-shell.tsx`) that lacks the Shiki import — non-trivial work distinct from the rest of v0.1.0. **`CodeBlockServerProps` type is shipped as forward-compatible scaffolding**; runtime defers to v0.2.0. Description was updated to reflect this. The v0.1.0 client `<CodeBlock>` SSRs fine in Next.js via the standard `'use client'` hydration boundary; users get correct first paint without a flash.

## Re-validation passes surfaced 8 substantive refinements

Per the locked `feedback_re_validation_pass_catches_real_issues.md` practice:

**GATE 1 description re-validation (post-draft, pre-sign-off):**
- 3 internal contradictions fixed inline (line-numbers default for terminal mode; `onCopy` semantics ambiguous; `onLineClick` claimed clipboard write).
- 6 ambiguities fixed inline (mode × variant compatibility; `themes` type signature; filename→lang priority chain; Cmd+S binding scope; `showExpand` modal recursion).
- 3 optimization calls surfaced as decisions for the user: A1/A2/A3 bundle budget realism (user picked A3 split — ~300 KB gz client + <10 KB gz RSC); B1/B2 theme switching mechanism (user picked B2 — Shiki dual-theme CSS variables); C1/C2/C3 filename editing in edit mode (user picked C3 — defer to v0.2).

**GATE 2 plan re-validation (post-draft, pre-sign-off):**
- 4 refinements fixed inline (R1 `CodeBlockServerProps` typed narrowing; R2 `insertSpaces` → `indentMore`; R3 `Compartment` snippet; R4 terminal streaming algorithm).
- 1 surfaced as decision: R5 lucide-react version pin (user picked R5-A — research and pin to project's actual version, `^1.11.0`).

**Mid-implementation P2 substrate shift** (described above).

## Verification

| Check | Result |
|---|---|
| `pnpm tsc --noEmit` | clean |
| `pnpm lint` | 0 errors, 2 pre-existing warnings (file-manager + file-tree TanStack Virtual; unrelated) |
| `pnpm validate:meta-deps` | 41/41 clean, 0 drift |
| `pnpm registry:build` | clean — `public/r/code-block.json` + `public/r/code-block-fixtures.json` regenerated |
| `pnpm build` | clean — 49 static pages generated; 2 pre-existing rich-card warnings unchanged |
| Smoke harness path-b | deferred to post-deploy (F-05) |

## GATE 3 spot-check review

[`docs/procomps/code-block-procomp/reviews/2026-05-11-v0.1.0-spotcheck.md`](../../docs/procomps/code-block-procomp/reviews/2026-05-11-v0.1.0-spotcheck.md). Rotating dimension: **public API** (slot/callback shapes; F-cross-12 lessons). Verdict: **`Pass with follow-ups`** — 5 findings, all bump-targeted to v0.1.1 or v0.2.0, none blocking.

## Follow-ups (bump-targeted)

| Finding | Description | Target |
|---|---|---|
| F-01 | Wire `diffForRetokenize` into `useShikiHighlighter` for true append-only streaming (currently full re-tokenize per render, rAF-batched). Cache helper is already in place. | v0.1.1 |
| F-02 | `console.warn` on `handle.scrollToLine()` v0.1.1; implement v0.2.0 via CodeMirror `scrollIntoView`. | v0.1.1 + v0.2.0 |
| F-03 | Dedicated RSC variant `@ilinxa/code-block/server` with zero-client-Shiki shell. | v0.2.0 |
| F-04 | Author `code-block-procomp-guide.md` covering substrate decisions, bundle posture, v0.2 upgrades, canonical drop-in recipes. | v0.1.1 |
| F-05 | Run smoke harness path-b after Vercel redeploy; update review with smoke row. | v0.1.0 post-deploy |

## Active queue impact

Active queue now **4 of 6 shipped** (pdf-viewer ✅ + file-tree ✅ + file-manager ✅ + **code-block ✅**). Remaining: `rich-graph-2`, `chat-panel`, `notification-system`. Code-block was inserted into the queue mid-session at the user's request (not on the original 6-item list); it now sits as a substrate for `chat-panel` (the most demanding future consumer — streaming chat code-blocks anchor the substrate's design).

## Library state

**41 components total** across **8 categories** (added `code`). 41/41 slugs `validate:meta-deps` clean. Tip will be the next commit (this session).
