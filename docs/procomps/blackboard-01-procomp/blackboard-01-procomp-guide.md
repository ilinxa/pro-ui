# blackboard-01 — consumer guide

> Stage 3: how to use it. Companion to the [description](./blackboard-01-procomp-description.md) (GATE 1) and [plan](./blackboard-01-procomp-plan.md) (GATE 2). Shipped v0.1.0, 2026-06-18.

A dark-navy **chalkboard** widget: a team writes short **handwritten notes** that stream vertically. Per-note ink color, chalk width, and handwriting font; auto-save; scroll-up lazy load; inline author-on-hover; pin; `@mentions`; a handwritten red unread marker; and a themeable board surface (color or image).

## When to use

- A **team board / shared wall** on a dashboard or panel — quick notes, reminders, "+1"s, status.
- A **read-only status wall** (lobby screen, kiosk) fed by a live feed.
- Anywhere you want a tactile, expressive note surface rather than a formal comment thread.

## When NOT to use

- **Threaded discussion** with replies/nesting → `comment-thread-01`.
- **Chat / DMs** → a chat panel (paired bubbles, conversation semantics).
- **Freeform whiteboard** (drag notes anywhere, pan/zoom) → out of scope (a future `blackboard-canvas-01`).
- **App-global notifications** → the red number is a *board-local* unread marker, not a notification center.

## Quick start

```tsx
import { Blackboard01 } from "@/components/blackboard-01"

<div className="h-[520px]">
  <Blackboard01
    notes={notes}                 // controlled, oldest → newest
    currentUser={me}
    members={team}                 // drives the @-mention picker
    canWrite
    onPostNote={(draft) => api.post(draft)}          // returns Promise<BlackboardNote> for optimistic reconcile
    onLoadOlder={(beforeId, n) => api.older(beforeId, n)}  // 10 on scroll-up
    hasMoreOlder
    pinnedNoteIds={pinnedIds}
    onPinNote={(id) => api.pin(id)}
    onUnpinNote={(id) => api.unpin(id)}
    onMention={(noteId, ids) => api.notify(noteId, ids)}
    lastSeenNoteId={me.lastSeen}
    onSeen={(id) => api.markSeen(id)}
    editableBackground
  />
</div>
```

The board **fills its container** — give the parent a height (it's a dashboard tile / panel region).

## Composition patterns

It ships as a shadcn-style **compound**. The batteries-included `Blackboard01` is just `BlackboardRoot` + the flat parts gated by `show*` toggles. Compose the parts directly for a lighter / custom build:

```tsx
import {
  BlackboardRoot, BlackboardSurface, BlackboardPinnedRow,
  BlackboardNoteStream, BlackboardComposer, BlackboardNotificationBadge,
} from "@/components/blackboard-01"

// Read-only wall — no composer ⇒ none of the writing / mention code ships.
<BlackboardRoot notes={notes} currentUser={me}>
  <BlackboardSurface>
    <BlackboardNoteStream />
  </BlackboardSurface>
</BlackboardRoot>
```

- **Tier B parts** (`BlackboardSurface`, `…PinnedRow`, `…NoteStream`, `…NoteItem`, `…Composer`, `…NotificationBadge`, `…BackgroundEditor`) read context — place them, they wire themselves. No prop-drilling.
- **Tier C primitives** (`HandwrittenNote`, `NoteComposer`, `InkColorPicker`, `ChalkWidthPicker`, `HandwritingFontPicker`, `MentionPicker`, `MentionText`, `UnreadCount`, `BoardBackground`) are dumb, context-free `value`/`onChange` pieces usable anywhere.
- **Capability-gating:** omit a handler and its affordance disappears — no `onPostNote` ⇒ no composer; no `onPinNote` ⇒ no pin; no `onDeleteNote` ⇒ no delete; empty `members` ⇒ no `@`-picker; `canWrite={false}` ⇒ disabled composer (`renderWriteDenied`).
- **Composer reveal (`composerMode`):** defaults to **`"double-click"`** — the board stays clean and the (deliberately minimal) composer slides up when the user double-clicks the surface; a faint hint advertises it, and Esc / ✕ dismisses. Set `composerMode="always"` to keep the composer docked at the bottom.

## Data flow & the portability contract

The library does **no network I/O** (it's registry-portable). You own persistence, transport, and notifications:

| Concern | How |
|---|---|
| **Persist a note** | `onPostNote(draft)` — auto-saved (debounced, no Save button). Return `Promise<BlackboardNote>` so the optimistic note reconciles to the server id; reject to surface a retry. |
| **Draft autosave** | `onDraftChange(draft)` (debounced `autoSaveDelayMs`, default 600) — "no data loss," not a per-keystroke post. |
| **Load older** | `onLoadOlder(beforeId, limit)` returns the next page (default 10); gate with `hasMoreOlder`. Prepend is scroll-anchored (no jump). |
| **Real-time inbound** | controlled `notes` prop, or push via the handle: `ref.current.appendNote(note)` (dedup-safe). |
| **Unread** | `lastSeenNoteId` (or explicit `unreadCount`); `onSeen(latestId)` fires when the viewer reaches the bottom; `markAllSeen()` on the handle. |
| **Mentions** | `onMention(noteId, memberIds)` fires after the post reconciles (real id), so you can route a notification. |

Imperative handle (`ref`): `scrollToLatest()`, `appendNote(note)`, `focusComposer()`, `markAllSeen()`.

## Fonts ("chalk width" + the 4 faces)

Four handwriting fonts ship bundled via `@fontsource` and load automatically when the board mounts: **Kalam**, **Caveat**, **Patrick Hand**, **Shadows Into Light**. Override or replace with the `fonts` prop (each entry points at a `--bb-font-*` CSS var you define). "Chalk width" maps to a real font-weight where the face has weights (Kalam: thin/regular/bold) and a faux `-webkit-text-stroke` otherwise.

## Gotchas

- **The board is dark in both light and dark app themes** — that's intentional (chalkboard identity), not a theme bug. It sets its own surface tokens, doesn't inherit `--background`.
- **`pinnedNoteIds` (controlled) wins over `note.pinned` (uncontrolled).** Pick one for the component's life; don't flip modes.
- **Pinned notes lift out of the stream** into the sticky top row — they're not shown twice. Unpin returns them to the flow.
- **Give the board a height.** It's `h-full` over a `min-h-80`; in a `flex`/grid tile, ensure the parent has a defined height.
- **`@you` emphasis vs. the count:** a note mentioning the current user gets a small `@you` chalk-mark; it does **not** change the unread number (which counts new-since-last-seen).
- **Custom background images** get a darkening overlay (default 0.45) so chalk stays legible; tune via `background.overlay`.

## Open follow-ups (v0.1)

- **Live mention-highlight while typing** — v0.1 inserts `@name` as plain text and styles mention tokens on *rendered* notes; an in-textarea highlight overlay is deferred to v0.2.
- **Edit-own notes** — delete-own ships in v0.1; inline edit is v0.2 (the `onUpdateNote` type is already present).
- **Virtualization** — not needed at lazy-load-10 scale; revisit with `@tanstack/react-virtual` if a consumer holds thousands of notes.
- **Reconciled-extra prune** — absorbed optimistic/appended notes linger in a local buffer (display is correct via dedup; buffer is capped at 300). Opportunistic prune → v0.1.1.
- **Visual interaction walkthrough** — pixel/interaction QA (posting, mention popover nav, scroll-anchored lazy load, pin) is user-owned; SSR render + all automated gates verified at ship.
