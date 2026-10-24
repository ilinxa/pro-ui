# Loop state — `account-switcher` (U-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **breaking** — the trigger's role changes `combobox` → `button` (AW1); everything else additive. No runtime dependents) |
| **Current stage** | U7 — committed locally; push awaits the user's OK |
| **Sign-off policy** | user-interactive |
| **Version target** | v0.2.1 → **v0.3.0** |
| **Model roster** | architect: main session · implementer: architect (est. diff ~400 lines across 3 new + 6 touched files; one implementer at most for tests) · finders: 2 × Sonnet 5 (fresh, one with a real browser) |
| **Started / updated** | 2026-10-24 / 2026-10-24 |

## Stage checklist (U-loop)

- [x] U0 Intake — class, blast radius, reproductions (below)
- [x] U1 Change contract — **sign-off:** user + platform team 2026-10-24 (platform reply: "Build the contract in `account-switcher-loop.md` as written"; role change OK — they do not use account-switcher yet, adopt at their M15; budget 48 KB accepted; `itemSize="lg"` prop as written, no CSS var asked)
- [x] U2 Implement (architect; falsified 16/16) · [x] U3 Gates (tsc 0 · lint 0 / 13 · meta-deps 0 · registry:build 0, 47.41 / 48 KB · build 0 · tests 102 files / 1344) · [x] U4 Review (2 fresh finders: 13 rows — 11 fixed + falsified 8/8, A7 dropped, B2 upstream) · [x] U5 Runtime & smoke (browser **42/42** light / dark / mobile + app-sidebar; installs **2/2 CLIs**) · [x] U6 Docs & review — [`reviews/2026-10-24-v0.3.0-hardening.md`](reviews/2026-10-24-v0.3.0-hardening.md): **Pass with follow-ups** (4) · [ ] U7 Ship (ask before push)

Source: request §4.3 AW1–AW4 (`E:/tmp/social-ui-v2/PROUI_HANDOFF.md:587-625`) as amended by the digest
§account-switcher (`.claude/hardening-request-verification-2026-10-23.md:121-125`).

## U0 — Intake

**Class: breaking (take the higher class).** AW1 needs focus to move into the list (the footer slot must stay
reachable), and a `combobox` keeps focus on itself by definition — so the trigger becomes a `button` with
`aria-haspopup="listbox"`. A consumer test querying `getByRole("combobox")` breaks. Everything else is additive or
an RTL-only default change. 0.x → `0.3.0`. Ladder row: 2 fresh finders, broad spotcheck, smoke slug + fixtures.

**Scope check (request + digest vs the code at `9821f82`)**

| Item | Code today | Verdict |
|---|---|---|
| AW1 listbox not implemented | `<ul role="listbox">` (`account-switcher.tsx:135`), rows `<button role="option">` (`switcher-item-row.tsx:30`), no key handler anywhere | confirmed. Every row is its own Tab stop; no ↑ ↓ Home End. Escape + focus return work (Radix). 🔒 L7 "combobox + button-list" → revise |
| AW1 (plan claim) | plan §11.1: "ArrowDown on the trigger opens — Radix handles this natively" | **false** — `@radix-ui/react-popover` has zero `onKeyDown` handlers (grepped `dist/index.mjs`) |
| AW2 strings | `` `${ariaLabel}, current: ${activeItem.label}` `` (`switcher-trigger.tsx:34`); "No items available" (`empty-placeholder.tsx:40`, also a `jsx-literal` contract-baseline row); default `"Switch account context"` (`account-switcher.tsx:19`) | confirmed |
| AW3 groups / description / row size / renderItem | `SwitcherItem = { key, label, icon?, href? }` (`types.ts`) | confirmed. 🔒 L1 (tight item shape) → revise, additive |
| AW4 `text-left` / `ml-auto` | already `text-start` / `ms-auto` (R6, `72263e0` → 0.2.1) | **already fixed** |
| AW4 collapsed side | `collapsedPopoverSide = "right"` (`account-switcher.tsx:36`); type is physical only | confirmed — add `"start" \| "end"`, default `"end"` |
| C11 | no `__tests__` folder | confirmed — no tests at all |

**Also found in U0 (read end to end):**
- **U0-1 Base UI width (fix-on-touch ledger: `--radix-popover-trigger-width` audit):** the content sets BOTH an inline
  `width: var(--radix-popover-trigger-width)` (`:101-103`) and the dual-var class
  `w-(--radix-popover-trigger-width,var(--anchor-width))` (`:132`). The inline declaration wins the cascade; on Base UI
  the Radix var is undefined, so `width` becomes invalid-at-computed-value → `auto`, and the class's `--anchor-width`
  fallback never applies. The popover is content-sized on Base UI. Fix: drop the inline style.
