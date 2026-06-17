# blackboard-01 — procomp plan

> Stage 2: how (the implementation contract). **GATE 2 — ✅ SIGNED OFF (2026-06-18, "go").** Author: assistant, 2026-06-17. → Proceeding to scaffold + implementation.
> Builds on the signed-off [description](./blackboard-01-procomp-description.md) (GATE 1 ✅ 2026-06-17). Slug **`data/blackboard-01`**. Ships as a **shadcn-style compound** per [`compound-component-structure.md`](../../../.claude/rules/compound-component-structure.md).
>
> **Deep consistency review — 2026-06-18.** Internal (desc↔plan) + external (vs. codebase) audit, with an Explore-agent verification pass against the actual code. 8 findings folded in: context-in-hook structure (matches `media-library-01`), per-component sealed `use-controllable-state` copy (no shared import — portability), exact `fontsource.d.ts` sub-path decls, pin source-of-truth precedence, `onMention` reconciled-id timing, no-React.lazy rationale, `manifest.ts` step, and `PopoverAnchor`-avoidance (F-cross-13). meta-deps sub-path mapping + registry shape verified OK. See §14 review log.
>
> **Composes ZERO other procomps** — only shadcn primitives + `@fontsource` + existing repo deps. This sidesteps the F-01 / F-S1 cross-procomp rewriter traps entirely (no `@/registry/.../types` imports to mangle). The only novel risk is **font delivery** (§Fonts) and **scroll-anchored prepend** (§Lazy load).

---

## 1. Final API

### Public types (`types.ts`)

```ts
import type { ReactNode, Ref } from "react";

// ── identity ───────────────────────────────────────────────
export interface BlackboardAuthor {
  id: string;
  name: string;
  avatarUrl?: string;
  inkColor?: string;                 // optional per-author default ink (palette key or CSS color)
}

export interface BlackboardMember {        // mention-able roster (superset of authors)
  id: string;
  name: string;
  avatarUrl?: string;
}

// ── note styling (the three writing controls) ──────────────
export type NoteWidth = "thin" | "regular" | "bold";

export interface NoteStyle {
  color: string;                     // palette key (e.g. "lime") OR a raw CSS color if free-hex enabled
  width: NoteWidth;                  // chalk thickness
  font: string;                      // HandwritingFont.key
}

export interface HandwritingFont {
  key: string;                       // stable id stored on the note ("kalam", "caveat", …)
  label: string;                     // picker label ("Kalam")
  cssVar: string;                    // the CSS var the family is exposed through ("--bb-font-kalam")
  hasWeights?: boolean;              // true ⇒ real font-weight for width; false ⇒ faux text-stroke
}

// ── mentions ───────────────────────────────────────────────
export interface Mention {
  memberId: string;
  display: string;                   // "@Maryam" as written
  start: number;                     // char offset into note.text
  length: number;
}

// ── the note ───────────────────────────────────────────────
export interface BlackboardNote {
  id: string;
  text: string;
  author: BlackboardAuthor;
  createdAt: string;                 // ISO 8601
  updatedAt?: string;
  style: NoteStyle;
  pinned?: boolean;
  mentions?: Mention[];
  meta?: Record<string, unknown>;
  /** internal: set on optimistic notes awaiting server id; cleared on reconcile */
  pending?: boolean;
}

// ── board background ───────────────────────────────────────
export type BoardBackground =
  | { kind: "color"; value: string }                       // CSS color
  | { kind: "image"; url: string; overlay?: number };      // overlay 0–1 darken (default 0.45)

// ── note draft (composer ↔ callbacks) ──────────────────────
export interface NoteDraft {
  text: string;
  style: NoteStyle;
  mentions: Mention[];
}

// ── labels (i18n surface) ──────────────────────────────────
export interface Blackboard01Labels {
  composerPlaceholder: string;       // "Write a note…"
  loadOlder: string;                 // "Load older notes"
  pinnedHeading: string;             // "Pinned"
  empty: string;                     // "Nothing on the board yet"
  postAction: string;                // "Post"  (visually optional; auto-saves)
  unreadAria: (n: number) => string; // (n) => `${n} unread notes`
  mentionYou: string;                // "@you"
  colorLabel: string; widthLabel: string; fontLabel: string;
  pin: string; unpin: string; delete: string;
}

// ── imperative handle ──────────────────────────────────────
export interface Blackboard01Handle {
  scrollToLatest(): void;
  appendNote(note: BlackboardNote): void;   // inbound real-time note (dedup-safe)
  focusComposer(): void;
  markAllSeen(): void;
}
```

