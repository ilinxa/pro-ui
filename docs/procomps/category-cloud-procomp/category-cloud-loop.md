# Loop state — `category-cloud` (U-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **minor** — additive link mode, `labels`, `locale`) |
| **Current stage** | **Closed** — 0.3.0 shipped (`ca088f2`) and verified live 2026-10-25 |
| **Sign-off policy** | user-interactive (one sign-off for the five generic-set contracts) |
| **Version target** | v0.2.0 → **v0.3.0** |
| **Model roster** | architect: main session · implementer: 1 × Sonnet 5 (generic-set wave) · finders: 2 × Sonnet 5 (fresh — code on a frozen snapshot; Chromium) |
| **Started / updated** | 2026-10-24 / 2026-10-25 |

## Stage checklist (U-loop)

- [x] U0 Intake — read-only intake agent (Sonnet 5) + architect verdicts (below)
- [x] U1 Change contract — **sign-off:** user, 2026-10-25 (platform reply `E:/tmp/social-ui-v2/PROUI_REPLY_2026-10-25_GENERIC_SET.md` accepted both open questions; user confirmed and authorized pushing without asking, after a final consistency review)
- [x] U2 Implement · [x] U3 Gates · [x] U4 Review · [x] U5 Runtime & smoke · [x] U6 Docs & review · [x] U7 Ship (pushed after a final consistency review; live-verified)

Source: request §4.10 CCL1–CCL2 (`E:/tmp/social-ui-v2/PROUI_HANDOFF.md:824-847`) as amended by the digest
(`.claude/hardening-request-verification-2026-10-23.md:152-153`).

## U0 — Intake

