# Loop state — `engagement-bar` (U-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **breaking** — 0.x minor; composed by post-card, comment-thread, story-viewer → user sign-off) |
| **Current stage** | CLOSED — shipped `91b3ea3`, deploy verified 2026-10-24 |
| **Sign-off policy** | user-interactive — U1 signed off 2026-10-24 ("ok go a": contract as written, D1 = (a)); ask before push |
| **Version target** | v0.4.1 → **v0.5.0** |
| **Model roster** | architect: main session · implementers: Sonnet 5 · finders: Sonnet 5 (fresh) |
| **Started / updated** | 2026-10-24 / 2026-10-24 |

Source of the request: ilinxa Social Platform hardening request §4.6 (EB1–EB7) + contract C1–C12,
**as amended by** [`.claude/hardening-request-verification-2026-10-23.md`](../../../.claude/hardening-request-verification-2026-10-23.md) §engagement-bar (the digest wins).
Order confirmed by the platform 2026-10-24: engagement-bar → media-carousel (their post card needs both) → video-player → expandable-text → account-switcher.

## Stage checklist (U-loop)

- [x] U0 Intake — class + blast radius + reproductions (below)
- [x] U1 Change contract — **sign-off:** user, 2026-10-24 ("ok go a" — contract as written, D1 = (a) deprecated-alias escape)
- [x] U2 Implement — slices below (all done)
- [x] U3 Gate battery — real numbers below
- [x] U4 Adversarial review — 2 fresh finders + test author: 18 rows, 15 CONFIRMED + fixed, 3 DROPPED (L4 pre-existing, G7 intended, G8 name); 18 regression tests in `__tests__/u4-regressions.test.tsx` + 2 in post-card, falsified (F1/F3/F5/G3 fixes reverted → 5 fail; restored `cmp`-identical)
- [x] U5 Runtime & smoke — browser 42/42 (both themes) + story-viewer R1 live; installs 2/2 CLIs (base, fixtures, post-card, story-viewer, comment-thread), consumer tsc 0, edited-primitive negative path held
- [x] U6 Docs sync & review — spotcheck (broad) [`reviews/2026-10-24-v0.5.0-hardening.md`](reviews/2026-10-24-v0.5.0-hardening.md): **Pass with follow-ups** (7, all owned); roster 20/20 (finder-2 folder walk); blast-radius rows synced (trio, CHANGELOG, STATUS, component-versions, post-card 0.5.3); decision `.claude/decisions/2026-10-24-engagement-bar-v0-5-0.md`; retro appended to `.claude/improvement-log.md`
- [x] U7 Ship — `91b3ea3` pushed on the user's OK (2026-10-24); live verified: `/r/engagement-bar.json` 0.5.0 (20 files), `-fixtures` 0.5.0, `/r/post-card.json` 0.5.3 — one stamp each, 0 bare deps, no test files; served code carries `resolveLocale`, the picker dialog name, `touch-manipulation` (no `touch-none`), `use-direction`, and post-card's gate fix

## U0 — Intake

**Class: breaking.**
- `EngagementState` count fields become `number | null` (`likeCount`, `commentCount`, `reactionCounts[k]`, `reactionTotalCount` already nullable) — a TS break for `getCurrentState()` / `engagementReducer` readers.
- Reaction counts follow the props whenever `viewerReaction` is controlled (today: never controlled) — a runtime behaviour change for hosts that pass `viewerReaction` and rely on the bar applying `reaction-changed` deltas.
- `formatEngagementCount` output changes for English (`1.2k` → `1.2K`, `10.5k` floor → `11K` rounding).
- Accessible names gain the count (`"Like"` → `"Like 12"`).

**Blast radius**