- **U0-2 portal loses `dir`:** the content is portaled to `<body>`. Inside a `<div dir="rtl">` section on an LTR page,
  the list renders LTR (text start, check mark, group headings) and floating-ui aligns it as LTR. Fix: set the resolved
  direction as `dir` on the content.
- **U0-3 `aria-controls` dangles while closed:** it points at the listbox id, which isn't in the DOM until open. Set it
  only while open.
- **U0-4 collapsed initial splits emoji:** `label.charAt(0)` takes half a surrogate pair for an astral first character
  (emoji, some CJK). Use the first code point.
- **U0-5 owed review items (v0.1.0 spotcheck):** F-03 (JSDoc: collision flip can't be disabled) — do now.
  F-01 (dedupe allocation fast-path) — do now, it's three lines. F-02 (path-b smoke) — satisfied since (P1/P4 smokes);
  mark done.
- **U0-6 docs:** guide §5 describes the combobox and "Tab navigates between rows"; guide "Current: v0.1.0" (it's
  0.2.1); guide :269 / :328 version-pin future work ("v0.2 candidates") — rule violation; `meta.features` advertises
  "Combobox-aria popover" and the inline-width line.
- **R7 (digest: 5 diverging `use-controllable-state` copies):** this copy drives only `open` (a discrete boolean). It
  already lets the prop win every render and adds the mode-switch dev warning. No defect → kept; not swapped for the
  `_template` copy (no optimistic need for `open`).

**Blast radius (from imports, not names)**

| Surface | Why touched | Synced (U6) |
|---|---|---|
| `src/registry/components/navigation/account-switcher/**` | the change | |
| shipped dependents | **none** — no registry item imports it (grep of `src/registry/components/**` imports) | n/a |
| `app-sidebar` demo / usage / meta (not shipped) | mounts `<AccountSwitcher isCollapsed>` in its docs demo — U5 renders it collapsed, LTR | |
| `registry.json` account-switcher (+ `-01` alias, `-fixtures`) | **3 new files** (`hooks/use-direction.ts`, `parts/switcher-list.tsx`, `lib/order-items.ts`) — roster diff at U6 | |
| `scripts/contract-baseline.json` | `jsx-literal` row for `empty-placeholder.tsx` removed; `closed` += account-switcher | |
| CHANGELOG, trio docs, STATUS, component-versions, `meta.ts` | 0.3.0; budget | |

**Reproductions (write before the fix, replayed at U5)**

| # | Input | Today | Expected |
|---|---|---|---|
| R1 (AW1) | focus trigger, press ↓ | nothing | list opens, focus on the active option |
| R2 (AW1) | open; ↓ ↓ ↑ Home End | Tab only; arrows do nothing | focus moves through options in rendered order; one Tab stop for the whole list |
| R3 (AW1) | Enter on a non-active option; Escape | Enter selects (native button); Escape closes | Enter → `onSelect` + close + focus on trigger; Escape → close + focus on trigger |
| R4 (AW2) | `labels={{ trigger: c => \`Hesap: ${c}\` }}`, Acme active | name "Switch account context, current: Acme" | name "Hesap: Acme"; no English anywhere with all labels set |
| R5 (AW3) | items with `group`, `groups`, `description` | fields ignored (type error) | headings + group roles; description line; keyboard order = visual order |
| R6 (AW4) | collapsed, `dir="rtl"` | opens to the right (away from content in an RTL sidebar) | opens to the left (inline end) |
| R7 (U0-1) | Base UI backend, expanded | popover content-sized | trigger width |
| R8 (U0-2) | `<div dir="rtl">` section on an LTR page | list renders LTR | list renders RTL |

## U1 — Change contract

**AW1 — keyboard (APG listbox, roving focus; L7 revised)**
- Trigger: `role` drops `combobox` → native `button`, `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls` (only
  while open). ↓ / ↑ on the trigger open the list (new). Enter / Space / click open as today. The standalone
  `parts/switcher-trigger.tsx` `SwitcherTrigger` (shipped file, not in the barrel) gets the same role change.
- On open, focus goes to the active option (else the first). Both backends: Radix's auto-focus lands there anyway
  (the only tabbable option); an open effect covers Base UI.
- In the list: ↓ / ↑ next / previous (no wrap), Home / End first / last, Enter / Space select (native button), Escape
  closes + focus returns to the trigger (unchanged). **One Tab stop** (roving `tabIndex`): Tab leaves the list for the
  footer slot. Keys are handled only when the event target is an option.
- Real DOM focus on options, not `aria-activedescendant` (both are APG; roving focus scrolls and announces reliably, and
  keeps native button activation).
- Active option: `aria-selected="true"`; `aria-current` (L14) unchanged.

**AW2 — labels (C2)**
- `labels?: Partial<AccountSwitcherLabels>`: `trigger: (current: string | null) => string` (the trigger's accessible
  name, also the empty placeholder's), `list: string` (the listbox name), `empty: string` (placeholder text).
  English defaults exported as `defaultAccountSwitcherLabels`; merge skips `undefined`.
- `aria-label` keeps working, **deprecated**: when given and the matching label isn't, it feeds `list` and the legacy
  `"<aria-label>, current: <label>"` trigger name. Default output is byte-identical to today's.

**AW3 — groups, description, row size, renderItem (L1 revised, additive)**
- `SwitcherItem` += `group?: string`, `description?: ReactNode`.
- `groups?: ReadonlyArray<{ id: string; label: ReactNode }>` — order + headings. Render: ungrouped items first (array
  order), then each group in `groups` order (empty groups skipped) as `role="group"` + `aria-labelledby` its heading.
  An item naming an unknown group: dev-warn, rendered ungrouped. Keyboard order = this rendered order.
- `itemSize?: "default" | "lg"` — `lg` = 32 px icon / avatar box, two-line comfortable row. Default unchanged.
- `renderItem?: (item, state: { active: boolean }) => ReactNode` — replaces the row's inner content; the option
  wrapper, roles, keyboard and selection stay the library's.

**AW4 — direction (C4)**
- `CollapsedPopoverSide` += `"start" | "end"`; default `"end"` (resolves to `right` in LTR, `left` in RTL — LTR
  output unchanged). Physical values stay.
- `dir?: "ltr" | "rtl"` prop, else the trigger's resolved direction (canonical `_template/_snippets/use-direction.ts`,
  copied); applied as `dir` on the portaled content (U0-2).

**Found in U0:** U0-1 drop the inline width · U0-3 `aria-controls` only while open · U0-4 first code point · U0-5 F-01 +
F-03 done, F-02 marked done · U0-6 guide §5 rewritten, unpinned wording, `meta.features` true.

**Tests + demo (C11)** — `__tests__/contract.test.tsx` (the kit: render, labels, controlled `open` + `activeKey`, RTL
asserting `dir="rtl"` on the content and the inline-end side, keyboard path, axe on the open list + grouped list),
`__tests__/hardening.test.tsx` (R1–R8, groups order, unknown group, deprecated `aria-label`, `undefined` labels, first
code point). Demo: Groups + description tab ("post as": personal / businesses), RTL tab (`<div dir="rtl" lang="ar">`,
collapsed + expanded), Turkish labels; Arabic + Turkish samples in `dummy-data.ts`.

### Contract matrix

| Rule | v0.3.0 |
|---|---|
| C1 tokens | `bg-card` / `bg-accent` / `text-muted-foreground` (unchanged) |
| C2 labels | typed `labels`, functions for values, no concatenation (except the deprecated `aria-label` path) |
| C3 | n/a (no dates / numbers) |
| C4 direction | logical classes (R6) + `start` / `end` sides + `dir` on the portaled content; RTL demo |
| C5 controlled | `activeKey` / `items` read every render; `open` / `defaultOpen` / `onOpenChange` (exists) |
| C6 / C7 | n/a / `footerSlot` + `renderItem` |
| C8 | n/a (avatars are the host's `icon` node) |
| C9 runtime | keydown on the list only (option targets); no global listener; no motion added |
| C10 | 0.3.0 + CHANGELOG + installs CLI 3.8.5 / 4.18.0 |
| C11 | kit + R1–R8 + axe |
| C12 | n/a (no prototype spec cited) |

### Invariants

| # | Invariant | U4 | U5 |
|---|---|---|---|
| I1 | default render (no new props, LTR): same visuals; accessible names identical to 0.2.1 | | |
| I2 | one Tab stop for the list; ↓ ↑ Home End move in rendered order; Enter / Space select; Escape closes → trigger focused | | |
| I3 | active click / Enter closes without `onSelect` (L6) | | |
| I4 | labels: every string overridable; `undefined` keeps defaults; deprecated `aria-label` still works | | |
| I5 | groups: headings + `role="group"`; ungrouped first; empty groups hidden; unknown group warns | | |
| I6 | collapsed `end` = right in LTR, left in RTL; physical values unchanged | | |
| I7 | expanded popover = trigger width on Radix AND Base UI | | |
| I8 | content carries the resolved `dir` | | |
| I-neg | empty items → disabled placeholder (labels); fallback item not in the list → focus first option; footer reachable by Tab; controlled `open` still wins every render | | |

### Platform usage (from the sign-off — demo / test data)

Three groups — personal account, businesses the user manages, platform console (staff) — each row an avatar, a name
and a one-line description; Turkish labels; expanded sidebar → list opens below the trigger; collapsed → toward the
content. The demo's "post as" tab and the hardening tests use this shape.

### Size

Artifact today **28.63 KB** / budget 35. Estimate (retro: the last two estimates ran ~45 % low): +3 modules, ~+11 KB
source × 1.13 ≈ **41 KB** → budget **48**.

## U2 — Implement (architect)

New: `parts/switcher-list.tsx` (listbox, roving focus, ↑ ↓ Home End, groups + headings, open-focus fallback for Base
UI), `lib/order-items.ts` (ungrouped first, `groups` order, empty groups skipped, unknown group warns),
`hooks/use-direction.ts` (canonical `_template/_snippets` copy). Touched: `types.ts` (labels + defaults, `group`,
`description`, `SwitcherGroup`, `groups`, `itemSize`, `renderItem`, `dir`, `"start" | "end"`, deprecated
`aria-label`), `account-switcher.tsx` (label resolution, `start`/`end` → physical, trigger ↓ / ↑, `dir` +
dialog name on the content, inline width removed, `aria-controls` only while open), `parts/switcher-item-row.tsx`
(roving `tabIndex`, `aria-selected` true / false, description line, `lg` box, `renderItem`),
`parts/switcher-trigger.tsx` (`firstGrapheme`; standalone `SwitcherTrigger` role change, its composed name kept),
`parts/empty-placeholder.tsx` (`labels.empty`), `lib/enforce-unique-keys.ts` (F-01 fast path), `index.ts`,
`dummy-data.ts` (the platform's grouped "post as" shape with initials avatars, Turkish labels + groups, Arabic items),
`demo.tsx` (Groups (post as) + Turkish toggle, RTL tab; the collapsed demo uses `labels`, not the deprecated prop),
`usage.tsx`, `meta.ts` (0.3.0, budget 48, features true), CHANGELOG, `registry.json` (3 files + versions),
contract baseline (`jsx-literal` row gone, `closed` += account-switcher), docs trio (L1 / L7 revised, plan §11
corrections, guide §4.8–4.10 + §5 key table + migration note), v0.1.0 review F-01 / F-02 / F-03 marked done.

Self-caught while writing (before any test): a group id containing a space would split `aria-labelledby` → heading
ids by position; the standalone `SwitcherTrigger` lost its composed name in my first edit → restored (only its role
changes, per the contract); Radix's content is `role="dialog"` with no name (axe `aria-dialog-name`) → named by
`labels.list`; the F-02 follow-up note first claimed 0.3.0 installs before they ran → corrected.

Tests: `__tests__/contract.test.tsx` (kit, 7) + `__tests__/hardening.test.tsx` (37: R1–R8, groups, labels, renderItem,
controlled `open`, axe over the portaled list in 4 states). tsc first run: 2 errors (`activeItem` not narrowed after
the empty-state return) → fixed. Worker-start flake twice on the full folder (host ~3.5 GB free); single-file runs
pass: **7/7 + 37/37**.

Falsified **16/16** (scratchpad `falsify.mjs`: each fix reverted in place → the folder's 44 tests run → restored;
folder byte-identical to a backup afterwards): trigger ↓/↑ (9 fail) · roving stop (8) · arrows / Home / End (4) ·
undefined label (1) · deprecated `aria-label` (1) · ungrouped-first order (1) · heading id by position (1) ·
start/end → physical (2) · no inline width (1) · `dir` on content (4) · `aria-controls` only open (1) · first
grapheme (1) · dedupe fast path (1) · dialog name (4, axe) · `labels.empty` (1) · select closes (2). Not falsifiable
in jsdom: the Base UI open-focus fallback (Radix already lands focus on the roving stop) → U4 browser finder / U5.

## U3 — Gate battery

- Run 1: tsc 0 · lint **1** — contract `intl`: `new Intl.Segmenter(undefined, …)` in `firstGrapheme` (a real catch —
  fixed with the explicit root locale `"und"`: grapheme boundaries are locale-independent, UAX #29) · meta-deps 0 ·
  registry:build 1 (same) · build 0 (772 s) · tests: 15 × "Failed to start forks worker" right after the build
  (87 / 102 files ran — the partial-run false-green shape; the count, not the exit code, gave it away).
- Run 2: tsc 0 · lint 0 / 13 · registry:build **1** — `validate:doc-budget`: `STATUS.md` 14.0 KB (my expandable-text
  close-out lengthened the active-arc line) → slimmed to a pointer, 13.4 KB · tests 2 downstream of it.
- Run 3: registry:build **0** (artifact **45.12 KB / 48** — the U1 estimate of 41 ran ~10 % low; 6 % headroom) ·
  tests **102 files / 1333 passed** (1287 + this loop's 44).

## Findings table (U4 — finder A, Sonnet 5, code + jsdom probes)

| # | Finding (failure scenario) | Verdict | Evidence | Fix |
|---|---|---|---|---|
| A1 | Duplicate ids in `groups` render that group's items twice (duplicate keys; arrows walk duplicates) | CONFIRMED | `order-items.ts` looked up the same bucket per occurrence | first occurrence kept, dev-warn; test + falsified |
| A2 | Mounted empty (items loading) in an RTL section → `useDirection` measured nothing (no trigger yet) and never re-ran → list LTR, collapsed side `right` | CONFIRMED | hook deps `[dirProp, ref]`; empty branch had no ref | the empty placeholder carries the same ref (same direction context); test + falsified |
| A3 | Live update removes the focused option → focus drops to `<body>`, arrows dead | CONFIRMED | no refocus path | effect: focused key gone + focus on body → focus the new stop; test + falsified |
| A4 | Open-focus rAF retry pulls focus back from the footer (autofocus / same-frame Tab) | CONFIRMED | guard exempted only focus outside the popup | move only from `<body>` or the popup root; test + falsified |
| A5 | Inline `groups` literal → the unknown-group warning fires every render | CONFIRMED | warn lived inside the memoized pure function | `orderItems` returns `problems`; the component warns in an effect keyed on the message. My first version also kept a "warned" ref — falsification showed it was dead code (the string-keyed effect already dedupes) → removed; falsified on the effect key instead |
| A6 | Ctrl / Meta / Shift + ↓ on the trigger opened the list (`preventDefault` swallows app shortcuts) | CONFIRMED | APG specifies plain / Alt + ↓ | modifiers + IME composition ignored, Alt kept; 4 tests + falsified |
| A7 | Guide links the 0.3.0 review file, which doesn't exist | DROPPED | it is written at U6 (this loop) | — |
| A8 | `demo.tsx` "without waiting for v0.2" — a version-pinned phrase | CONFIRMED (the guide's `// v0.2 features` is app-sidebar's API, dropped) | `demo.tsx:311` | reworded |

Falsified **6/6** (A5 after the dead ref was removed). Hardening suite **46/46**.

## Findings table (U4 — finder B, Sonnet 5, Chromium on `next start`, Radix backend)

No 🚫 / ⚠️. Verified live (probe output + screenshots read): ↓ / ↑ / Enter / Space / click open on the active
option; ↓ ↑ Home End in visual order, no wrap; select / Escape → trigger focused; one Tab to the footer; RTL
expanded (`direction: rtl`, check at inline end, headings start-aligned) and collapsed (`data-side=left`, sits left
of the trigger); grouped `lg` rows (32 px box, 52 px rows, no overflow at 375 px); Turkish trigger / list / headings;
collapsed + app-sidebar collapsed switcher; controlled open focuses the list; fallback focuses the first option;
ARIA (no `aria-controls` closed, native button, named dialog); 0 console errors / hydration warnings on every page.
CSS-mechanism probe for Base UI: `width: var(--radix-popover-trigger-width, var(--anchor-width))` with only
`--anchor-width: 300px` → 300px; adding the 0.2.1 inline `width: var(--radix-popover-trigger-width)` → 1264px (auto) —
U0-1 proven in a real engine.

| # | Finding | Verdict | Evidence | Fix |
|---|---|---|---|---|
| B1 | Expanded popover wider than a trigger under 224 px (`min-w-56`): app-sidebar's 191 px trigger → 224 px list overhanging its edge (pre-existing since 0.1, contradicts I7) | CONFIRMED | p9: trigger w191, content w224 | the floor only in collapsed mode; test + falsified |
| B2 | Keys in the ~100 ms close animation are swallowed (Esc then ↓ immediately does nothing) | CONFIRMED — upstream | p8: works from 150 ms; Radix returns focus after the exit animation | not fixed → follow-up R-02 |
| B3 | Hover and keyboard focus share one background — which row has focus is ambiguous | CONFIRMED | p11 computed colours equal | inset `focus-visible` ring; test + falsified |
| B4 | Turkish demo toggle leaves English row descriptions | CONFIRMED (demo data) | p5 | `ACCOUNT_SWITCHER_DUMMY_GROUPED_ITEMS_TR` |
| B5 | Tab past the footer cycles inside the popover (Radix non-modal content loops); only Escape / select leaves | CONFIRMED (docs) | p1 / p6 / p7 | guide §5 key table says so |

Falsified **2/2** (B1, B3). Folder **55/55** (contract 7 + hardening 48).

## U3 (re-run after the U4 fixes)

tsc 0 · lint 0 / 13 baseline (contract clean) · meta-deps 0 · registry:build 0 (artifact **47.41 KB / 48** — the U4
fixes added 2.3 KB; 1.2 % headroom → follow-up) · build 0 · tests: first attempt 14 × worker-start + 4 repo-tier
"Test timed out in 5000ms" (script-spawning gate tests on a starved host; the same validators passed when run
directly) → retry **102 files / 1344 passed** (1333 + 11 U4 regressions).

## U5 — Runtime & smoke evidence

- Browser replay (architect, scratchpad `as-browser/u5.mjs`, Chromium on `next start` of the post-U4 build):
  **42/42** — light + dark: Ctrl+↓ ignored; ↓ opens on the active option; one tab stop; End / no wrap / Home; focus
  ring only on the keyboard row (inset 2 px `--ring`), none on the hovered row; Tab → footer; width 230 = 230; Enter
  selects → closed → trigger focused (name updated); Escape → trigger; grouped order + named groups + 32 px avatar
  box; Turkish: no English text or names in the open list; RTL expanded `dir` / `direction` rtl, collapsed
  `data-side=left` and left of the trigger; app-sidebar's narrow trigger 191 = list 191 (B1) with focus in the list;
  console clean on both pages. Mobile 375 (dark): no horizontal scroll, list in the viewport, no row overflow.
  Screenshots read: `u5-dark-postas-tr.png` (flipped above the trigger for lack of room — Turkish throughout, ring
  on the active row), `u5-light-sidebar-focus.png` (ring on "Personal" vs hover on "Platform"),
  `u5-light-rtl-collapsed.png` (opens left, check at inline end, start-aligned headings).
- Seen in a screenshot: the sidebar demo still said "app-sidebar v0.2.0's upcoming `topSlot`" (stale since
  app-sidebar 0.2) → reworded (demo text only, not shipped).
- Base UI: not runnable here (the docs site and the install consumer are Radix / new-york). Proven at the CSS level in
  a real engine (finder B: the dual-var class resolves `--anchor-width`; the 0.2.1 inline style forced `auto`); the
  open-focus fallback for Base UI is reasoned, not observed → follow-up.

- Installs (`pnpm test:install`, `account-switcher` + `-fixtures`, new-york consumer): **CLI 3.8.5 + 4.18.0 — every add
  exit 0, 0.3.0, consumer tsc 0, 2/2.**

## U6 — Docs & review

Roster `registry.json` 13 = folder 13 (no missing / phantom). Docs trio current (description + plan revision banners,
L1 / L7, plan §11 corrections; guide §1, §4.5–4.10, §5 key table + migration note, §7, §8, §9), `usage.tsx`, CHANGELOG,
component-versions regenerated, source map regenerated after the last demo-text fix. GATE 3:
[`reviews/2026-10-24-v0.3.0-hardening.md`](reviews/2026-10-24-v0.3.0-hardening.md) — **Pass with follow-ups** (R-01 Base
UI runtime unobserved · R-02 keys in the close animation · R-03 size headroom 1.2 % · R-04 no type-ahead). Report-back
draft: `.claude/report-back-2026-10-24-account-switcher.md` (send after the live check).
