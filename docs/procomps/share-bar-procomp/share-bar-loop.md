# Loop state — `share-bar` (U-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **minor** — additive target kind + labels; label constant renamed with an alias) |
| **Current stage** | U2 — implementing (generic-set wave; release order share-bar → people-grid / info-list / empty-state → category-cloud) |
| **Sign-off policy** | user-interactive (one sign-off for the five generic-set contracts) |
| **Version target** | v0.2.0 → **v0.3.0** |
| **Model roster** | architect: main session · implementer: 1 × Sonnet 5 (generic-set wave) · finder: 1 × Sonnet 5 (fresh, browser) |
| **Started / updated** | 2026-10-24 / 2026-10-25 |

## Stage checklist (U-loop)

- [x] U0 Intake — read-only intake agent (Sonnet 5) + architect verdicts (below)
- [x] U1 Change contract — **sign-off:** user, 2026-10-25 (platform reply `E:/tmp/social-ui-v2/PROUI_REPLY_2026-10-25_GENERIC_SET.md` accepted both open questions; user confirmed and authorized pushing without asking, after a final consistency review)
- [ ] U2 Implement · [ ] U3 Gates · [ ] U4 Review · [ ] U5 Runtime & smoke · [ ] U6 Docs & review · [ ] U7 Ship (push authorized after a final consistency review)

Source: request §4.9 SB1 (`E:/tmp/social-ui-v2/PROUI_HANDOFF.md:807-823`) as amended by the digest
(`.claude/hardening-request-verification-2026-10-23.md:150-151`).

## U0 — Intake

**Class: minor.** No dependents (no imports; `related` strings only). 0 contract-baseline rows; not in `closed`. Built
18.01 KB / budget 25.

| Item | Code today | Verdict |
|---|---|---|
| SB1 no native share | no `navigator.share` anywhere; targets = intents + copy (`share-bar.tsx:83-117`) | confirmed |
| Digest: native as a target kind vs the guide's `useNativeShare` | `useNativeShare` exists only in docs (guide `:231`, plan `:559`, description `:29,:172`) as a "v0.2" promise — the component is 0.2.0 | **target kind** (composes with the ordered `targets`, per-target icon / label; the request's accept line); the stale promise is removed |
| Digest: 9 English per-platform names outside `labels` | `parts/icons.ts:29-40` `DEFAULT_ARIA`, used for `aria-label` + `title` (`share-button.tsx:35-39,53-54`); only per-target `ariaLabel` reaches them | confirmed — the gate can't see object-map strings |
| Digest: `aria-labelledby` on a role-less `<div>` | `share-bar.tsx:133-136`; with no heading the bar has no name at all | confirmed |
| "Labels renamed under R2" | still `SHARE_BAR_DEFAULT_LABELS` (`types.ts:62`) | not done |

**Also found:** U0-1 labels merge lets `undefined` erase a default (`:56`). U0-2 `writeText` **rejecting** (iframe
permissions policy, unfocused document) skips the `execCommand` fallback — the guide promises a fallback chain
(`:13-16`). U0-3 fallback textarea not `readonly` (iOS keyboard flash). U0-4 copy result after unmount re-arms the reset
timer → state update on an unmounted component (`:62-69,87-91`). U0-5 guide false / pinned: `aria-live="alert"` (it is
`role="alert"`), "tree-shakable templates" (one object), `onShare` "after a successful open" (unknowable with
`noopener`), "v0.2 candidates", "direction prop in v0.2", "in v0.1". U0-6 two `copy` targets share a React key and one
copied-state. Parked: per-target copied state; controlled `copied`; `errorResetMs` split (owed F-02 → JSDoc only).

## U1 — Change contract

- **SB1:** target `{ kind: "native"; icon?; ariaLabel? }` (a separate union member — `ShareKind` keys the templates and
  stays as is). Rendered only after mount, when `navigator.share` exists and `navigator.canShare` (if present) accepts
  `{ url, title, text }` (undefined keys dropped) — no native button in server HTML. The click calls `share` without
  awaiting anything first (user activation). Success → `onShare("native")`; `AbortError` → silent; other rejections →
  new `onShareError?(error, kind)`.
- **Labels (C2):** `defaultShareBarLabels` (+ deprecated `SHARE_BAR_DEFAULT_LABELS` alias); per-key merge skipping
  `undefined`; `labels.targets?: Partial<Record<kind, string>>` for every platform name, copy and native (defaults = today's
  English strings, so output is unchanged); per-target `ariaLabel` still wins; `title` = the same string.
- **Name:** the bar is `role="group"` named by its heading, else by `labels.heading`.
- **C7:** `disabled?` / `hidden?` on every target.
- **Fixes:** U0-2 rejected `writeText` → `execCommand` fallback; U0-3 readonly textarea; U0-4 unmount guard; U0-6 keys
  by position. **Docs:** U0-5 corrected and unpinned; RTL demo tab; native demo (renders only where supported).
- **Tests (C11):** kit (`controlled` not applicable; keyboard = Tab + Enter on copy); native (stubbed: renders after
  mount and calls `share` with the URL; absent → never rendered; server HTML has none; abort silent; other errors →
  `onShareError`); copy success / failure live-region text; `writeText` rejection → fallback; intents open the template
  URL; labels with `undefined`; Turkish `labels.targets` → no English; RTL; axe.

### Invariants

| # | Invariant |
|---|---|
| I1 | no native target, no `labels` → today's visible output and names (English platform names unchanged) |
| I2 | native button only after mount and only when supported; abort is not an error |
| I3 | copy falls back to `execCommand` when `writeText` rejects |
| I-neg | intents unchanged; `custom` targets unchanged |

### Size

18.01 KB / 25 — estimate +3–4 KB → within budget.
