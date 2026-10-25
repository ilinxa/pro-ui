# Loop state — `entity-picker` (U-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **minor** — additive controlled query, async states, `labels`, `locale`) |
| **Current stage** | U1 signed (scope: platform 2026-10-25) — U2 starts on the user's go for its release |
| **Sign-off policy** | user-interactive. Push: the user granted push-without-asking for each Part 3 release after a final consistency review (2026-10-25). |
| **Version target** | v0.1.4 → **v0.2.0** |
| **Model roster** | architect: main session · intake: 1 × Sonnet 5 (read-only) |
| **Started / updated** | 2026-10-25 / 2026-10-25 |

Source: request §5.4 EP1–EP2 (`E:/tmp/social-ui-v2/PROUI_HANDOFF.md:1078-1105`) as amended by the digest
(`.claude/hardening-request-verification-2026-10-23.md` §Part 3 "entity-picker").

## Stage checklist (U-loop)

- [x] U0 Intake — read-only intake agent (Sonnet 5) + architect verdicts (below)
- [x] U1 Change contract — **sign-off:** platform 2026-10-25 (`PROUI_REPLY_2026-10-25_PART3.md`); the user's go is given per release (order in the platform reply)
- [ ] U2 Implement · [ ] U3 Gates · [ ] U4 Review · [ ] U5 Runtime & smoke · [ ] U6 Docs & review · [ ] U7 Ship

## U0 — Intake

**Class: minor.** No code dependents (only `entity-picker-fixtures`; filter-bar / category-cloud / properties-form /
markdown-editor name it in `meta.related` only). No feature slices. Not in `closed`. Baseline: 4 `jsx-literal` rows
(`Search entities`, `Remove`, `No results`, `Nothing to pick from`). The gate misses 2 more English defaults
(`"Search…"` `entity-picker.tsx:44`, `"Select…"` `parts/trigger-button.tsx:48`: default-parameter strings). **No
`__tests__/` at all.** Built 30.3 KB / budget 35.

| Item | Code today | Verdict |
|---|---|---|
| EP1 controlled query | `useState("")` `entity-picker.tsx:70`, reset on close `:74`, `onValueChange={setQuery}` `:308` | confirmed |
| EP1 server results ("`filter={false}`") | `<Command filter={filterFn}>` `:304`. In cmdk `filter` is a scorer, so the off switch is `shouldFilter` (verified in `node_modules/cmdk/dist/index.d.ts:32`). `match={() => true}` works today (guide `:383`) but cmdk still drives the empty state | partial |
| EP1 items re-render / chips persist | `items.map` `:320`; chips render from `value` (`trigger-button.tsx:88-100`) | already fine (digest) |
| EP1 loading / error / retry, `aria-busy`, results count | none | confirmed |
| Digest: `loadItems(query, page)` in the description vs a controlled pair: pick one | description §3 `:55`, plan `:164`; guide `:389,415,443` says "v0.2 candidate" / "deferred to v0.2" (**a version-pinned deferral**: inert-surfaces rule) | confirmed. **Verdict: controlled pair** (below) |
| EP2 hard-coded strings | the 6 above; `triggerLabel` names three different things (trigger placeholder, trigger name, search input name) | confirmed |
| EP2 physical classes | already logical (`72263e0`) | already fixed |

**Also found (architect-verified):**
- **C3 bug for a Turkish host:** `lib/default-match.ts` uses `toLowerCase()`. `"İstanbul".toLowerCase().includes("istanbul")`
  is `false`; with `toLocaleLowerCase("tr")` it is `true` (Node probe). Typing "istanbul" today finds nothing.
- **Async glitch:** `showKindBadges` is derived from `items.some(i => i.kind)` (`:82-85`), so while `items` is empty
  (loading, no results) the chips lose their kind badges. Fix: derive from `items` or `value`.
- Popover width dual var already in place (`:302`). Nothing owed here. The single-var site is content-composer's
  `field-author-picker.tsx:136` (parked, fix with content-composer).

## U1 — Change contract (proposed)

**API decision: the host owns the data.** Controlled `query` + host-supplied `items` fits locked decision 1 (the prop
wins every render), a server-first host with its own fetch layer, and live data. `loadItems(query, page)` would hide
a second request lifecycle and a second copy of `items`. The race guard belongs to the host's fetch layer (it passes
only the latest `items`).