| Surface | Why touched | Synced (U6) |
|---|---|---|
| `src/registry/components/data/engagement-bar/**` | the change | |
| `registry.json` engagement-bar item (+ `engagement-bar-01` alias) | new files (`hooks/use-direction.ts`, maybe `lib/`), deps pinned | |
| `scripts/contract-baseline.json` | delete 3 rows (template-fill 1 `likers-strip.tsx`, jsx-literal 2 `like-action.tsx`); add `engagement-bar` to `closed` | |
| `CHANGELOG.md` | bullet opening `` `engagement-bar` 0.5.0 `` (no grandfather row exists) | |
| procomp trio (description · plan · guide) | API delta + migration note; guide §align, §counts, §controlled | |
| STATUS row · component-versions · llms/README | version 0.5.0 | |
| **post-card** (composes; `LikersStrip`, `ShareMenu`, `EngagementBar`; re-exports `EngagementAction`/`EngagementDelta`) | must still compile + render. Passes `moreAriaLabelTemplate` (a `"+{count} more"` string) → see Decision D1. No post-card file change planned. | |
| **comment-thread** (`EngagementBar` per comment, like action) | must still compile + render; no file change planned | |
| **story-viewer** (inline copy of the action types, cast at the boundary; stacked variant; `[&>div>*]` stagger selectors depend on the stacked DOM shape) | stacked DOM shape is an invariant (I12). Inline copy stays a valid subset → no change now; sync parked to its Part 3 loop. **Gets the NaNb fix for free (R1).** | |
| news-card / blackboard / story-rail / media-carousel | prose mentions only | n/a |
| Feature slices / interop contracts | none (`featureOf` = 0) | n/a |

Fix-on-touch ledger: F-cross-15 — not a carrier. `--radix-popover-trigger-width` — PopoverContent is `w-auto`, clear. Open follow-ups: v0.3.0 spotcheck F-1 (post-push smoke) long closed by later live deploys; nothing else owed.

**Reproductions (write-before-fix, replayed at U5)**

| # | Input | Today | Expected |
|---|---|---|---|
| R1 (new, live in story-viewer) | `{ kind: "comment", count: undefined }` (story-viewer, every story with 0 replies) | renders **"NaNb"** (`formatEngagementCount(undefined)` falls through to the billions branch) | no number |
| R2 (new, inert surface) | `subscribe` emits `comment-count-changed` / `share-count-changed` / `view-count-changed` | nothing changes — the effective state always reads the prop | the delta's count shows until the prop next changes |
| R3 (new, false advertising) | `import { ReactionPicker, ReactionAction } from ".../engagement-bar"` | not exported, though `meta.ts` lists both as sub-exports | exported |
| R4 (EB1) | `{ kind: "reaction", totalCount: null, viewerReaction: "love" }` | n/a (type is `number`); with 0 → "0" beside own reaction | no digit, no count in the name |
| R5 (EB2) | controlled reaction, re-render with new `kinds[i].count` / `totalCount` | ignored (read once) | DOM follows the props |
| R6 (EB2/C5) | `onToggle` / `onSelect` returns a rejected promise | optimistic change stays | rolls back |
| R7 (EB5) | vertical swipe starting on the reaction trigger | page doesn't scroll (`touch-none`) | scrolls; long-press still opens |
| R8 (EB6) | `dir="rtl"`, picker focused, press → | moves to the next kind | moves to the previous kind |
| R9 (EB7) | `locale="tr"`, 1200 likes | "1.2k" | "1,2 B" |
| R10 (new) | `ShareMenu` `onSearch` — type "ab" fast, the "a" request resolves last | stale "a" results replace "ab"; a rejection is unhandled | latest query wins; rejection caught |
| R11 (new, a11y) | `ShareMenu` search input | no accessible name (placeholder only) | labelled |

## U1 — Change contract (for sign-off)

### API delta (v0.5.0)

**Counts (EB1, C6)** — every action `count` becomes `count?: number | null` (like, comment, view-count were required `number`; share/custom were `count?: number`); `EngagementReactionKind.count: number | null`; reaction `totalCount?: number | null`.
- `null` **or absent** = withheld: no digit, nothing in the accessible name, the split count button is not rendered. Absent is treated like `null` so story-viewer's `undefined` stops rendering "NaNb" (R1).
- `0` renders "0" as today.
- `null` is sticky: deltas and optimistic toggles never reveal a withheld count (`liked` still flips; the count stays hidden).
- Picker per-kind counts go through `formatCount` (today raw digits).

**Accessible names** — the action name comes from visually-hidden label text plus the visible count, instead of an `aria-label` that hides the count: like → "Like 12" (withheld → "Like"). Same for comment / share / view-count / reaction / picker kinds / split count buttons. Satisfies WCAG 2.5.3 (visible count is part of the name); label overrides keep working.

