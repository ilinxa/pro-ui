# Loop state — `info-list` (U-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **minor** — additive props; label constant renamed with an alias) |
| **Current stage** | **Closed** — 0.3.0 shipped (`c2f1d2d`) and verified live 2026-10-25 |
| **Sign-off policy** | user-interactive (one sign-off for the five generic-set contracts) |
| **Version target** | v0.2.0 → **v0.3.0** |
| **Model roster** | architect: main session · implementer: 1 × Sonnet 5 (generic-set wave) · finders: 2 × Sonnet 5 (fresh — code on a frozen snapshot; Chromium) |
| **Started / updated** | 2026-10-24 / 2026-10-25 |

## Stage checklist (U-loop)

- [x] U0 Intake — read-only intake agent (Sonnet 5) + architect verdicts (below)
- [x] U1 Change contract — **sign-off:** user, 2026-10-25 (platform reply `E:/tmp/social-ui-v2/PROUI_REPLY_2026-10-25_GENERIC_SET.md` accepted both open questions; user confirmed and authorized pushing without asking, after a final consistency review)
- [x] U2 Implement · [x] U3 Gates · [x] U4 Review · [x] U5 Runtime & smoke · [x] U6 Docs & review · [x] U7 Ship (pushed after a final consistency review; live-verified)

Source: request §4.8 IL1 (`E:/tmp/social-ui-v2/PROUI_HANDOFF.md:791-806`) as amended by the digest
(`.claude/hardening-request-verification-2026-10-23.md:149`).

## U0 — Intake