- **Query:** `query?: string` + `onQueryChange?(query, reason: "input" | "reset")`. Uncontrolled = today (reset on
  close). Controlled: `query` wins every render; closing calls `onQueryChange("", "reset")`.
- **Filtering:** `filterItems?: boolean` (default `true` = today) → cmdk `shouldFilter`. With `false`: host items render
  as given, `match` is ignored, the empty state follows `items.length === 0` (our own row, not cmdk's count-based one).
- **States:** `loading?`, `error?: boolean | string`, `onRetry?`, `renderLoading?` / `renderError?`. Precedence loading >
  error > empty. Loading with items keeps the rows plus a loading row. The Retry button renders only with `onRetry` (no
  inert button). `aria-busy` on the list while loading. A polite live region announces `labels.resultsCount(n)` once,
  when loading settles while open (not per keystroke).
- **Pagination:** `hasMore?` + `onLoadMore?` + `loadingMore?`. A "Load more" row at the list end only when both of the
  first two are given.
- **Labels:** `labels?: Partial<EntityPickerLabels>` + `defaultEntityPickerLabels`: `searchPlaceholder`, `searchLabel`,
  `triggerPlaceholder`, `removeChip(label)`, `nothingToPick`, `noResults`, `loading`, `error`, `retry`, `loadMore`,
  `resultsCount(n)`. English defaults identical to today. `placeholder` / `triggerLabel` stay as deprecated aliases that
  win over their keys. `undefined` keeps a default.
- **Locale:** `locale?: string` → `defaultMatch` uses `toLocaleLowerCase(locale)`. No `locale` → today's
  `toLowerCase()`.
- **Bug:** kind badges derived from `items` ∪ `value`.
- **Docs:** rewrite the guide's async section and remove "deferred to v0.2" wording. Server-search demo (fake latency,
  loading, error + retry, load more). RTL demo tab. Meta features.
- **Tests (C11, all new):** `describeContract` (labels, controlled `query`, keyboard), `locale="tr"` matching,
  hydration, controlled query (host ignores input → input keeps host value), `filterItems={false}`, state precedence,
  live region settles once, Retry only with `onRetry`, kind-badge regression, RTL, axe. Falsify every fix.

### Invariants

| # | Invariant |
|---|---|
| I1 | no new props → today's markup, filtering, English text |
| I2 | selection is id-based; `onChange` fires only when the id set changes; chips render from `value` |
| I3 | uncontrolled query resets on close; Backspace-on-empty removes the last chip |
| I4 | no `asChild`; dual popover-width vars; logical classes; handle (focus/open/close/clear) unchanged |

### Size

30.3 KB / 35; estimate +4 KB → ~34–35. Budget → **40** (decided at U3 on the real number).

### Open questions (in the proposal)

1. Also ship a `useEntitySource({ load(query, page, signal) })` helper (abort + stale-response guard) as an optional
   feature item, or leave fetching to the host? Recommendation: leave it out unless they want it.
2. Pagination as a "Load more" row (recommended) vs infinite scroll.

## Parked

- content-composer `field-author-picker.tsx:136` single-var popover width (fix with content-composer's redesign).
- `ui/command.tsx` physical `pl-2!` (shadcn primitive; registry-wide pass).
- Selected items missing from current results can't be unticked in the list (chip remove works): `pinSelected`
  only on request.

### Platform reply (Part 3 run)

Platform reply `E:/tmp/social-ui-v2/PROUI_REPLY_2026-10-25_PART3.md`: scope signed off as proposed, including every breaking change. Release order: (1) story-viewer 0.5.4 → 0.6.0 · (2) media-editor 0.5.0 + story-composer 0.6.0 · (3) filter-bar 0.3.0 + entity-picker 0.2.0 · (4) post-card 0.6.0 + comment-thread 0.4.0 · (5) carousel-composer 0.3.0 (+ content-composer patch) · (6) app-sidebar 0.6.0, whenever convenient.

- No entity-picker-specific questions were asked; the contract stands as written (host-owned data, no `useEntitySource` helper, "Load more" row).

### Pre-U2 scope review (2026-10-25) — corrections

Source: `.claude/review-2026-10-25-part3-scope.md` (fresh Sonnet finder + architect). Where these lines differ from the text above, these win.

- No findings for this component.