### The assembly props (`Blackboard01Props`)

```ts
export interface Blackboard01Props {
  // data
  notes: BlackboardNote[];                  // controlled stream, oldest→newest
  currentUser: BlackboardAuthor;
  members?: BlackboardMember[];             // mention roster; empty/undefined ⇒ no @-picker
  canWrite?: boolean;                       // default true; false ⇒ composer disabled

  // lazy load older (scroll-up, default page = 10)
  onLoadOlder?(beforeNoteId: string | null, limit: number): Promise<BlackboardNote[]>;
  hasMoreOlder?: boolean;
  loadOlderPageSize?: number;               // default 10

  // write / persist (auto-save = debounced; NO network here)
  onPostNote?(draft: NoteDraft): void | Promise<BlackboardNote>;
  onUpdateNote?(id: string, patch: Partial<NoteDraft>): void;   // v0.2 edit-own; type present, UI deferred
  onDeleteNote?(id: string): void;
  onDraftChange?(draft: NoteDraft): void;
  autoSaveDelayMs?: number;                 // debounce, default 600

  // pin — SOURCE OF TRUTH: `pinnedNoteIds` (controlled) wins when provided; else the
  // per-note `note.pinned` flag (uncontrolled). Never read both — mode-locked at mount.
  pinnedNoteIds?: string[];                 // controlled set of pinned ids
  onPinNote?(id: string): void;
  onUnpinNote?(id: string): void;

  // mentions — onMention fires AFTER onPostNote resolves, with the FINAL (reconciled)
  // note id, never the optimistic temp id, so a notification can link to the real note.
  onMention?(noteId: string, memberIds: string[]): void;

  // unread marker
  unreadCount?: number;                     // controlled…
  lastSeenNoteId?: string | null;           // …or derived
  onSeen?(latestNoteId: string): void;

  // board theming
  background?: BoardBackground;             // controlled
  defaultBackground?: BoardBackground;      // uncontrolled initial; lib default = navy color
  onBackgroundChange?(bg: BoardBackground): void;
  editableBackground?: boolean;             // default false

  // writing palette constraints
  palette?: string[];                       // ink color keys/colors offered; default DEFAULT_PALETTE
  fonts?: HandwritingFont[];                // default DEFAULT_FONTS (the 4 bundled)
  widths?: NoteWidth[];                     // default ["thin","regular","bold"]
  allowFreeColor?: boolean;                 // default false (curated only)
  defaultStyle?: Partial<NoteStyle>;        // initial composer style

  // behaviour
  newestFirst?: boolean;                    // default false (newest at bottom)
  showAuthorOnHover?: boolean;              // default true

  // chrome toggles (compound assembly)
  showComposer?: boolean;                   // default = !!onPostNote
  showNotificationBadge?: boolean;          // default true
  showBackgroundEditor?: boolean;           // default = editableBackground
  showPinnedRow?: boolean;                  // default true

  // escape hatches
  renderWriteDenied?(): ReactNode;
  renderEmpty?(): ReactNode;
  labels?: Partial<Blackboard01Labels>;
  className?: string;
  style?: React.CSSProperties;
  ref?: Ref<Blackboard01Handle>;            // React 19 ref-as-prop
}
```

### Exported names (flat — `index.ts` barrel)

```ts
// assembly (Tier A)
export { Blackboard01 } from "./blackboard-01";
// headless + context parts (Tier B)
export { BlackboardRoot } from "./parts/blackboard-root";
export { BlackboardSurface } from "./parts/blackboard-surface";
export { BlackboardPinnedRow } from "./parts/blackboard-pinned-row";
export { BlackboardNoteStream } from "./parts/blackboard-note-stream";
export { BlackboardNoteItem } from "./parts/blackboard-note-item";
export { BlackboardComposer } from "./parts/blackboard-composer";
export { BlackboardNotificationBadge } from "./parts/blackboard-notification-badge";
export { BlackboardBackgroundEditor } from "./parts/blackboard-background-editor";
// standalone primitives (Tier C)
export { HandwrittenNote } from "./parts/handwritten-note";
export { NoteComposer } from "./parts/note-composer";
export { InkColorPicker } from "./parts/ink-color-picker";
export { ChalkWidthPicker } from "./parts/chalk-width-picker";
export { HandwritingFontPicker } from "./parts/handwriting-font-picker";
export { MentionPicker } from "./parts/mention-picker";
export { MentionText } from "./parts/mention-text";
export { UnreadCount } from "./parts/unread-count";
export { BoardBackground } from "./parts/board-background";
// context hook
export { useBlackboard } from "./hooks/use-blackboard";
// constants
export { DEFAULT_PALETTE, DEFAULT_WIDTHS } from "./lib/palette";
export { DEFAULT_FONTS } from "./blackboard-fonts";
// types
export type * from "./types";
```

