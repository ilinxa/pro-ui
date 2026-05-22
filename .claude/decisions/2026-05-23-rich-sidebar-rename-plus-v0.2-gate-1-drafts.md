---
date: 2026-05-23
session: rich-sidebar-rename-and-v0.2-gate-1
phase: planning
type: doc-only
commits:
  - 66072fd  # rename: sidebar-nav-01 → rich-sidebar
  - (this commit)  # pause state lock + GATE 1 drafts
components:
  - rich-sidebar
  - account-switcher-01 (new)
status: paused
---

# rich-sidebar renamed + v0.2.0 / account-switcher-01 GATE 1 description drafts (2026-05-23)

## Session arc

Two-phase session:

1. **Phase 1 — Hard rename `sidebar-nav-01` → `rich-sidebar`** (committed at `66072fd`, not pushed). Slug + sealed-folder + main file + 23 exported identifiers + procomp docs folder + registry.json + STATUS + component-versions + memory pins all renamed in a single commit via `git mv` + bulk find+replace + registry artifact regen. Validators all clean post-rename; dev server confirms `/components/rich-sidebar` → 200, `/components/sidebar-nav-01` → 404 (intended). Historical decision files (3 from the v0.1 ship) + the HANDOFF + the `social-nav-system/` migration intake folder kept under original `sidebar-nav-01` naming as historical record.

2. **Phase 2 — GATE 1 description drafts** for the two procomps the migration analysis identified as needed:
   - `account-switcher-01` v0.1.0 (NEW procomp) — popover-with-switchable-items primitive, generic for accounts/contexts/projects/sub-accounts.
   - `rich-sidebar` v0.2.0 (ADDITIVE addendum to v0.1 base description) — `topSlot` + `{key}` href templates + `ownerOnly` + `minMembers` + exported `NavContext` type + exported `useFilteredNavSections` helper hook. Zero breaking changes from v0.1.x.

## What landed in this commit

- Two GATE 1 description docs (~300 lines + ~330 lines).
- Self-revalidation pass on both — 9 findings caught + applied in-place (3 ⚠️ High prejudgments where locks contradicted Q-Ps; 6 🔸/🔹 wording/redundancy fixes).
- Cross-consistency check against the original source — 2 findings → "Improvements over source" appendices added to both docs (8 deliberate deviations in account-switcher-01, 7 in rich-sidebar v0.2.0).
- HANDOFF doc at [`.claude/HANDOFF-2026-05-23-rich-sidebar-rename-plus-v0.2-gate-1-drafts.md`](../HANDOFF-2026-05-23-rich-sidebar-rename-plus-v0.2-gate-1-drafts.md).
- This decision file.
- STATUS.md "Recent activity" pointer.
- Memory pin updates (rename of `project_sidebar_nav_01_in_flight.md` → `project_rich_sidebar_shipped.md` was committed in `66072fd`; this commit adds a new pin for the GATE 1 work).

## Why pause now

GATE 1 sign-off (the 7 + 6 Q-Ps) is a small synchronous human decision that the user prefers to handle in a fresh session. Pausing here avoids drift between drafts and sign-off. After sign-off, GATE 2 plan authoring begins (separate doc per procomp, file layout + commit chain + internal types + demo plan).

## Material decisions captured during this session (not blocking sign-off, just nice to record)

1. **Rename strategy: hard rename, drop sidebar-nav-01 entirely.** Single commit; no deprecation alias; the live registry artifact at `https://ilinxa-proui.vercel.app/r/sidebar-nav-01.json` will 404 after the next Vercel deploy. Acceptable because v0.1.x shipped only a day ago with no confirmed real consumers.

2. **Export rename: full** — every typed identifier (`SidebarNav01Trigger` → `RichSidebarTrigger`, `useSidebarNav01State` → `useRichSidebarState`, etc.) via a single broad `SidebarNav01` → `RichSidebar` substring replacement since every typed name shares the root prefix.

