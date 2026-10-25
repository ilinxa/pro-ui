# Loop state — `share-bar` (U-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **minor** — additive target kind + labels; label constant renamed with an alias) |
| **Current stage** | U7 — shipping (release 1 of the generic set) |
| **Sign-off policy** | user-interactive (one sign-off for the five generic-set contracts) |
| **Version target** | v0.2.0 → **v0.3.0** |
| **Model roster** | architect: main session · implementer: 1 × Sonnet 5 (generic-set wave) · finders: 2 × Sonnet 5 (fresh — code; Chromium) |
| **Started / updated** | 2026-10-24 / 2026-10-25 |

## Stage checklist (U-loop)

- [x] U0 Intake — read-only intake agent (Sonnet 5) + architect verdicts (below)
- [x] U1 Change contract — **sign-off:** user, 2026-10-25 (platform reply `E:/tmp/social-ui-v2/PROUI_REPLY_2026-10-25_GENERIC_SET.md` accepted both open questions; user confirmed and authorized pushing without asking, after a final consistency review)
- [x] U2 Implement · [x] U3 Gates · [x] U4 Review · [x] U5 Runtime & smoke · [x] U6 Docs & review · [ ] U7 Ship (push authorized after a final consistency review)

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

## U2 — Implement (2026-10-25)

1 × Sonnet 5 implementer (generic-set wave; four siblings in parallel, each in its own folder). Coordinator: kit
`notApplicable` (`899597a`), `scripts/contract-baseline.json` `closed` += share-bar, `scripts/changelog-baseline.json`
row dropped, CHANGELOG bullet. Every U1 bullet and U0 fix landed (`__tests__/contract.test.tsx` +
`__tests__/hardening.test.tsx`). Registry roster unchanged (no shipped file added or removed).

**Falsified 18 / 18** — each fix reverted alone makes its test fail (scratchpad `falsify-share-bar*.mjs`): U0-1 ×2,
U0-2, U0-3, U0-4, U0-6, native-only-when-supported, `canShare` consulted, AbortError silent, `onShareError` wired,
`role="group"`, `labels.targets` used, C7 `hidden`, C7 `disabled`, and the four U4 fixes below (F1, F2, F13, F3).

## U3 — Gates (share-bar alone; the other four implementations held in `git stash`)

tsc 0 · lint 0 errors / 13 baseline warnings · validate-contract no new violations · registry:build 0 (after the
changelog-baseline row drop; inert-surfaces 64/64 clean; artifact-size 0 high) · doc-budget ok · tests **104 files /
1380 passed / 1 skipped** (3 repo tests first failed only because registry:build had stopped on the baseline row; re-run
2 files / 32 passed) · share-bar 33 + 1 skip (kit `controlled`, not applicable) · `next build` 0.

## U4 — Adversarial review (1 fresh Sonnet finder, code)

| id | sev | finding | verdict |
|---|---|---|---|
| F1 | High | `defaultShareBarLabels.targets.copy` made a 0.2.0 spread `{ ...SHARE_BAR_DEFAULT_LABELS, copyAria }` ignore `copyAria` (I1 regression) | CONFIRMED → fixed: `targets.copy` has no default; copy = `labels.targets.copy ?? copyAria`; test "a 0.2.0-style spread…" |
| F2 | Medium | double click while the native sheet is open → `InvalidStateError` → spurious `onShareError` | CONFIRMED → fixed: in-flight ref; test |
| F3 | Medium | kit keyboard check passed with Enter doing nothing | CONFIRMED → fixed: clipboard stubbed in kit `setup`, asserts the status text |
| F4 | Medium | native `hidden` test trivially true; no `disabled` native test; callbacks after unmount mid-share | test gap CONFIRMED → added disabled-native test (proves the native button renders where supported); callbacks after unmount DROPPED (a completed share is still a share — reporting it is correct) |
| F5 | Low | `console.error` assertion in the U0-4 test is vacuous on React 19 | DROPPED — the `setTimeout` count is the real assertion and falsification proves it |
| F6–F8 | Low | description item 4, guide exports sentence, plan snippets stale | CONFIRMED → fixed (plan carries a 0.3.0 superseded banner) |
| F9 / F10 | Low | `DEFAULT_ARIA` removed from `parts/icons.ts`; `ShareTarget` widened (exhaustive switches) | CONFIRMED → both stated in the CHANGELOG bullet |
| F11 | Low | `labels.heading: ""` gives an empty group name | DROPPED — an explicit empty string is the host's choice, same as every other label |
| F12 | Low | the fallback's error replaces the original `writeText` rejection in `onCopyError` | DROPPED — parked (debuggability only) |
| F13 | Low | a throwing `canShare` would crash the effect | CONFIRMED → fixed: try/catch, treated as unsupported; test |

## U5 — Runtime & smoke

- **Browser (fresh Sonnet finder, Chromium, production build on :3200) — 9 / 9:** names unchanged vs 0.2.0 and
  `title` = name; copy success / rejected-`writeText` fallback / double failure (alert) with resets; native with a
  stubbed `navigator.share` (after hydration, payload keys `url` + `title` only, abort silent, `onShareError` on
  `NotAllowedError`, double click during a 1.5 s share → 1 call, lock released) and without it (no button, no console
  output); Turkish tab no English; RTL row mirrors and Tab follows it; keyboard Enter / Space copy; axe clean on the
  component (demo `h4` heading order only → R-04); both themes. Zero console errors for the session.
- **Installs:** `INSTALL_TEST_ITEMS=share-bar,share-bar-fixtures pnpm test:install` — shadcn 3.8.5 + 4.18.0, every
  add exit 0, both items at 0.3.0, consumer tsc 0 → **2 / 2**.

## U6 — Docs & review

Docs current (description, plan banner, guide, usage, meta); CHANGELOG; `docs/component-versions.md` regenerated.
GATE 3: [`reviews/2026-10-25-v0.3.0-hardening.md`](reviews/2026-10-25-v0.3.0-hardening.md) — **Pass with follow-ups**
(R-01 real-device native sheet → platform at M8).