> **Flat exports only** — never a `Blackboard.Root` namespace object (kills tree-shaking). Mirrors shadcn's `SidebarProvider`/`SidebarContent`.

---

## 2. Compound tier inventory (mandatory at GATE 2)

| Export | Tier | Owns | Reads context? | Notes |
|---|---|---|---|---|
| `BlackboardRoot` | **B (provider)** | ALL state, handlers, `useImperativeHandle`, `BlackboardContext` | provides | renders `children`; no DOM beyond a wrapper |
| `BlackboardSurface` | B | board frame + drop wrapper | ✅ | renders `BoardBackground` (Tier C) underneath |
| `BlackboardPinnedRow` | B | sticky pinned region | ✅ | maps pinned notes → `BlackboardNoteItem`; hides when empty |
| `BlackboardNoteStream` | B | scroll container + lazy-older sentinel + `role="log"` | ✅ | scroll-anchored prepend via `use-lazy-older` |
| `BlackboardNoteItem` | B | one note's affordances (hover label, pin, delete) | ✅ | wraps `HandwrittenNote` (Tier C) |
| `BlackboardComposer` | B | draft state glue + autosave + post | ✅ | wraps `NoteComposer` (Tier C) + the 3 pickers + `MentionPicker` |
| `BlackboardNotificationBadge` | B | unread derivation + `onSeen` | ✅ | wraps `UnreadCount` (Tier C) |
| `BlackboardBackgroundEditor` | B | background edit glue | ✅ | popover of color/image controls |
| `HandwrittenNote` | **C (dumb)** | render text+style+author+mentions | ❌ | pure props; uses `MentionText` |
| `NoteComposer` | C | controlled textarea + overlay | ❌ | emits `onChange(draft)`; no persistence |
| `InkColorPicker` / `ChalkWidthPicker` / `HandwritingFontPicker` | C | one control each | ❌ | `value`/`onChange` |
| `MentionPicker` | C | `@`-triggered member combobox | ❌ | controlled by `query`+`open`+`onSelect` |
| `MentionText` | C | render text with mention tokens | ❌ | parses `mentions[]` offsets |
| `UnreadCount` | C | the red handwritten number | ❌ | `count` + `aria-label` |
| `BoardBackground` | C | color/image surface + overlay | ❌ | `background` prop |
| `Blackboard01` | **A (assembly)** | nothing — composition only | — | `Root` + fixed child tree gated by `show*` |

**Tier A contains no logic the parts don't.** `Blackboard01` is literally:

```tsx
<BlackboardRoot {...props}>
  <BlackboardSurface>
    {showNotificationBadge && <BlackboardNotificationBadge />}
    {showBackgroundEditor && <BlackboardBackgroundEditor />}
    {showPinnedRow && <BlackboardPinnedRow />}
    <BlackboardNoteStream />
    {showComposer && <BlackboardComposer />}
  </BlackboardSurface>
</BlackboardRoot>
```

### Tree-shaking story

- Each part is its own module, re-exported from the barrel → unused parts drop.
- **Dropping `BlackboardComposer`** (read-only board) drops: the composer, all 3 pickers, `MentionPicker`, `cmdk`/`popover` weight, `use-autosave`, `use-mentions`. The demo's "Lighter (read-only)" tab proves this.
- **`BoardBackground` image path** is inert unless a `{kind:"image"}` background is passed.
- **Fonts are core, not droppable** — a blackboard *is* handwriting; `blackboard-fonts` is imported by `BlackboardRoot` so both read + write paths get it (see §Fonts).
- **No `React.lazy` boundaries needed.** The compound rule's "heavy deps `React.lazy`" clause targets heavy *delegated viewers* (pdf.js/CodeMirror/Konva) — this procomp composes none. Its heaviest dep is `cmdk` (the mention `command`), which is moderate and only enters the graph via `BlackboardComposer` (already module-split). Pay-for-what-you-use here is **static tree-shaking via per-part modules**, not lazy chunks. GATE 3 should record this as "N/A — no heavy delegated viewers," not a missing-lazy finding.

