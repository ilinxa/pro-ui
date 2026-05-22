# Social Nav System — migration source notes

> Intake doc for [`docs/migrations/social-nav-system/`](./). Drafted by the assistant from the user's brief; user reviews + edits before sign-off.
>
> See [`docs/migrations/README.md`](../README.md) for the full pipeline.

## Source

- **App:** `kasder` (kas-social-front, v0)
- **Path in source:**
  - `src/components/social/navbar/SocialSidebar.tsx` (~175 LOC)
  - `src/components/social/navbar/SocialBottomNav.tsx` (~70 LOC)
- **Used in:** the social section of kas-social-front — every page under `/social/*` mounts both. Desktop renders the sidebar (`hidden lg:flex`); mobile renders the bottom nav (`lg:hidden`). They are a coordinated pair, not a single component with responsive switching.
- **Related code:**
  - shadcn primitives — `button`, `avatar`, `dropdown-menu` (all consumed; no extension)
  - `next/link` + `next/navigation` (`usePathname`)
  - `lucide-react` icons (`Home`, `Search`, `MessageCircle`, `Bell`, `User`, `Briefcase`, `Menu`, `X`, `PlusSquare`, `Settings`, `LogOut`)
  - `cn` helper from `@/lib/utils`

## Role

A two-surface app-shell navigation system for a social-media product. The sidebar is the primary nav on desktop — collapsible (icon-only 80px ↔ labeled 256px), holds the brand mark, the main nav list with badge counts, a "Paylaş" (Share / Create Post) primary action, and a user footer with a dropdown menu (Profile / Settings / Logout). The bottom nav is the mobile counterpart — fixed full-width, 5 stacked icon-and-label items with badge overflow capping (`> 9 → "9+"`), an active-state with `scale-110` icon plus a small primary-color dot beneath, backdrop-blur surface, and iOS-safe-area awareness.

The two share the same `NavItem` schema (`icon`, `label`, `path`, optional `badge`) and the same hardcoded item list — the source app keeps them in sync by hand. Both perform active-route detection via `pathname === item.path` (exact match), with a commented-out `startsWith` variant in both files signaling that prefix-matching was wanted but never wired up.

## What I like (preserve)

- **Sidebar collapse rhythm** — collapsed `w-20` ↔ expanded `w-64`; `transition-all duration-300` smoothes the width change; brand row hides at-collapsed; badges reposition from `right-3` to `top-1 right-1` corner to stay visible on the icon.
- **Bottom-nav active state** — icon `scale-110` lift + primary color + a 4×4 dot indicator at the bottom of the cell. Three signals stacked make the active tab instantly readable even on tiny touch targets.
- **Bottom-nav badge cap** — `> 9 ? "9+"` keeps the badge from blowing out the icon footprint. Sidebar does NOT have this cap (raw number); the bottom-nav version is the correct one — port to both.
- **Backdrop-blur surface on the bottom nav** — `bg-card/95 backdrop-blur-md` keeps the nav legible over scrolling feed content; iOS-style polish.
- **Safe-area awareness on the bottom nav** — `safe-area-bottom` class signals iOS notch padding. Must translate to Tailwind v4 (`pb-[env(safe-area-inset-bottom)]`).
- **Active-state color shift on sidebar badge** — when the item is active, the badge flips from destructive (red) to accent — visually quiet on the now-highlighted row, instead of clashing.
- **Three-zone sidebar structure** — brand row at top, scrollable nav in the middle, sticky user footer at bottom — classic app-shell rhythm, clean to read.
- **Primary action as a button (not a nav item)** — "Paylaş" sits below the nav list, visually distinct from routing destinations. Encodes the right mental model: posting is an action, not a place.
- **User footer dropdown** — avatar + name + handle stacked, click → DropdownMenu with Profile / Settings / Logout; `align` flips from `end` (expanded) to `center` (collapsed) so the popup doesn't overflow the screen edge.
- **Compact bottom-nav row** — icon + 10px label stacked, fits 5 items comfortably on a phone.

## What bothers me (rewrite)

