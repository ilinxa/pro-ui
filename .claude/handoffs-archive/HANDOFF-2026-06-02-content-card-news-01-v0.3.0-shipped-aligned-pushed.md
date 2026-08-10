# HANDOFF — 2026-06-02 content-card-news-01 v0.3.0 SHIPPED + ALIGNED + PUSHED

> **Session-close handoff for fresh-chat resume.** Read this top-to-bottom before doing anything else.

## State at session close

- **Branch:** `master` · **Tip:** `f8c094f` · **Working tree:** clean · **Ahead of origin:** 0 (pushed)
- **Latest 3 commits:**
  ```
  f8c094f docs(content-card-news-01): v0.3.0 align docs + meta + registry with 8-commit post-ship polish arc
  9eab176 design(content-card-news-01): v0.3.0 split badges — state overlay vs curation kicker
  444b9db polish(content-card-news-01): v0.3.0 editorial badge stack — uniform shape, saturation hierarchy
  ```
- **All gates green:** `pnpm tsc --noEmit` clean · `pnpm lint` clean for slug · `pnpm validate:meta-deps` clean · `pnpm registry:build` clean (24 files in artifact = 24 source files on disk)

## What shipped — content-card-news-01 v0.3.0 (10 commits)

### Initial feat (`7b67bae`) — A+ backend-shaped editorial features

12-commit implementation chain (C1–C12) mirroring post-card-01 v0.3.2's trait set into editorial vocabulary. 14 A+ traits:

1. `viewerMode: "editor" | "viewer"` opt-in two-mode toggle
2. 19-capability `ContentCardPermissions` matrix (12 editor + 2 host-policy + 4 reader + 1 moderator)
3. `canPerformAction(action, item)` universal predicate
4. Moderator section (orthogonal `canModerate` + `moderatorActions` slot)
5. 16 mutation handlers (12 editor + 4 reader) separate from engagement
6. Kebab system (defaults + role-aware + moderator group + full takeover)
7. Paywall gate (post-ship: media-only scope; preview substitutes for excerpt)
8. Sensitive content gate (post-ship: `compact` prop for small variant)
9. Editorial badge stack (post-ship: uniform shape + saturation hierarchy + state/curation placement split)
10. Quoted-article recursive mini-card (post-ship: variant=small + all gates suppressed)
11. Light engagement counts with `renderEngagementCounts` slot for engagement-bar-01 detail-page composition
12. 11-method imperative handle
13. Per-variant feature matrix (small trims to highest-priority badge + sensitive gate only)
14. Backward-compat — zero v0.2.x consumer break (drop-in test verified)

**13 new files** (2 lib + 11 parts); **12 edited** (5 variant parts + root + types + index + meta + dummy + demo + format-default + registry.json).

### 8-commit post-ship polish arc

All post-ship fixes ran between GATE 3 spotcheck and push. The push happened on top of `9eab176`, then the docs-alignment commit `f8c094f` brought all docs in sync.

| Commit | Type | What |
|---|---|---|
| `02a255f` | fix | Small sensitive-gate overflow — added `compact: boolean` to `ContentSensitiveGate` (heading + warnings dropped, 44px button → 24px "Show" pill, fits 96×96 thumb). Plan Q-P34 amended. |
| `b5bb2fa` | fix | Small article stretch — added `items-start` to article (default `align-items: stretch` was pulling thumb gate vertically in grid rows). Demo sensitive tab: `grid-cols-2` → `space-y-6`. Plan Q-P34b added. |
| `7000a21` | fix | Quoted-article inner variant medium → small + suppressed paywall + sensitive + chrome flattened via className. Demo quoted tab: `grid-cols-2` → `space-y-6`. Plan Q-P32 amended. |
| `b9c5447` | fix | **Paywall scope correction (load-bearing).** Original impl wrapped entire card body, causing `paywall.preview` to overlap badges + whole card blurred. Restructured: gate covers media only; preview substitutes for excerpt in body. All 4 variants refactored. Plan Q-P33 amended. |
| `3ddbb7a` | fix | Medium badge stack `left-2` → `right-2 max-w-[75%] flex-wrap justify-end` (was colliding with category chip at `left-4`). Plan Q-P42c added. |
| `558954c` | fix | QuotedArticleCard inner: added `disableBadgesRender` (EXCLUSIVE badge was overlapping title in compact preview). |
| `444b9db` | polish | Badge uniform shape `BADGE_BASE` const + saturation hierarchy (vivid Breaking/Live → accent Exclusive/Featured → subtle Pinned/Sponsored/Status). SponsorBadge + StatusBadge aligned. |
| `9eab176` | design | **Badge placement split.** `NewsBadges` gains `group: "all" \| "state" \| "curation"`. Medium variant renders TWO instances: state at top-right overlay + curation as kicker above title (newspaper convention). Description Q-PC2 added; Plan Q-P42b added. |