---

## 3. Fonts (the hybrid mechanism — Q4 locked)

**Bundled defaults + override, mirroring the docs site's `@fontsource` self-hosting.**

**Packages (registry `dependencies.npm`):**
- `@fontsource/kalam` — ships 300/400/700 → `hasWeights: true` (real thin/regular/bold)
- `@fontsource-variable/caveat`
- `@fontsource/patrick-hand` — single weight 400 → faux stroke for width
- `@fontsource/shadows-into-light` — single weight 400 → faux stroke for width

**`blackboard-fonts.ts`** (shipped):

```ts
import "@fontsource/kalam/300.css";
import "@fontsource/kalam/400.css";
import "@fontsource/kalam/700.css";
import "@fontsource-variable/caveat";
import "@fontsource/patrick-hand";
import "@fontsource/shadows-into-light";
import type { HandwritingFont } from "./types";

export const DEFAULT_FONTS: HandwritingFont[] = [
  { key: "kalam",   label: "Kalam",            cssVar: "--bb-font-kalam",   hasWeights: true  },
  { key: "caveat",  label: "Caveat",           cssVar: "--bb-font-caveat",  hasWeights: false },
  { key: "patrick", label: "Patrick Hand",     cssVar: "--bb-font-patrick", hasWeights: false },
  { key: "shadows", label: "Shadows Into Light", cssVar: "--bb-font-shadows", hasWeights: false },
];
```

- **`BlackboardRoot` imports `./blackboard-fonts`** (side-effect) so the CSS loads whenever a board mounts.
- The Root injects the `--bb-font-*` vars (with a `cursive` fallback chain) as inline style on its wrapper, so the families resolve **without touching app-global CSS** — keeps it portable:
  ```
  --bb-font-kalam: "Kalam", cursive;
  --bb-font-caveat: "Caveat Variable", "Caveat", cursive;
  --bb-font-patrick: "Patrick Hand", cursive;
  --bb-font-shadows: "Shadows Into Light", cursive;
  ```
- **Override:** pass `fonts={[…]}` with consumer `cssVar`s; if a consumer fully replaces the set, the bundled CSS still loads (~tens of KB) — accepted out-of-box trade-off; the guide documents forking `blackboard-fonts.ts` to a no-op for zero-weight consumers.
- **`width` → rendering:** `hasWeights` font → `font-weight: 300|400|700`. Single-weight font → `font-weight: 400` + `-webkit-text-stroke: {0|0.4px|0.9px} currentColor` (capped; degrades gracefully where unsupported).
- **TS ambient decls** (`src/fontsource.d.ts`) — the existing file uses **package-level** decls (`declare module "@fontsource-variable/onest";`) and the codebase avoids wildcards (verified 2026-06-18). Because we import Kalam by **sub-path** (to get 3 real weights), each imported specifier must be declared explicitly:
  ```ts
  declare module "@fontsource/kalam/300.css";
  declare module "@fontsource/kalam/400.css";
  declare module "@fontsource/kalam/700.css";
  declare module "@fontsource-variable/caveat";
  declare module "@fontsource/patrick-hand";
  declare module "@fontsource/shadows-into-light";
  ```
  (Package-level decls do NOT cover sub-path specifiers in TS — the `.css` paths need their own lines.) The docs-site `layout.tsx` does NOT need these imports (Root self-loads), but I'll mirror them there too so the docs preview is deterministic.

> GATE 3 will confirm: the registry artifact lists the 4 npm deps, `blackboard-fonts.ts` ships, and a fresh consumer renders handwriting without extra setup.

---

## 4. File-by-file plan