**Controlled data + optimistic (EB2, C5)** — per-action, opt-in, today's defaults kept (locked decision 1):
- like: controlled when `liked` is passed (today) → `liked` + `count` win every render (today).
- bookmark: controlled when `bookmarked` is passed (today).
- reaction: controlled when `viewerReaction` is passed (today) → **NEW: `kinds[i].count` + `totalCount` also win every render** (pair rule, same as like). Bar no longer applies `reaction-changed` to a controlled reaction; `onSubscribeDelta` still hands every delta to the host.
- `onToggle` / `onSelect` may return a promise. Then, with `optimistic` (bar prop, default `true`): the change shows at once until the promise settles or the props change; a rejection rolls back to the props (controlled) or the last accepted value (uncontrolled); only the latest request decides. `optimistic={false}` → only props render. A synchronous handler behaves exactly as today. Semantics copied from `_template/hooks/use-controllable-state.ts`.
- comment / share / view-count (prop-driven): a matching delta now shows **until the prop next changes** (fixes R2 — today these deltas are inert).
- `LikersStrip`: `likers` + new `onLikersChange` = controlled (prop wins every render; load-more calls `onLikersChange([...likers, ...loaded])`); new `defaultLikers` = uncontrolled; `likers` alone = ~~today's read-once, kept + one dev-warning per mount (story-rail precedent)~~ **changed at U2:** shows the prop on EVERY render plus the pages the strip loaded itself, de-duplicated by `id` — C5 holds, and post-card (which also appends loaded likers to its own state) gets neither duplicates nor a warning it can't act on. No dev-warning. Recorded in the guide upgrade table + CHANGELOG (U4 G4). `totalCount: number | null` (null → the pill shows without a number).

