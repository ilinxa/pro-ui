# Loop state — `filter-bar` (U-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **minor with a migration note**: `onChange` stops firing on mount) |
| **Current stage** | U1 — **awaiting sign-off** (Part 3 proposal) |
| **Sign-off policy** | user-interactive. Ask before every push. |
| **Version target** | v0.2.1 → **v0.3.0** |
| **Model roster** | architect: main session · intake: 1 × Sonnet 5 (read-only) |
| **Started / updated** | 2026-10-25 / 2026-10-25 |

Source: request §5.3 FB1–FB5 (`E:/tmp/social-ui-v2/PROUI_HANDOFF.md:1034-1077`) as amended by the digest
(`.claude/hardening-request-verification-2026-10-23.md` §Part 3 "filter-bar").

## Stage checklist (U-loop)

- [x] U0 Intake — read-only intake agent (Sonnet 5) + architect verdicts (below)
- [ ] U1 Change contract — sign-off: pending
- [ ] U2 Implement · [ ] U3 Gates · [ ] U4 Review · [ ] U5 Runtime & smoke · [ ] U6 Docs & review · [ ] U7 Ship

## U0 — Intake

**Class: minor + migration note.** No code dependents (`filter-bar-fixtures` and the `filter-bar-01` alias only;
magazine-layout takes it through a `filterBar` slot and doesn't import it). No feature slices. Not in `closed`. Baseline:
4 `intl` rows, all in `lib/format-default.ts` (module-scope `Intl.DateTimeFormat(undefined, …)`). **No `__tests__/`.**
Built 18.4 KB / budget 25. Only review is the v0.1.0 spotcheck (F-01 meta vs registry deps divergence still live).

| Item | Code today | Verdict |
|---|---|---|
| FB1 `onChange` from an effect | `filter-bar.tsx:117-122` effect on `[search, category, dateRange, onChange]`, comment: fires on mount on purpose; guide `:106-118` documents it | confirmed, **wider:** it also re-fires when `onChange` changes identity (an inline arrow that sets parent state loops) and when a controlled prop changes from outside (URL, refetch) |
| FB1 (digest) controlled mode ignores debounce | `parts/search-input.tsx` debounces only when uncontrolled; `searchDebounceMs` documented as uncontrolled-only | confirmed |
| FB2 locale | module-scope formatters with `undefined` locale (`lib/format-default.ts:7,12`); no `locale` / `timeZone` prop; `<Calendar>` gets no `locale` (`parts/date-range-picker.tsx`) though `ui/calendar.tsx` accepts one | confirmed |
| FB2 (digest) "1 items found" | default `` `${count} items found` `` (`types.ts:85`) | confirmed |
| FB3 physical classes | `start-4` / `ps-12` (R6, `72263e0`) | already fixed |
| FB3 (digest) `align` | chips row hard-codes `justify-center` (`filter-bar.tsx:147`, `parts/chip-row.tsx:31`), so wrapped chip lines stay centred under `left` / `right` | confirmed (half-works) |
| FB4 Calendar always in the bundle | static import in `date-range-picker.tsx:5`; `hideDateRange` only gates JSX; item ships `calendar`, `react-day-picker`, `date-fns` | confirmed |
| FB5 `searchAccessory` | no slot | confirmed |

**Who relies on the mount fire:** no in-repo runtime consumer. Outside hosts that followed the guide's skip-first-call
ref would drop the first real change after the fix; hosts that seeded state from the mount call get nothing until the
first interaction. Hence the migration note and the `emitInitialChange` escape.

## U1 — Change contract (proposed)

- **FB1:** remove the effect. `onChange` fires from the three user handlers only, with the merged next value: one call
  per interaction, nothing on mount, nothing when `onChange`'s identity changes, nothing when a controlled prop changes
  from outside. `emitInitialChange?: boolean` (default `false`) fires once on mount for hosts that want the old start.
  Uncontrolled search: one `onChange` per debounced commit.
- **FB1 controlled debounce:** `debounceControlledSearch?: boolean` (default `false` = today). When on, the input keeps a
  local echo, commits after `searchDebounceMs`, and resyncs when the controlled value differs from the last commit
  (structural resync guard). The prop still wins every render.
- **FB2:** `locale?: string` (default `"en"`, invalid → `"en"`) and `timeZone?: string`. Formatters built in the
  component (`useMemo`), so the 4 baseline rows go. `formatDate` / `formatDateRange` overrides unchanged.
  `calendarLocale?` (a react-day-picker / date-fns `Locale` the host imports) is forwarded to `<Calendar>` with `dir`.
  We don't bundle date-fns locales. Default count text: "1 item found" / "{n} items found" by `Intl.PluralRules`.
  **Changelog note:** a browser whose default locale isn't English used to see its own date format; it now sees `en`
  unless `locale` is passed (the hydration fix).
- **FB3:** `align` drives `justify-start | center | end` on both rows (logical in a flex row). Default `center`
  unchanged.
- **FB4 (recommended): `React.lazy` calendar.** The `<Calendar>` body moves to `parts/date-range-calendar.tsx`, lazily
  imported inside the popover with a two-month skeleton fallback. The calendar code loads only when the popover opens;
  `hideDateRange` never loads it. The installed tree is unchanged (the request's "item no longer lists calendar" is
  not met). The alternative, a `filter-bar-date-range` feature item, removes the deps from the base but breaks the
  default picker and leaves an orphan `parts/date-range-picker.tsx` in every existing install. Question 2.
- **FB5:** `searchAccessory?: ReactNode` at the inline end of the field, after the input in tab order. The input gets
  end padding only when an accessory is passed.
- **Owed:** v0.1.0 F-01 (declare `react-day-picker` / `date-fns` in `meta.ts`); rewrite the guide's mount-fire gotcha
  as a migration note.
- **Docs + tests (C11, all new):** `describeContract` (labels, controlled, keyboard), `locale="tr"` + hydration, FB1
  (mount = 0 calls, identity change = 0, one chip click = 1, `emitInitialChange` = 1, external controlled change = 0),
  debounce, align, lazy boundary (no static calendar import from the entry graph), accessory tab order, RTL demo, axe.

### Invariants

| # | Invariant |
|---|---|
| I1 | controlled pairs win every render; per-control `onSearchChange` / `onCategoryChange` / `onDateRangeChange` keep firing |
| I2 | uncontrolled search debounces 250 ms; "All" chip = `null`; chips keep `aria-pressed` |
| I3 | `role="search"`, the chip `role="group"`, the polite count region; no `asChild` on the popover trigger |
| I4 | default `align="center"` and default labels (except the plural fix) |

### Size

18.4 KB / 25; estimate +3.4 KB → ~22. Fits.

### Open questions (in the proposal)

1. Drop the on-mount `onChange` (with `emitInitialChange` as the escape)? Recommended, the request asks for it.
2. Calendar: lazy-loaded (recommended), or removed from the install through an add-on (breaks today's default picker)?
3. Format large counts ("1,234 items") with `Intl.NumberFormat`? Recommendation: only when `locale` is passed.

## Parked

- Controlled → uncontrolled switch leaves a stale `SearchInput` seed (`search-input.tsx`).
- Pending debounce dropped on unmount, no flush on Enter.
- `meta.related` lists `filter-panel`: check the slug exists.

### Platform reply (Part 3 run)

Platform reply `E:/tmp/social-ui-v2/PROUI_REPLY_2026-10-25_PART3.md`: scope signed off as proposed, including every breaking change. Release order: (1) story-viewer 0.5.4 → 0.6.0 · (2) media-editor 0.5.0 + story-composer 0.6.0 · (3) filter-bar 0.3.0 + entity-picker 0.2.0 · (4) post-card 0.6.0 + comment-thread 0.4.0 · (5) carousel-composer 0.3.0 (+ content-composer patch) · (6) app-sidebar 0.6.0, whenever convenient.

- Calendar: **lazy-loading is enough**; the date picker stays in the default bar (no feature item).
- Mount-fire removal (with `emitInitialChange`) and count formatting only with `locale`: not contested → as recommended.
