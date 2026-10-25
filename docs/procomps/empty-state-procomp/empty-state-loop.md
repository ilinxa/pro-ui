# Loop state — `empty-state` (C-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | C-loop |
| **Current stage** | CLOSED — shipped v0.1.0, GATE 3 Pass with follow-ups (C8 complete 2026-08-12) |
| **Sign-off policy** | delegated by user (2026-08-12 directive: "create this loop system … and test and prove that is working" — pilot run authorized end-to-end) |
| **Version target** | v0.1.0 |
| **Model roster** | architect: main session · implementers: Sonnet 5 · finders: Sonnet 5 |
| **Started / updated** | 2026-08-12 / 2026-08-12 |

## Stage checklist

- [x] C0 Intake — roadmap: listed post-P4 candidate (STATUS.md). Overlap grep: no standalone match in manifest; `detail-panel` ships an internal `DetailPanelEmptyState` part (`parts/detail-panel-empty-state.tsx`) — relationship to be defined in description. Tier: pro-component. Compound rule: single-unit widget → EXEMPT. Category `feedback` exists. Peers: none new (`lucide-react` already repo-wide). Naming: `empty-state` noun-first, no `-NN` — canon-clean.
- [x] C1 Description — 3 self-adversarial findings (D-F1 scope cut, D-F2 DetailPanelEmptyState relationship, D-F3 hint→ReactNode) resolved in-doc. **Sign-off:** delegated (see Status)
- [x] C2 Plan — 5 findings (P-F1 asChild→buttonVariants, P-F2 SSR-safe reveal, P-F3 role=status matrix, P-F4 fixtures-as-single-source, P-F5 tw-animate-css portability — verified both precedents in-registry before deciding). Invariants I1–I6 + I-neg, blast radius, registry-item plan, size est. 15KB/20KB. **Sign-off:** delegated (see Status)
- [x] C3 Implement — 1 Sonnet 5 implementer (slices 1+2, 7 files, tsc 0 / lint 0 errors evidence in report); 3 reasoned deviations accepted (no-cva → undeclared-dep avoidance; `bg-primary/12` token form; createElement in .ts); coordinator spot-check read `empty-state.tsx` in full + caught fixtures item missing `"type"` in the agent's proposed registry JSON; coordinator applied manifest + registry.json edits (slice 3).
- [x] C4 Gate battery — all 7 gates green, numbers below.
- [x] C5 Adversarial review — 1 fresh Sonnet 5 finder → 3 findings; architect verdicts: 2 CONFIRMED code (F2 `action={false}` empty row; F3 media over-aria-hidden), 1 CONFIRMED doc-drift (F4 sm radius → plan sync); plus architect's own F1 (fill-mode flash) at C3. All fixed; battery re-run green (artifact 11.27KB/20KB).
- [x] C6 Runtime & smoke — production build + Playwright: **18/18** (incl. I2 0-interactive recheck post-fix, I3, I4 3×status, I5 6×h3, onClick, href-`<a>`, dark theme); consumer smoke (Base UI backend, real CLI, local artifact server): base + fixtures install pass, **consumer tsc 0** (re-run post-fix). Fixtures regDep needed temporary `@ilinxa`→localhost remap pre-deploy (documented in review; post-deploy re-check owed).
- [x] C7 Docs & GATE 3 — guide authored; roster diff clean; review at `reviews/2026-08-12-v0.1.0-spotcheck.md` → **Pass with follow-ups** (2 follow-ups, owners+targets set).
- [x] C8 Ship — STATUS row + count 63→64; decision file authored; `feat(empty-state)` commit; post-deploy spot-check owner: assistant, same session.

## Slice plan

| # | Slice | Owner | Status | Spot-check evidence |
|---|---|---|---|---|
| — | (set at C2) | | | |

## Invariants

(set at C2)

## Blast radius

(set at C2)

## Gate battery (C4) — run 2026-08-12 over combined tree (empty-state + blackboard patch; folder-disjoint diffs)

