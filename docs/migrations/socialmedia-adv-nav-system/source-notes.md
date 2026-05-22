# Source notes — socialmedia-adv-nav-system migration

## Source repository

`E:\2026\socialmedia_adv_app\socialmedia_adv_app_v1\frontend\src`

## What was copied into `original/`

| Path in source | Path in intake |
|---|---|
| `components/navigation/AccountSwitcher.tsx` | `original/components/AccountSwitcher.tsx` |
| `components/navigation/BottomNavbar.tsx` | `original/components/BottomNavbar.tsx` |
| `components/navigation/MobileMenuSheet.tsx` | `original/components/MobileMenuSheet.tsx` |
| `components/navigation/NavItem.tsx` | `original/components/NavItem.tsx` |
| `components/navigation/Sidebar.tsx` | `original/components/Sidebar.tsx` |
| `components/navigation/SidebarNav.tsx` | `original/components/SidebarNav.tsx` |
| `components/navigation/Topbar.tsx` | `original/components/Topbar.tsx` |
| `components/navigation/UserMenu.tsx` | `original/components/UserMenu.tsx` |
| `components/navigation/index.ts` | `original/components/index.ts` |
| `hooks/use-nav-context.ts` | `original/hooks/use-nav-context.ts` |
| `hooks/use-filtered-nav.ts` | `original/hooks/use-filtered-nav.ts` |
| `lib/navigation-config.ts` | `original/lib/navigation-config.ts` |
| `types/navigation.ts` | `original/types/navigation.ts` |
| `types/rbac.ts` | `original/types/rbac.ts` (Membership shape) |

## Why two migration folders now exist

- `docs/migrations/social-nav-system/` — earlier intake from `kasder/kas-social-front`'s `SocialSidebar.tsx`. That file is a **flat-list, hardcoded social-feed sidebar** (Ana Sayfa / Keşfet / Mesajlar / Profil) — it has none of the multi-context architecture. v0.1.0 of `rich-sidebar` was built from that intake and shipped before the user pointed out the wrong source. The folder is kept as historical context but is **not the source of truth** for the v0.2 expansion.
- `docs/migrations/socialmedia-adv-nav-system/` (this folder) — the real architectural source. Multi-context app shell with dynamic context-switcher, permission-aware section gating, `{slug}` href templates, governance/CMS sub-modes.

## App stack the original lives in

- Next.js (App Router; `usePathname` from `next/navigation`)
- Zustand stores (`useMembershipStore`, `useUser` from `@/stores/auth-store`)
- `next-themes` (used by UserMenu + MobileMenuSheet for theme switching — incidental, not a nav-system concern)
- shadcn primitives — Avatar, Button, DropdownMenu (+ Sub variants), Popover, ScrollArea, Separator, Sheet
- Lucide icons throughout

## App-specific code that should NOT migrate into the library

The originals are tightly coupled to the kas-social-app's domain — these references must stay app-side, not library-side:

- `useUser`, `useMembershipStore`, `usePlatformMembership`, `useBusinessMemberships` from auth/membership stores
- `BusinessCreationRequestButton`, `CreateBusinessDialog` (business-feature components)
- `fetchMyMembershipsApi` (network call)
- `GovernanceSessionBar` (governance-feature component)
- `NotificationBell` (notifications feature)
- `useLogout` (auth mutation)
- `next-themes` integration (theme submenu is app-specific UX)

## App-agnostic patterns that SHOULD migrate into the library

These are the load-bearing ideas worth lifting into ilinxa-ui-pro components:

1. **NavContext as a discriminated union** — `{ type: "personal" } | { type: "business"; slug; … } | { type: "platform"; … } | { type: "governance" } | { type: "cms"; mode: …; … }`. Anything with a `slug` or sub-mode key counts as a "sub-context."
2. **Declarative `NAV_CONFIG` keyed by context** — a static config object mapping each context to its sections + items. Items declare `permission?`, `ownerOnly?`, `minMembers?`, `activeMatch: "exact" | "prefix"`, and `href` template strings with `{slug}` placeholders.
3. **`useNavContext` hook** — URL pathname → context derivation via prefix matching (`/bconsole/[slug]/...` → business; `/cconsole/...` → CMS platform; `/cconsole/[slug]/...` → CMS business).
4. **`useFilteredNav` hook** — combine config + membership permissions to produce a filtered sections list. Strip out items the user can't access; strip out sections that become empty.
5. **`resolveHref({slug} template, context)`** — template-string substitution at render time.
6. **`isNavActive(pathname, href, "exact" | "prefix")`** — match strategy per item.
7. **`AccountSwitcher` as a top-of-sidebar popover** — combobox-style switcher between contexts; "active" item highlighted with Check; opens new contexts via router push; appends a "Create Business" affordance at the bottom.
8. **`BottomNavbar` context-driven items** — same items shape, different layout (fixed bottom, icon-over-label).
9. **`MobileMenuSheet`** — bottom sheet that composes `AccountSwitcher` + `SidebarNav` + theme switcher + logout into a mobile-friendly menu accessed from a "More" item on the bottom bar.

## What's different vs rich-sidebar v0.1.x

See [`analysis.md`](analysis.md) for the full gap breakdown. TL;DR: v0.1 ships a static, single-context sidebar; this source describes a **multi-context app shell** where the sidebar's items + the bottom bar's items + the trigger affordance all switch in lockstep based on the active workspace/account.