**Class: minor.** No shipped dependents (the `event-detail-page-01` sandbox page uses it: three lists, two compact — they
keep today's output). 0 contract-baseline rows; not in `closed`. Built 9.09 KB / budget 15.

| Item | Code today | Verdict |
|---|---|---|
| IL1 compact rows truncate with no way to read the value | `parts/info-row.tsx:41`, `:46` (`min-w-0 truncate`) | confirmed |
| IL1 change "wrap by default; `truncate?` opts in" | — | **reversed by the digest + locked decision 2**: plan `:358` locks truncation in compact → truncation stays the default, wrapping is the opt-in |
| IL1 "full value as `title` and the accessible name" | no `title`; the DOM text is complete, so the accessible name already is the full value | `title` missing (confirmed); accessible-name part already true |
| Request tests: both variants, `linkComponent`, empty state, RTL, axe | none; no RTL demo | owed |

**Also found:** U0-1 `{ ...DEFAULT, ...labels }` lets `undefined` erase `emptyText` (`info-list.tsx:30-33`). U0-2
`DEFAULT_INFO_LIST_LABELS` → `defaultInfoListLabels` + alias. U0-3 `renderItem` rows ignore `itemClassName` and
`separated`, both documented as per-row (`info-list.tsx:78-79`, `types.ts:35,65`). U0-4 compact silently drops
`secondary` / `action` — owed review F-02 (dev-warn), never done; the inert-surfaces rule needs warn + `@notImplemented`.
U0-5 fixtures ship a `<span>` styled as a link (owed review F-01). U0-6 `href` JSDoc claims a `linkComponent` is needed
(it links whenever `href` is set). Parked: string-only `heading`; static empty state's `role="status"` (accepted at v0.1).

## U1 — Change contract

- **IL1:** `wrap?: boolean` (default `false`; compact only) → no `truncate`, `wrap-break-word`. While truncating, the
  value element carries `title` = `item.title` ?? (`primary` when it is a string). `InfoListItem.title?: string` for
  node-valued `primary`.
- **U0-1/2:** `defaultInfoListLabels` (+ deprecated `DEFAULT_INFO_LIST_LABELS` alias); merge skips `undefined`.
- **U0-3:** `renderItem` rows get `itemClassName` always, and separators only when `separated` is passed explicitly —
  today's `renderItem` output is unchanged unless the host opts in.
- **U0-4:** dev-warn once when a compact list receives `secondary` or `action`; JSDoc `@notImplemented` on both for
  compact; guide / usage reworded ("ignored with a dev warning").
- **U0-5:** fixture action becomes a real `<button type="button">` (F-01 closed). **U0-6:** JSDoc corrected.
- **Tests (C11):** contract kit (`controlled` not applicable — `items` is read every render; keyboard = Tab to the row
  link); both variants; `wrap` / `title`; `linkComponent`; empty state + labels with `undefined`; `renderItem` row props;
  dev-warn; RTL; axe. RTL demo tab + Arabic fixture rows.

### Invariants

| # | Invariant |
|---|---|
| I1 | default compact still truncates (sandbox output unchanged), now with a `title` |
| I2 | `wrap` → no `truncate`, long values wrap |
| I3 | `renderItem` output unchanged unless `separated` is passed |
| I-neg | comfortable variant unchanged; `labels={{ emptyText: undefined }}` shows the default |

### Size

9.09 KB / 15 — no budget change expected.

## U2 — Implement (2026-10-25)

1 × Sonnet 5 implementer (generic-set wave). Coordinator: `closed` += info-list, changelog-baseline row dropped,
CHANGELOG bullet; plan carries a 0.3.0 superseded banner and an unpinned "Open follow-ups" heading. Roster unchanged.
**Falsified 11 / 11**: IL1 `wrap`, IL1 `title`, IL1 `item.title` wins, U0-1 `emptyText`, U0-3 `itemClassName`, U0-3
explicit `separated`, U0-5 fixture button, U0-4 dev-warn fires, U0-4 once guard, and U4 F2 / F4 below. (The first
dev-warn mutation produced a syntax error — not counted; redone as a real mutation.)

## U4 — Adversarial review (1 fresh Sonnet finder, code, frozen snapshot)

| id | sev | finding | verdict |
|---|---|---|---|
| F1 | Medium | "once" is per mounted list; the test did not prove the guard | per-instance ACCEPTED (one warning per misused list is useful); test gap CONFIRMED → rich → plain → rich test |
| F2 | Low | `secondary: cond && <X />` with `cond` false warned | CONFIRMED → fixed (`false` / `""` are not content); test |
| F3 | Low | the `items.some` scan ran in production | CONFIRMED → gated on `NODE_ENV` |
| F4 | Low | a numeric `primary` got no `title` | CONFIRMED → fixed; test. `title: ""` keeps suppressing the tooltip (explicit host choice) |
| F5 | Low | compact `renderItem` separator untested | CONFIRMED → test |
| F6 | Low | plan snippets stale; "post v0.1" heading pinned | CONFIRMED → banner + heading |
| F7 | Low | tooltip on rows that are not clipped | DROPPED — the contract asks for `title` "while truncating"; measuring clip is out of scope |


## U3 — Gates (release 2: people-grid + info-list + empty-state; category-cloud held in `git stash`)

tsc 0 · lint 0 errors · registry:build 0 (inert-surfaces clean; artifact-size 0 high) · doc-budget ok · tests **110 files /
1467 passed / 5 skipped** · info-list 30 + 1 skip (kit `controlled`, not applicable) · `next build` 0.

## U5 — Runtime & smoke

- **Browser (fresh Sonnet finder, Chromium, production build on :3200):** default mission row truncates (`scrollWidth > clientWidth`) with `title`; with `wrap` the 193-character mission wraps to four lines with no `title`; sandbox rows still truncate, now with `title`; RTL icon at the start, text start-aligned. axe: lime link `color-contrast` (pre-existing, token-level → R-01); demo `landmark-unique` (R-02). Zero console errors / warnings for
  the session (no `[info-list]` warning in production).
- **Installs:** `INSTALL_TEST_ITEMS=people-grid,people-grid-fixtures,info-list,info-list-fixtures,empty-state,empty-state-fixtures
  pnpm test:install` — shadcn 3.8.5 + 4.18.0, every add exit 0, info-list + fixtures at 0.3.0, consumer tsc 0 → **2 / 2**.

## U6 — Docs & review

Docs current; CHANGELOG; `docs/component-versions.md` regenerated. GATE 3: [`reviews/2026-10-25-v0.3.0-hardening.md`](reviews/2026-10-25-v0.3.0-hardening.md) —
**Pass with follow-ups**.

## U7 — Ship

Final consistency review before push (user's condition): versions in `meta.ts`, `registry.json`, base + fixtures
`public/r`, `docs/component-versions.md`, CHANGELOG, STATUS all 0.3.0; roster = folder; review-file test counts
checked against the test files; `meta.ts` features match the code; commit holds release 2 only (category-cloud held
in `git stash`, its CRLF-rewritten `public/r` files reverted). Commit `c2f1d2d`, pushed. **Live 04:17:**
`https://ui.ilinxa.com/r/info-list.json` 0.3.0 with the U4 fixes in the served source (`isShown` predicate, numeric `title`); fixtures 0.3.0;
detail page 200. Report-back: `.claude/report-back-2026-10-25-generic-set-release-2.md`.