**All 8 strictly additive** — `compact` and `group` are new optional props; paywall scope is a bug fix; badge style is purely visual. Drop-in test re-verified post-fixes.

### Docs alignment (`f8c094f`)

Files updated to reflect post-ship state:
- `description-v0.3.0.md` — §1.1 / §3.1 / §3.2 paywall scope; Q-PG addendum; Q-PC2 added
- `plan-v0.3.0.md` — Q-P32 / Q-P33 / Q-P34 amended; Q-P34b / Q-P42b / Q-P42c added
- `meta.ts` — description + 4 feature bullets reworded
- `registry.json` — root description aligned
- `guide.md` — Paywall + Sensitive (compact mode) + Badges (group prop + split + uniform shape) + Quoted (variant=small pattern) sections rewritten with code examples
- `reviews/2026-06-02-v0.3.0-spotcheck.md` — Post-ship findings-closed section appended
- `decisions/2026-06-02-content-card-news-01-v0.3.0-backend-shaped-editorial-features.md` — Per-commit detail appended
- `STATUS.md` + `component-versions.md` — refined to call out the polish arc

Registry artifacts regenerated via `pnpm registry:build`.

## Vercel auto-deploy + smoke harness next step

`pnpm vercel-build` (= `shadcn build && next build`) runs on each deploy. v0.3.0 should become installable via:
```sh
pnpm dlx shadcn@latest add @ilinxa/content-card-news-01
```

