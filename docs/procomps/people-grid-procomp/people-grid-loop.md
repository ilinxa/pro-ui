# Loop state — `people-grid` (U-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **minor** with **two deliberate default changes** — card heading level, avatar `alt`) |
| **Current stage** | U2 — implementing (generic-set wave; release order share-bar → people-grid / info-list / empty-state → category-cloud) |
| **Sign-off policy** | user-interactive (one sign-off for the five generic-set contracts) |
| **Version target** | v0.2.0 → **v0.3.0** |
| **Model roster** | architect: main session · implementer: 1 × Sonnet 5 (generic-set wave) · finder: 1 × Sonnet 5 (fresh, browser) |
| **Started / updated** | 2026-10-24 / 2026-10-25 |

## Stage checklist (U-loop)

- [x] U0 Intake — read-only intake agent (Sonnet 5) + architect verdicts (below)
- [x] U1 Change contract — **sign-off:** user, 2026-10-25 (platform reply `E:/tmp/social-ui-v2/PROUI_REPLY_2026-10-25_GENERIC_SET.md` accepted both open questions; user confirmed and authorized pushing without asking, after a final consistency review)
- [ ] U2 Implement · [ ] U3 Gates · [ ] U4 Review · [ ] U5 Runtime & smoke · [ ] U6 Docs & review · [ ] U7 Ship (push authorized after a final consistency review)

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