```
src/registry/components/data/blackboard-01/
├── blackboard-01.tsx              # Tier A assembly (the ~12-line tree above)
├── blackboard-fonts.ts            # §3 — side-effect imports + DEFAULT_FONTS
├── types.ts                       # §1 public types
├── parts/
│   ├── blackboard-root.tsx        # provider: state wiring + handle + font-var injection
│   ├── blackboard-surface.tsx     # frame + BoardBackground + min-size clamp + container query
│   ├── blackboard-pinned-row.tsx
│   ├── blackboard-note-stream.tsx # scroll container, sentinel, log region, scroll-to-latest
│   ├── blackboard-note-item.tsx   # hover author-label, pin/delete buttons (gated)
│   ├── blackboard-composer.tsx    # draft glue, autosave, post, pickers + mention popover
│   ├── blackboard-notification-badge.tsx
│   ├── blackboard-background-editor.tsx
│   ├── handwritten-note.tsx       # Tier C dumb note
│   ├── note-composer.tsx          # Tier C textarea + highlight overlay
│   ├── ink-color-picker.tsx       # Tier C (toggle-group of swatches)
│   ├── chalk-width-picker.tsx     # Tier C (toggle-group, 3)
│   ├── handwriting-font-picker.tsx# Tier C (toggle-group / dropdown)
│   ├── mention-picker.tsx         # Tier C (command in popover at caret)
│   ├── mention-text.tsx           # Tier C (offset-based token render)
│   ├── unread-count.tsx           # Tier C (red handwritten number)
│   └── board-background.tsx       # Tier C
├── hooks/
│   ├── use-blackboard.ts          # createContext + BlackboardContext + useBlackboard() (throws outside Root)
│   │                              #   — context lives IN the hook module, matching media-library-01's use-media-library.ts
│   ├── use-blackboard-state.ts    # useReducer: notes merge, draft, unread, pin, optimistic
│   ├── use-controllable-state.ts  # SEALED per-component copy (NOT a shared import — registry portability bans it)
│   ├── use-lazy-older.ts          # IntersectionObserver + scroll-anchored prepend
│   ├── use-mentions.ts            # caret @-detection, query, insert/serialize
│   └── use-autosave.ts            # debounced onDraftChange
├── lib/
│   ├── palette.ts                 # DEFAULT_PALETTE (chalk tones, token-aligned), DEFAULT_WIDTHS, resolveInk()
│   ├── mentions.ts                # extractMentions(text, members), serialize, dedupeMemberIds
│   └── unread.ts                  # deriveUnread(notes, lastSeenNoteId): number
├── dummy-data.ts                  # fixtures (separate registry item; not in base)
├── demo.tsx                       # docs only — tabs: Full board / Lighter (read-only) / Custom bg
├── usage.tsx                      # docs only
├── meta.ts                        # docs only
└── index.ts                       # flat barrel (§1)
```

**`meta.ts`** (`ComponentMeta`): `slug:"blackboard-01"`, `category:"data"`, `version:"0.1.0"`, `status:"alpha"`, `dependencies.shadcn: ["button","textarea","popover","command","toggle-group","avatar","skeleton","separator"]`, `dependencies.npm: { "@fontsource/kalam":"^5", "@fontsource-variable/caveat":"^5", "@fontsource/patrick-hand":"^5", "@fontsource/shadows-into-light":"^5", "date-fns":"^4" }`, `dependencies.internal: []`. (`validate:meta-deps` must match shipped imports — keep in sync.)