3. **Internal filenames stay** (`parts/sidebar-nav-row.tsx` etc. inside `rich-sidebar/`). The folder name is the public boundary; internal organization is consumer-invisible. Renaming would double the diff for zero API benefit.

4. **`account-switcher-01` as a separate procomp, NOT a slot recipe inside rich-sidebar.** Reused beyond sidebars (topbar pickers, settings switchers, command-palette adjacencies); cleanly owns the aria-combobox + collapsed-mode + width-matches-trigger quirks.

5. **`rich-sidebar` v0.2.0 is additive, not breaking.** Slug stays, exports stay, v0.1 props/behavior unchanged. Version bump per semver (minor for new public API additions). GATE 3 required (touches public API).

6. **`useNavContext` URL→context hook stays consumer-side** (Next-coupled, route-prefix-specific). Documented as a recipe in guide.md.

7. **`pinnedItems` dropped** (analysis revalidation F-04) — source uses array prepend; library doesn't need a separate API.

8. **Speculative SwitcherItem fields dropped** (`description`, `groupId`, `meta`, `triggerVariant`) — none in source, all v0.2+ candidates if real demand.

## Improvements over source — at-a-glance

### account-switcher-01 (8)

I-1 `fallbackActiveItem` (governance-mislabel fix) · I-2 empty-items defensiveness · I-3 key uniqueness guard · I-4 icon type widened · I-5 `aria-current="true"` · I-6 F-cross-13 pre-emption · I-7 collapsed-mode trigger · I-8 domain-agnostic + portable (zero auth/router imports).

### rich-sidebar v0.2.0 (7)

I-1 `{key}` arbitrary template syntax (source `{slug}` only) · I-2 `resolveHref` callback escape hatch · I-3 `bypassFiltering` explicit flag · I-4 pure helper hook (no store coupling) · I-5 raw scalar inputs (`isOwner`, `currentMaxMembers`) · I-6 exported `NavContext` discriminated union · I-7 no URL routing baked in.

## Open follow-ups (post-sign-off)

| Item | Linked finding | Target |
|---|---|---|
| GATE 2 plan for account-switcher-01 | — | After Q1–Q8 sign-off |
| GATE 2 plan for rich-sidebar v0.2.0 | — | After Q15–Q22 sign-off |
| Implementation commit chains for both procomps | — | After both GATE 2s |
| Push rename commit + GATE 1 + GATE 2 + impl | — | User decides when |
| `useNavContext` recipe in guide.md (Next.js + TanStack + plain location examples) | — | Folded into implementation |
| `MobileMenuSheet` composition recipe in guide.md | — | Folded into implementation |
| `validateNavContextConfig()` runtime helper | rich-sidebar Q22 | v0.3+ candidate (deferred) |

## What's NOT in this session

- No procomp code written (GATE 1 only).
- No GATE 2 plans (blocked on sign-off).
- No push to origin (multiple unpushed commits accumulated: rename + this state lock + earlier v0.1.1 hydration fix + v0.1.0 ship from the prior session).

## References

- [`.claude/HANDOFF-2026-05-23-rich-sidebar-rename-plus-v0.2-gate-1-drafts.md`](../HANDOFF-2026-05-23-rich-sidebar-rename-plus-v0.2-gate-1-drafts.md)
- [`docs/procomps/account-switcher-01-procomp/account-switcher-01-procomp-description.md`](../../docs/procomps/account-switcher-01-procomp/account-switcher-01-procomp-description.md)
- [`docs/procomps/rich-sidebar-procomp/rich-sidebar-procomp-description-v0.2.0.md`](../../docs/procomps/rich-sidebar-procomp/rich-sidebar-procomp-description-v0.2.0.md)
- [`docs/migrations/socialmedia-adv-nav-system/analysis.md`](../../docs/migrations/socialmedia-adv-nav-system/analysis.md) — the deep-dive analysis underpinning both descriptions
