# blackboard-01 — procomp description

> Stage 1: what & why. **GATE 1 — ✅ SIGNED OFF (2026-06-17).** All open questions resolved with the user. Author: assistant, 2026-06-17. → Proceeding to GATE 2 (plan).
>
> **Decisions locked at review (2026-06-17):** Q1 `data/blackboard-01` (revalidated — no collision; the collaborative-feed family lives in `data`) · Q3 curated ink palette (consumer-overridable) · **Q4 hybrid font delivery — bundle defaults via `@fontsource` + expose `fonts` prop & `--bb-font-*` CSS vars to override** · Q6 red number = notes newer than last-seen · Q7 delete-own in v0.1, edit-own → v0.2 · **+ NEW: pin and @mention are in v0.1 scope** (added at review). Q2 (newest-at-bottom) and Q5 (no virtualization in v0.1) defaulted.
>
> **Greenfield, compound-first.** A *blackboard* widget: a dark-navy board you drop into a dashboard or any panel, where the members of a team write short **handwritten notes** that stream vertically. Each writer picks an ink **color**, a chalk **width** (weight), and one of a few **handwriting fonts**. Notes **auto-save** (no Save button), the stream **lazy-loads 10 older notes on scroll-up**, hovering a note reveals its **author name as a faint inline label**, and a **handwritten red number** marks unread notes. Authors can **@mention teammates** while writing, and authorized members can **pin** notes to a sticky region at the top of the board. The board surface itself is themeable — a solid color or a custom background image.
>
> **Two foundational forks were resolved with the user before this draft (2026-06-17):** (1) **layout = vertical note stream** (not a freeform pan/zoom canvas, not columns) — this is what makes "lazy-load 10 on scroll up" map cleanly; (2) **author reveal = a minimal inline label beside the hovered note** (the "carosel" in the brief = the note you point at; no separate avatar carousel).

## Problem

Teams want a shared, low-ceremony **wall** — somewhere a group can jot a quick thought, a reminder, a "+1", a status — that *feels* like writing on a real chalkboard, not filing a ticket or threading a comment. Concretely:

1. **Write** — a member types a short note; it auto-persists (no explicit Save); they can pick ink color, chalk width, and a handwriting font as they write.
2. **Read** — notes stream top→bottom (newest at the bottom); the surface scrolls; scrolling up **lazy-loads the previous 10** notes.
3. **Attribute** — who wrote what is *quiet by default* (the board reads as a wall of handwriting), but **hovering a note fades in the author's name** (+ time) as a small inline label.
4. **Notice** — when new notes have arrived since you last looked, a **handwritten reddish number** sits on the board as an unread marker.
5. **Theme** — the board's background is a dark navy by default but **editable**: another solid color, or a **custom background image**.
6. **Drop in anywhere** — it's a self-contained widget sized to its container, equally at home as a dashboard tile, a panel region, or a full-width board.

Nothing in the library covers this. The closest neighbours are deliberately *different* surfaces (see next section) — none of them is a handwriting-styled, per-note-styled, board-themed collaborative note wall.

## Why a new procomp (not an extension of an existing one)

