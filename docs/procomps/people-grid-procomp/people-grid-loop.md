# Loop state — `people-grid` (U-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **minor** with **two deliberate default changes** — card heading level, avatar `alt`) |
| **Current stage** | **Closed** — 0.3.0 shipped (`c2f1d2d`) and verified live 2026-10-25 |
| **Sign-off policy** | user-interactive (one sign-off for the five generic-set contracts) |
| **Version target** | v0.2.0 → **v0.3.0** |
| **Model roster** | architect: main session · implementer: 1 × Sonnet 5 (generic-set wave) · finders: 2 × Sonnet 5 (fresh — code on a frozen snapshot; Chromium) |
| **Started / updated** | 2026-10-24 / 2026-10-25 |

## Stage checklist (U-loop)

- [x] U0 Intake — read-only intake agent (Sonnet 5) + architect verdicts (below)
- [x] U1 Change contract — **sign-off:** user, 2026-10-25 (platform reply `E:/tmp/social-ui-v2/PROUI_REPLY_2026-10-25_GENERIC_SET.md` accepted both open questions; user confirmed and authorized pushing without asking, after a final consistency review)
- [x] U2 Implement · [x] U3 Gates · [x] U4 Review · [x] U5 Runtime & smoke · [x] U6 Docs & review · [x] U7 Ship (pushed after a final consistency review; live-verified)

Source: request §4.11 PG1–PG4 (`E:/tmp/social-ui-v2/PROUI_HANDOFF.md:848-881`) as amended by the digest
(`.claude/hardening-request-verification-2026-10-23.md:154-155`).

## U0 — Intake

**Class: minor + two visible defaults.** No shipped dependents; the `event-detail-page-01` sandbox page uses it (its cards
go `h4` → `h3`). `getInitials` is a public export (guide, usage). 0 contract-baseline rows; not in `closed`. Built
10.19 KB / budget 15.

| Item | Code today | Verdict |
|---|---|---|
| PG1 initials not locale-aware; English honorifics | `lib/get-initials.ts:23,26,30` `toUpperCase()`; `TITLE_PATTERN` `:1` | confirmed — digest: `getInitials` is public → an options object (`honorifics` needs a home too); the request's `getInitials(name, "tr")` also accepted as a shorthand |
| PG2 heading levels skip | card `<h4>` fixed (`parts/person-card.tsx:75`) under a default `h2` section | confirmed — digest: guide `:150` ("one level below") is false; `headingAs="h4"` → card `h5` |
| PG3 no action / badge slot on the default card | none; the stretched link is `absolute inset-0` and rendered last (`:85-91`) → anything not raised loses clicks | confirmed — digest: slots need `relative z-10` |
| PG4 images without dimensions | `<img src alt loading>` (`:56-61`); fixed-size avatar box → no layout shift today | confirmed (pass-through only) |
| Digest: default `alt={name}` double-announces | `alt={imageAlt ?? name}` (`:58`) beside a heading with the same name | confirmed |

**Also found:** U0-1 labels merge lets `undefined` erase `emptyText` (`people-grid.tsx:39-42`). U0-2
`DEFAULT_PEOPLE_GRID_LABELS` → `defaultPeopleGridLabels` + alias. U0-3 `charAt(0)` splits astral characters
(`get-initials.ts:23,26,29`). U0-4 owed review F-01 (`React.memo` on the card) and F-02 (srcSet — closed by PG4). U0-5
plan `:439-444` "v0.2 …" deferrals (version-pinned; the "social slot" one is PG3). Parked: honorific stripping applies
to every word ("Ada Ms" loses "Ms"); a custom `linkComponent` that drops `aria-labelledby` leaves the link unnamed.

## U1 — Change contract

- **PG1:** `getInitials(name, options?)` with `options: string | { locale?; honorifics?: readonly string[] | RegExp;
  fallback? }` (a string = `locale`); `toLocaleUpperCase(locale)`; first grapheme, not `charAt`. Default honorific list
  unchanged. Grid `locale?: string` → the default card's initials.
  Accept: `getInitials("ilker yılmaz", "tr")` → `"İY"`; a custom honorific list is honoured.
- **PG2 (default change 1):** `cardHeadingAs?` (`h3`–`h6`); default = one level below `headingAs` (`h2` → `h3`,
  `h4` → `h5`). `cardHeadingAs="h4"` reproduces 0.2.0. Documented in CHANGELOG + guide.
- **PG3:** `renderActions?(item)` and `renderBadge?(item)` on the default card, each in a `relative z-10` wrapper so the
  card link never swallows their clicks. Tab order: slots, then the card link (documented).
- **PG4:** `PeopleGridItem` gains `imageWidth?`, `imageHeight?`, `imageSrcSet?`, `imageSizes?` → passed to `<img>`;
  `decoding="async"`.
- **Default change 2 (digest):** avatar `alt` defaults to `""` (decorative — the name is the heading right beside it);
  `imageAlt` still wins.
- **Contract items:** U0-1/2 labels; U0-3 graphemes; U0-4 `memo`; U0-5 unpinned plan wording.
- **Docs:** guide (`getInitials` options, heading rule, slots, image fields, alt), usage, meta features, RTL demo tab,
  `renderItem` example without a hard-coded `h4`.