| Gate | Result |
|---|---|
| tsc | exit 0 |
| lint | 0 errors / 9 warnings (the 9 known pre-existing; none in empty-state) |
| meta-deps | 64 slugs — 64 clean, 0 findings |
| registry validators | whitelist 25 clean · registry-json 64 base + 2 feature + 52 aliases, 0 high / 6 warn (all 6 pre-existing: filter-bar ×2, rich-text-editor, post-card ×2, project-card) · naming 64 checked, 0 findings |
| doc validators | doc-drift failed pre-regen (count 63 vs 64, expected) → green after registry:build; doc-budget all ✓ |
| registry:build | full chain green; artifact-size 66 audited 0 high; **empty-state 10.96KB / 20KB budget** |
| build | Next production build exit 0, all routes compiled |

## Findings table (C5)

| # | Finding (failure scenario) | Source | Verdict | Evidence / refutation | Fix |
|---|---|---|---|---|---|
| F1 | Stagger flash: tw-animate-css `animate-in` defaults `animation-fill-mode` to `none` → delay-staggered elements render visible during delay, snap to opacity 0, animate back (flash per element) | architect (C3 spot-check, verified in `node_modules/tw-animate-css/dist/tw-animate.css` — `var(--tw-animation-fill-mode,none)`) | CONFIRMED | `empty-state.tsx` delayStyle | inline `animationFillMode: "both"` added pre-C4; battery re-run green |
| F2 | `action={isAdmin && {…}}` with false → `false` passes ReactNode type, escapes the null guard, `hasActions` true → empty actions row mounts (margin+gap+reveal) | finder (fresh Sonnet 5) | CONFIRMED | renderAction null-guard + `hasActions !== null` check | falsy boolean/`""` guard in `renderAction`; I2 re-verified live 0 interactive |
| F3 | Consumer passes meaningful illustration via `media` (plan's own example 3) → wrapper force-`aria-hidden` hides alt text from AT | finder | CONFIRMED | media branch `aria-hidden="true"`; plan a11y section authorized hiding tile/bloom/ring only | aria-hidden removed from media branch; contract documented in guide |
| F4 | Plan says `rounded-2xl` tile all sizes; code ships `rounded-xl` at sm | finder | CONFIRMED (doc-drift; code kept — proportionally correct at 48px) | `SIZE_TILE_CLASS.sm` | plan visual spec updated |

## Runtime & smoke evidence (C6)

- Docs site (production `next start` :8322 + Playwright): 18/18 — variant matrix (6 titles),
  I4 3×`role="status"`, I5 6×h3, Primary onClick logs, sizes ×3, read-only 0 interactive (I2),
  illustration svg present + tile absent (I3), href action renders styled `<a>`, dark theme via
  next-themes localStorage. Screenshots: `c6-variants-light.png` / `c6-variants-dark.png`
  (scratchpad, sent to user 2026-08-12).
- Install (Base UI consumer, real `shadcn@latest` CLI, local artifact server :8321): base 3 files
  → `src/components/empty-state/`; fixtures +dummy-data (after temporary `@ilinxa`→localhost
  namespace remap — deployed registry lacks the slug pre-push); consumer `tsc --noEmit` **0
  errors**, re-run after C5 fixes. Negative paths: read-only tab (handlers absent → zero
  button/a), base-without-fixtures compiles (fixtures truly optional).

## Slice results (C3)

| # | Slice | Owner | Status | Spot-check evidence |
|---|---|---|---|---|
| 1+2 | 7 component files | Sonnet 5 implementer | done | coordinator read `empty-state.tsx` in full; report's tsc/lint outputs verified by C4 re-run |
| 3 | manifest + registry.json | coordinator | done | fixtures `"type"` omission caught vs `page-hero-fixtures` reference before merge |

## Parked

(none yet)

## Pre-mortem (C8)

If this breaks for a consumer, it breaks because their Tailwind setup lacks tw-animate-css (the
entrance silently plays without enter-state → acceptable degradation, but the inline
fill-mode:both then keeps elements visible — no flash), or because the fixtures item's
`@ilinxa/empty-state` regDep is resolved before the Vercel deploy finishes (post-deploy re-check
owned in the review file).

---

## Run 2 — U-loop (0.1.0 → 0.2.0, social-platform hardening)

### Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **minor** — one additive prop; one defect fix in the disabled-link markup) |
| **Current stage** | **Closed** — 0.2.0 shipped (`c2f1d2d`) and verified live 2026-10-25 |
| **Sign-off policy** | user-interactive (one sign-off for the five generic-set contracts) |
| **Version target** | v0.1.0 → **v0.2.0** |
| **Model roster** | architect: main session · implementer: 1 × Sonnet 5 (generic-set wave) · finders: 2 × Sonnet 5 (fresh — code on a frozen snapshot; Chromium) |
| **Started / updated** | 2026-10-24 / 2026-10-25 |

### Stage checklist (U-loop)

- [x] U0 Intake — read-only intake agent (Sonnet 5) + architect verdicts (below)
- [x] U1 Change contract — **sign-off:** user, 2026-10-25 (platform reply `E:/tmp/social-ui-v2/PROUI_REPLY_2026-10-25_GENERIC_SET.md` accepted both open questions; user confirmed and authorized pushing without asking, after a final consistency review)
- [x] U2 Implement · [x] U3 Gates · [x] U4 Review · [x] U5 Runtime & smoke · [x] U6 Docs & review · [x] U7 Ship (pushed after a final consistency review; live-verified)

Source: request §4.7 ES1 (`E:/tmp/social-ui-v2/PROUI_HANDOFF.md:774-790`) as amended by the digest
(`.claude/hardening-request-verification-2026-10-23.md:148`).

### U0 — Intake

**Class: minor.** Additive `linkComponent`; no shipped dependents (imports only from the fixtures item). 0 contract-baseline
rows; not in `closed`. Built 11.37 KB / budget 20.

| Item | Code today | Verdict |
|---|---|---|
| ES1 `href` action renders a plain `<a>` (full page load in a client-routed app) | `empty-state.tsx:93-105` | confirmed |
| Digest: a ReactNode action already takes a host `<Link>` | `types.ts:279`, `empty-state.tsx:86-88` | confirmed — but the node is unstyled (`buttonVariants` isn't re-exported), and the object form (styled, `disabled`) has no router path → `linkComponent` is still worth it, additive |
| Request "tests per variant; `role="status"` only on transient variants; `animated={false}`; RTL; axe" | `TRANSIENT_VARIANTS` `:33-37`, roles `:161-162`, motion gates `:147-152`, `:187-189`; no tests, no RTL demo | owed |
| Request "all copy from the host, tokens only" | no string literals, token classes only | confirmed — so **no `labels` prop** (it would be an inert surface) |

**Also found:** U0-1 a disabled `href` action renders `<a aria-disabled>` with no `href` → no link role, read as plain text
(`:97-101`). U0-2 guide `:44` "None at v0.1.0 …" is version-pinned. Parked (not requested): `target` / `rel` on object
actions; per-action `hidden`; root `...rest` passthrough; `error` variant's `role="status"` (locked Q3).

### U1 — Change contract

- **ES1:** `linkComponent?: ElementType` (default `"a"`) renders object actions that have `href`, receiving `href`,
  `onClick`, `className` (`buttonVariants`) and the label as children. No `asChild`.
- **U0-1:** a disabled `href` action renders the same disabled `<Button>` the non-link path renders — never the
  `linkComponent` (a disabled link is not navigable; the button keeps `disabled` semantics).
- **Docs:** guide section for `linkComponent` + the ReactNode-link recipe; unpin `:44`; RTL demo tab; `usage.tsx` example.
- **Tests (C11):** the contract kit, with `labels` / `controlled` declared **not applicable** (reason recorded — see the
  kit change in the generic-set note below); per-variant render; `role="status"` only on search / error / offline;
  `animated={false}` emits no animation classes or delays; `linkComponent` receives `href` + children; disabled link →
  disabled button; RTL; axe.

#### Invariants

| # | Invariant |
|---|---|
| I1 | no `linkComponent` → today's markup byte-for-byte (except the disabled-link fix) |
| I2 | `linkComponent` renders every enabled `href` action with `href` + children + button styling |
| I3 | disabled `href` action = disabled button, `linkComponent` not called |
| I-neg | non-`href` actions and ReactNode actions untouched; `role="status"` only on transient variants |

#### Size

11.37 KB / 20 — no budget change.

### Generic-set note (shared tooling, coordinator-owned)

`tests/helpers/contract-kit.tsx` requires `labels`, `controlled` and `keyboard` specs. empty-state has no strings, no state
and no keyboard path of its own; four of the five generic-set components hold no controlled data. Change: each of those
three checks accepts `{ notApplicable: "<reason>" }` — the check then registers as a skipped test whose name carries the
reason (visible in every run), so an absent check is a recorded decision, never a silent omission. Existing callers
unchanged.

### U2 — Implement (2026-10-25)

1 × Sonnet 5 implementer (generic-set wave). Coordinator: `closed` += empty-state, changelog-baseline row dropped,
CHANGELOG bullet (states the disabled-link markup change); link class restored to `cn(buttonVariants(…))` so the
default markup is byte-identical to 0.1.0 (the implementer's tests asserted the raw `buttonVariants` string, which
differs for `outline` — corrected). Roster unchanged. **Falsified 4 / 4**: ES1 `linkComponent`, U0-1 disabled href →
Button, the `cn` parity, and the link keyboard path.

### U4 — Adversarial review (1 fresh Sonnet finder, code, frozen snapshot)

| id | sev | finding | verdict |
|---|---|---|---|
| F1 | Medium | docs named react-router as a drop-in `linkComponent`; its `Link` takes `to` | CONFIRMED → guide + JSDoc: `href`-based links as is, adapter recipe for `to` routers |
| F2 | Low | tests compared the class to raw `buttonVariants`, the code used `cn()` | CONFIRMED (baseline failed on `outline`) → tests assert `cn(buttonVariants(…))` = 0.1.0 |
| F3 | Low | no keyboard test on a link action | CONFIRMED → Tab + Enter test |
| F4 | Low | the disabled-link markup change only in docs | CONFIRMED → CHANGELOG states it (selectors for `a[aria-disabled]` stop matching) |
| F5 | Low | from a Server Component, `linkComponent` must be a client reference | CONFIRMED → guide sentence |
| F6 | Low | no `target` / `rel` on object actions | DROPPED — already disclosed "not implemented" (parked in U0) |


### U3 — Gates (release 2: people-grid + info-list + empty-state; category-cloud held in `git stash`)

tsc 0 · lint 0 errors · registry:build 0 (inert-surfaces clean; artifact-size 0 high) · doc-budget ok · tests **110 files /
1467 passed / 5 skipped** · empty-state 21 + 2 skips (kit `labels` + `controlled`, not applicable) · `next build` 0.

### U5 — Runtime & smoke

- **Browser (fresh Sonnet finder, Chromium, production build on :3200):** router-link tab: the action renders through the demo RouterLink, click logs `router.push("/compose")` with the URL unchanged; the disabled action is a `<button disabled>` skipped by Tab; without `linkComponent` a plain button-styled `<a href>`; `role="status"` only on search / error / offline; RTL mirrored; axe clean except the demo's muted hint (R-02). Zero console errors / warnings for
  the session (no `[info-list]` warning in production).
- **Installs:** `INSTALL_TEST_ITEMS=people-grid,people-grid-fixtures,info-list,info-list-fixtures,empty-state,empty-state-fixtures
  pnpm test:install` — shadcn 3.8.5 + 4.18.0, every add exit 0, empty-state + fixtures at 0.2.0, consumer tsc 0 → **2 / 2**.

### U6 — Docs & review

Docs current; CHANGELOG; `docs/component-versions.md` regenerated. GATE 3: [`reviews/2026-10-25-v0.2.0-hardening.md`](reviews/2026-10-25-v0.2.0-hardening.md) —
**Pass with follow-ups**.

### U7 — Ship

Final consistency review before push (user's condition): versions in `meta.ts`, `registry.json`, base + fixtures
`public/r`, `docs/component-versions.md`, CHANGELOG, STATUS all 0.2.0; roster = folder; review-file test counts
checked against the test files; `meta.ts` features match the code; commit holds release 2 only (category-cloud held
in `git stash`, its CRLF-rewritten `public/r` files reverted). Commit `c2f1d2d`, pushed. **Live 04:17:**
`https://ui.ilinxa.com/r/empty-state.json` 0.2.0 with the U4 fixes in the served source (`cn(buttonVariants(…))` parity, `linkComponent`); fixtures 0.2.0;
detail page 200. Report-back: `.claude/report-back-2026-10-25-generic-set-release-2.md`.