**Class: minor.** No dependents (magazine-layout's usage text mentions it; no import). 0 contract-baseline rows (the gate
can't see the `"Categories"` fallback — a variable, not an attribute); not in `closed`. Built 7.02 KB / budget 10.
Selection is already C5-correct (`value` wins every render; `defaultValue` uncontrolled).

| Item | Code today | Verdict |
|---|---|---|
| CCL1 chips can't be links | `<button aria-pressed>` (`parts/category-chip.tsx:21-26`) | confirmed |
| CCL2 no `labels`; `"Categories"` fallback | `category-cloud.tsx:70` (`ariaLabel ?? title ?? "Categories"`) | confirmed — digest: `ariaLabel` exists, only the final fallback becomes a label |
| CCL2 count not locale-formatted | default `` ` (${count})` `` (`:12`) | confirmed — digest: `formatCount` exists → change the default, don't add a competing function |
| Digest: count concatenation is C2 | chip name = label + count (`category-chip.tsx:31-32`) — "Technology (5)"; owed review F-01 | confirmed |
| Digest: title `font-serif` drift | `:77`; description `:16` locks the serif-bold editorial title | confirmed — locked; keep the default, document `titleClassName` (decision 2) |

**Also found:** owed review F-03 (a controlled `value` matching no item is silent) and duplicate `item.value`s (duplicate
React keys, two active chips) — both cheap dev-warns. Parked: F-02 touch target (a visible size change), per-chip
`disabled` / `hidden`, `aria-labelledby` instead of the duplicated title name, BOM in `demo.tsx`.

## U1 — Change contract

- **CCL1:** `getHref?(item) => string | undefined` + `linkComponent?: ElementType` (default `"a"`). With `getHref`, chips
  render through the link with `href`, no `aria-pressed`, `aria-current="page"` on the chip matching `value`; `onChange`
  still fires on click (no `preventDefault`) so routers can react; an item whose `getHref` returns `undefined` stays a
  button. `toggleable` has no meaning in link mode (documented). Without `getHref` → unchanged.
- **CCL2:** `labels?: { group?: string; count?: (count: number, formatted: string) => string }` +
  `defaultCategoryCloudLabels` (`group: "Categories"`, `count: (_, f) => \` (${f})\``) — today's English output exactly.
  `locale?: string` (default `"en"`, invalid → `"en"`, engagement-bar's `resolveLocale` precedent) formats the number with
  `Intl.NumberFormat(locale)`. Precedence for the group name: `ariaLabel` > `title` > `labels.group`. Precedence for the
  count text: `formatCount` (existing, full override) > `labels.count(n, formatted)`. Merge skips `undefined`.
  Accept: `locale="tr"` → `12.345` inside the count; with labels overridden, no English remains.
- **F-03 + duplicates:** dev-warn once per change.
- **Docs:** guide (link mode recipe replaces the `next/navigation` URL example; font note), meta features, RTL demo tab +
  Arabic fixtures.
- **Tests (C11):** kit (controlled `value` / `onChange`; keyboard = Tab + Enter toggles); single-select toggling;
  link mode (`href`, no `aria-pressed`, `aria-current`); locale; labels with `undefined`; dev-warns; RTL; axe.

### Invariants

| # | Invariant |
|---|---|
| I1 | no new props → today's markup and English text ("(12)") |
| I2 | link mode: links with `href`, `aria-current="page"` on the active one, no `aria-pressed` |
| I3 | `formatCount` still overrides everything about the count |
| I-neg | controlled / uncontrolled selection unchanged; `toggleable` unchanged in button mode |

### Size

7.02 KB / 10 — estimate +2.5 KB → close; budget → **12** if needed (decided at U3 on the real number).

## U2 — Implement (2026-10-25)

1 × Sonnet 5 implementer (generic-set wave). Coordinator: `registry.json` += `lib/resolve-locale.ts` (roster 4 → 5),
`closed` += category-cloud, changelog-baseline row dropped, CHANGELOG bullet (states the grouped-count change and how to
get the 0.2.0 text back); dev warnings dedupe by content (an inline `items` array re-renders without re-warning — the
implementer's effect re-warned on every new array identity). **Falsified 14 / 14** (U2) + the U4 fixes below:
link mode, `aria-current`, `linkComponent`, no toggle-off in link mode, `labels.group` fallback, `labels.count`,
`locale` formatting, `formatCount` precedence, invalid locale → `en`, `undefined` label, F-03 warn, duplicate warn,
distinct duplicate keys, warn once per problem.

## U4 — Adversarial review (1 fresh Sonnet finder, code on a frozen snapshot + Node `Intl` probes)

| id | sev | finding | verdict |
|---|---|---|---|
| F1 | Medium | default count through `Intl.NumberFormat("en")` groups ≥ 1,000 (`(12,345)` vs 0.2.0 `(12345)`), undisclosed; `-0` → "-0" | CONFIRMED → the contract specifies locale formatting, so kept and disclosed (CHANGELOG + guide, with the `formatCount` recipe for the old text); `-0` prints `0`; tests pin both |
| F2 | Medium | docs say Enter / Space activates — a link activates on Enter only | CONFIRMED → usage / meta / description / plan / guide qualified; link Enter test. No Space handler (a router link would double-fire) |
| F3 | Medium | Ctrl / Cmd / Shift / Alt-click a link chip fires `onChange` and moves the uncontrolled active chip though the page does not change | CONFIRMED → modified clicks skip both; test; guide: `onChange` is not a navigation signal |
| F4 | Low | uncontrolled link mode marks the last click as current, wrong after Back | CONFIRMED → guide: control `value` from the URL |
| F5 | Low | a `null` from `getHref` made an `href`-less, unfocusable `<a>` | CONFIRMED → only a string makes a link; test |
| F6 | Low | repeat keys `value#n` could collide with a real value `a#1` | CONFIRMED → NUL separator; test |
| F7 | Low | no `ar` / `fa` count assertion | DROPPED — locale is covered by the `tr` test; formatting is `Intl`'s |
| F8 | Low | N instances with the same bad value warn N times | ACCEPTED — per-instance, like info-list |
| F9 | Low | every chip is a Tab stop (no roving) | DROPPED — already disclosed in the guide |

## U3 — Gates (release 3: category-cloud alone)

tsc 0 · lint 0 errors · registry:build **1 → 0**: `validate:artifact-size` failed at 13.05 KB over the 1.2× cap of the
10 KB budget → budget **15** (decision file) → 0 high · tests **112 files / 1498 passed / 5 skipped** (repo version
tests re-run after the rebuild: 2 files / 32 passed) · category-cloud 30 · `next build` 0 (re-run after the demo fix).

## U5 — Runtime & smoke

- **Browser (fresh Sonnet finder, Chromium, production build on :3200) — 7 / 7:** button chips toggle with
  `aria-pressed` (click, Enter, Space); link chips are `<a href>` with `aria-current="page"` and no `aria-pressed`;
  Ctrl+click opened a new page with the URL and active chip unchanged; Enter on a link navigated, Space did nothing and
  threw nothing; `tr` counts `1.545` with Turkish text; RTL chips right to left; axe clean on every group; both themes;
  zero console output. Finding: the link-mode demo pinned `value` with no `onChange` → wired to state; coordinator
  re-check on a rebuilt site: plain click moves the active chip (`Technology`), Ctrl+click on `Events` opens a page
  and leaves `Technology` active, console empty.
- **Installs:** `INSTALL_TEST_ITEMS=category-cloud,category-cloud-fixtures pnpm test:install` — shadcn 3.8.5 + 4.18.0,
  every add exit 0, both at 0.3.0 (5-file roster incl. `lib/resolve-locale.ts`), consumer tsc 0 → **2 / 2**.

## U6 — Docs & review

Docs current; CHANGELOG; `docs/component-versions.md` regenerated. GATE 3:
[`reviews/2026-10-25-v0.3.0-hardening.md`](reviews/2026-10-25-v0.3.0-hardening.md) — **Pass with follow-ups**.

## U7 — Ship

Final consistency review before push (user's condition): 0.3.0 in `meta.ts`, `registry.json`, base + fixtures
`public/r`, `docs/component-versions.md`, CHANGELOG, STATUS; roster 5 = folder; review counts checked against the test
files (CCL1 ×8, CCL2 ×6, 30 total); `meta.ts` features match the code (group-name line corrected); source map
regenerated after the demo fix; `validate:doc-drift` + `validate:inert-surfaces` clean. Commit `ca088f2`, pushed.
**Live 04:58:** `https://ui.ilinxa.com/r/category-cloud.json` 0.3.0, 5 files, with the U4 fixes in the served source
(modified-click guard, string-only `href`, `-0`, content-deduped warnings, `\u0000` key separator as escape text — no
raw NUL); fixtures 0.3.0; detail page 200. Report-back: `.claude/report-back-2026-10-25-category-cloud.md`.
