# Loop state — `category-cloud` (U-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **minor** — additive link mode, `labels`, `locale`) |
| **Current stage** | U1 — change contract written; awaiting the user's sign-off (generic-set batch) |
| **Sign-off policy** | user-interactive (one sign-off for the five generic-set contracts) |
| **Version target** | v0.2.0 → **v0.3.0** |
| **Model roster** | architect: main session · implementer: 1 × Sonnet 5 (generic-set wave) · finder: 1 × Sonnet 5 (fresh, browser) |
| **Started / updated** | 2026-10-24 / 2026-10-24 |

## Stage checklist (U-loop)

- [x] U0 Intake — read-only intake agent (Sonnet 5) + architect verdicts (below)
- [ ] U1 Change contract — **sign-off:** pending
- [ ] U2 Implement · [ ] U3 Gates · [ ] U4 Review · [ ] U5 Runtime & smoke · [ ] U6 Docs & review · [ ] U7 Ship (ask before push)

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