**`registry.json`** (verified against `media-library-01`'s shape, 2026-06-18): base item `blackboard-01` + `blackboard-01-fixtures`. **Item-level `type: "registry:block"`** (the compound shape — mirrors media-library-01); each **file** uses `type:"registry:component"`, `target:"components/blackboard-01/<sub-path>"`. The base item's **`dependencies`** is a flat string array (no versions): `["@fontsource/kalam","@fontsource-variable/caveat","@fontsource/patrick-hand","@fontsource/shadows-into-light","date-fns","lucide-react"]`. Fixtures item: `registryDependencies:["@ilinxa/blackboard-01"]`, just `dummy-data.ts`. shadcn-primitive `registryDependencies` (button/textarea/popover/command/toggle-group/avatar/skeleton/separator) are authored per the `shadcn-registry-pro` skill at ship time (step 6). Never ship demo/usage/meta.

---

## 5. Dependencies

- **shadcn primitives** (all present): `button`, `textarea`, `popover`, `command` (mention picker), `toggle-group` (pickers), `avatar`, `skeleton` (load-older), `separator`. Use **defensive callback contravariance + drop divergent prop names** per F-cross-13 (Radix↔Base-UI divergence) — esp. for `popover`/`command` (the engagement-bar-01 Popover sub-trap precedent).
- **npm**: `@fontsource/*` (×4, §3), `date-fns` (relative timestamps — already a dep).
- **internal registry components**: **none.**
- **Optional/deferred**: `@tanstack/react-virtual` (present) — *not* used in v0.1 (Q5).

---

## 6. Composition pattern

- **Headless provider + context** (Tier B) — `BlackboardRoot` owns a `useReducer` store + handlers, exposes via `BlackboardContext`; parts call `useBlackboard()`. No prop-drilling; assembly is declarative.
- **Standalone dumb primitives** (Tier C) — pure `value`/`onChange` props, context-free, reusable anywhere.
- **Controlled-with-uncontrolled-fallback** for `selected`-style surfaces: `notes` is controlled; `background`, `pinnedNoteIds`, `unreadCount` support controlled OR derived/uncontrolled (`defaultBackground`, `lastSeenNoteId`). Use a **sealed per-component copy** of the `useControllableState` hook at `hooks/use-controllable-state.ts` (mode-locked: a prop is controlled XOR uncontrolled for the component's life). **Verified 2026-06-18:** the library has NO shared controllable-state module — `account-switcher-01`, `code-block`, and `media-library-01` each vendor their own sealed copy because registry portability bans cross-component imports. blackboard-01 copies the same proven hook into its own folder.
- **Capability-gating**: a handler's absence hides its affordance (`onPostNote`→composer, `onPinNote`→pin, `onDeleteNote`→delete, empty `members`→mention picker).
- **Render props / labels** for i18n + empty/denied escape hatches.

---

## 7. Client vs server

**`"use client"`** on every part. Requires refs (`scrollTop` anchoring, textarea caret), `useReducer`, `useImperativeHandle`, `IntersectionObserver`, event handlers, `crypto.randomUUID()` for optimistic ids (guarded — see Risks; deterministic in client effect, never during SSR render). `BlackboardRoot` is the client boundary; `next/dynamic` is **banned** (registry rule) — fonts load via static side-effect import, not dynamic.

---

## 8. Edge cases

- **Empty board** → `renderEmpty()` or default chalk "Nothing on the board yet".
- **Loading older** → skeleton rows at top; `hasMoreOlder=false` removes the sentinel; no double-fire (guard in-flight).
- **Scroll-anchored prepend** → measure `scrollHeight` before prepend, restore `scrollTop += Δ` in `useLayoutEffect` so the viewport doesn't jump.
- **Optimistic post** → push a `pending:true` note with a temp id; on `onPostNote` resolve, swap temp→real (reconcile by temp id); on reject, mark error + offer retry; never lose the draft.
- **Real-time echo dup** → `appendNote()` ignores a note whose id already exists OR matches a pending temp note (reconcile).
- **Pinned note deleted/unpinned** → removed from pinned row; if it was the only pinned note, row hides.
- **Long note text** → wraps; max-height + "show more" deferred (v0.2) — v0.1 wraps fully.
- **Mention at string end / adjacent mentions / deleted member** → `extractMentions` tolerant; an unknown `memberId` renders as plain styled text (no crash).
- **Custom image bg** → overlay (default 0.45) guarantees ink contrast; very light images still legible.
- **Narrow container / dashboard tile** → container-query; pickers collapse into a popover toolbar under a threshold; min-height clamp.
- **RTL** → text direction inherits; author-label + unread-number mirror; mention `@` trigger unaffected.
- **No `currentUser` / `canWrite=false`** → composer hidden/disabled (`renderWriteDenied`).
- **`prefers-reduced-motion`** → disable the new-note reveal animation.

---

## 9. Accessibility

- **Composer**: labelled `textarea` (`aria-label` from `labels`); mention picker follows the **combobox/listbox** ARIA pattern (cmdk provides roles); `@`-popover is keyboard-driven (↑/↓/Enter/Esc), focus returns to the textarea on select; posting via ⌘/Ctrl+Enter.
- **Stream**: `role="log"` `aria-live="polite"` `aria-relevant="additions"` so genuinely-new notes are announced — **older lazy-loaded notes are NOT announced** (insert with live-region temporarily off, or prepend outside the live boundary).
- **Notes**: each note focusable (`tabIndex`); the **author label reveals on focus as well as hover** (keyboard parity); pin/delete are real `button`s with labels.
- **Pickers**: `toggle-group` with `aria-label` per group; color swatches have accessible names (color label, not just hue); current selection `aria-pressed`.
- **Unread number**: `aria-label={labels.unreadAria(n)}`; not the only signal (it's a number, not just color).
- **Focus rings**: signal-lime `--ring`, `:focus-visible` only.
- **Contrast**: ink palette tones verified ≥ 4.5:1 on the navy board; image bg overlay enforces it.

---

## 10. Design tokens & the three scoped deviations (GATE 3 will check)

- **Board surface** owns local vars (`--bb-board-bg` default `oklch(0.18 0.04 250)`, `--bb-board-edge`, `--bb-ink-*`) — **dark in both themes** (chalkboard identity). Set on the Root wrapper; does not leak to app tokens.
- **Ink palette** (`DEFAULT_PALETTE`): chalk-white `oklch(0.96 0.01 250)`, lime `var(--primary)`, sky, amber, rose — all chroma ≤ 0.20, ≥ 4.5:1 on navy.
- **Red unread number**: chalk-red `oklch(0.62 0.19 25)` (chroma ≤ 0.20). **Signal-lime stays the interactive accent** (focus, active picker); red is unread-only.
- **Handwriting font**: note text + unread number only; all chrome stays Onest.
- **Motion**: one `reveal-up`-style entrance for a newly posted note (60ms, reduced-motion aware); no per-note independent reveals.
- The `frontend-design` skill is **mandatory** when building the visual surface.

---

## 11. Risks & alternatives

| Risk | Mitigation / decision |
|---|---|
| **Mention input rendering** (tokens inside an editable field) | **Chosen: `textarea` + an absolutely-positioned mirror `<div>`** that re-renders the text with highlighted mention spans behind the transparent-text textarea (the "highlighted-textarea" pattern). **Rejected: `contentEditable`** — caret/paste/IME hell, harder a11y. Plain text is stored; offsets drive `MentionText`. |
| **Scroll-anchored prepend jump** | `useLayoutEffect` scrollTop restoration (§8). Tested with variable-height notes. |
| **Optimistic/real-time duplication** | temp-id reconcile + `appendNote` dedup (§8). |
| **Font CSS not tree-shakeable on override** | Accepted (out-of-box priority); guide documents the fork-to-no-op escape. |
| **`crypto.randomUUID` during SSR** | temp ids generated only in a client event handler / effect, never in render — avoids the hydration-mismatch class (rich-card v0.4.3 precedent). |
| **F-cross-13 (Radix↔Base-UI) on `popover`/`command`** | Defensive callback contravariance + drop divergent prop names from day one; verify in consumer smoke. **Do NOT anchor the mention popover via `PopoverAnchor`** (engagement-bar-01 smoke: Base UI doesn't export it, and `asChild` isn't accepted) — position the `@`-popover at the caret with a **manually-computed offset from the textarea mirror** (a plain positioned element), not a Popover primitive anchor. |
| **Scope creep (drawing, rich text, threads)** | Hard-cut per description Out-of-scope; types leave room (`meta`, `onUpdateNote`) without v0.1 UI. |

**Alternatives considered:** (a) extend `comment-thread-01` — rejected (identity clash, §description). (b) freeform canvas — rejected at the layout fork. (c) `zustand` store — rejected; React context+reducer is simpler and sufficient for one board. (d) `react-virtual` now — deferred (Q5).

---

## 12. Verification plan (pre-GATE-3) — aligned to the procomp workflow

1. `pnpm new:component data/blackboard-01` → implement against this plan (add `@fontsource/*` deps to `package.json`; add the 6 ambient decls to `src/fontsource.d.ts`; mirror the font side-effect imports in `src/app/layout.tsx` for the docs preview).
2. **Register in the docs site** — paste the scaffolder's printed 3 lines into `src/registry/manifest.ts`.
3. tsc / lint / `validate:meta-deps` clean (sub-path font imports map to their packages — verified 2026-06-18); `pnpm build` clean.
4. Docs render at `/components/blackboard-01`; demo tabs (Full / Lighter read-only / Custom bg) all work.
5. **Add the two items to `registry.json`** (§4 shape) → `pnpm registry:build` clean; spot-check `public/r/blackboard-01.json` (no demo/usage/meta; fonts in `dependencies`).
6. Author `blackboard-01-procomp-guide.md` (Stage 3, consumer-facing — incl. the font-override + fork-to-no-op notes).
7. Manual walkthrough (the de-facto gate per prior procomps): write w/ each font+width+color, autosave, scroll-up lazy 10, hover+focus author label, @mention a member, pin/unpin, unread number + clear, custom image bg legibility, narrow-container collapse, read-only subset.
8. **Consumer smoke** (F-cross-11 path-b): `shadcn add` into a tmp consumer + consumer-side `tsc` clean — **including fonts actually loading** without extra consumer setup.
9. GATE 3 spot-check (4 fixed dims + rotating dim = **Design system**, given the 3 deviations) → verdict ≥ Pass with follow-ups. Author review file + update STATUS.md + decision file.

---

## 13. Open plan questions (none blocking — defaults chosen)

- **P1 — ⌘/Ctrl+Enter to post + auto-save both?** Default: **yes** — autosave persists the draft (`onDraftChange`), explicit post (button or ⌘↵) commits a note. ("Auto-save" = no data loss + no mandatory Save click, not "every keystroke is a note.")
- **P2 — Pin permission.** Default: pin affordance shows whenever `onPinNote` is supplied (consumer gates *who* sees the board with write rights); no separate `canPin`. Add `canPin` later if needed.
- **P3 — Timestamp format.** Default: `date-fns` relative ("2h", "Mon") in the hover label; absolute on title attribute.

---

## 14. Review log

**2026-06-18 — deep consistency audit (internal desc↔plan + external vs. codebase, Explore-agent-verified).** Findings + disposition:

| # | Sev | Finding | Disposition |
|---|---|---|---|
| R-1 | 🔸 Med | **Pin source-of-truth ambiguity** — `note.pinned` field AND `pinnedNoteIds` prop both expressed pinned state with no precedence. | **Fixed** §1: `pinnedNoteIds` (controlled) wins when provided; else `note.pinned` (uncontrolled); mode-locked. |
| R-2 | 🔸 Med | **Context-file structure** — plan had a standalone `blackboard-context.ts`; the established pattern (media-library-01) defines context *inside* the state hook. | **Fixed** §1/§4: context moved to `hooks/use-blackboard.ts`; barrel updated. |
| R-3 | 🔸 Med | **`useControllableState` framed as a shared "internal" hook** — verification proved there is NO shared module; each component vendors a sealed copy (portability). | **Fixed** §4/§6: added `hooks/use-controllable-state.ts` sealed copy; wording corrected. |
| R-4 | 🔹 Low | **`fontsource.d.ts` decl form** — sub-path CSS imports (`@fontsource/kalam/400.css`) aren't covered by package-level decls. | **Fixed** §3: explicit per-specifier decls listed. |
| R-5 | 🔹 Low | **`onMention` id timing** — would fire with the optimistic temp id. | **Fixed** §1: fires after `onPostNote` resolves, with the reconciled id. |
| R-6 | 🔹 Low | **`manifest.ts` registration** missing from the verification sequence. | **Fixed** §12 step 2. |
| R-7 | 🔹 Low | **Compound "lazy boundaries" GATE-3 check** could false-flag (no heavy delegated viewers here). | **Fixed** §2: documented "N/A — static tree-shaking, no `React.lazy`." |
| R-8 | 🔹 Low | **`PopoverAnchor` caret-anchoring trap** (Base UI doesn't export it — engagement-bar-01 smoke). | **Fixed** §11: mention popover positioned via textarea-mirror offset, not a Popover anchor. |
| R-9 | 🔹 Low | **Desc sketch drift** — `onDraftChange`/`fonts` shapes lagged the plan's `NoteDraft`/`HandwritingFont`. | **Fixed** in the description (sketch aligned; plan types are authoritative). |
| R-10 | 🔹 Low | **`note.pending` on the public type** is an internal flag. | **Accepted** — kept but marked `@internal`; harmless if a consumer reads it. |

**Verified OK (no change):** meta-deps validator correctly maps `@fontsource/kalam/400.css` → `@fontsource/kalam`; `registry.json` base+fixtures shape + flat-string `dependencies` array; all 8 shadcn primitives present with expected exports; `lib/` subfolder is an established convention (rich-card, properties-form, media-library-01).

**Requirement coverage** (original brief → where satisfied): dark-navy board §10 · team-write `currentUser`/`canWrite`/`members` · auto-save §1 P1 + `use-autosave` · scrollable `BlackboardNoteStream` · handwriting font §3 · color+width+font pickers §1/§2 (3 Tier-C pickers) · author-on-hover §8/§9 · lazy-load-10 `onLoadOlder`+`loadOlderPageSize` · red handwritten number `UnreadCount` §10 · editable/image bg `BoardBackground`+`BlackboardBackgroundEditor` · pin + @mention §1/§2/§8 · "well-structured/dynamic/light/optimized" = compound + tree-shaking §2. **All covered.**
