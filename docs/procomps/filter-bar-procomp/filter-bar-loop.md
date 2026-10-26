# Loop state — `filter-bar` (U-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **minor with a migration note**: `onChange` stops firing on mount) |
| **Current stage** | **U2** — release 4 started 2026-10-26 on the user's go (with entity-picker) |
| **Sign-off policy** | user-interactive. Push: the user granted push-without-asking for each Part 3 release after a final consistency review (2026-10-25). |
| **Version target** | v0.2.1 → **v0.3.0** |
| **Model roster** | architect: main session · intake: 1 × Sonnet 5 (read-only) |
| **Started / updated** | 2026-10-25 / 2026-10-25 |

Source: request §5.3 FB1–FB5 (`E:/tmp/social-ui-v2/PROUI_HANDOFF.md:1034-1077`) as amended by the digest
(`.claude/hardening-request-verification-2026-10-23.md` §Part 3 "filter-bar").

## Stage checklist (U-loop)

- [x] U0 Intake — read-only intake agent (Sonnet 5) + architect verdicts (below)
- [x] U1 Change contract — **sign-off:** platform 2026-10-25 (`PROUI_REPLY_2026-10-25_PART3.md`); the user's go is given per release (order in the platform reply)
- [x] U2 Implement · [x] U3 Gates · [x] U4 Review · [x] U5 Runtime & smoke · [x] U6 Docs & review · [ ] U7 Ship

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

### Pre-U2 scope review (2026-10-25) — corrections

Source: `.claude/review-2026-10-25-part3-scope.md` (fresh Sonnet finder + architect). Where these lines differ from the text above, these win.

- The default date locale changing from the browser's language to `"en"` is listed in the **migration note** beside FB1 (not only a changelog line) and in the report-back. [F-15]

## U2 — Implement (release 4, started 2026-10-26 on the user's go)

One Sonnet 5 implementer per component, in parallel (filter-bar / entity-picker folders only); brief from the agent
template + this loop doc's U1 as the spec. Coordinator owns `registry.json`, `scripts/contract-baseline.json`,
CHANGELOG and the guide (written after the U4 fix wave, so docs describe the final code).

