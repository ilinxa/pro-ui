# Session pause — 2026-05-28

> **Locked & pushed.** Tip `82fe997` (= `origin/master`). Working tree clean. Resume any new work directly; nothing in-flight on this branch.

## What this session landed

Two commits this session, both pushed to master:

| SHA | Type | Subject |
|-----|------|---------|
| `42bf87d` | fix | post-card-01 v0.2.0 → v0.2.1 — list-thumb width shrink for narrow-container readability |
| `82fe997` | feat | docs-site `<SwipeTabsList>` wrapper + 39-demo sweep + ViewCode reposition |

Together with the 18 commits from the 2026-05-27 v0.2.0 ship that were also unpushed pre-session, **22 commits total were pushed** in one operation.

## Final state

- `post-card-01` at **v0.2.1** (visual-only patch on top of v0.2.0; no GATE 3 needed per readiness-review rule)
- `engagement-bar-01` at **v0.2.1** (was bumped during the 2026-05-27 main ship — sibling C0 + C10 patch)
- Versions reconcile across:
  - `src/registry/components/data/post-card-01/meta.ts` → `version: "0.2.1"`
  - `src/registry/components/data/engagement-bar-01/meta.ts` → `version: "0.2.1"`
  - `docs/component-versions.md` (stale rows synced this session)
  - `.claude/STATUS.md` Components table
- Decision files authored:
  - [`.claude/decisions/2026-05-27-post-card-01-v0.2.0-ship.md`](decisions/2026-05-27-post-card-01-v0.2.0-ship.md)
  - [`.claude/decisions/2026-05-27-engagement-bar-01-v0.2.0-likers-strip-share-menu-extraction.md`](decisions/2026-05-27-engagement-bar-01-v0.2.0-likers-strip-share-menu-extraction.md)
  - [`.claude/decisions/2026-05-28-post-card-01-v0.2.1-list-thumb-and-docs-swipe-tabs.md`](decisions/2026-05-28-post-card-01-v0.2.1-list-thumb-and-docs-swipe-tabs.md)
- `.claude/STATUS.md` Recent activity updated.
- Auto-memory updated: [project_post_card_01_v0_2_0_in_flight.md](file:///C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/project_post_card_01_v0_2_0_in_flight.md) (now reflects SHIPPED state, not IN_FLIGHT) + new [project_docs_site_swipe_tabs_list.md](file:///C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/project_docs_site_swipe_tabs_list.md).

## Verification at session close

```sh
git status                   # clean (only .claude/scheduled_tasks.lock untracked)
git rev-parse HEAD           # 82fe9971bd2f9883dfcd10a9a2ed2485f3d23384
git rev-parse origin/master  # same
pnpm tsc --noEmit            # exit 0
pnpm validate:meta-deps      # 49/49 clean, 0 findings
```

All green at session close. Re-run these on next-session open to confirm nothing drifted between sessions.

## Open follow-ups (NONE blocking)

From the 2026-05-27 v0.2.0 GATE 3 review — still applicable, none of them block any other work:

| # | Finding | Severity | Bump target |
|---|---------|----------|-------------|
| F-01 | Smoke harness post-push consumer-tsc run for `@ilinxa/post-card-01@0.2.1` | 🔹 Low | this branch (one-shot) |
| F-02 | Sub-export asymmetry — `SensitiveGate` + `LinkPreviewCard` not sub-exported | 🔹 Low | v0.2.2 |
| F-03 | Multi-select polls UI not implemented (single-vote rendered for both modes) | 🔸 Medium | v0.3 |
| F-04 | `closesAt` doesn't tick — cross-procomp relative-time hook | 🔹 Low | v0.3+ |
| F-05 | Hardcoded English aria-label in RepostOfCard | 🔹 Low | v0.2.2 |

## Active in-flight items (unrelated to this session — survive into next session)

- **cms-panel-01 GATE 1 description** — awaiting user sign-off + answers to 10 open questions. Handoff: [`HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md`](HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md). No code changes on master since that handoff was authored; safe to resume from it directly.

## Resume notes for fresh session

1. Read [`.claude/STATUS.md`](STATUS.md) — current snapshot + recent decision log.
2. Read [`project_post_card_01_v0_2_0_in_flight.md`](file:///C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/project_post_card_01_v0_2_0_in_flight.md) for the final shipped state of these procomps (name is historical — it now describes the SHIPPED state).
3. If continuing cms-panel-01: read its handoff above (pre-existing, unchanged).
4. If new procomp demo work: ALWAYS use `<SwipeTabsList>` from `@/components/site/swipe-tabs-list` instead of `<TabsList>`. Pattern docs at [`project_docs_site_swipe_tabs_list.md`](file:///C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/project_docs_site_swipe_tabs_list.md).
5. If continuing post-card-01: GATE 3 follow-ups F-02 / F-05 are good v0.2.2 candidates; F-04 is a v0.3+ cross-procomp candidate (would also touch comment-thread-01).

## Session-specific learnings worth surfacing

- **Don't use `tab.offsetLeft` for scroll snap math.** The offsetParent chains up to <body> if no ancestor is `position: relative`, producing body-coordinate numbers that have nothing to do with `scrollLeft`. Use `getBoundingClientRect` with the scroll container's rect as a reference — viewport-relative, robust to positioning context. Cost an iteration of "scroll snap not working" in the docs SwipeTabsList build.
- **Tab strips with `flex-1` children compete for container width; tabs at natural width need `flex-none`.** Discovered while debugging 13-tab post-card-01 demo strip. shadcn's `TabsTrigger` ships `flex-1` baked in, so any "swipe scroll" attempt with overflow-x-auto fails because total = container width = no overflow. Override with `[&>button]:flex-none` to let triggers take natural content width.

(Both also captured in the SwipeTabsList memory file.)