**Gating + slot (EB3, EB4, C7)**
- `disabled?: boolean` and `hidden?: boolean` on every action arm. Disabled → `aria-disabled="true"`, stays focusable, never calls its handler, picker never opens, styled `aria-disabled:opacity-50`. Hidden → renders nothing. Handle methods (`triggerLike` / `triggerBookmark` / `triggerReaction`) are no-ops on a disabled or hidden action (post-card's double-tap-to-like then respects the gate).
- `trailing?: ReactNode` on the bar — rendered inside the row after the end-aligned actions (stacked: after the last action, before the previews), in DOM/focus order.

**Touch (EB5)** — trigger drops `touch-none` → `touch-manipulation` (pan + pinch allowed); long-press keeps the 10 px move tolerance and `pointercancel` cancels it (the browser fires it when a scroll starts); the native context menu is suppressed only when a long-press fired.

**Direction (EB6, C4)**
- `align?: "start" | "end" | "auto"`; `"left"` / `"right"` stay as `@deprecated` aliases of start/end (identical rendering — the row already mirrors). `"auto"` = the per-kind default (today an explicit `"auto"` fell into the start group even for bookmark — fixed).
- Picker ← / → follow `useDirection` (copied from `_template/_snippets/`); adds Home / End.
- `dir?: "ltr" | "rtl"` on the bar (else the element's direction after mount).

**Locale + formatting + labels (EB7, C2, C3)**
- `locale?: string` (default `"en"`) and `formatCount?: (n: number) => string` on the bar; default = `Intl.NumberFormat(locale, { notation: "compact" })` created inside the component, memoised on locale. `labels.formatCount` kept as a deprecated alias.
- `formatEngagementCount(n, locale = "en")` becomes Intl-based (English output changes: "1.2K", "11K", "1.2M").
- `defaultEngagementBarLabels` added; `DEFAULT_ENGAGEMENT_BAR_LABELS` kept as a deprecated alias. The `?? "Show likers"` fallbacks are deleted (closes the 2 jsx-literal rows).
- `LikersStrip` gets `labels?: Partial<LikersStripLabels>` (`heading`, `close`, `loading`, `moreAriaLabel(count)`, `morePill(formatted)`) + `locale`; `heading` becomes optional. Existing string props (`heading`, `closeLabel`) keep working as aliases.
- `ShareMenu` gets `labels?: Partial<ShareMenuLabels>` (`heading`, `searchPlaceholder`, `searchLabel` (new — R11), `empty`, `close`) + `locale`; existing string props keep working. Filter uses `toLocaleLowerCase(locale)`; search is latest-request-wins with a caught rejection (R10).
- Initials use `toLocaleUpperCase(locale)` ("ilker" → "İ" under `tr`).

**Exports** — barrel adds `ReactionPicker`, `ReactionAction` (+ prop types) as `meta.ts` already advertises (R3), plus the new label types/defaults.

**Motion (C9)** — `hover:scale-125`, `transition-*` on action/picker buttons become `motion-safe:`; heart-burst CSS already has a reduced-motion block.

### Decision D1 — post-card's `"{count}"` template (needs your call)

- **Problem:** closing the baseline means deleting `likers-strip.tsx`'s `.replace("{count}")`. post-card passes `moreAriaLabelTemplate="+{count} more"` from its own public label `likersMoreLabel`. The `template-fill` rule has no escape, and a new `.replace` in post-card would fail the gate too (post-card has no template-fill row).
- **Options:**
  - **(a)** Keep `moreAriaLabelTemplate` as a deprecated alias inside LikersStrip. Add a `// template-ok: <reason>` escape to the `template-fill` rule, for deprecated aliases only, like the other rules' escapes (`validate-contract.mjs` + its test + guide §19.1 table). post-card is untouched and migrates in its Part 3 loop.
  - **(b)** Remove `moreAriaLabelTemplate` outright. post-card loses its localized "+N more" name (falls back to English) until its Part 3 loop.
  - **(c)** Change post-card now: `likersMoreLabel` becomes a function (post-card breaking 0.6.0). This pulls post-card into this loop.
- **Differences:** (a) costs a small gate change and keeps every consumer working. (b) is a silent i18n regression for post-card users. (c) widens this loop to a second breaking component.
- **Recommendation: (a).**

### Contract matrix (C1–C12 applied to engagement-bar)

| Rule | Applies | v0.5.0 |
|---|---|---|
| C1 tokens | yes | already clean (0 palette rows); `text-destructive` / `bg-accent` only |
| C2 labels | yes | all strings in typed labels (bar, LikersStrip, ShareMenu); functions for values; no fallbacks in parts; 2 jsx-literal + 1 template-fill rows closed |
| C3 formatting | yes | `locale` + `formatCount` props; Intl compact in-component; no clock reads |
| C4 direction | yes | logical classes (R6 did them); start/end align; mirrored picker arrows; `dir` prop; RTL demo tab |
| C5 controlled | yes | above; optimistic + rollback + latest-wins |
| C6 withheld counts | yes | `number \| null` everywhere, sticky null, nothing in names |
| C7 permissions/slots | yes | `disabled` / `hidden` per action; `trailing` slot |
| C8 media | partial | avatar images only (LikersStrip / ShareMenu) — `alt=""` decorative, initials fallback; no change |
| C9 runtime | yes | no `next/*`; no window access in render; motion-safe; no window keydown |
| C10 packaging | yes | 0.5.0 + CHANGELOG + stamp (Part 1 machinery); install on CLI 4.18.0 + 3.8.5 |
| C11 tests | yes | `describeContract` kit; `locale="tr"`; hydration (`renderToString` → `hydrateRoot`, no mismatch); one test per EB1–EB7 accept line and per R1–R11; axe on default, withheld, disabled, open picker |
| C12 visual | yes | no visual change in LTR at default props (except disabled styling + "K" casing); U5 compares before/after screenshots |

### Invariants

| # | Invariant (testable) | U4 | U5 |
|---|---|---|---|
| I1 | No new props → same DOM/behaviour as 0.4.1 except: count in the name, "K"/"M" casing, `touch-manipulation` | | |
| I2 | `count: 0` renders "0"; `null` / absent renders no digit and no count in any name; split count button absent when withheld | | |
| I3 | Withheld stays withheld through `like-toggle`, deltas, optimistic updates | | |
| I4 | Controlled like / bookmark / reaction: new props update the DOM every render; reaction counts + total follow the props | | |
| I5 | Promise handler: optimistic show → resolve keeps (uncontrolled) / shows the prop (controlled, not adopted); reject rolls back; older settling late never overrides newer; `optimistic={false}` shows only props; sync handler = today | | |
| I6 | comment/share/view deltas show until the prop changes (R2) | | |
| I7 | Disabled: `aria-disabled`, focusable, no handler call (click, Enter, long-press, handle method); hidden: not rendered, handle no-op | | |
| I8 | `trailing` renders inside the row after end actions, reachable by Tab in order | | |
| I9 | Long-press opens picker (fake timers); move > 10 px cancels; no `touch-none` | | |
| I10 | RTL: → moves to the previous kind; Home/End; start/end groups mirror; "left"/"right" render as start/end | | |
| I11 | `locale="tr"`: 1200 → "1,2 B"; initials "İ"; server HTML == first client render (hydration, no warnings) | | |
| I12 | Stacked variant: root `div` > one element per visible action, previews after (story-viewer's `[&>div>*]` stagger depends on it) | | |
| I13 | post-card, comment-thread, story-viewer compile (consumer-strict) and render unchanged; story-viewer comment shows no "NaNb" | | |
| I-neg | No `subscribe`, no `labels`, no `locale`: renders; `actions=[]` → null; all actions hidden and no `trailing` → null | | |

### Size

Built artifact today **86.3 KB** vs `artifactBudgetKB: 100`. Estimated +12–14 KB source → ≈ 100–102 KB. **Raise the budget to 115** (fails at 138).

## Slice plan

| # | Slice | Owner | Status | Spot-check evidence |
|---|---|---|---|---|
| 1 | types + state hook (nullable counts, pair rule, optimistic overlay, delta fix, gating) + handle | architect | done | `types.ts`; `hooks/use-engagement-state.ts` (`run` request path, basis-keyed overlays, sticky withheld last); handle in `engagement-bar.tsx` routes through the hook |
| 2 | root + action parts + picker (names, null, disabled, touch, dir, locale/format, trailing, motion-safe) | architect | done | `lib/action-name.ts` (`aria-labelledby` label+count), `hooks/use-direction.ts` (snippet copy), all `parts/*-action.tsx`, `reaction-picker.tsx` (dir keys, Home/End, `format`), `reaction-action.tsx` (`touch-manipulation`, contextmenu guard, disabled), `index.ts` (+ReactionPicker/ReactionAction). tsc: dependents (post-card, comment-thread, story-viewer) compile unchanged |
| 3 | LikersStrip + ShareMenu (labels, controlled likers, locale case, search race, input label) | implementer (Sonnet) | done | read `likers-strip.tsx` 147-250: three data modes, `dedupeById`, caught rejection, `template-ok` escape on a comment-only line above the one `.replace`. 36 tests; falsified (dedupe + latest-wins guard removed → 3 fail, restored `cmp`-identical). Pill moved into a `role="listitem"` (axe `aria-required-children`) |
| 4 | tests (contract kit, tr, hydration, EB1–EB7, R1–R11, axe) | implementer (Sonnet) | pending | |
| 5 | demo (RTL tab, withheld, controlled + rollback, gating + trailing) + usage + RTL dummy text | implementer (Sonnet) | done | tabs RTL / Withheld / Controlled (fail-next + optimistic toggles) / Gating (DropdownMenu via `buttonVariants`, no asChild) / Locale; usage migration section; AR fixtures. eslint 0. Browser check at U5 |
| 6 | registry.json · meta · CHANGELOG · baseline `closed` · D1 gate change (if a) · trio docs · STATUS | architect | done (STATUS at U7) | registry item +2 files (20); meta 0.5.0, budget 115, features; CHANGELOG component + registry bullets; `template-ok` escape (gate + test + guide §19.1); baseline: 3 rows gone, `closed` += engagement-bar, gate exit 0 (template-fill 27, jsx-literal 638); guide (recipes 4/5/9/10/11 rewritten, 12–15 new, upgrade table, "Candidates (not scheduled)"); description + plan v0.5.0 sections |

## Gate battery (U3 — real numbers)

| Gate | Result |
|---|---|
| tsc | exit 0 · 0 errors (consumer-strict) — post-card / comment-thread / story-viewer compile unchanged |
| lint | exit 0 · 0 errors / 13 warnings (baseline). First run: 1 error — `react-hooks/set-state-in-effect` on the overlay-cleanup effect → replaced by React's guarded setState-during-render pattern |
| meta-deps | exit 0 · 64/64 clean |
| registry validators | all exit 0 inside `registry:build` (barrel-exports strict, inert-surfaces strict, registry-tokens, cross-category, registry-deps, contract, changelog) |
| doc validators | doc-drift + doc-budget exit 0 (inside `registry:build`) |
| registry:build | exit 0 · artifact **110.55 KB** vs estimate 100–102 → budget raised 115 → **125** |
| build | `pnpm build` exit 0 (compiled 4.1 min, 77/77 pages) |
| tests | engagement-bar 9 files / **207/207** (incl. 36 LikersStrip/ShareMenu). Full suite `NODE_ENV=production pnpm test:run --no-file-parallelism` **922/922, 75 files**. The test pass found 1 bug (open picker dialog unnamed — axe `aria-dialog-name`) → fixed (`aria-label` on PopoverContent), its 3 `it.fails` flipped to passing. Falsified 5 ways by the test author (sticky withheld, RTL keys, rejection rollback, latest-wins guard, gating) — each failed its tests, sources restored `cmp`-identical |

## Findings table (U4)

| # | Finding (failure scenario) | Source | Verdict | Evidence / refutation | Fix |
|---|---|---|---|---|---|
| T1 | ⚠️ open reaction picker: the portalled popover (`role="dialog"`) had no accessible name (axe `aria-dialog-name`, serious) | test author (U2) | CONFIRMED | axe on `document.body` with the picker open; axe on the container missed the portal | `aria-label={labels.reactionPickerLabel}` on `PopoverContent`; 3 `it.fails` → `it` |
| F1 | 🔸 uncontrolled count seeded withheld (loading) then given a number: clicking like left it at 10 (reducer `step(null)`); async path snapped 11 → 10 on resolve. Same for the reaction total | finder-1 | CONFIRMED | `internalState.likeCount ?? prop` shows the prop, reducer never knew it | `like-set.baseCount` / `reaction-select.base` (the shown counts) fill counts the internal state lacks; live tallies still win |
| F2 | 🔸 uncontrolled reaction action added after mount: picks did nothing (`reactionCounts === null` → reducer no-op) — an inert surface | finder-1 | CONFIRMED | reducer early return | same `base` fix |
| F2b | 🔸 a kind added after mount collapsed to 1 on pick (`step(undefined, 1)`), 40 → 1 | finder-1 | CONFIRMED | picker text `Sad1` | same `base` fix |
| F3 | 🔸 bar first rendered `null` (all hidden) → `useDirection` never re-ran → picker `dir="ltr"` in an RTL tree (R8 re-opened) | finder-1 | CONFIRMED | effect deps `[dirProp, ref]`, ref empty at first commit | root element held in state; the ref object is memoised on it, so the hook re-resolves when the root mounts |
| F4 | 🔹 long-press timer leaked: second pointer overwrote the timer id (pinch → picker opens with no finger down); right-click started it; no unmount cleanup; fired after `disabled` flipped | finder-1 | CONFIRMED | `handlePointerDown` overwrote `longPressTimer.current` | a second pointer while pending cancels; mouse button ≠ 0 ignored; unmount cleanup; `disabledRef` checked in the callback |
| F5 / G6 | 🔹 keys used the index inside the start/end group → hiding / re-aligning one action remounted others (open picker closed) | finder-1 + finder-2 | CONFIRMED | `${kind}-${groupIndex}` | keys = custom id, else kind + occurrence over the full list |
| L1 | 🔹 a newer sync request (or a throwing handler) left an older in-flight overlay stuck until props changed | finder-1 | CONFIRMED | sync path cleared pending only when uncontrolled; throw skipped cleanup | `run` drops the group's pending on every sync request and on a throw (rethrown) |
| L2 | 🔹 NaN / Infinity / negative delta counts rendered "NaN" | finder-1 | CONFIRMED | deltas bypassed `known()` | `sane()` in the reducer + finite check on the overlay |
| L3 | 🔹 long-press fired then `pointercancel` (scroll) left the flag set → a later keyboard Enter force-opened the picker instead of clear-on-tap | finder-1 | CONFIRMED | flag reset only on pointerdown | `pointercancel` resets it; a keyboard click (`detail === 0`) ignores it |
| L4 | 🔹 `aria-live` count inside the `aria-labelledby` target may double-announce | finder-1 | DROPPED | unchanged from 0.4.1 (the live count sat inside an aria-labelled button) — not a regression | — |
| G1 | 🔸 post-card double-tap played the heart burst on a `disabled` / `hidden` like (handle no-op) — post-card 0.5.1's "burst with no effect" bug re-opened by the new gating | finder-2 | CONFIRMED | probe: burst present, liked false | **post-card 0.5.3**: `getLikeCapableBar` requires `!disabled && !hidden`; 2 regression tests |
| G2 | 🔸 `disabled` accepted + documented on `view-count`, wired to nothing (inert surface; the gate can't see it) | finder-2 | CONFIRMED | `action-button.tsx` view-count case | `view-count` arm is `Omit<Base, "disabled">`; `@ts-expect-error` test |
| G3 | 🔸 an invalid BCP 47 tag (`"en_US"`) threw in render (Intl / `toLocale*Case`) — a new crash path via the new `locale` prop | finder-2 | CONFIRMED | `RangeError` repro | `resolveLocale()` (canonicalise or `"en"`) in the bar, LikersStrip, ShareMenu, `formatEngagementCount` |
| G4 | 🔸 LikersStrip: contract said read-once + dev-warn, code follows the prop (C5); pill / template now compact-formatted — undocumented | finder-2 | CONFIRMED (docs) | `shown` memo | contract note (U1 bullet struck + reason), CHANGELOG + guide upgrade table rows |
| G5 | 🔹 guide recipes 7 / 1b still said `aria-label` | finder-2 | CONFIRMED (docs) | — | reworded |
| G7 | 🔹 `disabled` also blocks a split like's count button (likers list) | finder-2 | DROPPED (intended) | contract I7 says the whole action is inert | documented in recipe 13 |
| G8 | 🔹 dialog and inner group both named "Pick a reaction"; runtime `dir` switch undocumented in the guide | finder-2 | DROPPED (name) / CONFIRMED (doc) | standalone `ReactionPicker` needs its group name | recipe 14: pass `dir` for runtime switches |

## Runtime & smoke evidence (U5)

- **Gates re-run after U4 fixes:** tsc 0 · lint 0 errors / 13 warnings · `registry:build` exit 0 (engagement-bar **115.30 KB** / budget 125; post-card 144.13 / 165) · full suite **942/942, 76 files** · `pnpm build` exit 0. One tsc run exited 1 with an empty log while nothing else ran; the immediate re-run was 0 errors (host flake, not code).
- **Docs site (`next start` on the production build, host-side Playwright, 1440 px, light + dark) — 42/42:** default tab names "Comment 23" / "Show likers 142", like → "Unlike"; RTL tab: `dir="rtl"` container, like at the right / bookmark at the left (screenshot), picker portal `dir="rtl"`, ArrowRight on the first kind wraps to the last (R8 replayed), ArrowLeft to the next; Withheld: "Like" (no count) beside "Like 0"; Controlled + "Fail the next request": change shows at once, rolls back after the rejection (R6 replayed); Gating: trailing Report menu; Locale tr: "1,2 B" (R9 replayed); 0 console / page errors on engagement-bar, post-card, story-viewer, comment-thread; no "NaN" anywhere.
- **story-viewer (R1 replayed live):** Viewer-mode story opened — overlay names "Like 0", "React", "Comment", "Share" (0.4.1 rendered "NaNb" under Comment for 0 replies); its comment thread rows "Like 47", "Unlike 12"… The reaction total there is now withheld (story-viewer passes no `totalCount`) — expected under the pair rule.
- **Install (`pnpm test:install`, items engagement-bar, engagement-bar-fixtures, post-card, story-viewer, comment-thread; served from this checkout's `public/`):** CLI **3.8.5** and **4.18.0** — every add exit 0, consumer `tsc --noEmit` exit 0, installed engagement-bar@0.5.0 / fixtures@0.5.0 / post-card@0.5.3 / story-viewer@0.5.3 / comment-thread@0.3.2 (+ expandable-text, video-player, media-carousel via registryDependencies); negative path: a seeded + edited `ui/button.tsx` untouched. **2/2 CLIs pass.**
- Screenshots: session scratchpad `u5/`.

## Parked

- story-viewer's inline type copy (`StoryEngagementAction`) lags 0.5.0 (no `disabled`/`hidden`/`start`/`end`/`null`) — still a valid subset; sync in story-viewer's Part 3 loop.
- post-card's `likersMoreLabel` template → a label function in post-card's Part 3 loop (D1-a leaves the alias until then).

## Pre-mortem (U7)

If this breaks for a consumer, it breaks because: a host controls `viewerReaction` but relied on the bar applying
`reaction-changed` (now the host's job — upgrade table + CHANGELOG say so); or long-press / scroll behaves
differently on a real touch device (only jsdom + reasoning cover `touch-manipulation`, review R-02); or a host
reads `getCurrentState()` counts as `number` (now `number | null`, a compile-time break they will see).

---

# Run — 0.6.0 (Part 3, with story-viewer 0.6.0)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **minor** — one additive optional prop) |
| **Current stage** | CLOSED — shipped with story-viewer 0.6.0 (`c89aac2`), live 2026-10-25 |
| **Sign-off policy** | covered by the story-viewer 0.6.0 contract (platform confirmed 2026-10-25; user go). Push under the user's Part 3 grant. |
| **Version target** | v0.5.0 → **v0.6.0** |
| **Started / updated** | 2026-10-25 / 2026-10-25 |

## U0 / U1

- **Why:** story-viewer must pause while the reaction picker is open (SV5 for the reaction popover — moved from 0.5.4
  because engagement-bar exposed no picker open state). Pre-U2 scope review R-04.
- **Change:** `onReactionPickerOpenChange?: (open: boolean) => void` — fires when the reaction picker opens and closes.
  Nothing else changes; no prop → identical behaviour. post-card / comment-thread / story-viewer compose engagement-bar;
  none breaks (additive).
- **Kept:** LikersStrip's deprecated `moreAriaLabelTemplate` stays (pre-U2 scope review F-07) — removing it would break
  engagement-bar.
- **Tests:** opens → `true`, closes (select, Escape, outside) → `false`, once per transition; falsified.

## U2–U6 (with story-viewer 0.6.0)

- Built in story-viewer slice B: `onReactionPickerOpenChange` on `ReactionAction` → `ActionButton` → `EngagementBar`;
  fires on change only (never on mount), reports `false` on unmount while open (StrictMode-safe). Tests
  `picker-open-change` (6), falsified CAUGHT.
- U4 (the story-viewer code finder read the engagement-bar diff): additive, only the one `ActionButton` call site
  needed the prop; post-card and comment-thread untouched. No findings.
- U5: engagement-bar docs page (Reactions / Hybrid / Withheld counts / Controlled + optimistic) — picker opens and
  closes, `aria-expanded` false → true → false, focus returns, console clean, no overflow at 1280 / 390; installs on
  CLI 3.8.5 + 4.18.0 with story-viewer and post-card (consumer tsc 0). Artifact 116.86 / 125 KB.
- U6: `meta.ts` 0.6.0, CHANGELOG bullet, guide note; review
  [`reviews/2026-10-25-v0.6.0-picker-open-change.md`](reviews/2026-10-25-v0.6.0-picker-open-change.md) — **Pass**.

---

# Run — 0.6.1 (Part 3 release 5, with comment-thread 0.4.0 + post-card 0.6.0)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **patch** — behaviour fix, no API change) |
| **Current stage** | U6 done — ships in the release 5 commit (see `docs/procomps/comment-thread-procomp/comment-thread-loop.md`, "Run — Part 3 release 5") |
| **Sign-off policy** | user go 2026-10-26 (release 5 "end to end"); patch found by the release's browser finder |
| **Version target** | v0.6.0 → **v0.6.1** |

## U0 / U1

- **Why:** release 5 browser finder W1 — a mouse click on the likers "+N" pill did nothing: `useDragScroll` captured
  the pointer on press, so the click was retargeted to the strip. W5 — the pill read "+99" while its name said
  "+379 more" (WCAG 2.5.3).
- **Change:** pointer capture starts only after 4 px of movement; a press released outside the strip ends on return
  (`buttons === 0`). The pill shows the full compact count (`labels.morePill(format(pending))`, no 99 cap).

## U2–U6

- Built by the architect in `parts/likers-strip.tsx`; tests in `__tests__/likers-strip.test.tsx` (click after press,
  drag past the threshold, released-elsewhere press — the last one found by the pre-push doc verifier), each falsified.
- U5 re-verify: W1 and W5 PASS in Chromium on `next start -p 3200`. Installs: final matrix on CLI 4.18.0 + 3.8.5 (6 runs, all PASS, consumer tsc 0 — see comment-thread-loop.md "U5 — installs").
- U6: `meta.ts` 0.6.1, CHANGELOG bullet, guide section "0.6.1 — likers pill". Artifact 117.9 / 125 KB.
