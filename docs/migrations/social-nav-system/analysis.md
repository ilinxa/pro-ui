# Social Nav System — migration analysis

> Extraction pass for [`docs/migrations/social-nav-system/`](./). Filled by the assistant after reading `original/` + `source-notes.md`. Reviewed and signed off by you before the procomp gates begin.
>
> Pipeline: [`docs/migrations/README.md`](../README.md). User-locked picks from the pre-intake conversation: option A (two sibling procomps) ✓ · Sheet drawer variant for mobile ✓ · opt-in center FAB ✓ · open brand + footer slots with prefab parts ✓ · `isActive` predicate + per-item `match` fallback ✓ · shared `<NavBadge>` part ✓ · `navigation` category exists (no action) ✓ · tooltip-on-collapsed ✓ · single feature-complete v0.1 per procomp ✓.
>
> **🔁 Deep-audit re-validation pass — 2026-05-22.** Per the project's re-validation memory: never rubber-stamp draft → sign-off. Pass surfaced **23 substantive findings** across 6 categories — folded back as ML11–ML22 locks + a **§ Audit additions** section at the bottom that LAYERS over the original analysis (the original sections above remain accurate; the appendix adds new features and corrects two inline claims). The two inline corrections are: (a) three-defenses applied to discrete boolean state (collapse / mobileOpen) means Defenses 1+2 only — Defense 3 has no continuous flow to suppress; (b) shared `<NavBadge>` location confirmed in `sidebar-nav-01/parts/` per F-S1 lock (not in `navigation/_shared/` legacy pattern).

## Source artifacts read

**Sidebar** ([`original/sidebar/`](./original/sidebar/), 1 file, 174 LOC):

- `SocialSidebar.tsx` — `<aside>` shell with three vertical zones (brand row, scrollable nav list, user footer); `useState(true)` for collapsed mode; `next/link` + `usePathname()`; hardcoded 6-item nav list (Turkish); hardcoded brand "Kasder"; hardcoded "Paylaş" primary action button; hardcoded user (Ahmet Kaya / @ahmetkaya / Unsplash avatar URL); hardcoded 3-item dropdown menu (Profile / Settings / Logout). Active state via `pathname === item.path`. Badge: numeric, repositions by collapsed-vs-expanded, color-shifts by active-vs-inactive.

**Bottom-nav** ([`original/bottom-nav/`](./original/bottom-nav/), 1 file, 70 LOC):

- `SocialBottomNav.tsx` — `<nav>` fixed-bottom shell with `bg-card/95 backdrop-blur-md` + `safe-area-bottom` class; 5 hardcoded nav items (Turkish; one item is the "Paylaş" action treated as a route); active state = primary color + icon `scale-110` + small primary-color dot beneath; badge with `> 9 → "9+"` overflow cap; `usePathname()` for active detection.

**Cross-references:** both files share the inline `NavItem` interface (`{ icon, label, path, badge? }`) — duplicated, not imported. Both consume shadcn `button` / `avatar` / `dropdown-menu` primitives. Both depend on `next/link` + `next/navigation`. Both are Turkish-only. No tests, no Storybook, no MDX docs in source.

## Design DNA to PRESERVE

Distilled from reading the source. These are the visual / behavioral decisions worth keeping verbatim — what makes this feel like a polished social-app shell rather than a generic admin sidebar.

### Sidebar — collapse rhythm