**Remaining open from GATE 3 review:**
- **F-01 (Med, v0.3.1)** — post-push smoke harness path-b consumer-tsc. Run after Vercel deploys. Expected next failure mode per `project_smoke_harness` + 4 consecutive prior ships: F-cross-13 sub-traps against `dropdown-menu` (defensive `<DropdownMenuTrigger>` direct-child pattern was pre-wired in `parts/news-kebab.tsx` per the memory's locked guidance — should minimize patch surface, but verify).
- **F-02 (Low, v0.3.1)** — Live badge + LiveUpdateLine double pulsing dot.
- **F-04 (Low, v0.4)** — `openKebab` handle method is a no-op stub.
- **F-03** — formally closed via Q-PC2 split.

**Smoke command (from fresh chat):**
```sh
cd e:/tmp/ilinxa-smoke-consumer && pnpm dlx shadcn@4.6.0 add @ilinxa/content-card-news-01 && pnpm tsc --noEmit
```

## Decision-file pointer

[`/.claude/decisions/2026-06-02-content-card-news-01-v0.3.0-backend-shaped-editorial-features.md`](decisions/2026-06-02-content-card-news-01-v0.3.0-backend-shaped-editorial-features.md) — full per-commit detail of the polish arc, all the locked Q-P amendments, and the next-steps roadmap.

## Open queue beyond this slug

Per STATUS.md Active queue:
- `rich-graph-2` (no GATE 1 yet)
- `chat-panel` (no GATE 1 yet)
- `notification-system` (no GATE 1 yet — also Layer 0 dep for `cms-panel-01`)

Concurrent in-flight (untouched this session):
- `cms-panel-01` GATE 1 awaiting sign-off — see [`HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md`](HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md)

Sibling queued: `related-articles-ribbon-01` (added 2026-06-02 alongside content-card-news-01 v0.3.0 description sign-off — stacks under a news card on detail pages).

## Resume checklist for fresh chat

1. Read this handoff.
2. Read [STATUS.md](STATUS.md) — current Active handoff banner points here; Recent activity expanded with polish-arc summary.
3. Read auto-memory at `C:\Users\AsiaData\.claude\projects\e--2026-ilinxaDOC-ilinxa-ui-pro\memory\` (MEMORY.md index → topic file `project_content_card_news_01_v0_3_0_shipped_arc.md` next session).
4. If smoke harness was the next action: run the command above, surface any F-cross-13 sub-traps as v0.3.1 patch.
5. Otherwise: pick from active queue (rich-graph-2 / chat-panel / notification-system) or resume `cms-panel-01` GATE 1.

## Verification at session close

| Check | Result |
|---|---|
| `git status` | clean |
| `git log origin/master..HEAD` | empty (= pushed) |
| `pnpm tsc --noEmit` | clean |
| `pnpm lint` for slug | clean |
| `pnpm validate:meta-deps` for slug | clean |
| `pnpm registry:build` | clean (24 files in artifact) |
| Manual registry-roster audit | 24 disk = 24 artifact (clean) |
| Description + plan + meta + guide + registry + GATE 3 + STATUS + decision file + component-versions | all aligned with post-ship state per the alignment audit |

## Session-close lessons (worth preserving in memory)

1. **Post-ship visual review surfaces real design bugs that GATE 3 + tsc/lint/build don't catch.** Out of 8 fixes, 4 were genuine spec-correction (paywall scope, badge placement collision, quoted preview compact, sensitive gate fit). Only 2 were polish (uniform shape, saturation hierarchy) and 2 were design refinements (badge split, quoted variant=small). The post-ship visual review is now a de-facto gate.

2. **Don't pair variants with wildly different natural heights in `grid-cols-N`.** The medium + small sensitive demo and medium + list quoted demo both broke because of `align-items: stretch`. Default to `space-y-N` stacking when variants differ in height.

3. **Recursive nested ContentCardNews01 must suppress all its own gates.** A paywalled or sensitive article quoted as a citation should NEVER render its own paywall/sensitive in the compact preview — the quote is a CITATION, not the content itself. `disableBadgesRender` + `disablePaywallGate` + `disableSensitiveGate` + `disableEngagementCounts` + `disableQuotedRender` is the recursion-strip recipe.

4. **Gate scope = "what content the gate covers"** — must be carefully designed per variant. The original v0.3.0 paywall impl wrapped everything because `paywallContent` was the entire card body. The fix split each variant into "gated portion" + "always-visible portion" (title + author + footer).

5. **Editorial badge categories want different positions.** State indicators (urgency/admin) belong as overlay on the image; curation labels (Exclusive/Featured) belong as kicker above title (newspaper convention). Mixing them in one stack creates visual conflict and dilutes both. The `group` prop pattern lets variants opt into the split selectively.

6. **Doc-alignment commit is part of the ship, not optional.** When 8 post-ship commits modify behavior, the description / plan / meta / guide / registry / GATE 3 review / STATUS / decision file all need explicit amendments. Letting docs drift between "what GATE 3 reviewed" and "what was pushed" creates trust-gap with consumers.

7. **`shrink-0` matters when wrapping content inside a flex container.** Multiple badge wrappers needed it. Easy to forget when authoring components that consumers might place in flex rows.

8. **The 4-ship `ship → smoke → patch → re-smoke clean` pattern is now the EXPECTED post-push trajectory** for any new procomp introducing a shadcn primitive (this ship added `dropdown-menu` for the kebab). F-cross-13 defensive `<DropdownMenuTrigger>` direct-child pattern was pre-wired but the smoke pass is still load-bearing.

---

**Frozen at:** 2026-06-02 — content-card-news-01 v0.3.0 SHIPPED + ALIGNED + PUSHED on `master` at `f8c094f`. Resume from this handoff or run the smoke harness next.