| Candidate to extend | Verdict |
|---|---|
| **`comment-thread-01`** (data, v0.2.1) | ❌ A threaded comment list — replies, nesting, comment affordances. Wrong identity: no handwriting aesthetic, no per-note ink/width/font styling, no themeable board surface, no "wall" feel. Bolting a chalkboard identity onto it would muddy a shipped, generic comment primitive. |
| **`chat-panel`** (active queue #9, not yet built) | ❌ A chat surface is paired bubbles + input + (typically) DM/room semantics. Blackboard is a *single shared wall*, not a conversation; styling is per-note expression, not message bubbles. They can share nothing without distorting both. |
| **`notification-system`** (active queue #10) | ❌ That's the app-global notification feed. The blackboard's red handwritten number is a **board-local unread marker**, not a global notification center. No overlap beyond the word "notification." |
| **New procomp `blackboard-01`** | ✅ **Recommended.** A purpose-built collaborative handwritten-note wall: themeable board surface + handwriting-styled note stream + per-note ink/width/font + scroll-up lazy load + inline author-on-hover + red unread marker. Self-contained; composes only shadcn primitives. |

## Compound structure (mandatory — this is a multi-part artifact)

Per [`.claude/rules/compound-component-structure.md`](../../../.claude/rules/compound-component-structure.md), this ships as a **shadcn-style compound** — it has ≥3 distinct mountable regions (board surface / note stream / composer / notification badge / background editor) and a consumer could reasonably want a subset (e.g. a **read-only** board with no composer, or just the note stream embedded elsewhere). Rough tier inventory (final shape is GATE 2):

- **Tier B — headless `BlackboardRoot`** — owns all state (notes, draft, current style, scroll/lazy-load cursor, unread tracking, background theme), all handler wiring, the imperative handle, and the single cross-cutting `BlackboardContext`. Renders `children`.
- **Tier B — context-connected parts** (flat exports, each its own module, read `useBlackboard()`):
  - `BlackboardSurface` — the scrollable board area + background (color/image) + drop target.
  - `BlackboardPinnedRow` — the sticky pinned-notes region at the top (collapsible); empty/hidden when nothing is pinned.
  - `BlackboardNoteStream` — the lazy-loading scroller (scroll-up sentinel → `onLoadOlder`).
  - `BlackboardNoteItem` — one note; handles hover→author-label reveal, mention-token rendering, pin toggle, edit/delete affordances (all capability-gated).
  - `BlackboardComposer` — the write box + the **ink-color / chalk-width / font** pickers + the **`@`-mention picker**; auto-save wiring.
  - `BlackboardNotificationBadge` — the handwritten red unread number.
  - `BlackboardBackgroundEditor` — color/image control for the surface (opt-in).
- **Tier C — standalone, context-free primitives** (usable anywhere): `HandwrittenNote` (dumb note render given text+style+author+mentions), `NoteComposer` (dumb controlled composer), `InkColorPicker`, `ChalkWidthPicker`, `HandwritingFontPicker`, `MentionPicker` (the `@`-triggered member list), `MentionText` (renders text with mention tokens styled), `UnreadCount` (the red handwritten number), `BoardBackground` (renders a color/image surface).
- **Tier A — the assembly** `Blackboard01` = `BlackboardRoot` + a fixed child tree gated by `show*` toggles (`showComposer` / `showNotificationBadge` / `showBackgroundEditor` / `showAuthorOnHover`). Contains **no logic the parts don't**. The demo + screenshot use Tier A; the demo also includes a "Lighter (read-only, composed)" example proving the subset path.

**Tree-shaking / pay-for-what-you-use:** flat exports only (`BlackboardRoot`, `BlackboardComposer`, … — never `Blackboard.Root`). The handwriting **font assets** and the **background-image** path are the heavy bits; dropping the composer or shipping a read-only board must not pull writing-only weight. State the lazy boundaries explicitly in GATE 2.

## Portability constraints (registry rules — these shape the API, not optional)

Registry code may import only `react`, `@/components/ui/*`, `@/lib/utils`, and declared third-party deps — **never `next/*`, app contexts, or env code**. Consequences baked into the design:

1. **Auto-save does no network.** The lib debounces and fires `onPostNote` / `onUpdateNote` / `onDraftChange`; the consumer owns persistence. "Auto-save" = no manual Save button + debounced commit, **not** a built-in backend.
2. **Lazy load is callback-driven.** Scroll-up calls `onLoadOlder(beforeNoteId, limit)` (default `limit = 10`); the consumer returns the next page. `hasMoreOlder` gates the sentinel.
3. **Real-time is the consumer's transport.** The board is a **controlled stream** (`notes` prop) + an imperative `appendNote()` for pushing inbound notes from a socket. The lib does not open sockets / poll / sync. Live multi-cursor / OT / CRDT is explicitly out of scope (see Out of scope).
4. **Handwriting fonts can't use `next/font`.** Fonts are surfaced via CSS variables with chained fallbacks (the registry-portable pattern); how the font *assets* are delivered (declared `@fontsource` dep vs. consumer-provided `--bb-font-*` vars) is a GATE 2 decision — see Open questions Q4.
5. **Team-membership gating is the consumer's call.** The lib exposes `canWrite` (gates the composer) + `currentUser` (authorship); *who is on the team* is resolved upstream and passed in.

## Design-system deviations (must be signed off — the mandate is strict)

The [design-system mandate](../../../.claude/CLAUDE.md#design-system-mandate) is deliberately strict (Onest/JetBrains fonts, signal-lime accent, no off-palette colors). This component requests **three scoped exceptions**, each justified and contained:

1. **Handwriting font for note text** — the entire point of a "blackboard." Onest/JetBrains stay for all *chrome* (toolbar labels, buttons, counts-as-UI). The handwriting font applies **only to note body text** (and the red unread number). 3–4 options offered to writers (see Open questions Q4 for the shortlist).
2. **Board surface is dark-navy in *both* light and dark app themes** — a chalkboard is dark regardless of page theme; the board defines its own surface tokens (`--bb-board-bg` etc.) rather than inheriting `--background`. This is an intentional identity choice, not a theme bug. Default `oklch(0.18 0.04 250)` (navy-leaning graphite, within the cool-graphite family the dark mandate already uses).
3. **Reddish notification number** — the spec's "handwritten reddish number." The accent mandate is signal-lime; red here is *semantic* (unread/alert), small, and reads correctly on dark navy. Proposed `oklch(0.62 0.20 25)`-ish chalk-red, chroma kept ≤ 0.20 per the "no neon-saturated" rule. **Signal-lime remains the component's interactive accent** (focus rings, active picker state); red is reserved for the unread marker only.

The writer **ink palette** (note colors) is a small curated set of chalk tones (white, lime, sky, amber, rose, …) — design-token-aligned, chroma-capped — not a free color wheel (keeps the wall coherent). Free-hex is an Open question (Q3).

## In scope (v0.1.0)

- **Themeable board surface** — dark-navy default; `background` prop accepts a solid color **or** a custom image (with a darkening overlay so handwriting stays legible). Optional in-UI `BlackboardBackgroundEditor`.
- **Handwritten note stream** — vertical, newest-at-bottom, scrollable; each note rendered in its author-chosen ink color, chalk width, and handwriting font.
- **Composer** with three writing controls: **ink color** (curated palette), **chalk width** (3 levels → font-weight where the font supports it, faux text-stroke fallback otherwise), **handwriting font** (3–4 options). Auto-save (debounced) — no Save button.
- **Scroll-up lazy load** — `onLoadOlder(beforeId, limit=10)`, loading spinner sentinel, `hasMoreOlder` gate, scroll-position preserved on prepend (no jump).
- **Author-on-hover** — faint inline label (name + relative time) fading in beside the hovered note; off by default-able via `showAuthorOnHover`.
- **Unread marker** — handwritten red number; controlled via `unreadCount`, or derived from `lastSeenNoteId` vs. the stream; `onSeen` fires when the latest is viewed; `markAllSeen()` on the handle. Notes that **@mention the current user** get extra visual emphasis (a small "@you" chalk-mark) so a mention isn't lost in the count.
- **Pin** — authorized members pin a note → it lifts into the sticky `BlackboardPinnedRow` at the top (stays visible while the stream scrolls); unpin returns it to the flow. Capability-gated via `onPinNote` / `onUnpinNote` + controlled `pinnedNoteIds`. Omit the handlers → no pin affordance (pinned row still *displays* incoming pinned notes).
- **@Mentions** — typing `@` in the composer opens a `MentionPicker` over the team `members` list (filter-as-you-type); selecting inserts a mention token. Stored as `note.mentions[]` (id + display offset); rendered by `MentionText` as a styled chalk token. `onMention(noteId, memberIds)` fires on post so the consumer can route notifications. The board does **not** send notifications itself (portability) — it surfaces the mention data + the "@you" emphasis.
- **Capability-gated affordances** — omit `onPostNote` → composer hides (read-only board); omit `onDeleteNote` → no delete; omit `onPinNote` → no pin control; empty `members` → no mention picker; `canWrite={false}` → composer disabled with an optional `renderWriteDenied`.
- **Imperative handle** — `scrollToLatest()`, `appendNote()` (inbound real-time), `focusComposer()`, `markAllSeen()`.
- **Dashboard/panel fit** — sizes to its container; container-query responsive; min-height clamp; works as a tile.
- **States** — empty board, loading-older, post-in-flight (optimistic note), post-error + retry; design-token compliance (within the scoped deviations above); a11y (composer labelled, stream is a labelled log region with SR announcements for new notes, keyboard-postable, focus-visible rings in signal-lime).

## Out of scope (v0.1.0 — deferred)

- **Real-time sync engine** (websocket/OT/CRDT, live cursors, presence) — consumer wires transport; lib exposes `appendNote()` + controlled `notes`. (Trigger: a consumer needs built-in presence.)
- **Rich text / drawing / images inside a note** — v0.1 notes are styled plain text. (Freehand drawing, @mentions, attachments → later.)
- **Threading / replies / reactions** — that's `comment-thread-01` / `engagement-bar-01` territory; the blackboard is a flat wall.
- **Freeform placement / pan-zoom canvas** — explicitly rejected at the layout fork; could be a *separate* `blackboard-canvas-01` later.
- **Sorting / search / a "mentions me" filter view** of notes — v0.1 is a chronological stream (pin is in; jump-to-my-mentions and search are v0.2 candidates).
- **Sending mention notifications** — the lib emits the mention data (`onMention` + `note.mentions`); delivering the notification is the consumer's job (and overlaps the future `notification-system`).
- **Per-note permissions / moderation queue** — `canWrite` + delete-callback only; finer ACL is the consumer's.
- **Built-in upload for the background image** — consumer supplies a URL.

## Target consumers

| Consumer | How it uses it |
|---|---|
| Team **dashboard** | A "team board" tile — quick shared notes alongside other widgets. |
| `cms-panel-01` (in-flight panel) | A collaboration region on a workspace/overview page. |
| Any **panel / workspace** | Drop-in shared wall; pass `currentUser` + `canWrite` from the app's session. |
| **Read-only display** (lobby screen, status wall) | Omit `onPostNote` → pure handwriting wall, auto-refreshed via `appendNote()`. |

## Data model (illustrative — final shape is GATE 2)

```ts
interface BlackboardAuthor {
  id: string;
  name: string;
  avatarUrl?: string;
  inkColor?: string;            // optional per-author default ink
}

interface NoteStyle {
  color: string;                // palette key or token-backed value
  width: "thin" | "regular" | "bold";   // "font width" / chalk thickness
  font: string;                 // one of the offered handwriting font keys
}

interface Mention {
  memberId: string;
  display: string;              // the @name as written
  start: number;                // char offset in text (for token rendering)
  length: number;
}

interface BlackboardNote {
  id: string;
  text: string;
  author: BlackboardAuthor;
  createdAt: string;            // ISO 8601
  updatedAt?: string;
  style: NoteStyle;
  pinned?: boolean;             // lifts into the sticky pinned row
  mentions?: Mention[];         // @teammates referenced in text
  meta?: Record<string, unknown>;
}

// the mention-able team roster (drives the @-picker)
interface BlackboardMember {
  id: string;
  name: string;
  avatarUrl?: string;
}

type BoardBackground =
  | { kind: "color"; value: string }
  | { kind: "image"; url: string; overlay?: number /* 0–1 darken */ };
```

## Rough API sketch (illustrative — final shape is GATE 2)

```ts
interface Blackboard01Props {
  notes: BlackboardNote[];                 // controlled stream (oldest→newest)
  currentUser: BlackboardAuthor;           // who is writing
  canWrite?: boolean;                      // gate composer (team membership = consumer's call)

  // lazy load older (scroll-up, 10 scope)
  onLoadOlder?(beforeNoteId: string | null, limit: number): Promise<BlackboardNote[]>;
  hasMoreOlder?: boolean;

  // write / persist (auto-save = debounced; NO network in the lib)
  onPostNote?(draft: { text: string; style: NoteStyle; mentions: Mention[] }): void | Promise<BlackboardNote>;
  onUpdateNote?(id: string, patch: Partial<{ text: string; style: NoteStyle }>): void;
  onDeleteNote?(id: string): void;
  onDraftChange?(draft: { text: string; style: NoteStyle; mentions: Mention[] }): void;   // autosave-the-draft hook (plan: NoteDraft)
  autoSaveDelayMs?: number;                // debounce; default ~600

  // pin (capability-gated)
  pinnedNoteIds?: string[];                // controlled; pinned notes lift to the sticky row
  onPinNote?(id: string): void;
  onUnpinNote?(id: string): void;

  // @mentions
  members?: BlackboardMember[];            // roster for the @-picker; empty → no mentions
  onMention?(noteId: string, memberIds: string[]): void;   // fires on post; consumer routes notifications

  // unread marker (handwritten red number)
  unreadCount?: number;                    // controlled…
  lastSeenNoteId?: string | null;          // …or derived from this
  onSeen?(latestNoteId: string): void;

  // board theming
  background?: BoardBackground;
  defaultBackground?: BoardBackground;     // default: navy color
  onBackgroundChange?(bg: BoardBackground): void;
  editableBackground?: boolean;

  // writing palette constraints (curated, not free wheel by default)
  palette?: string[];                      // ink colors offered
  fonts?: { key: string; label: string; cssVar: string; hasWeights?: boolean }[];  // 3–4 (plan: HandwritingFont)
  widths?: ("thin" | "regular" | "bold")[];

  // chrome toggles (compound assembly)
  showComposer?: boolean;
  showNotificationBadge?: boolean;
  showBackgroundEditor?: boolean;
  showAuthorOnHover?: boolean;             // default true

  renderWriteDenied?: () => ReactNode;
  labels?: Partial<Blackboard01Labels>;
  className?: string;
  ref?: Ref<Blackboard01Handle>;
}

interface Blackboard01Handle {
  scrollToLatest(): void;
  appendNote(note: BlackboardNote): void;  // inbound real-time note
  focusComposer(): void;
  markAllSeen(): void;
}
```

## Example usages

1. **Team dashboard tile (this gate's demo):** `<Blackboard01 notes={notes} currentUser={me} canWrite onPostNote={post} onLoadOlder={loadOlder} hasMoreOlder unreadCount={3} />` — type a note, pick lime ink + bold width + "Caveat", it auto-saves and appears at the bottom; scroll up → 10 older notes prepend; hover a teammate's note → their name fades in; the red "3" sits on the board until you scroll to the latest.
2. **Read-only status wall (composed/lighter):** `<BlackboardRoot notes={notes} currentUser={me}><BlackboardSurface><BlackboardNoteStream /></BlackboardSurface></BlackboardRoot>` — no composer (and thus none of the writing-control weight); a kiosk pushes new notes via `ref.appendNote()`.
3. **Custom-themed board:** `background={{ kind: "image", url: "/cork.jpg", overlay: 0.4 }}` with `editableBackground` so a team lead can swap the board image in-place.

## Success criteria

- A member writes a note with a chosen ink color + width + font → it auto-saves (debounced, no Save button) and appears at the bottom in that handwriting style; `onPostNote` fires once.
- Scrolling up triggers `onLoadOlder(beforeId, 10)`; the returned page prepends **without scroll-jump**; `hasMoreOlder=false` stops the sentinel.
- Hovering any note fades in the author name + time as a minimal inline label; leaving hides it; `showAuthorOnHover={false}` disables it.
- The handwritten red unread number reflects new notes since `lastSeenNoteId` (or `unreadCount`); viewing the latest fires `onSeen` and clears it; `markAllSeen()` works from the handle.
- Typing `@` in the composer opens the member picker; selecting inserts a mention token; the posted note carries `mentions[]`, renders the token styled, and `onMention` fires. A note mentioning the current user shows the "@you" emphasis.
- Pinning a note (when `onPinNote` is supplied) lifts it into the sticky top row and it stays put while the stream scrolls; unpin returns it; with the handlers omitted, no pin control shows but `pinnedNoteIds` still renders.
- The board renders dark-navy by default in both light & dark app themes; a `color` or `image` background applies, with handwriting legible over an image (overlay).
- Dropping the composer (read-only) yields a pure wall with **no writing-control bundle weight**; flat exports tree-shake; a hand-assembled subset renders (demo proves it).
- tsc / lint / `validate:meta-deps` clean; `pnpm build` + `registry:build` clean; consumer-side install smoke clean; GATE 3 spot-check ≥ Pass with follow-ups.

## Carried risk

- **Compound + design-deviation review surface.** Three scoped design exceptions (handwriting font, dark board in light theme, red number) plus a flat-export/tree-shaking contract — GATE 3 will check each. The `frontend-design` skill is mandatory at implementation for the visual surface.
- **Handwriting-font delivery in a portable registry component** (Q4) is the one genuinely novel technical risk — no shipped procomp ships its own font. Resolve the asset-delivery mechanism at GATE 2 before scaffolding.
- **Scroll-anchored prepend** (no-jump lazy load) is fiddly; budget for it. `@tanstack/react-virtual` (existing dep) is available if the stream grows long enough to need virtualization — weigh at GATE 2 (Q5).
- **Optimistic post + reconcile** (temp id → server id) — define the contract so `appendNote()` (real-time echo) doesn't duplicate a just-posted optimistic note.

## Open questions

**Resolved at the 2026-06-17 review:**

- **Q1 — Slug + category.** ✅ **LOCKED `data/blackboard-01`** (revalidated: no `blackboard` collision in the registry; the entire collaborative-feed family — `comment-thread-01`, `engagement-bar-01`, `post-card-01`, `story-rail-01`, `kanban-board-01` — lives in `data`; `feedback` is toasts/loaders, `media` is viewers). A future `collaboration` category is deferred until a 2nd resident justifies it (would mean relocating `comment-thread-01` — a breaking move, not worth it now).
- **Q2 — Newest at top or bottom?** ✅ **Defaulted bottom** (chat-like; "scroll up = older" matches the lazy-load spec). Reversible via a `newestFirst` prop.
- **Q3 — Ink colors: curated palette or free hex?** ✅ **LOCKED curated palette** (white + a few chalk tones, token-aligned, chroma-capped); `palette` prop overrides. Free-hex is a v0.2 opt-in.
- **Q5 — Virtualize the stream?** ✅ **Defaulted: not in v0.1** (lazy-load-10 + a cap keeps the DOM small); revisit with `@tanstack/react-virtual` if a consumer holds thousands of notes.
- **Q6 — What does the red number count?** ✅ **LOCKED: notes newer than `lastSeenNoteId` (or explicit `unreadCount`)**, cleared when the viewer reaches the latest. Mentions of the current user get separate "@you" emphasis (they don't replace the count).
- **Q7 — Edit/delete own notes in v0.1?** ✅ **LOCKED: delete-own in v0.1 (gated via `onDeleteNote`), edit-own → v0.2.**
- **+ Pin & @mention** ✅ **Added to v0.1 scope at review** (see In scope, Data model, API). Pin = sticky top row + `onPinNote`/`pinnedNoteIds`; mentions = `@`-picker over `members` + `note.mentions[]` + `onMention`.
- **Q4 — Handwriting-font delivery.** ✅ **LOCKED: hybrid (option C).** Bundle four defaults — **`Kalam`** (ships 300/400/700 → a *real* thin/regular/bold "chalk width"), **`Caveat`**, **`Patrick Hand`**, **`Shadows Into Light`** — via declared `@fontsource` deps (mirrors the docs site's Onest/JetBrains self-hosting), surfaced through `--bb-font-*` CSS vars with a `cursive` fallback chain, **and** expose the `fonts` prop so a consumer can override/replace them. The only design-mandate font exception; scoped to note text + the red number (chrome stays Onest). "Chalk width" maps to real font-weight where the font supports it (Kalam), faux `-webkit-text-stroke` otherwise. **GATE 2 must specify** the exact `@fontsource` packages, the CSS-var wiring, and how the font assets ship in the registry artifact (they are NOT `.tsx` — confirm the registry `files` handling for font CSS / the consumer-installs-dep path).

**No items remain open. GATE 1 is closed.**