- **`next/link` + `next/navigation` imports** — banned in `src/registry/`. Must abstract the link primitive (consumer-supplied `linkComponent` prop) AND the active-detection input (consumer-supplied `currentPath` prop).
- **Hardcoded data EVERYWHERE** — nav items, brand label, brand logo, user name + handle + avatar URL, dropdown menu items, "Paylaş" copy. All Turkish. Everything must move to props.
- **No controlled-mode for sidebar collapse** — `useState(true)` is the only path. Real consumers need to persist collapse state across reloads (localStorage), share it with a header bar, or sync it cross-tab. Both controlled (`isCollapsed` + `onCollapseChange`) and uncontrolled (`defaultCollapsed`) must ship.
- **No mobile drawer for the sidebar** — when `< lg`, the sidebar simply disappears. Real apps need a Sheet-based drawer so the full nav surface is still reachable. The pair-of-components model leaves this gap.
- **No tooltips on collapsed sidebar icons** — accessibility blocker. Icon-only links MUST have `aria-label` + a visible tooltip-on-hover.
- **No `aria-current="page"` on the active route** — a11y miss.
- **Active state uses raw `bg-primary` + `text-primary-foreground`** — the lime accent is too bright for white text. Must use lime + near-black foreground per ilinxa's design-system mandate.
- **Badge logic duplicated + inconsistent** — sidebar lacks overflow cap, has color-shift on active; bottom nav has overflow cap, no color shift. Unify into one shared `<NavBadge>` part.
- **Badge positioning is style-coupled inside each component** — extract to the shared part.
- **Single bottom-nav active-affordance variant** — `scale-110 + dot` is one of several common variants (lifted pill, top-edge line, color-only). Worth offering as a prop.
- **No FAB / center-prominent action on bottom nav** — social apps commonly elevate the central "post" action. Kasder treats "Paylaş" as a regular item; worth offering as an opt-in slot variant.
- **Brand zone is fixed shape** — a K-square + label. Real apps need a logo image, an SVG, or a fully custom mark. Make it an open `brandSlot` ReactNode.
- **User footer is fixed shape** — avatar + name + handle + the same 3 dropdown items in the same order. Make it an open `footerSlot` + ship a `<NavUser>` prefab part for the 80% case.
- **Active detection is exact-match only** — commented `startsWith` variant proves both modes were wanted. Ship `isActive?` predicate + per-item `match?: "exact" | "prefix"` fallback.
- **Typos / dead code** — `p-4ss`, `text-accent-foregroundd`, `border-borde`, `z-9999`, dead `useLocation` comment. Cleanup during port.
- **No reduced-motion respect** — `transition-all duration-300` ignores `prefers-reduced-motion`. Wrap in `motion-safe:` or token-gated.
- **No keyboard nav semantics beyond browser default** — focus rings on tokens, arrow-key cycling between nav items (optional).
- **Hardcoded badge color (`text-white`) bypasses tokens** — should be `text-destructive-foreground` and `text-accent-foreground` cleanly.
- **No item disable / visibility predicate** — real consumers need permission gating ("show Business item only to business owners") and disable states.

## Constraints / non-goals

- **Two procomps, not one shell.** User pick: option A — `sidebar-nav-01` + `bottom-tab-bar-01`. NOT a single `app-nav-shell-01` that owns responsive switching.
- **No internal router knowledge.** Active-route detection must accept a `currentPath` string + optional `isActive` predicate. The components never call `usePathname()`.
- **No internal `<Link>` knowledge.** Link rendering goes through a `linkComponent` prop (default = `<a href>`). Consumers wire Next, React Router, TanStack Router, etc.
- **Single feature-complete v0.1 per procomp.** No v0.2 / v0.3 deferrals. Same posture as `todo-tree` v0.1.0.
- **i18n via props only.** No hardcoded copy in shipped source — all labels, button text, aria-labels via props.
- **Stay framework-agnostic.** No `next/*`, no app contexts, no env-specific code (registry rule).

## Screenshots / links

- Live in kas-social-front under `/social/*` routes. No design file URL was provided; assistant is matching from source code.
