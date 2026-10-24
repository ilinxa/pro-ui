# Loop state — `info-list` (U-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **minor** — additive props; label constant renamed with an alias) |
| **Current stage** | U1 — change contract written; awaiting the user's sign-off (generic-set batch) |
| **Sign-off policy** | user-interactive (one sign-off for the five generic-set contracts) |
| **Version target** | v0.2.0 → **v0.3.0** |
| **Model roster** | architect: main session · implementer: 1 × Sonnet 5 (generic-set wave) · finder: 1 × Sonnet 5 (fresh, browser) |
| **Started / updated** | 2026-10-24 / 2026-10-24 |

## Stage checklist (U-loop)

- [x] U0 Intake — read-only intake agent (Sonnet 5) + architect verdicts (below)
- [ ] U1 Change contract — **sign-off:** pending
- [ ] U2 Implement · [ ] U3 Gates · [ ] U4 Review · [ ] U5 Runtime & smoke · [ ] U6 Docs & review · [ ] U7 Ship (ask before push)

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