| Decision | Specifics |
|---|---|
| Width | Collapsed `w-20` (80px). Expanded `w-64` (256px). |
| Transition | `transition-all duration-300` on width. Brand label fades out at-collapsed; toggle icon swaps Menu ↔ X. |
| Sticky | `sticky top-0 h-screen` — full viewport height; never scrolls with the page body. |
| Visibility | `hidden lg:flex` — desktop-only in kasder. In the port, this becomes consumer-choice (don't bake the breakpoint). |
| Surface | `bg-card border-r border-border` — leans into raised-surface tokens (card lifts above page bg per ilinxa's mandate). |
| Zones | Brand row (`min-h-17`, padded) → flex-1 nav list (`p-3 space-y-1`) → user footer (`p-3 border-t`). |

### Sidebar — nav-row paint

| Decision | Specifics |
|---|---|
| Row layout | `flex items-center gap-3 px-3 py-3 rounded-lg`. Icon `h-5 w-5 shrink-0` + label (hidden at-collapsed). |
| Icon-only centering | `isCollapsed && "mx-auto"` on icon. |
| Hover | `hover:bg-muted` at-rest. |
| Active | `bg-primary text-primary-foreground`. **Will rewrite to lime + near-black foreground per ilinxa mandate (lime is too bright for white text).** |
| Transition | `transition-all duration-200` on the row. |
| Group | `group relative` — primes hover-reveal hooks (unused in source, useful for tooltip wrapping in the port). |

### Sidebar — badge

| Decision | Specifics |
|---|---|
| Shape | `min-w-5 h-5 text-xs font-medium rounded-full px-1`. |
| Position (expanded) | `absolute right-3` — right of the label, centered vertically. |
| Position (collapsed) | `absolute top-1 right-1` — top-right corner of the icon. |
| Color (inactive) | `bg-destructive text-destructive-foreground`. |
| Color (active) | `bg-accent text-accent-foreground` — quiet on the highlighted row. |
| Cap | **Missing in source** — bottom-nav has `> 9 → "9+"`; sidebar shows raw number. Unify to capped in the port. |

### Sidebar — primary action

| Decision | Specifics |
|---|---|
| Position | Below the nav list (still inside the scrollable nav zone). |
| Shape (expanded) | Full-width button `gap-2` with icon + label. |
| Shape (collapsed) | Icon-only `px-0` (full-width still, but no horizontal padding). |
| Spacing | `mt-4` — separates from the nav-list rhythm. |

### Sidebar — user footer

| Decision | Specifics |
|---|---|
| Container | `p-3 border-t border-border`. |
| Trigger row | `flex items-center gap-3 p-2 rounded-lg w-full hover:bg-muted`. Centered when collapsed (`justify-center`). |
| Avatar | `h-9 w-9`. |
| Identity text | Two-line: name `text-sm font-medium`, handle `text-xs text-muted-foreground`. Hidden at-collapsed. |
| Dropdown align | `align={isCollapsed ? "center" : "end"}` — keeps popup on-screen. |
| Dropdown items | Profile / Settings / Logout (destructive). |

### Bottom-nav — surface + rhythm

| Decision | Specifics |
|---|---|
| Position | `fixed bottom-0 left-0 right-0 z-50`. |
| Surface | `bg-card/95 backdrop-blur-md border-t border-border`. **The translucency over content is the polish that elevates it past "just a tab bar."** |
| Safe area | `safe-area-bottom` (custom util). **Translate to `pb-[env(safe-area-inset-bottom)]` in the port.** |
| Visibility | `lg:hidden` — mobile-only in kasder. Consumer-choice in the port. |
| Inner | `flex items-center justify-around h-16 px-2` — 64px tall, even spacing across items. |

### Bottom-nav — item paint

| Decision | Specifics |
|---|---|
| Layout | `flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-lg`. Icon stacked above label. |
| Icon | `h-6 w-6` — larger than sidebar's `h-5` because there's no label-side companion. |
| Label | `text-[10px] font-medium` — tight beneath the icon. |
| Active icon | `scale-110` lift via `transition-transform`. |
| Active color | `text-primary` (icon + label both). |
| Inactive color | `text-muted-foreground` at-rest, `hover:text-foreground`. |
| Active dot | `absolute bottom-1 w-1 h-1 rounded-full bg-primary` — three-signal redundancy (color + scale + dot) for accessibility on small tap targets. |

### Bottom-nav — badge

| Decision | Specifics |
|---|---|
| Shape | `w-4 h-4 text-[10px] font-medium rounded-full`. |
| Position | `absolute -top-1 -right-1` on the icon container (the inner `<div className="relative">`). |
| Color | `bg-destructive text-destructive-foreground` (no active-state shift, unlike sidebar). |
| Cap | `> 9 ? "9+" : badge`. **This is the cap the sidebar lacks — port it to the shared `<NavBadge>` part.** |

## Structural debt to REWRITE

Default-rewrite list from the registry-portability rules + the user's "what bothers me" pass. Each item explicitly justified.

### Registry portability (blocking)

- **Drop all `next/*` imports.** Banned in `src/registry/`. Two changes flow from this:
  1. Replace `<Link>` with a `linkComponent` prop. Default value = `({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>`. Consumers wire their router's link primitive.
  2. Replace `usePathname()` with a `currentPath: string` prop + optional `isActive?: (item, currentPath) => boolean` predicate + per-item `match?: "exact" | "prefix"`.
- **Drop hardcoded copy.** Every Turkish string moves to props: nav-item `label` is already prop-shaped; brand label, "Paylaş", footer dropdown labels, `aria-label`s, empty states — all consumer-supplied.
- **Drop hardcoded data.** Nav items, brand image/label, user identity, footer dropdown menu items — all consumer-supplied.

### Controlled-mode + state

- **Sidebar collapse** — ship both `defaultCollapsed?: boolean` (uncontrolled) and `isCollapsed?: boolean` + `onCollapsedChange?: (next: boolean) => void` (controlled). Controlled mode applies the three-defenses pattern per [`project_controlled_mode_two_defenses.md`](../../../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/project_controlled_mode_two_defenses.md), but in **attenuated form for discrete boolean state**: Defense 1 (microtask-defer notify) applies — protects against re-entrant `onCollapsedChange` calls from consumers that synchronously sync to other state. Defense 2 (content-equality resync guard) applies — for a boolean, content-equality reduces to `===`; effect uses `prevRef.current === next` short-circuit so stable parent re-renders don't double-fire. **Defense 3 (suppress-mid-flow) does NOT apply** — there's no continuous event stream like drag/type/scroll to suppress; the toggle is a single discrete event and the 300ms CSS transition is purely visual (not an event source). Same posture for `isMobileOpen`.
- **Mobile drawer for sidebar** — new feature in the port: `isMobileOpen?: boolean` + `onMobileOpenChange?: (next: boolean) => void` controlled pair, or `defaultMobileOpen?: boolean` uncontrolled. Renders inside shadcn `<Sheet side="left">` when below a consumer-configurable breakpoint (default `lg`). Consumer triggers via the imperative handle (`openMobile()` / `closeMobile()`) or by toggling the controlled prop.
- **Bottom-nav** — stateless aside from active-route detection; no internal state to lift.

### Slot architecture

- **Brand zone** → `brandSlot?: ReactNode` (full override) + ship a `<NavBrand>` part for the 80% case (`<NavBrand logo={...} label="..." href="..." linkComponent={...} />`). Collapsed-mode behavior: when the sidebar is collapsed, `brandSlot` receives a `data-collapsed="true"` ancestor + `<NavBrand>` automatically hides the label.
- **Primary action** → `primaryActionSlot?: ReactNode` (full override) + per-prop shorthand `primaryAction?: { icon, label, onClick, href? }`. Hidden when neither is provided.
- **User footer** → `footerSlot?: ReactNode` (full override) + ship a `<NavUser>` part with `user: { name, handle?, avatarUrl?, avatarFallback? }` + `menuItems: NavUserMenuItem[]` (each `{ icon?, label, onClick?, href?, variant?: "default" | "destructive", separator?: "before" | "after" }`). Aligns popup like the source (`align={isCollapsed ? "center" : "end"}`).
- **Nav row** → `renderItem?: (args: { item; isActive; isCollapsed; defaultRender }) => ReactNode` for full row override.
- **Bottom-nav center FAB** (opt-in only) — `centerSlot?: ReactNode` + `centerVariant?: "inline" | "lifted"` (`"lifted"` shifts the slot vertically up and gives it a circular shadow ring; `"inline"` keeps it level with other items). When provided, items array splits visually around the center cell.

### Active-route detection

- `currentPath: string` (required prop).
- `isActive?: (item: NavItem, currentPath: string) => boolean` — if provided, wins for every item.
- Per-item `match?: "exact" | "prefix"` — fallback when `isActive` not provided. Default `"exact"` (matches source).
- Active state passes to renderItem slot as a boolean + lands as `aria-current="page"` on the link.

### Shared `<NavBadge>` part (cross-procomp via relative imports)

- Lives in `sidebar-nav-01/parts/nav-badge.tsx`. Exported from `sidebar-nav-01/index.ts` AND re-exported (for ergonomic consumer import) — but per F-S1 lock, **`bottom-tab-bar-01` imports via relative path `../sidebar-nav-01/parts/nav-badge`**, never via the `@ilinxa/` alias in shipped source.
- Props: `value: number | string | ReactNode`, `max?: number` (default 9), `variant?: "number" | "dot" | "pulse"` (default `"number"`), `tone?: "default" | "accent" | "destructive" | "muted"`, `showZero?: boolean` (default false), `className?: string`.
- Renders nothing when `value === 0 && !showZero`.
- `"dot"` variant — small filled circle, no number. `"pulse"` — dot + animated ping ring (CSS keyframe, motion-safe).

### Accessibility rewrites

- `aria-current="page"` on the active row's `<a>` element.
- Each nav row carries `aria-label` (sourced from `item.label`); the icon is `aria-hidden` to avoid double-announcement.
- Collapsed sidebar: every nav row wrapped in a shadcn `<Tooltip>` with `side="right"` showing the label on hover/focus. Active-row tooltip suppressed (no info value). Tooltip respects F-cross-13: defensive `delayDuration` + `delay` typed-as-Radix-OR-BaseUI per the memory.
- `prefers-reduced-motion` respected — wrap width/scale transitions in `motion-safe:` utilities. The sidebar's width morph + bottom-nav's active-icon `scale-110` both gate on motion preference.
- Bottom-nav: `role="tablist"` on the `<nav>`, `role="tab"` + `aria-selected` on each item — closer to the right pattern than raw links when the items represent app sections rather than routes. (Decision per item-shape — if items are real route destinations, keep `<a>` + `aria-current`; if they're tab-like sections, `role="tab"`. Default to route semantics; expose `interactionRole?: "link" | "tab"` if needed.)
- Sidebar primary action: focusable, `aria-label` when no visible text (collapsed icon-only mode).
- Sidebar user footer dropdown trigger: focusable button with `aria-haspopup="menu"` + accessible name.

### Cleanup pass

- Drop typos: `p-4ss`, `text-accent-foregroundd`, `text-destructive-foregroundd`, `border-borde`, `z-9999` → token-correct equivalents.
- Drop dead commented code (`useLocation`, `isActive` predicate stub).
- Drop redundant `text-white` overrides (use token foregrounds).
- Replace `safe-area-bottom` custom class with `pb-[env(safe-area-inset-bottom)]` (Tailwind v4 arbitrary).

## Dependency audit

| Dep | Source uses | Port uses | Action |
|---|---|---|---|
| `next/link`, `next/navigation` | ✓ | ✗ (banned in registry) | **Drop** — replace with `linkComponent` + `currentPath` props |
| `lucide-react` | ✓ | ✓ | Keep — declare as peer dep in `meta.ts` |
| `@/components/ui/button` | ✓ | ✓ | Keep — shadcn primitive |
| `@/components/ui/avatar` | ✓ | ✓ (via `<NavUser>`) | Keep — shadcn primitive |
| `@/components/ui/dropdown-menu` | ✓ | ✓ (via `<NavUser>`) | Keep — shadcn primitive |
| `@/components/ui/tooltip` | ✗ | ✓ NEW | Add — collapsed-mode label tooltips |
| `@/components/ui/sheet` | ✗ | ✓ NEW (sidebar mobile drawer) | Add — Sheet wraps sidebar in mobile mode |
| `@/lib/utils` (`cn`) | ✓ | ✓ | Keep |

**F-cross-13 carriers to pre-empt in the GATE 2 plan** (per [`project_shadcn_primitive_radix_baseui_divergence.md`](../../../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/project_shadcn_primitive_radix_baseui_divergence.md)):

- Tooltip — defensive callback contravariance + dual-naming `delayDuration` + `delay`
- Sheet — `onOpenChange: (open: boolean) => void` is a common Radix-vs-Base divergence point; type defensively
- DropdownMenu (inside `<NavUser>`) — `onSelect` callback shape; type defensively

No npm-new peer deps to verify — every dep above is already a shipped shadcn primitive in this repo.

## Dynamism gaps

What needs to become a prop / slot / generic / render-prop. Already captured under "Slot architecture" + "Active-route detection" above, but consolidated for visibility:

| Surface | Today (kasder) | Port API |
|---|---|---|
| Nav items | Hardcoded inline `navItems` const | `items: NavItem[]` prop |
| Brand mark | Hardcoded inline JSX | `brandSlot?: ReactNode` + `<NavBrand>` prefab |
| Primary action | Hardcoded "Paylaş" button | `primaryActionSlot?: ReactNode` + `primaryAction?: NavPrimaryActionConfig` shorthand |
| User footer | Hardcoded inline JSX | `footerSlot?: ReactNode` + `<NavUser>` prefab + `NavUserMenuItem[]` config |
| Dropdown items | Hardcoded inline JSX | Part of `<NavUser>` config above |
| Active detection | `pathname === item.path` (exact only) | `currentPath` + optional `isActive` predicate + per-item `match` |
| Link primitive | `next/link` | `linkComponent?: ComponentType<LinkProps>` (default = `<a href>`) |
| Collapse state | `useState` (no controlled mode) | `isCollapsed` + `onCollapsedChange` + `defaultCollapsed` |
| Mobile-drawer state | N/A (sidebar disappears below `lg`) | `isMobileOpen` + `onMobileOpenChange` + `defaultMobileOpen` + Sheet integration |
| Breakpoint where drawer engages | Hardcoded `lg` via Tailwind classes | `mobileBreakpoint?: "sm" \| "md" \| "lg" \| "xl"` + matchMedia hook |
| Badge cap | Sidebar lacks; bottom-nav `> 9 → "9+"` | Both use shared `<NavBadge>` with `max` prop (default 9) |
| Badge color shift on active | Sidebar yes, bottom-nav no | Both via shared `<NavBadge>` with active-aware tone resolver |
| Bottom-nav active visual | Hardcoded `scale-110 + dot + color` | `bottomActiveVariant?: "scale-dot" \| "lifted-pill" \| "top-edge-line" \| "color-only"` (default `"scale-dot"` per source) |
| Center FAB on bottom-nav | None | `centerSlot?: ReactNode` + `centerVariant?: "inline" \| "lifted"` opt-in |
| Item visibility / disable | None | Per-item `hidden?: boolean` + `disabled?: boolean` |
| Item permission gating | None | Per-item `permission?: string` + `permissions?: ReadonlySet<string>` props (item hidden when permission required and not granted) |
| Custom rendering | None | `renderItem?` slot (full row override) + `renderBadge?` slot |
| Active-row aria semantics | Missing | Auto `aria-current="page"` |
| Reduced-motion gating | Missing | `motion-safe:` utilities throughout |

## Optimization gaps

The source files are short and unoptimized in standard React-idiomatic ways. The port adds:

- `useMemo` on the items-with-active-state derivation (avoid recomputing on every render of a parent).
- `useCallback` on all consumer-passed callbacks where they live in deps arrays.
- `React.memo` on the row component (`<NavItem>` part) — useful when items[] is stable and only one item flips active per route change.
- `useId` for ARIA relationships between nav-item button + tooltip content.
- Bottom-nav: no virtualization needed (max ~5–6 items typical, no scroll).
- Sidebar: no virtualization needed (typical nav lists ≤ 12 items). If a consumer pushes 50+ items, that's a different procomp (`command-palette` or `treeview-nav`).
- Sheet (mobile drawer): mount lazily — Sheet content only renders when `isMobileOpen === true` so the desktop bundle doesn't pay for it.

## Accessibility gaps

Source-app's a11y posture is "browser defaults + nothing else." Port closes:

- `aria-current="page"` on active row.
- `aria-label` on every row (sourced from `item.label`); icon `aria-hidden`.
- Tooltip on collapsed sidebar rows (accessible name preserved even when label hidden).
- Focus ring on token (`focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`).
- Keyboard nav within sidebar: `ArrowDown` / `ArrowUp` move between rows; `Home` / `End` jump to first / last; `Enter` activates; standard browser behavior on links.
- Skip-link affordance — `<a href="#main-content" className="sr-only focus:not-sr-only">` at top of sidebar, configurable via `skipLinkTarget?: string` prop. Source app lacks this entirely.
- `prefers-reduced-motion` gates the width transition + the active-icon scale.
- Bottom-nav: `aria-label` on the `<nav>` element (`navProps?: { "aria-label"?: string }` or top-level `aria-label` prop).
- Sheet drawer: focus trap on open, focus restore on close (shadcn Sheet handles this; verify no override).

## Proposed procomp scope

**Two sibling procomps in `navigation` category** (user-locked).

### `sidebar-nav-01` — desktop collapsible sidebar + mobile Sheet drawer

- Full sealed-folder shape per `data-table` precedent.
- Hosts the shared `<NavBadge>`, `<NavBrand>`, `<NavUser>`, `<NavPrimaryAction>` parts. These export from `index.ts` so consumers can compose ad-hoc.
- Owns the mobile-drawer Sheet integration (the missing piece in kasder).
- Imperative handle: `toggleCollapse()` / `setCollapsed(b)` / `openMobile()` / `closeMobile()` / `getState()`.
- 3-defenses controlled-mode wiring.

### `bottom-tab-bar-01` — mobile fixed bottom navigation

- Full sealed-folder shape.
- Imports `<NavBadge>` from `sidebar-nav-01` via **relative path** (F-S1 lock): `../sidebar-nav-01/parts/nav-badge`.
- Imports the `NavItem` schema type via relative path: `../sidebar-nav-01/types`.
- Owns active-variant choice (`"scale-dot"` / `"lifted-pill"` / `"top-edge-line"` / `"color-only"`).
- Owns center-FAB opt-in slot.
- No imperative handle needed (stateless).

**Cross-procomp pattern:** identical shape to `todo-rich-card` ↔ `todo-tree` (both shipped 2026-05-20/21). One procomp owns the shared types + the shared part (`NavBadge` here = `TodoItem` schema there); the sibling imports via relative paths in shipped source. Producer-side registry conventions copy verbatim.

**Build order:** `sidebar-nav-01` first (it owns the shared types + part), `bottom-tab-bar-01` second (it consumes them).

## Recommendation

**Proceed.** Two-procomp split is the right architecture; the kasder source has strong design DNA that ports cleanly once portability constraints are honored.

The migration is roughly **80% rewrite, 20% direct port**:

- Direct port: visual rhythm (widths, paddings, gaps, transitions), active-state signals (scale + color + dot triple-redundancy on mobile), backdrop-blur surface, badge corner-positioning logic for collapsed mode, three-zone sidebar layout, dropdown align-flip.
- Full rewrite: data flow (props vs. hardcoded), control surface (uncontrolled + controlled + headless), mobile drawer (new), accessibility layer (new), portability layer (`linkComponent` + `currentPath` + `isActive`), shared `<NavBadge>` extraction, slot system (brand / footer / primaryAction / renderItem / centerSlot), reduced-motion gating, F-cross-13 pre-emption.

**Next steps after sign-off:**

1. GATE 1 description doc for `sidebar-nav-01` (the bigger surface, owns the shared schema + parts).
2. After GATE 1 sign-off → GATE 2 plan doc for `sidebar-nav-01`.
3. After GATE 2 sign-off → scaffold + implement `sidebar-nav-01`.
4. After `sidebar-nav-01` is review-closed (GATE 3 pass), repeat (1)–(3) for `bottom-tab-bar-01`.

**Estimated surface (rough):**

- `sidebar-nav-01`: ~28 files in sealed folder (top + parts/ + hooks/ + lib/ + types + dummy-data + demo + usage + meta + index). 4 exported parts (`<NavBadge>`, `<NavBrand>`, `<NavUser>`, `<NavPrimaryAction>`). ~12 typed events. ~8 slot props.
- `bottom-tab-bar-01`: ~14 files in sealed folder. 0 new exported parts (reuses `<NavBadge>`). ~6 typed events. ~3 slot props.

Both target single feature-complete v0.1.0 ship; no v0.2 / v0.3 deferrals.

## Risks (worth flagging now)

| # | Risk | Mitigation |
|---|---|---|
| R1 | The cross-procomp shared `<NavBadge>` introduces a hard runtime dep `bottom-tab-bar-01 → sidebar-nav-01`. Consumers installing only `bottom-tab-bar-01` will pull `sidebar-nav-01`'s tree. | Same pattern as `todo-tree → todo-rich-card`. Document loudly in the bottom-nav guide. Consumers wanting *only* `bottom-tab-bar-01` can fork the badge part — but the shared schema means there's value in keeping them linked. Alternatively (deferrable): hoist `<NavBadge>` into a third tiny `nav-shared` procomp consumed by both. **Recommend keeping the dep direction simple for v0.1; reconsider if a third nav procomp lands.** |
| R2 | `linkComponent` as a prop is unusual in shadcn-land — every other procomp in this lib uses internal `<a>` or assumes no router. Risk: consumer confusion. | Document in both `usage.tsx` with two examples: (a) default `<a href>` for plain HTML; (b) Next.js wrapping (`<Link>` from `next/link`). Make the type definition discoverable: `LinkComponent` exported type. |
| R3 | Mobile-drawer Sheet integration assumes shadcn `<Sheet>` is available in the consumer's app. The `pnpm dlx shadcn add` flow ships `sheet.tsx` as a peer install. | Add `sheet` to `dependencies.shadcn` in `meta.ts`. The shadcn CLI will install it during `add @ilinxa/sidebar-nav-01`. Document the install footprint in the guide. |
| R4 | `currentPath` prop forces consumer to compute / subscribe to route changes. Easy to forget in a Next.js app (where `usePathname()` makes it trivial) but invisible if the consumer is on a router without that hook. | Ship a small `useCurrentPath()` recipe in `usage.tsx` for Next / React Router / TanStack Router — three one-liners. Don't bake any of them into the registry source. |
| R5 | Three signals (color + scale + dot) on bottom-nav active state may feel busy in some product contexts. | The `bottomActiveVariant` prop opts out (`"color-only"` is one of four variants). Source visual is the default. |
| R6 | Sheet drawer slide-direction is fixed `side="left"` in the spec. Consumer might want right-side drawer in RTL contexts or by preference. | Add `mobileDrawerSide?: "left" \| "right"` prop. Default `"left"` (LTR). RTL-aware default deferrable — document in guide. |
| R7 | F-cross-13 has bitten the last three procomps consistently. Sidebar + Bottom-nav use Tooltip + Sheet + DropdownMenu (inside `<NavUser>`) — three potential carriers. | Pre-empt in GATE 2 plan: defensive callback contravariance on Tooltip + Sheet + DropdownMenu; dual-name `delayDuration` + `delay`; widen narrow callback unions to typeof-guards. F-cross-11 path-b smoke run BEFORE flagging the component as ready. |
| R8 | Permission-gated items add complexity to the API surface — risk of bloat for v0.1. | Keep narrow: `permission?: string` on the item + `permissions?: ReadonlySet<string>` on the component. No matrix, no predicates beyond Set membership. If consumers need richer gating, they wire it via the `hidden?: boolean` or `disabled?: boolean` per-item props + their own selector. |

## Locked decisions (recorded here pre-sign-off)

Re-summarizing user picks from the pre-intake conversation so the GATE 1 description doc can cite them directly:

| # | Lock | Source |
|---|---|---|
| ML1 | **Two sibling procomps in `navigation` category** — `sidebar-nav-01` + `bottom-tab-bar-01`. NOT one shell. | User Q1 pick |
| ML2 | **Ship Sheet-based mobile drawer variant of the sidebar** — `isMobileOpen` + `onMobileOpenChange` controlled+uncontrolled pair, three-defenses pattern applied. | User Q2 pick |
| ML3 | **Opt-in center FAB on bottom-nav** via `centerSlot` + `centerVariant: "inline" \| "lifted"`. | User Q3 pick |
| ML4 | **Open `brandSlot` + ship `<NavBrand>` prefab part** for the default recipe. | User Q4 pick |
| ML5 | **Open `footerSlot` + ship `<NavUser>` part** with `user` + `menuItems` config. Fixture demo wires the kasder-style recipe. | User Q5 pick |
| ML6 | **Active detection:** `isActive?` predicate wins; else per-item `match?: "exact" \| "prefix"` (default `"exact"`). | User Q6 pick |
| ML7 | **Shared `<NavBadge>` part** lives in `sidebar-nav-01/parts/nav-badge.tsx`; `bottom-tab-bar-01` imports via relative path per F-S1 lock. | User Q7 pick |
| ML8 | **`navigation` category already exists** — no `categories.ts` edit needed. | Confirmed by reading `src/registry/categories.ts` line 16–21 |
| ML9 | **Tooltip-on-collapsed for sidebar icon-only state** via shadcn `<Tooltip>`; F-cross-13 defensive pattern applied. | User confirmed locked extra |
| ML10 | **Single feature-complete v0.1 per procomp** — no v0.2 / v0.3 deferrals. Same posture as `todo-tree` v0.1.0. | User confirmed locked extra |

## Definition of "done" for THIS document (intake gate)

- [x] All source artifacts read in full (both files, 244 LOC total).
- [x] Design DNA distilled — visible visual / behavioral decisions catalogued, not "vibes."
- [x] Structural debt enumerated by category — portability, controlled-mode, slots, active detection, shared part, a11y, cleanup.
- [x] Dependency audit with port-action column.
- [x] Dynamism + optimization + a11y gaps consolidated.
- [x] Proposed scope explicit — two procomps, naming locked, build order locked.
- [x] Recommendation explicit — proceed.
- [x] All 10 user-locked decisions recorded with the pick rationale.
- [ ] **User sign-off below → unlocks GATE 1 (sidebar-nav-01 description).**

---

## Appendix — original code snippets worth quoting in the description

Two pieces of the source are subtle enough that re-reading them in GATE 1 will save a re-discovery:

**Badge-position branching by collapsed mode** (`SocialSidebar.tsx:101–113`):

```tsx
{item.badge && item.badge > 0 && (
  <span className={cn(
    "absolute flex items-center justify-center min-w-5 h-5 text-xs font-medium rounded-full",
    isCollapsed ? "top-1 right-1" : "right-3",
    isActive ? "bg-accent text-accent-foreground" : "bg-destructive text-destructive-foreground"
  )}>
    {item.badge}
  </span>
)}
```

→ ports to `<NavBadge value={item.badge} position={isCollapsed ? "corner" : "inline-end"} tone={isActive ? "accent" : "destructive"} max={9} />`.

**Triple-signal active state** (`SocialBottomNav.tsx:48–64`):

```tsx
<item.icon className={cn("h-6 w-6 transition-transform", isActive && "scale-110")} />
{/* ...badge... */}
<span className="text-[10px] font-medium">{item.label}</span>
{isActive && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />}
```

→ ports to the `"scale-dot"` default variant of `bottomActiveVariant`. The dot's `bottom-1` position is preserved; the `scale-110` is gated on `motion-safe:scale-110` to respect `prefers-reduced-motion`.

**Dropdown align-flip** (`SocialSidebar.tsx:151`):

```tsx
<DropdownMenuContent align={isCollapsed ? "center" : "end"} className="w-56 z-9999">
```

→ ports to `<NavUser>` internal logic: when the ancestor sidebar is `data-collapsed="true"`, the trigger's dropdown renders with `align="center"`; otherwise `align="end"`. `z-9999` drops (use `z-50` per token; if stacking issues, address with a real layer system, not a typo).

---

## Audit additions (deep re-validation pass — 2026-05-22)

> Self-audit per [`feedback_re_validation_pass_catches_real_issues`](../../../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/feedback_re_validation_pass_catches_real_issues.md): "never rubber-stamp draft → sign-off; consistently surfaces 1–3 substantive refinements per Stage 1 description, 3–5 per Stage 2 plan; same pattern for migration intakes."
>
> Pass cross-checked the analysis above against: (1) `todo-tree` v0.1.2 precedent (most-recent shipped sibling-pair); (2) project memory hooks [`project_cross_procomp_imports`](../../../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/project_cross_procomp_imports.md), [`project_shadcn_primitive_radix_baseui_divergence`](../../../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/project_shadcn_primitive_radix_baseui_divergence.md), [`feedback_dynamicity_reusability_primacy`](../../../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/feedback_dynamicity_reusability_primacy.md); (3) design-system mandate (CLAUDE.md §Design system mandate); (4) registry conventions (CLAUDE.md §Registry conventions); (5) Tailwind v4 / React 19 / Next 16 stack realities.
>
> 23 findings across 6 categories. All folded back as locks (ML11–ML22) + the expanded inventories below.

### Findings (severity-ordered)

| # | Sev | Finding | Category | Resolution |
|---|---|---|---|---|
| A-01 | ⚠️ High | **Headless state hook missing** — todo-tree L16 + L20 pattern says: ship `useTodoTreeState` so consumers can lift state for BYO UI. Original analysis omits the parallel for sidebar-nav-01. | Convention parity | **ML11** — add `useSidebarNavState()` returning `{ isCollapsed, setCollapsed, toggleCollapsed, isMobileOpen, setMobileOpen, toggleMobile, activeItemId, activeItem, visibleItems, getItemById, getActiveItem }`. Bare `<SidebarNav>` uses it internally; consumers wanting to lift state pass it back via a `state?: SidebarNavStateValue` prop. |
| A-02 | ⚠️ High | **Mobile-drawer trigger has no home** — in mobile mode the sidebar is hidden; the hamburger button (currently inline in source) must live in the consumer's app header, not inside the sidebar's now-hidden DOM. Without a companion trigger component, the consumer is on their own to wire the controlled prop. | Missing companion | **ML12** — ship `<SidebarNavTrigger>` companion that the consumer mounts wherever in their app header. It connects via React context emitted by `<SidebarNav>` (or, when sidebar is uncontrolled, by direct prop). Renders an icon button with `aria-controls` + `aria-expanded` pointing at the drawer; respects the same `linkComponent`-less plain-`<button>` rule. |
| A-03 | ⚠️ High | **Item schema is shallow.** Original analysis treats `NavItem` like the kasder source (`icon` + `label` + `path` + `badge?`). Real consumers need richer items: icon that's either a lucide component OR a custom ReactNode (emoji, SVG, image), keyboard `shortcut` hint, longer `description` for richer tooltip body, right-side `accessory` (count, chevron, status dot), `tooltipContent` override, `target` + `rel` for external links, `onClick` for action-style items, and per-item `disabled` / `hidden`. | Dynamicity primacy | **ML13** — expanded `NavItem` schema; details in §Expanded item schema below. |
| A-04 | ⚠️ High | **Item grouping / sections / dividers missing.** Source has a flat 6-item list. Real app shells group items into sections ("Main" / "Personal" / "Admin") with optional headers + dividers. Forcing consumers to flatten or use the `renderItem` slot for this is a v0.2 trap — add it later means breaking change. | Dynamicity primacy | **ML14** — `items: ReadonlyArray<NavEntry>` where `NavEntry = NavItem \| NavSection \| NavSeparator`. Discriminated union via `kind` field. Sections can be `collapsible?: boolean` with their own collapse state (separate from sidebar collapse). |
| A-05 | ⚠️ High | **`linkComponent` interface unspecified.** Original analysis names the prop but doesn't pin the shape — consumers can't type their Next.js / React Router / TanStack adapter without it. | API rigor | **ML15** — concrete `NavLinkProps` + `NavLinkComponent` types exported from `sidebar-nav-01/types`; details in §Expanded API additions. |
| A-06 | 🔸 Medium | **Three-defenses claim for discrete boolean state was inaccurate** in original analysis (mentioned "suppress-mid-flow" guarding 300ms transition). Discrete boolean state has no continuous flow. Defense 3 is N/A. | Convention accuracy | ✅ **Corrected inline above** in Controlled-mode + state section. |
| A-07 | ⚠️ High | **CSS variable theme surface missing.** Project convention (per `xyflow-react-pro` skill: `--xy-*` custom properties) is to expose component dimensions / colors / timings as CSS vars so consumers can theme without prop drilling. Sidebar's widths (80px / 256px), transition duration (300ms), active-row surface tint, accent stripe color, badge dimensions — all should be CSS vars consumers can override at any DOM scope. | Project pattern | **ML16** — expose `--ilinxa-sidebar-w-collapsed` (default `5rem`), `--ilinxa-sidebar-w-expanded` (`16rem`), `--ilinxa-sidebar-transition-duration` (`300ms`), `--ilinxa-sidebar-row-h` (`2.75rem`), `--ilinxa-nav-active-bg`, `--ilinxa-nav-active-fg`, `--ilinxa-nav-active-bar-w` (for `"left-bar" \| "right-bar"` variants), `--ilinxa-nav-badge-size` (default `1.25rem`), `--ilinxa-nav-indent-step` (for nested sub-items if scope opens). Props remain as escape hatch for one-off overrides. |
| A-08 | ⚠️ High | **Sidebar active-style is hardcoded `bg-primary` fill.** Modern app shells offer multiple active visuals; locking the source's full-fill default means consumers wanting a left-edge accent bar (Linear), right-edge bar (Notion), subtle muted bg (Slack), or pure outline (vscode) must use `renderItem` slot. Bar variants are common enough to ship as a prop. | Dynamicity primacy | **ML17** — `activeVariant?: "fill" \| "left-bar" \| "right-bar" \| "outline" \| "subtle"` (default `"fill"`, matches source). Slot-priority rule applies: `renderItem` overrides everything. |
| A-09 | ⚠️ High | **Slot priority rule not made explicit.** todo-tree L15 locks "slot wins over prop variant when both supplied for the same surface." Original analysis implies it via "fallback chain" language but doesn't lock it. | Convention parity | **ML18** — explicit lock: when `renderItem` AND `activeVariant` / `renderBadge` AND `<NavBadge>` configuration / `brandSlot` AND `<NavBrand>` config are simultaneously provided, **the render-prop slot wins**. Documented in description + guide. |
| A-10 | 🔸 Medium | **Items[] scrollability missing.** With a flat 6-item list (source) it's invisible; with a 20+ item config (real-world) the user footer will be pushed off-screen. The middle nav zone needs `overflow-y-auto` with a thin scrollbar token. | Robustness | **ML19** — middle nav zone is `flex-1 min-h-0 overflow-y-auto` with `scrollbar-thin scrollbar-thumb-muted` (or equivalent v4 utility); brand row + user footer stay sticky in their zones. |
| A-11 | 🔸 Medium | **`autoCloseMobileOnNavigate` UX expectation unmodeled.** When user taps an item in the mobile drawer, the drawer should close (after the route change). Standard app-shell UX; if not opt-out-able, consumers who want the drawer to STAY open (rare but real — e.g., side-by-side picker apps) are blocked. | Robustness | **ML20** — `autoCloseMobileOnNavigate?: boolean` default `true`. Implementation: after the consumer's `onClick` resolves (or `linkComponent` mounts), call `setMobileOpen(false)`. |
| A-12 | 🔸 Medium | **localStorage persist for collapse state** is the most common consumer ask the controlled prop solves. Worth shipping an opt-in built-in to avoid every consumer reinventing the same hook. | Robustness | **ML21** — `storageKey?: string` opt-in: when supplied, sidebar persists `isCollapsed` + section-collapse states to `localStorage[storageKey]`. Uncontrolled mode only; controlled mode is the consumer's responsibility. SSR-safe (effect-gated read; no reads during render). |
| A-13 | 🔸 Medium | **SSR-safe matchMedia for breakpoint detection.** Risk only flagged inline; deserves a dynamism row. `mobileBreakpoint?: "sm" \| "md" \| "lg" \| "xl"` resolves via a `useMatchMedia(query)` hook in `hooks/`; isomorphic-safe init returns `false` (= "not yet matching mobile") during SSR + first client render, then transitions on `useEffect`. Hydration mismatch avoided by gating mobile-mode classes behind a `mounted` state. | Robustness | Captured in §Optimization additions. |
| A-14 | 🔸 Medium | **`<NavUser>` avatar status dot missing.** Modern social apps (Discord, Slack, Linear) show presence on the user avatar. The cost is one boolean+enum prop + a tiny absolute-positioned dot; the value is honoring the source aesthetic. | Dynamicity primacy | **ML22-a** — `user.status?: "online" \| "offline" \| "busy" \| "away" \| "invisible"` + status-dot positioned bottom-right of avatar; color via tokens (`bg-emerald-500` / `bg-red-500` / `bg-amber-500` / `bg-zinc-400` / no-render). |
| A-15 | 🔸 Medium | **NavUser menu items as discriminated union** is cleaner than per-item `separator?: "before" \| "after"`. Source has one explicit separator between Settings and Logout — discriminated union models this exactly. | API rigor | **ML22-b** — `menuItems: ReadonlyArray<NavUserMenuItem \| { kind: "separator" }>`. NavUserMenuItem = `{ kind: "item"; icon?; label; onClick?; href?; variant?: "default" \| "destructive"; shortcut?; disabled?; }`. |
| A-16 | 🔸 Medium | **Sidebar side `"left" \| "right"`** — RTL languages, design preference (right-edge sidebar in some admin apps). | Dynamicity primacy | **ML22-c** — `side?: "left" \| "right"` default `"left"`. Mirrors border + dropdown align-flip + mobile-trigger position. |
| A-17 | 🔸 Medium | **Bottom-nav hide-on-scroll opt-in** — common social app pattern. Hides when scroll-down crosses a threshold, reveals on scroll-up. | Dynamicity primacy | **ML22-d** — `hideOnScroll?: boolean \| { threshold?: number; scrollContainer?: () => HTMLElement \| null }` default `false`. When enabled, transforms via `translate-y-full` with `transition-transform`. SSR-safe (effect-gated scroll listener). Lives on `bottom-tab-bar-01`. |
| A-18 | 🔸 Medium | **Loading / skeleton state** missing. When the consumer's items[] is async (e.g., permission-filtered server-side), the sidebar paints empty until data arrives. Ship a `loading?: boolean` + skeleton renderer. | Robustness | **ML22-e** — `loading?: boolean` + `renderLoading?: (args: { defaultRender: ReactNode }) => ReactNode` slot. Default skeleton = 4-6 muted shimmer rows matching collapsed/expanded width. Same for `bottom-tab-bar-01`. |
| A-19 | 🔹 Low | **Reduced-motion gating** flagged but not concrete. Spell out: width-morph + active-icon `scale-110` both wrapped in `motion-safe:` utilities; CSS `prefers-reduced-motion: reduce` users see instant width snap + no scale lift (color + dot signals still convey active state). | A11y rigor | Captured in §Accessibility additions. |
| A-20 | 🔸 Medium | **Bottom-nav role decision left open.** Original analysis said "default to route semantics OR expose `interactionRole`". Close the question: default to `<a>` + `aria-current="page"` (route semantics); add `interactionRole?: "link" \| "tab"` for the rare consumer using bottom-nav as a tab control over a single page. | A11y rigor | Captured in §Accessibility additions. |
| A-21 | 🔸 Medium | **`headerSlot` for sidebar above brand** — common app-shell pattern (workspace switcher, env badge, search input, env-banner). Original analysis lists `brandSlot` but not a separate `headerSlot`. | Dynamicity primacy | **ML22-f** — `headerSlot?: ReactNode` renders ABOVE `brandSlot` in the brand-row zone. Most consumers leave it null; power consumers use it for workspace switcher / env banner. |
| A-22 | 🔸 Medium | **`drawerHeaderSlot` for mobile-drawer-only chrome** — when the Sheet drawer opens, it may want different top-bar chrome than the desktop sidebar (close button, drawer title, back button). | Dynamicity primacy | **ML22-g** — `drawerHeaderSlot?: ReactNode` renders inside Sheet header when in mobile-drawer mode. Defaults to a thin row with the brand + close button. |
| A-23 | 🔹 Low | **Estimated surface counts in Recommendation** don't reconcile with the new slot/event inventories. Original said "~8 slot props / ~12 events" — post-audit becomes ~12 slots / ~16 events for sidebar-nav-01 and ~5 slots / ~7 events for bottom-tab-bar-01. | Doc hygiene | Captured in §Updated estimated surface. |

### Inline corrections (already applied above)

| # | Original claim | Corrected claim |
|---|---|---|
| C-1 | "controlled mode applies the three-defenses pattern … suppress-mid-flow guards against double-fires during the 300ms transition" | Defenses 1+2 apply; Defense 3 does NOT (no continuous flow for discrete boolean). Applied to both `isCollapsed` and `isMobileOpen`. |
| C-2 | Shared `<NavBadge>` location implied "`sidebar-nav-01/parts/`" — left unstated against the legacy `navigation/_shared/file-clipboard.tsx` precedent. | Confirmed: `sidebar-nav-01/parts/nav-badge.tsx` per F-S1 lock (post-F-S1 procomps don't use `_shared/` legacy pattern). `bottom-tab-bar-01` imports via relative path `../sidebar-nav-01/parts/nav-badge` — never `@ilinxa/sidebar-nav-01`. |

### Expanded item schema (ML13 + ML14)

```ts
// Three discriminated members of NavEntry
export interface NavItem {
  kind?: "item";                         // optional; missing kind defaults to "item"
  id: string;                            // required — used by active detection + permissions + state keys
  label: string;                         // visible name + a11y name
  icon?: ReactNode | ComponentType<{ className?: string }>;  // both forms accepted
  href?: string;                         // navigation destination
  onClick?: (event: React.MouseEvent) => void;  // action-style item
  // INVARIANT: at least one of href / onClick must be present
  badge?: number | string | NavBadgeConfig;  // shorthand or full config
  match?: "exact" | "prefix";            // fallback when isActive predicate not supplied
  shortcut?: string;                     // e.g. "⌘K", "G then H" — rendered right-of-label OR in tooltip
  description?: string;                  // longer tooltip body OR sub-label paint (consumer choice)
  accessory?: ReactNode;                 // right-side custom node (chevron, count chip, status dot)
  tooltipContent?: ReactNode;            // override the tooltip's contents entirely (defaults to label + shortcut + description)
  target?: "_blank" | "_self" | "_parent" | "_top";  // external link
  rel?: string;                          // paired with target
  permission?: string;                   // gating key — item hidden if `permissions` Set doesn't include it
  disabled?: boolean;                    // renders, but inert + aria-disabled
  hidden?: boolean;                      // not rendered at all (precedes permission gate)
  className?: string;
  "data-testid"?: string;
}

export interface NavSection {
  kind: "section";
  id: string;
  title?: string;                        // section header; if undefined, renders an untitled group
  icon?: ReactNode | ComponentType<{ className?: string }>;  // header icon for collapsible sections
  collapsible?: boolean;                 // section can independently collapse
  defaultCollapsed?: boolean;            // section's initial collapse (uncontrolled)
  items: ReadonlyArray<NavItem>;         // nested-items disallowed in v0.1 (flat sections)
  permission?: string;                   // hides whole section
  hidden?: boolean;
}

export interface NavSeparator {
  kind: "separator";
  id?: string;                           // optional; React key fallback
}

export type NavEntry = NavItem | NavSection | NavSeparator;
```

### Expanded API additions (ML15 + new props)

```ts
// linkComponent contract
export interface NavLinkProps {
  href: string;
  className?: string;
  "aria-current"?: "page" | undefined;
  "aria-label"?: string;
  "data-active"?: boolean;
  children?: ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onFocus?: (e: React.FocusEvent) => void;
  target?: string;
  rel?: string;
  ref?: React.Ref<HTMLAnchorElement>;
  [key: `data-${string}`]: unknown;
}
export type NavLinkComponent = ComponentType<NavLinkProps>;

// SidebarNavProps additions beyond what the original analysis sketched
interface SidebarNavPropsAuditAdditions {
  // Items (replaces flat `items: NavItem[]`)
  items: ReadonlyArray<NavEntry>;

  // Active-detection
  isActive?: (item: NavItem, currentPath: string) => boolean;
  defaultMatch?: "exact" | "prefix";     // applies when item.match unset; default "exact"

  // Link primitive
  linkComponent?: NavLinkComponent;      // default = built-in `<a href>` wrapper

  // CSS-var theming escape hatch
  collapsedWidth?: string;               // CSS length; sets --ilinxa-sidebar-w-collapsed (default "5rem")
  expandedWidth?: string;                // sets --ilinxa-sidebar-w-expanded (default "16rem")
  transitionDuration?: string;           // sets --ilinxa-sidebar-transition-duration (default "300ms")
  activeVariant?: "fill" | "left-bar" | "right-bar" | "outline" | "subtle";  // default "fill"

  // Layout
  side?: "left" | "right";               // default "left"

  // Mobile drawer
  mobileBreakpoint?: "sm" | "md" | "lg" | "xl";  // default "lg"
  mobileDrawerSide?: "left" | "right";   // default = same as `side`
  autoCloseMobileOnNavigate?: boolean;   // default true

  // Persistence
  storageKey?: string;                   // opt-in localStorage; uncontrolled mode only

  // Permissions
  permissions?: ReadonlySet<string>;     // membership-only; richer gating is consumer responsibility

  // Slots (new)
  headerSlot?: ReactNode;                // ABOVE brandSlot in the brand-row zone
  brandSlot?: ReactNode;
  primaryActionSlot?: ReactNode;
  primaryAction?: NavPrimaryActionConfig;  // shorthand for the default <NavPrimaryAction>
  footerSlot?: ReactNode;
  drawerHeaderSlot?: ReactNode;          // mobile-drawer-only top chrome
  navAccessorySlot?: ReactNode;          // right of brand (collapse toggle by default; consumer override)

  // Render-prop slots
  renderItem?: (args: { item: NavItem; isActive: boolean; isCollapsed: boolean; defaultRender: ReactNode }) => ReactNode;
  renderBadge?: (args: { item: NavItem; defaultRender: ReactNode }) => ReactNode;
  renderTooltipContent?: (args: { item: NavItem }) => ReactNode;
  renderSection?: (args: { section: NavSection; defaultRender: ReactNode }) => ReactNode;
  renderLoading?: (args: { defaultRender: ReactNode }) => ReactNode;
  renderEmptyState?: (args: { reason: "no-items" | "all-filtered-by-permission" }) => ReactNode;

  // State + loading
  loading?: boolean;
  state?: SidebarNavStateValue;          // lifted from useSidebarNavState

  // Standard
  className?: string;
  style?: React.CSSProperties;
  "aria-label"?: string;
  skipLinkTarget?: string;               // e.g. "#main-content"
}

// Imperative handle (the SidebarNavHandle ref)
interface SidebarNavHandle {
  // Collapse
  toggleCollapse(): void;
  setCollapsed(next: boolean): void;
  isCollapsed(): boolean;

  // Mobile drawer
  openMobile(): void;
  closeMobile(): void;
  toggleMobile(): void;
  isMobileOpen(): boolean;

  // Section state
  toggleSection(sectionId: string): void;
  expandSection(sectionId: string): void;
  collapseSection(sectionId: string): void;
  expandAllSections(): void;
  collapseAllSections(): void;
  isSectionCollapsed(sectionId: string): boolean;

  // Items + active
  getItems(): ReadonlyArray<NavEntry>;
  getItemById(id: string): NavItem | undefined;
  getActiveItem(): NavItem | undefined;

  // Focus
  focusItem(id: string): void;
  focusFirstItem(): void;
  focusLastItem(): void;

  // Snapshot
  getState(): SidebarNavStateValue;
}

// Headless state hook (ML11)
export interface SidebarNavStateValue extends SidebarNavHandle {
  // Live state values mirroring the handle's getters as fields
  collapsed: boolean;
  mobileOpen: boolean;
  collapsedSectionIds: ReadonlySet<string>;
  activeItemId: string | null;
  activeItem: NavItem | null;
  visibleEntries: ReadonlyArray<NavEntry>;  // post permission + hidden filter
}

export function useSidebarNavState(
  options?: {
    defaultCollapsed?: boolean;
    defaultMobileOpen?: boolean;
    defaultCollapsedSectionIds?: ReadonlyArray<string>;
    items?: ReadonlyArray<NavEntry>;
    currentPath?: string;
    isActive?: (item: NavItem, currentPath: string) => boolean;
    permissions?: ReadonlySet<string>;
    storageKey?: string;
  },
): SidebarNavStateValue;
```

### Expanded slot inventory

**`sidebar-nav-01` — 12 slots total**

1. `headerSlot` — ABOVE brand
2. `brandSlot` — brand row (with `<NavBrand>` prefab for default)
3. `navAccessorySlot` — right of brand (collapse toggle by default)
4. `primaryActionSlot` — below nav list (with `<NavPrimaryAction>` prefab + `primaryAction` shorthand config)
5. `footerSlot` — user footer (with `<NavUser>` prefab)
6. `drawerHeaderSlot` — mobile drawer top chrome
7. `renderItem` — full row override (slot-priority winner)
8. `renderBadge` — badge cell override
9. `renderTooltipContent` — tooltip body override
10. `renderSection` — section header + group override
11. `renderLoading` — skeleton state
12. `renderEmptyState` — when no items render

**`bottom-tab-bar-01` — 5 slots total**

1. `centerSlot` — center FAB slot (opt-in, via `centerVariant`)
2. `renderItem` — full item override
3. `renderBadge` — badge override
4. `renderLoading` — skeleton state
5. `renderEmptyState`

### Expanded event inventory

**`sidebar-nav-01` — 16 events** (all object-args per post-F-cross-12 convention)

1. `onCollapsedChange({ collapsed })`
2. `onMobileOpenChange({ open, reason: "trigger" | "item-click" | "outside-click" | "escape" | "imperative" })`
3. `onItemClick({ item, isActive, event })`
4. `onItemHover({ item, event })`
5. `onItemFocus({ item, event })`
6. `onItemNavigate({ item })` — fires AFTER `onItemClick` if `event.defaultPrevented === false`
7. `onActiveItemChange({ item, previousItem })`
8. `onSectionToggle({ section, collapsed })`
9. `onPermissionDenied({ item, requiredPermission })` — when filtering out
10. `onBrandClick({ event })`
11. `onPrimaryActionClick({ event })`
12. `onFooterTriggerOpen({ open })` — footer dropdown open/close
13. `onFooterMenuItemClick({ menuItem, event })`
14. `onSkipLinkActivated({ event })` — diagnostic; rarely subscribed
15. `onMount({ initialState })` — diagnostic
16. `onUnmount()` — diagnostic; for state-persistence finalize

**`bottom-tab-bar-01` — 7 events**

1. `onItemClick({ item, isActive, event })`
2. `onItemNavigate({ item })`
3. `onActiveItemChange({ item, previousItem })`
4. `onCenterSlotInteract({ event })`
5. `onHideOnScroll({ hidden })`
6. `onMount({ initialState })`
7. `onUnmount()`

### Optimization additions (ML21 + A-13 + A-18)

- **`useMatchMedia(query)` hook** — isomorphic-safe. Returns `false` during SSR + first client render; transitions on `useEffect` mount. No hydration mismatch; mobile-mode classes gated behind a `mounted` flag.
- **`storageKey` (localStorage) opt-in** — read in `useEffect` (not render); write in `useEffect([state])`. JSON-encoded. Schema versioned (`{ v: 1, collapsed: boolean, collapsedSectionIds: string[] }`); reset gracefully on version mismatch.
- **Loading skeleton** — match collapsed/expanded width; 4–6 shimmer rows; CSS animation (no JS); respects `prefers-reduced-motion` (static muted rows).
- **`React.memo` on `<NavRow>`** — items pass via `==`-stable refs; only one row flips active per route change so memoization wins.
- **Sheet lazy-mount** — `import("@/components/ui/sheet")` is sync, but content children only render when `mobileOpen === true`. Use `{mobileOpen && <SheetContent>…</SheetContent>}` pattern; Radix's mount lifecycle handles focus trap on mount.
- **Bottom-nav scroll listener** — passive listener (`{ passive: true }`); rAF-throttled; deactivates on unmount + when `hideOnScroll` flips false.

### Accessibility additions (A-19 + A-20)

- **Reduced-motion (concrete)** — width morph wrapped `motion-safe:transition-[width] motion-safe:duration-[var(--ilinxa-sidebar-transition-duration)]`; active-icon scale wrapped `motion-safe:scale-110`. CSS `@media (prefers-reduced-motion: reduce)` users get instant width snap + no icon scale. Color + dot signals still differentiate active state.
- **Bottom-nav role default** — `<a>` + `aria-current="page"` (route semantics). Opt-in `interactionRole?: "link" | "tab"`; when `"tab"`, root carries `role="tablist"`, items carry `role="tab"` + `aria-selected`, parent must wrap a controlled `[role="tabpanel"]`.
- **`<SidebarNavTrigger>` ARIA** — `<button aria-controls={sidebarId} aria-expanded={mobileOpen} aria-label="…">`; consumer-supplied `aria-label` defaults to `"Open navigation"` / `"Close navigation"`.
- **Skip-link** — when `skipLinkTarget` supplied, sidebar renders `<a href={skipLinkTarget} className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-card focus:p-2 focus:shadow">{skipLinkLabel ?? "Skip to main content"}</a>` as first child.
- **Section a11y** — collapsible sections use `<button aria-expanded aria-controls>` for the header; section body is `role="group" aria-labelledby`.
- **Tooltip suppression on active row** — when item is active (and label is hidden because collapsed), the tooltip still shows label (a11y net) BUT description is omitted (no info value while sitting on the active page).

### Updated estimated surface

| Procomp | Files (est) | Slots | Events | Handle methods | Internal deps | New shadcn primitives | New npm peers |
|---|---|---|---|---|---|---|---|
| `sidebar-nav-01` | **~32** (up from ~28) | **12** (up from ~8) | **16** (up from ~12) | **~22** | `react`, `@/components/ui/button`, `@/components/ui/avatar`, `@/components/ui/dropdown-menu`, `@/components/ui/tooltip` NEW, `@/components/ui/sheet` NEW, `@/components/ui/separator`, `@/lib/utils` | tooltip, sheet, separator | lucide-react (already present in lib) |
| `bottom-tab-bar-01` | **~16** (up from ~14) | **5** (up from ~3) | **7** (up from ~6) | n/a (stateless) | `react`, `@/components/ui/button`, `../sidebar-nav-01/parts/nav-badge`, `../sidebar-nav-01/types`, `@/lib/utils` | none net-new | none net-new |

Both still target single feature-complete v0.1.0 (no v0.2 / v0.3 deferrals — per ML10).

### Final lock list (consolidated ML1–ML22 after audit)

| # | Lock | Source |
|---|---|---|
| ML1 | Two sibling procomps in `navigation` category | User Q1 |
| ML2 | Sheet-based mobile drawer variant of sidebar | User Q2 |
| ML3 | Opt-in center FAB on bottom-nav (`centerSlot` + `centerVariant`) | User Q3 |
| ML4 | Open `brandSlot` + `<NavBrand>` prefab | User Q4 |
| ML5 | Open `footerSlot` + `<NavUser>` prefab w/ `menuItems` config | User Q5 |
| ML6 | `isActive?` predicate wins; per-item `match` fallback | User Q6 |
| ML7 | Shared `<NavBadge>` in `sidebar-nav-01/parts/` (F-S1 relative-path import from sibling) | User Q7 |
| ML8 | `navigation` category exists — no edit needed | Confirmed in code |
| ML9 | Tooltip-on-collapsed via shadcn `<Tooltip>`; F-cross-13 defensive | User locked extra |
| ML10 | Single feature-complete v0.1 per procomp | User locked extra |
| **ML11** | **Headless `useSidebarNavState` hook ships in v0.1** (todo-tree L16 parity) | Audit A-01 |
| **ML12** | **`<SidebarNavTrigger>` companion component ships in same package** — wires via context (uncontrolled) or props (controlled); consumer mounts in app header for mobile-drawer trigger | Audit A-02 |
| **ML13** | **Expanded `NavItem` schema** — `icon: ReactNode \| ComponentType`, `shortcut?`, `description?`, `accessory?`, `tooltipContent?`, `href? + onClick?` (one required), `target`/`rel`, `disabled`, `hidden`, `permission?` | Audit A-03 |
| **ML14** | **`items: ReadonlyArray<NavEntry>` discriminated union** — `NavItem \| NavSection \| NavSeparator`; sections are flat (no nested sub-items in v0.1) but can be `collapsible` | Audit A-04 |
| **ML15** | **Concrete `NavLinkProps` + `NavLinkComponent` types exported** from `sidebar-nav-01/types`; default `linkComponent` = built-in `<a href>` wrapper | Audit A-05 |
| **ML16** | **CSS variable theme surface** — `--ilinxa-sidebar-*` custom properties for widths / transition / row-height / active surface / badge size; props remain as escape hatch | Audit A-07 |
| **ML17** | **`activeVariant?: "fill" \| "left-bar" \| "right-bar" \| "outline" \| "subtle"`** default `"fill"` matches source | Audit A-08 |
| **ML18** | **Slot priority rule** — render-prop slots win over prop variants when both supplied for the same surface (`renderItem` > `activeVariant`; `renderBadge` > `<NavBadge>` config; `brandSlot` > `<NavBrand>` config; etc.) | Audit A-09 |
| **ML19** | **Items list scrollable** — middle nav zone `flex-1 min-h-0 overflow-y-auto` with thin scrollbar; brand + footer sticky | Audit A-10 |
| **ML20** | **`autoCloseMobileOnNavigate?: boolean` default `true`** | Audit A-11 |
| **ML21** | **`storageKey?: string` opt-in localStorage persistence** for collapse + section-collapse state (uncontrolled mode only) | Audit A-12 |
| **ML22** | **Bundle of medium-rank dynamicity locks** (ML22-a … ML22-g): `user.status?` dot, `menuItems` discriminated union (item / separator), `side?: "left" \| "right"`, `hideOnScroll?` on bottom-nav, `loading?` + skeleton, `headerSlot`, `drawerHeaderSlot` | Audit A-14 .. A-22 |

### Additional risks (R9–R11)

| # | Risk | Mitigation |
|---|---|---|
| R9 | **`items: NavEntry[]` discriminated union surface bloats consumer typing.** The simple `NavItem[]` shape was easier to teach. | Ship two type names: `SidebarNavItems = ReadonlyArray<NavEntry>` AND `BasicNavItems = ReadonlyArray<NavItem>` (auto-narrowed for the flat case). Usage examples lead with the flat case; sections + separators introduced in a "More options" section. |
| R10 | **`useSidebarNavState` + `<SidebarNav state>` lifting pattern duplicates source-of-truth risk** if consumer also passes `isCollapsed` / `defaultCollapsed` props. Three sources of truth now: bare props / lifted hook / parent-controlled. | Resolution rule (locked in description): if `state` is supplied, it WINS over `isCollapsed` + `defaultCollapsed` + `isMobileOpen` + `defaultMobileOpen` props. Console.warn in dev mode if both. |
| R11 | **`<SidebarNavTrigger>` requires context bridging** between sidebar and trigger that live in different React subtrees. If consumer forgets the `<SidebarNavProvider>` wrapper (when one is needed), trigger silently does nothing. | Two-tier strategy: (a) Default — `<SidebarNav>` auto-emits a context with a stable provider; `<SidebarNavTrigger>` reads via `useContext`. If trigger is mounted before sidebar (DOM order), it queues via the provider that lives at `<SidebarNavProvider>` wrapper level. (b) Escape — consumer passes explicit `controls={ref.current}` prop on trigger pointing at the sidebar's imperative handle (bypasses context). Plan §X locks the provider's hoisting strategy. |

### Audit summary

**Convention parity:** original analysis omitted the headless hook (todo-tree L16) and the mobile-drawer trigger companion — both shipped in similar procomps and expected by the convention. Folded back as ML11 + ML12.

**Dynamicity primacy:** original treated NavItem as the kasder source's flat shape — missed the natural expansion (icon-as-ReactNode, shortcut, description, accessory, tooltipContent, sections, separators, status dot, side). The "add it later" tax these items would incur as breaking changes is the exact failure mode the dynamicity feedback memory describes. Folded back as ML13 + ML14 + ML22.

**API rigor:** `linkComponent` named without a typed shape was an open-ended hand-off to consumers; tightened to a concrete `NavLinkProps` (ML15). Slot-priority rule (ML18) made explicit per todo-tree L15 parity.

**Project pattern:** CSS-variable theme surface (ML16) is the project pattern from `xyflow-react-pro`; original analysis only mentioned token-driven colors, not the CSS-var escape hatch. Locked.

**Convention accuracy:** three-defenses claim for discrete boolean state was wrong in subtle but real way — Defense 3 doesn't apply. Corrected inline (C-1).

**Robustness:** scroll overflow (ML19), auto-close-on-navigate (ML20), localStorage persist (ML21), loading skeleton, role default — all common consumer asks the original analysis would have forced into v0.2.

**Net effect:** sidebar-nav-01 grew from ~28 files / ~8 slots / ~12 events to ~32 files / 12 slots / 16 events with a 22-method imperative handle + headless hook + trigger companion. Bottom-tab-bar-01 grew modestly (~14 → ~16 files; 3 → 5 slots; 6 → 7 events). Both still target single feature-complete v0.1.0 ship.

**Recommendation stands:** **proceed** to GATE 1 description for `sidebar-nav-01` after user signs off on this audit.