- **Tests (C11):** kit (`controlled` not applicable — `items` read every render; keyboard = Tab to a card link + to a
  slot button); `getInitials` (Turkish, honorifics, graphemes, string shorthand); heading levels (h2 → h3, h4 → h5,
  override); slots render and a slot click doesn't follow the card link; image attributes; `alt=""` default + override;
  labels with `undefined`; `renderItem`; RTL; axe.

### Invariants

| # | Invariant |
|---|---|
| I1 | `getInitials(name)` (one argument) returns today's result for every ASCII name |
| I2 | card heading one level below the section unless `cardHeadingAs` |
| I3 | a click on a slot never navigates the card link |
| I-neg | `renderItem` path unchanged; empty state with `labels={{ emptyText: undefined }}` shows the default |

### Size

10.19 KB / 15 — estimate +2.5 KB → within budget.

## U2 — Implement (2026-10-25)

1 × Sonnet 5 implementer (generic-set wave). Coordinator: `scripts/contract-baseline.json` `closed` += people-grid,
`scripts/changelog-baseline.json` row dropped, CHANGELOG bullet (both default changes + how to restore them). Roster
unchanged. **Falsified 15 / 15** (scratchpad `falsify.mjs` + `spec-release2.mjs`): PG1 locale casing, U0-3 first
grapheme, PG1 custom honorifics, grid `locale` reaches the card, PG2 default level, PG2 override, PG3 actions raised,
PG3 badge raised, PG4 `srcSet`, PG4 `width`, `alt=""` default, U0-1 `emptyText`, U0-4 memo, and U4 F3 / F5 below.

## U4 — Adversarial review (1 fresh Sonnet finder, code, frozen snapshot + Node probes of `getInitials`)

| id | sev | finding | verdict |
|---|---|---|---|
| F1 | Medium | no CHANGELOG entry for the two default changes | DROPPED — coordinator-owned step, written at U6 |
| F2 | Low | honorific list not case-insensitive for `ı` / `I` without `locale` (`SAYIN` vs `Sayın`) | CONFIRMED → documented (guide: pass `locale: "tr"`) |
| F3 | Low | `ß` upper-cases to `SS` → 3-letter initials (also in 0.2.0) | CONFIRMED → fixed: each initial upper-cased alone, first grapheme kept; test |
| F4 | Low | honorifics are skipped anywhere in the name ("Ada Ms" → "A"), undisclosed | CONFIRMED → documented in the guide (behaviour unchanged since 0.1, parked in U0) |
| F5 | Low | an untyped `headingAs` outside h2–h4 crashed (0.2.0 rendered it) | CONFIRMED → fixed: card level falls back to `h3`; test |
| F6 | Low | memo test did not cover a `locale` change; stacking only checked by class | CONFIRMED → locale re-render test added; stacking proven in the browser (U5) |
| F7 | Low | `usage.tsx` used `ml-5` | CONFIRMED → `ms-5` (not shipped, fixed anyway) |


## U3 — Gates (release 2: people-grid + info-list + empty-state; category-cloud held in `git stash`)

tsc 0 · lint 0 errors · registry:build 0 (inert-surfaces clean; artifact-size 0 high) · doc-budget ok · tests **110 files /
1467 passed / 5 skipped** · people-grid 33 + 1 skip (kit `controlled`, not applicable) · `next build` 0.

## U5 — Runtime & smoke

- **Browser (fresh Sonnet finder, Chromium, production build on :3200):** card names `h3` under an `h2` section (`h4` under `h3`), sandbox speakers `h3` with `alt=""`; Turkish initials `İY` / `ŞÇ` / `IÖ` read from the DOM; a real mouse click at each action button's centre ran its handler with the URL unchanged, an empty card area navigated; Tab order action → card link; images `alt=""` + `decoding="async"`; RTL grid mirrored. axe: initials fallback `color-contrast` 1.56:1 (pre-existing since 0.1 → review R-01); the actions row's empty space does not navigate (R-03). Budget 15 → 18 KB (built 16.18). Zero console errors / warnings for
  the session (no `[info-list]` warning in production).
- **Installs:** `INSTALL_TEST_ITEMS=people-grid,people-grid-fixtures,info-list,info-list-fixtures,empty-state,empty-state-fixtures
  pnpm test:install` — shadcn 3.8.5 + 4.18.0, every add exit 0, people-grid + fixtures at 0.3.0, consumer tsc 0 → **2 / 2**.

## U6 — Docs & review

Docs current; CHANGELOG; `docs/component-versions.md` regenerated. GATE 3: [`reviews/2026-10-25-v0.3.0-hardening.md`](reviews/2026-10-25-v0.3.0-hardening.md) —
**Pass with follow-ups**.

## U7 — Ship

Final consistency review before push (user's condition): versions in `meta.ts`, `registry.json`, base + fixtures
`public/r`, `docs/component-versions.md`, CHANGELOG, STATUS all 0.3.0; roster = folder; review-file test counts
checked against the test files; `meta.ts` features match the code; commit holds release 2 only (category-cloud held
in `git stash`, its CRLF-rewritten `public/r` files reverted). Commit `c2f1d2d`, pushed. **Live 04:17:**
`https://ui.ilinxa.com/r/people-grid.json` 0.3.0 with the U4 fixes in the served source (one grapheme per initial, `h3` fallback, `alt=""` default); fixtures 0.3.0;
detail page 200. Report-back: `.claude/report-back-2026-10-25-generic-set-release-2.md`.