### U2 result (2026-10-26)
Implementer report verified by the coordinator (re-ran: folder vitest 2 files / **42 passed**, repo tsc 0). Every
contract item done; 15 fixes falsified (one equivalent mutation replaced — `cn` lets a later `justify-*` win). New
shipped files: `parts/date-range-calendar.tsx` (lazy), `hooks/use-direction.ts`. **Beyond the contract:** a public
`dir?: "ltr" | "rtl"` prop (the portalled popover / calendar don't inherit direction) — additive, wired, report it.
Owed F-01 closed: `react-day-picker` declared in meta (`date-fns` isn't imported by shipped files). `meta.related`
`filter-panel` exists. Coordinator: roster +2, baseline `intl` rows (4) removed, `filter-bar` → `closed`; guide's
version-pinned "v0.3:" lines reworded (inert gate); CHANGELOG 0.3.0.

### U3 — Gate battery (2026-10-26, both components)
tsc 0 · lint 0 errors · doc-budget 0 · build 0 (77 pages; 537 s on a memory-starved host). **registry:build 1** —
artifact-size: entity-picker 42.34 KB > 1.2 × 35 (budget decided after the fix wave, per U1). **tests 1** — 1999 passed
/ 1 failed: filter-bar "the calendar renders only after the popover opens" timed out under full-suite load (cold
dynamic import; passes in the folder run) → fix wave #10 (pre-warm the module).

### U4 — Adversarial review (fresh Sonnet finder on the frozen snapshot)
| # | Sev | Finding | Verdict |
|---|---|---|---|
| 1 | ⚠️ | `onChange` from a chip / date click during a pending debounce carries the old search; a late search-only call follows | CONFIRMED → flush pending search first |
| 2 | 🔸 | `debounceControlledSearch`: a host adopting commits late resets the input / drops a keystroke | CONFIRMED → pending-commit list |
| 3 | 🔸 | `timeZone` not passed to the calendar → picked day ≠ shown day | CONFIRMED |
| 4 | 🔸 | lazy calendar chunk failure throws to the app's error boundary | CONFIRMED → local boundary + Retry (labels) |
| 5 | 🔸 | usage/types say "the prop wins every render" with `debounceControlledSearch` | CONFIRMED (docs) |
| 6 | 🔸 | `labels={{ key: undefined }}` erases defaults | CONFIRMED |
| 7 | 🔹 | well-formed unsupported tag ("xx") silently uses the runtime locale | CONFIRMED |
| 8 | 🔹 | default time zone is the runtime's → SSR preset range can mismatch | DOC only (UTC default would shift days for everyone) |
| 9 | 🔹 | no StrictMode test for `emitInitialChange` | CONFIRMED (test) |
| 10 | 🔹 | `calendarLocale` / `dir` untested, demos don't pass `calendarLocale` | CONFIRMED |
| 11 | 🔹 | polite count region mounted with its content (first announcement lost) | CONFIRMED |
| 12 | 🔹 | meta omits `date-fns` | DROPPED — no shipped import; meta-deps validator agrees |
| 13 | 🔹 | pending debounce dropped on unmount | DROPPED — parked since U0, guide notes it |

### U4 fix wave (2026-10-26)
Sonnet implementer; all 11 CONFIRMED rows fixed, 10 mutations CAUGHT (the flake fix has none). Pending search is
flushed into the one `onChange` of a chip / date / clear interaction (internal `flushRef`, no new prop); unechoed-commit
list for late hosts (coordinator capped it at 10); `timeZone` → `<Calendar>`; new shipped
`parts/calendar-error-boundary.tsx` + label keys `calendarLoadErrorText` / `calendarRetryText` (Retry rebuilds the lazy
component); undefined labels keep defaults; `supportedLocalesOf` check; StrictMode, `dir`, `calendarLocale` tests;
count region always mounted (`empty:hidden`); FB4 module pre-warmed. Folder: 3 files / **57 passed**; tsc 0; eslint 0.
Sizes after the wave: **33.75 KB** (U1 estimate ~22) → budget 25 → **38**, rationale in `meta.ts`.

### U3 re-run after the fix wave (2026-10-26, both components)
tsc 0 · lint 0 errors / 11 warnings · `registry:build` 0 (budgets 38 / 50; filter-bar 33.75 KB, entity-picker 44.6 KB;
warn: filter-bar `date-fns` over-declared — kept, hosts import `date-fns/locale` for `calendarLocale`) · doc-budget 0 ·
build 0 (77 pages). Tests 2019 passed / 6 failed: 5 repo gate tests "timed out in 5000ms" (known load flake) — each
re-run alone: changelog / contract / cross-category-imports gates + filter-bar folder 6 files / 114 passed;
registry-deps + registry-tokens gates 2 files / 28 passed. The 6th was real fragility: filter-bar
`lazy-failure.test.tsx` re-import after Retry hit a cold module load → the test now pre-warms
`@/components/ui/calendar` (not the mocked part) and waits up to 20 s; passes.

### U5 — Browser finder (production build, Playwright Chromium, desktop + mobile)
PASS: nothing on load; one chip click sets category; "abc" then a chip within ~20 ms → `{ search: "abc", category }`
and nothing after 700 ms; calendar chunk: 0 requests before open, 1 new chunk on first open; 2 months; range pick →
"Oct 6 - Oct 11"; clear; Escape returns focus to the trigger; tr tab: "Ekim 2026" + Turkish weekdays, "1.234 items
found" grouped with `locale`; RTL: chips start at the right, popover + `.rdp-root` `dir=rtl`, Arabic month names,
Saturday first; `align` left/right computed `justify-content` incl. wrapped mobile rows; accessory at the inline end
with 56 px end padding; tab order input → accessory → chips → date; `aria-pressed` on Enter; light / dark contrast;
no console errors.
| # | Sev | Finding | Verdict |
|---|---|---|---|
| B3 | 🔹 | RTL mobile: Arabic weekday headers cramped in the two-month popover | PARKED — shared `Calendar` primitive styling, demo-visible only |
Not counted in the browser: `onChange` call counts (the demo has no readout; covered by unit tests).

### Final consistency review (pre-push, 2026-10-26)
- **Versions:** filter-bar 0.3.0 / entity-picker 0.2.0 on meta.ts, registry.json (base + fixtures), `public/r`,
  component-versions, CHANGELOG, STATUS, both guides.
- **Roster vs folder:** both — missing 0, extra 0 (filter-bar 10 files, entity-picker 17); fixtures ship `dummy-data.ts`.
- **Claims vs code:** fresh Sonnet doc verifier (read-only) over CHANGELOG, both guides, meta / usage / demo,
  registry.json and the report-back — 0 High, 3 Medium, 11 Low. Fixed: popover direction is read when the trigger mounts
  (docs said "each time it opens") → guide, `dir` JSDoc, report-back; the guide promised a `triggerRef` dev warning that
  doesn't exist (pre-existing) → removed; **the unstable-`items` dev warning never reset its counter, so server search
  (a new array per fetch) got "wrap with useMemo" after 6 fetches** → the check now runs every render, 2 tests, falsified;
  Pattern 1 / walkthrough used `placeholder` for trigger text (it's the search's) → `labels.*Placeholder`; `align` is
  logical (left = start); skeleton is one month on phones; `clear()` fires only with a selection; single mode has no chip;
  Pattern 6 imports; `role=search` is on the wrapper; `resultsCount(count, formatted)`.

### U5 — installs (2026-10-26)
4.18.0: `filter-bar` + `entity-picker` pass (tsc 0); both fixtures items pass. 3.8.5: `entity-picker` alone passes (tsc 0);
`filter-bar` then `entity-picker` fails — CLI 3.8.5 rewrote the consumer's `@tailwindcss/postcss` to `^9.14.0` while
adding filter-bar (all 13 filter-bar files written), so the next add hit `ERR_PNPM_NO_MATCHING_VERSION`: the known
upstream version-shuffle bug (memory: 4.6.0, fixed by 4.17), now also seen on 3.8.5; filter-bar's deps are unchanged
since 0.2.1. Reported to the platform with the check / workaround; filter-bar F-04 (trim the npm list, re-test). The
first 3.8.5 attempt timed out inside the consumer's own `pnpm install` (commit charge 58 / 70 GB).
