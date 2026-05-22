# Analysis — socialmedia-adv-nav-system → ilinxa-ui-pro

> **Status:** Deep-dive complete (2026-05-22). Awaiting sign-off before authoring GATE 1 docs. Author: assistant.
>
> **Premise:** `rich-sidebar` v0.1.x was built from the wrong source (the kasder flat-list sidebar). The real source is a **multi-context app shell** — 8 components + 2 hooks + 1 config module + 2 type files + 7 test files — that drives the entire nav surface (desktop sidebar, mobile bottom bar, mobile menu sheet, topbar) off a single URL-derived "nav context" and a declarative config catalog. This analysis maps what to lift, what to leave consumer-side, and how the lifted parts compose into ilinxa-ui-pro's roadmap.
>
> **Investigation depth:**
> - ✅ All 9 navigation component files (read end-to-end)
> - ✅ All 5 component test files + 2 hook test files (the executable spec — 700+ LOC)
> - ✅ membership-store + auth-store (full source)
> - ✅ navigation-config.ts (462 LOC catalog) + types/navigation.ts + types/rbac.ts (Membership shape)
> - ✅ GovernanceSessionBar + BusinessCreationRequestButton + CreateBusinessDialog
> - ✅ membership-api.ts (`fetchMyMembershipsApi` contract)
> - ✅ App-router layouts that compose the system: `(app)/layout.tsx` + `(public)/layout.tsx`
> - ✅ 3 user journeys traced through the source (personal→business, business→CMS sub-mode, governance entry)
> - ✅ Permission code inventory (17 unique codes catalogued)
> - ✅ Naming-collision audit (CCONSOLE_PLATFORM_SEGMENTS vs business slugs, accountId vs slug, accountName fallback)

---

## 1. System overview

The source isn't one component — it's a **navigation system** composed of seven render-time pieces plus three derivation-time pieces:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        URL pathname                                  │
│                            │                                         │
│                            ▼                                         │
│                  ┌─────────────────────┐                             │
│                  │  useNavContext()    │  ← reads URL + memberships  │
│                  └──────────┬──────────┘                             │
│                             │                                        │
│                ┌────────────┴───────────────┐                        │
│                ▼                            ▼                        │
│       NavContext (discriminated union)                               │
│   personal | business{slug} | platform                               │
│   | governance | cms{platform|business{slug}}                        │
│                            │                                         │
│                            ▼                                         │
│                  ┌─────────────────────┐                             │
│                  │  useFilteredNav()   │  ← config + memberships +   │
│                  │                     │    permissions + ownership  │
│                  └──────────┬──────────┘                             │
│                             │                                        │
│                  Filtered NavSection[]                               │
│                             │                                        │
│       ┌─────────────────────┼────────────────────────┐               │
│       ▼                     ▼                        ▼               │
│ <Sidebar>             <BottomNavbar>           <MobileMenuSheet>     │
│ (desktop)             (mobile fixed)           (mobile drawer)       │
│   │                          │                       │               │
│   ├ AccountSwitcher          (context-driven         ├ AccountSwitcher
│   │  ↑ THE feature           static item set         ├ SidebarNav    │
│   │  the user flagged)        per context type)      ├ ThemeSwitcher │
│   ├ GovernanceSessionBar                              └ Logout       │
│   └ SidebarNav                                                       │
│       └ NavItem × N                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

`<Topbar>` and `<UserMenu>` are app-shell adjacencies, not nav-context-driven — they belong to the auth/branding chrome rather than the workspace nav.

---

## 2. Feature catalog (extracted from the originals)

### 2.1 NavContext type system
[`original/types/navigation.ts`](original/types/navigation.ts)

Five context types via a discriminated union:

| Type | Discriminant payload | URL prefix |
|---|---|---|
| `personal` | (none) | `/` (everything not matched below) |
| `business` | `slug`, `accountId`, `accountName` | `/bconsole/{slug}/...` |
| `platform` | `accountId` | `/pconsole/...` |
| `governance` | (none) | `/gconsole/...` |
| `cms` (platform mode) | `accountId`, `mode: "platform"` | `/cconsole`, `/cconsole/{platformSegment}` |
| `cms` (business mode) | `slug`, `accountId`, `accountName`, `mode: "business"` | `/cconsole/{slug}/...` |

The `cms` context has a nested `mode` discriminant — proving the union shape can recurse one level. Useful pattern.

### 2.2 NavItem schema with rich gating
[`original/types/navigation.ts:64-81`](original/types/navigation.ts)

```ts
interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  href: string;                              // supports {slug} placeholder
  permission?: string;                       // membership permission code
  ownerOnly?: boolean;                       // account owner only
  minMembers?: number;                       // min plan tier (max_members)
  activeMatch: "exact" | "prefix";
}

interface NavSection { label: string; items: NavItem[]; }
```

vs rich-sidebar's `NavItem` (close, but missing):
- ✅ `key` → rich-sidebar uses `id`
- ✅ `label` → same
- ✅ `icon` → same (more permissive type: ReactNode | ComponentType)
- ✅ `href` → same, but **no `{slug}` placeholder support**
- ✅ `permission` → same
- ❌ `ownerOnly` — **missing**
- ❌ `minMembers` — **missing**
- ✅ `activeMatch` → rich-sidebar has `match` (synonym)

### 2.3 Declarative `NAV_CONFIG` keyed by context
[`original/lib/navigation-config.ts`](original/lib/navigation-config.ts)

A single `NAV_CONFIG: NavContextConfig` object — 462 lines listing 6 contexts × N sections × M items. Every item declares its permission code, owner-only flag, min-members threshold, and active-match strategy upfront.

This is the **configurable surface** consumers fill in. Worth shipping as a typed shape in the library — `NavContextConfig` becomes part of the public API.

### 2.4 `resolveHref` template substitution
[`original/lib/navigation-config.ts:471-479`](original/lib/navigation-config.ts)

```ts
function resolveHref(href: string, context: NavContext): string {
  if (context.type === "business") return href.replace("{slug}", context.slug);
  if (context.type === "cms" && context.mode === "business") return href.replace("{slug}", context.slug);
  return href;
}
```

Trivial in isolation; load-bearing in practice — every `{slug}` placeholder in the business config flows through this. **rich-sidebar doesn't support this** — consumer must pre-resolve all hrefs.

### 2.5 `isNavActive` match strategy
[`original/lib/navigation-config.ts:484-486`](original/lib/navigation-config.ts)

```ts
function isNavActive(pathname: string, href: string, match: "exact" | "prefix"): boolean {
  return match === "exact" ? pathname === href : pathname.startsWith(href);
}
```

rich-sidebar already implements this via `defaultMatch` prop + per-item `match`. ✅ Already covered.

### 2.6 `useNavContext` hook
[`original/hooks/use-nav-context.ts`](original/hooks/use-nav-context.ts)

URL pathname → context. Reads `usePathname()` (Next.js-specific) + memberships store. Per-prefix conditional:

- `/cconsole/...` (and the static segments `sites`/`templates`/`media`/`api-keys`/`businesses` count as platform CMS) → `cms` context
- `/bconsole/{slug}/...` → business context (with membership lookup for accountName)
- `/gconsole` → governance
- `/pconsole` → platform
- else → personal

**Next-coupled** — uses `usePathname` from `next/navigation`. Library-side equivalent must abstract this (accept `currentPath` prop OR allow injection of a path source).

### 2.7 `useFilteredNav` hook
[`original/hooks/use-filtered-nav.ts`](original/hooks/use-filtered-nav.ts)

Combines config + memberships + context → filtered `NavSection[]`. Logic:

1. Pick `NAV_CONFIG[context.type]` (CMS context maps to `cms_platform` / `cms_business`).
2. Personal context: pass through, no gating.
3. Other contexts: find the membership for the context (business by slug, platform by type, etc.).
4. For each item: filter on `permission && permCodes.has(item.permission)` && `(!ownerOnly || is_owner)` && `(!minMembers || account_max_members >= minMembers)`.
5. Drop empty sections.

The pattern is solid. Library version should be hook-shaped + accept the inputs via props (not via zustand-store hooks), so consumers can wire their own state stores.

### 2.8 `<AccountSwitcher>` — the feature the user flagged
[`original/components/AccountSwitcher.tsx`](original/components/AccountSwitcher.tsx)

`Popover` (radix) wrapping a `Button` (combobox role) + a list of switchable items:
- Each item: `{ key, label, icon, href, isActive }`.
- Items built dynamically from current context + memberships + an optional "CMS active context" prefix when inside cconsole.
- Active item rendered with `Check` icon trail.
- Trigger button shows the active item's icon + label.
- Bottom of list: contextual "Create Business" affordance (renders different button based on `user.can_create_business`).

This is **the missing piece** in rich-sidebar. Two ways to ship it:

**Option A — `accountSwitcherSlot` on rich-sidebar.** Consumer-supplied component slotted above the brand. The library provides a recipe in guide.md but doesn't ship the switcher itself. Lowest friction; max consumer flexibility.

**Option B — Ship a new procomp `account-switcher-01`.** Generic popover-with-switchable-items, decoupled from rich-sidebar. Sidebar-nav-01 gains a `topSlot` or `accountSwitcherSlot` that the new procomp fills. Two procomps, composable.

**Option C — Both.** Sidebar-nav-01 grows a `topSlot` (named slot above brand). Optional new procomp `account-switcher-01` is what consumers usually drop in. Library doesn't force usage.

Recommended: **Option C** — slot is the load-bearing API; the prefab is convenience.

### 2.9 `<BottomNavbar>` — context-driven mobile bar
[`original/components/BottomNavbar.tsx`](original/components/BottomNavbar.tsx)

Mobile fixed-bottom bar. `getBottomNavItems(context)` returns a different 4-item array per context type (personal / business / platform / governance / cms-platform / cms-business). Plus a "More" item that opens a `<MobileMenuSheet>` for fuller nav.

Maps cleanly onto the already-queued `bottom-tab-bar-01` procomp. Items take the same `NavItem` shape via the F-S1 cross-procomp import. **Missing in v0.1 plan:** the dynamic per-context catalog. Either:

- bottom-tab-bar-01 takes `items` as a flat prop (consumer derives per-context) — current plan.
- OR bottom-tab-bar-01 accepts `itemsByContext: Partial<Record<ContextType, NavItem[]>>` + `context: { type: ... }` and resolves internally. Heavier surface; probably not worth it.

Stick with the lighter "consumer derives" pattern. The KEY thing bottom-tab-bar-01 must support is the "More" overflow → opens a Sheet. That's a slot or a prop.

### 2.10 `<MobileMenuSheet>` — mobile drawer composing the switcher + nav
[`original/components/MobileMenuSheet.tsx`](original/components/MobileMenuSheet.tsx)

`<Sheet side="bottom" h-[70vh]>` containing:
1. `<AccountSwitcher />`
2. `<SidebarNav sections={sections} context={context} />`
3. Theme switcher
4. Logout

This is the consumer's COMPOSITION of library pieces — it's a glue component for the kasder app. Doesn't ship as a procomp, but the **composition pattern** is documented in rich-sidebar guide.md as a recipe.

### 2.11 `<UserMenu>` + `<Topbar>` — adjacencies, not nav-system parts
Topbar is the auth-aware app banner with logo + UserMenu. UserMenu is a profile-avatar dropdown with theme submenu + logout. **Not nav-system core.** rich-sidebar already has `<NavUser>` (the bottom user-menu prefab) — UserMenu's pattern is already covered (modulo the theme submenu, which is consumer-specific).

---

## 3. Feature gap — rich-sidebar v0.1.x vs this source

| # | Feature | rich-sidebar v0.1.x | Source | Migrate? |
|---|---|---|---|---|
| 1 | Context-switcher at the top | ❌ Missing | ✅ `<AccountSwitcher>` | **YES — top priority** |
| 2 | `{slug}` href template resolution | ❌ Missing | ✅ `resolveHref` | YES — additive |
| 3 | `ownerOnly` per-item gate | ❌ Missing | ✅ | YES |
| 4 | `minMembers` per-item gate | ❌ Missing | ✅ | YES |
| 5 | Multi-context section catalog | ❌ Consumer must swap `items` prop manually | ✅ Filter hook derives from config + memberships (URL→context stays consumer-side per #9) | Ship `useFilteredNavSections` (filter-derive). Document `useNavContext`-equivalent (URL→context) pattern only. |
| 6 | Declarative `NavContextConfig` typed shape | ❌ No type exported | ✅ `NavContextConfig` | YES — additive |
| 7 | Discriminated `NavContext` union | ❌ No type exported | ✅ `NavContext` | YES — additive |
| 8 | `useFilteredNav` hook | ❌ N/A | ✅ | YES — additive helper hook |
| 9 | `useNavContext` (URL → context) | ❌ N/A | ✅ | NO — Next-coupled; document the pattern |
| 10 | Permission filter via membership permissions | Partial (`permissions: ReadonlySet<string>`) | Richer (`MembershipPermission[]` + `is_owner` + `max_members`) | Already partially covered; extend item schema (#3, #4) |
| 11 | `active-match` per item | ✅ `match` prop | ✅ `activeMatch` | Already covered |
| 12 | Bottom mobile bar with context-driven items | bottom-tab-bar-01 not yet shipped | `<BottomNavbar>` | Carry into bottom-tab-bar-01's GATE 1 |
| 13 | Mobile menu sheet recipe | ✅ Sheet drawer mode already in v0.1 | ✅ Composition recipe | Document the composition in guide.md |
| 14 | "Create Business" affordance under the switcher | ❌ N/A | ✅ | Consumer-side concern — covered if Option C ships the slot |
| 15 | Active context highlighted in switcher list | ❌ N/A | ✅ Check icon | Library when shipping `account-switcher-01` |
| 16 | `GovernanceSessionBar` between switcher and nav | ❌ N/A | ✅ App-feature widget | Consumer concern. Single `topSlot` (final decision §9 Q4) — consumer stacks switcher + governance bar vertically inside it via Fragment. No second slot. |

Material gaps: **#1, #2, #3, #4, #6, #7, #8, #12**.

Document-only gaps: **#9, #13, #14, #16**.

Already covered: **#5 (partially), #10 (partially), #11, #15 (when switcher ships)**.

---

## 4. Proposed migration plan

### 4.1 Three procomps total

| Procomp | Status | Migration role |
|---|---|---|
| `rich-sidebar` | ✅ shipped v0.1.1 | **v0.2.0** adds: `topSlot` (above brand) + `{slug}` template support in href + `ownerOnly` + `minMembers` on NavItem + exported `NavContext` type system + exported `useFilteredNavSections` helper hook |
| `account-switcher-01` | **NEW** | Standalone popover/combobox primitive — `items: SwitcherItem[]`, `activeKey`, `onSelect`, `footerSlot` for "Create X" affordances. Generic enough to handle accounts/contexts/projects/sub-accounts. Slots into rich-sidebar's `topSlot`. |
| `bottom-tab-bar-01` | queued | GATE 1 expanded to include the context-driven items pattern + "More" overflow slot for `<MobileMenuSheet>` composition. |

### 4.2 rich-sidebar v0.2.0 scope (proposed)

**Additive (no breaking changes from v0.1.x).** Final locked surface — supersedes any earlier drafts:

1. **`topSlot?: ReactNode`** — single named slot above the brand zone (provisional name; final TBD at GATE 1 per F-11). Consumer mounts account switcher + any inter-section widgets (governance bar, breadcrumbs, status banners) inside, stacked vertically via Fragment. **No second slot** — one is enough (see §9 Q4).
2. **`{slug}` href template support** — TWO surfaces, both opt-in:
   - **`hrefTemplateValues?: Record<string, string>`** — the common-path prop. When set, items' hrefs get `{key}` substitution at render time via `String.prototype.replaceAll("{" + key + "}", value)` for each entry.
   - **`resolveHref?(item: NavItem, templateValues: Record<string,string> | undefined) => string`** — escape-hatch callback. When provided, wins precedence over the built-in substitution. Returns the final href string.
   - Backward compatible: items without `{…}` placeholders and consumers without `hrefTemplateValues`/`resolveHref` render unchanged.
3. **`NavItem.ownerOnly?: boolean`** — new optional field. Filter logic extends to check against a new `isOwner?: boolean` sidebar prop. Item with `ownerOnly: true` is hidden when `isOwner !== true`.
4. **`NavItem.minMembers?: number`** — new optional field. Filter logic extends to check against new `currentMaxMembers?: number` sidebar prop. Item is hidden when `currentMaxMembers < minMembers`.
5. **Exported `NavContext` discriminated union** — re-exported from `types.ts` for consumer ergonomics. Type-only — consumers use it to type their own URL-derivation code.
6. **Exported `useFilteredNavSections` hook** — pure helper. Signature (locked from §8.7):
   ```ts
   useFilteredNavSections({
     sections: ReadonlyArray<NavSection>,
     permissions?: ReadonlySet<string>,
     isOwner?: boolean,
     currentMaxMembers?: number,
     bypassFiltering?: boolean,   // true for personal context — skip all gates
   }): NavSection[]
   ```
   Three independent gates per item (permission ∩ ownerOnly ∩ minMembers, all must pass); then drop empty sections. **No `context` parameter** — `bypassFiltering` is the explicit personal-context discriminator.
7. **`renderTopSlot?` render-prop equivalent** for `topSlot` — for consistency with rich-sidebar's existing render-prop family.

**Documented in guide.md:**

- The `useNavContext`-style URL-derivation pattern (with Next.js + TanStack Router + plain `window.location` examples).
- The `<AccountSwitcher>` composition recipe using the new `account-switcher-01` procomp.
- The `MobileMenuSheet` composition recipe using `<Sheet>` + `<RichSidebar>` (mobile drawer mode) + theme/logout extras.
- The CCONSOLE_PLATFORM_SEGMENTS-style reserved-word collision warning (§8.9) for consumers building sub-mode systems.

### 4.3 account-switcher-01 v0.1.0 scope (proposed new procomp)

Library-side primitive for the dropdown/popover-with-switchable-items pattern. Generic enough to cover account / workspace / context / project / sub-account switching.

**Surface (locked at this stage — final shape pinned at GATE 1):**

```ts
interface SwitcherItem {
  /** Stable, unique key. Multiple items per conceptual account are allowed
   *  as long as their keys differ — e.g. "biz-acme" + "cms-biz-acme" for
   *  business mode vs CMS sub-mode (the source's dual-entry pattern). */
  key: string;
  label: string;
  icon?: ReactNode | ComponentType<{ className?: string }>;
  /** Optional — switcher fires `onSelect` regardless; consumer wires routing. */
  href?: string;
}

interface AccountSwitcher01Props {
  /** Ordered list — consumer controls placement (pinned-first items, groupings,
   *  fallback ordering all live in the consumer's `items` derivation). */
  items: ReadonlyArray<SwitcherItem>;
  /** The currently-active item's key. When null OR not found in `items`,
   *  the trigger label falls back to `fallbackActiveItem` (if provided),
   *  otherwise to `items[0]`. */
  activeKey: string | null;
  /** Fired on click. Active-item clicks are no-ops at the library level —
   *  caller decides whether to no-op or re-affirm. */
  onSelect: (item: SwitcherItem) => void;
  /** Avoids the source's "show Personal when in governance" mislabel
   *  (§8.10). When `activeKey` doesn't resolve to an item, this is shown
   *  in the trigger instead of `items[0]`. */
  fallbackActiveItem?: SwitcherItem;
  /** Arbitrary footer content (separator + button row + state machine, etc.).
   *  Source uses this for "Create Business" + the 6-state
   *  `BusinessCreationRequestButton`. Library stays out of the shape. */
  footerSlot?: ReactNode;
  /** Collapsed-mode rendering (ilinxa extension beyond source — rich-sidebar
   *  has icon-collapsed mode the source lacks). When true, trigger shows only
   *  the active item's icon. Detailed collapsed-UX behavior locked at GATE 1
   *  per F-10. */
  isCollapsed?: boolean;
  "aria-label"?: string;
  className?: string;
}
```

**Deliberately NOT in v0.1:** `description`, `groupId`, `meta`, `triggerVariant`. These were speculative additions from an earlier draft (F-05). The source uses none of them; ship a tight v0.1 and expand in v0.2 if real consumer demand emerges. `pinnedItems` (also from an earlier draft, F-04) is dropped — the source just prepends to `items` via spread; that's a consumer concern, not a library API.

**Composes with rich-sidebar:**

```tsx
<RichSidebar
  items={navItems}
  currentPath={pathname}
  topSlot={
    <AccountSwitcher01
      items={switcherItems}
      activeKey={activeContextKey}
      onSelect={handleSwitch}
      footerSlot={user.canCreateBusiness ? <CreateBusinessButton /> : null}
      isCollapsed={isCollapsed}
    />
  }
/>
```

### 4.4 bottom-tab-bar-01 GATE 1 expansion

When `bottom-tab-bar-01` ships GATE 1, fold in:

- **Context-driven items pattern** — items prop is a flat `NavEntry[]`; consumer derives from their context. Document the dynamic pattern.
- **"More" overflow slot** — last visible item can be a `MoreItem` that triggers a Sheet/Drawer (the consumer composes `<MobileMenuSheet>`-equivalent).
- **F-S1 NavBadge + NavItem schema sharing with rich-sidebar** — already in plan.

---

## 5. What stays consumer-side (deliberately)

The library should NOT ship these because they're tied to a specific app's domain shape:

1. **`useNavContext`** — Next.js-coupled (uses `usePathname`), and the route-prefix → context mapping is app-specific. Document the pattern; provide a `pathnameToContext(pathname, mapping)` PURE helper if there's demand later.
2. **`Membership` shape + `useMembershipStore`** — consumer's auth state.
3. **`NAV_CONFIG` catalog** — consumer's product surface.
4. **Theme switcher submenu** — consumer wires `next-themes` or their own theme system to `<NavUser>`'s menu items.
5. **Logout, NotificationBell, GovernanceSessionBar, CreateBusinessDialog** — feature components.

The library ships the **shapes, primitives, and helpers**; the consumer ships the **product configuration**.

---

## 6. Risks and open questions

| # | Risk / Question | Notes |
|---|---|---|
| Q1 | Should `account-switcher-01` ship before rich-sidebar v0.2.0, or alongside? | Alongside makes sense — both reference the new slot. v0.2.0 rich-sidebar + v0.1.0 account-switcher-01 land in the same session. |
| Q2 | `{slug}` template syntax — `{slug}` or `:slug` (Express-style) or `[slug]` (Next.js-style)? | `{slug}` matches the source. No reason to deviate. Lock at GATE 1. |
| Q3 | `hrefTemplateValues` as a prop OR `resolveHref` callback? | Callback is more flexible (consumer can do any transform). Prop is cheaper for the common case. Probably both — callback wins precedence. |
| Q4 | One slot or multi-slot above the nav? | **Single `topSlot`** (final, F-01). Consumer stacks switcher + governance bar + breadcrumbs vertically inside via Fragment. Multi-slot would inflate the API for no gain. |
| Q5 | Does `useFilteredNavSections` belong in rich-sidebar or a shared `_shared` registry item? | Likely shared — bottom-tab-bar-01 will also want it. Mirror the `file-clipboard` pattern. |
| Q6 | `isOwner` + `currentMaxMembers` as raw props vs an opaque `membership` shape? | Raw props are more portable. Opaque `membership` couples to a specific auth shape. Go raw. |
| Q7 | `NavContext` exported as concrete type or as a generic `<TContextType>` parameter? | Concrete for v0.2.0 — match the source's 5-type union. Generic version is a v0.3 over-engineer candidate. |
| Q8 | Are `ownerOnly` + `minMembers` too kasder-specific? | They're general enough — "filter by role-flag" and "filter by capacity-threshold" are common across SaaS. Worth keeping in the library schema. |
| R1 | rich-sidebar v0.1.x consumers reading current `permissions: ReadonlySet<string>` won't break — additions are all opt-in. | Confirmed additive. |
| R2 | F-cross-13 surface grows when adding Popover (account-switcher-01) — must defensively pre-wire. | Already a known carrier pattern; standard project workflow. |
| R3 | Storybook/docs site needs to demo all 5 context types — fixtures grow. | Acceptable; expand `dummy-data.ts`. |

---

## 7. Next steps (recommended order)

1. **You** sign off on this analysis (or send edits).
2. **Author `account-switcher-01` GATE 1 description** in `docs/procomps/account-switcher-01-procomp/`. Lock the SwitcherItem shape + the popover-based UX.
3. **Author `rich-sidebar-procomp-description-v0.2.0.md`** as an addendum to the existing description, listing the additive surface (topSlot + `{slug}` + ownerOnly + minMembers + exported NavContext + useFilteredNavSections).
4. **GATE 2 plans** for both. Likely one shared session given the tight composition.
5. **Implement** in commit chains. Both procomps land in the same week. rich-sidebar bumps to 0.2.0; account-switcher-01 ships at 0.1.0.
6. **bottom-tab-bar-01 GATE 1** picks up the loose ends (context-driven items + More-overflow slot).

---

## 8. Deep-dive findings (added after second-pass investigation)

### 8.1 App-shell layout — sidebar is a sibling, not a wrapper

Both `(app)/layout.tsx` and `(public)/layout.tsx` (authenticated branch) compose the system identically:

```tsx
<div className="fixed inset-0 flex flex-col">
  <Topbar variant="authenticated" />                  {/* h-14 sticky */}
  <div className="flex min-h-0 flex-1">
    <Sidebar />                                        {/* hidden md:block md:w-64 */}
    <main className="flex-1 overflow-y-auto p-6 pb-20 md:pb-6">
      {children}
    </main>
  </div>
</div>
<BottomNavbar />                                       {/* fixed bottom md:hidden */}
```

**Key insight:** the sidebar is a **sibling of `<main>`**, not a wrapper. Topbar sits above the sidebar/main pair. BottomNavbar floats absolutely on mobile. **This is already aligned with how rich-sidebar is designed** — consumer places `<RichSidebar>` next to their `<main>`, no wrapping. ✅

The original has **no collapse-to-icon mode** on desktop. It's a fixed `md:w-64` block. Mobile = `<BottomNavbar>` + `<MobileMenuSheet>` instead. **rich-sidebar's collapse-to-icon mode is an ADDITION beyond the source, not a regression** — useful for desktop power-users, keep it.

### 8.2 AccountSwitcher behavior (decoded from source + tests)

From `AccountSwitcher.test.tsx` + reading the component:

1. **Trigger:** `role="combobox"`, `aria-label="Switch account context"`. Shows active item's icon + label + `ChevronsUpDown`. Width = full container width (consumer-controlled).
2. **Active resolution:** `items.find((i) => i.isActive) ?? items[0]`. Fallback to first item when nothing matches.
3. **Item ordering (load-bearing):**
   - CMS active context (if inside `/cconsole/...`) — **pinned first**, marked active
   - Personal (always present)
   - Each `business` membership (status=active only, via `useBusinessMemberships` selector)
   - Platform (if user has `platform` membership with status=active)
   - **No governance entry** — governance is accessed via a separate auth flow (governance-token), not switcher
4. **Click behavior:** active item is a no-op (`if (!item.isActive) router.push(item.href)`). Closes popover regardless.
5. **Footer (state-driven):**
   - User authenticated + `can_create_business: true` → "Create Business" button → opens `<CreateBusinessDialog>` (RHF + zod form) → on success: refetch memberships + push to `/bconsole/{newSlug}/dashboard`
   - User authenticated + `can_create_business: false` → `<BusinessCreationRequestButton>` (6-state widget: loading / error / can_request / has_pending / has_info_requested / in_cooldown / approved)
   - Unauthenticated → no footer
6. **Popover content width:** `w-[var(--radix-popover-trigger-width)]` (matches trigger).

### 8.3 GovernanceSessionBar is a specialized widget, not a slot

I previously called it a "slot pattern." Wrong — it's a specific widget:

- Reads `getGovernanceTimeRemaining()` every second via `setInterval`
- Auto-locks (clears token + `router.replace("/gconsole/authenticate")`) when time hits 0
- Manual "Lock Console" button
- Time turns amber when ≤120s remaining

This is consumer-side code. Library shouldn't ship it. Consumers drop it (or any other inter-section widget like breadcrumbs / status banners) into rich-sidebar's single `topSlot` — stacked vertically alongside the account switcher via Fragment. The single-slot decision is locked at §9 Q4 (F-01).

### 8.4 `BusinessCreationRequestButton` is a 6-state machine

| State | UI |
|---|---|
| `loading` | `<Skeleton />` |
| `error` | "Request Business Access" button (fallback) |
| `can_request` | Plus icon + "Request Business Access" — shows "Checking..." / "Sending..." during ops |
| `has_pending` | Clock icon + "Request Pending" + "View" → routes to `/activity/{txnId}` |
| `has_info_requested` | AlertTriangle + "Action Needed" + "Respond" → routes to `/activity/{txnId}` |
| `in_cooldown` | Disabled button + "Available in N days" sub-line |
| `approved` | Returns `null` (parent shows "Create Business" instead) |

The state comes from `useBusinessCreationRequest()`. Library account-switcher-01 needs an **arbitrary `footerSlot: ReactNode`** — consumer renders whatever state machine they want. NOT a typed prop with these specific states.

### 8.5 Permission code inventory (17 unique codes)

> **Drift framing (revised):** the frontend has no central enum — codes are inline strings in `navigation-config.ts`. **Drift risk is asymmetric:** the backend owns the canonical list and echoes codes back in the membership response, so a user with stale codes never *gains* false access (the filter just fails to match). The risk is **BE→FE name changes** silently turning items invisible. The library doesn't fix this (consumer concern), but a typed permission-code utility could land as a v0.3+ helper if demand emerges.

From `navigation-config.ts` permission strings:

| Code | Used in contexts |
|---|---|
| `can_view_members` | business, platform, governance |
| `can_view_audit_logs` | business, platform, governance |
| `can_view_transactions` | business, platform |
| `can_view_settings` | business, platform |
| `can_view_businesses` | platform, governance |
| `can_approve_business_creation` | platform, governance |
| `can_view_cms_content` | business, cms_business |
| `can_create_cms_site` | platform, cms_platform |
| `can_upload_cms_media` | cms_platform, cms_business |
| `can_create_cms_api_key` | cms_platform, cms_business |
| `can_activate_cms_template` | cms_business (×2 in templates section) |
| `can_create_cms_template` | cms_platform |
| `can_manage_business_cms` | cms_platform |
| `can_manage_followers` | business |
| `can_manage_connections` | business |
| `can_create_form` | business |
| `can_view_all_transactions` | governance |

**No central enum/constants file** in the frontend — codes are inline strings. Drift between backend and frontend is unguarded. **The library doesn't need to fix this** (consumer concern), but the migration would benefit from a typed permission-code utility if we ship it later.

### 8.6 NavContext fallback semantics (from tests)

`useNavContext` test reveals defensive fallbacks:

- **Missing business membership** on `/bconsole/unknown/dashboard` → `{ type: "business", slug: "unknown", accountId: "", accountName: "unknown" }`. Empty `accountId` → `useFilteredNav` returns `[]` (no membership → no permissions → no items).
- **Missing CMS-business membership** on `/cconsole/unknown/sites` → same pattern: `accountName: "unknown"`.
- **Missing platform membership** on `/pconsole/dashboard` → `{ type: "platform", accountId: "" }` → empty nav.
- **Suspended membership** is treated identically to missing (the selector filters on `status === "active"`).
- **Non-matching URL prefix defaults to personal context regardless of memberships** — verified by `use-nav-context.test.ts:72-80` which asserts that `/business/acme` (a public discovery route, NOT `/bconsole/acme/...`) returns `{ type: "personal" }` even when the user has an active "acme" business membership. This is the catch-all fallback: anything that doesn't match `/cconsole`, `/bconsole/[slug]`, `/pconsole`, or `/gconsole` is personal.

This is **defensive resilience** — the URL drives the context, but missing data degrades to empty state and unmatched URLs degrade to personal. The library should mirror: filter inputs are opaque values; if they're empty, the filter returns empty.

### 8.7 useFilteredNav gating layers (from tests)

The filter applies three independent gates per item, ALL of which must pass:

1. **Permission** — `!item.permission || permCodes.has(item.permission)` — item without `permission` is always visible
2. **ownerOnly** — `!item.ownerOnly || membership.is_owner`
3. **minMembers** — `!item.minMembers || membership.account_max_members >= item.minMembers`

Then **empty sections are dropped** (`sections.filter(s => s.items.length > 0)`).

Personal context bypasses all gates. Governance uses **platform membership permissions** (since governance authority comes from platform-scoped perms).

CMS context maps to `cms_${context.mode}` config key. CMS-business uses business membership; CMS-platform uses platform membership.

**Library `useFilteredNavSections` helper signature locked:**

```ts
useFilteredNavSections({
  sections: NavSection[],              // raw config for current context
  permissions?: ReadonlySet<string>,   // membership perm codes
  isOwner?: boolean,                   // is_owner flag
  currentMaxMembers?: number,          // for minMembers gate
  bypassFiltering?: boolean,           // for personal context
}) → NavSection[]
```

Pure function. Consumer wires their store reads.

### 8.8 fetchMyMembershipsApi is trivial

```ts
GET /users/me/memberships/ → Membership[]
```

No pagination, no filter query params. Refresh triggers: (a) on auth login (consumer wires this), (b) after `CreateBusinessDialog` success (consumer wires this — example pattern lives in `AccountSwitcher.tsx`).

The library doesn't need to know about this API — it just accepts a derived `items` prop.

### 8.9 The five-name reserved-segment collision (latent source bug)

`CCONSOLE_PLATFORM_SEGMENTS = new Set(["sites", "templates", "media", "api-keys", "businesses"])`

If a business has a slug ∈ those five words, visiting `/cconsole/<that-slug>` mis-classifies as **platform CMS context** instead of business CMS. Backend must enforce slug validation against reserved words. **Document this as a consumer-side constraint.** Library shouldn't bake URL-routing logic in — provide pure helpers.

### 8.10 Governance context is invisible in AccountSwitcher

When `context.type === "governance"`:

- The items list has NO governance entry
- `items.find(isActive)` returns `undefined`
- Falls back to `items[0]` → "Personal" (or CMS active if applicable)
- **Switcher mislabels** the active context as Personal when user is actually in /gconsole

**Latent UX bug in source.** Library fix: support a `fallbackActiveLabel` / `fallbackActiveItem` prop on account-switcher-01, OR document that the consumer should hide the switcher entirely in governance mode.

### 8.11 Dual-entry pattern (CMS-business mode)

When inside `/cconsole/{slug}/...`:

- Switcher items list: **[CMS-business active item, Personal, Acme Corp, Beta Inc, ..., Platform]**
- The user sees TWO entries pointing to the same conceptual account: "Acme Corp CMS" (first in list, active) + "Acme Corp" (regular, not active)
- Clicking "Acme Corp" switches from CMS-business mode to business mode (`/bconsole/acme/dashboard`)
- Clicking "Acme Corp CMS" is a no-op (active)

This is a deliberate UX: the regular business entry is the user's **escape hatch** from a sub-mode back to the parent mode.

**Key uniqueness IS preserved** in source — the CMS item uses `key: "cms-biz-acme"` and the regular business item uses `key: "biz-acme"` (`AccountSwitcher.tsx:39, 66`). The "dual entry" is two distinct keys pointing to the same conceptual account, NOT key collision. Library account-switcher-01 enforces key uniqueness (consumer error if duplicated) and documents the dual-entry pattern in guide.md.

Source ordering ("CMS active first") is achieved via plain array prepend (`...(cmsActiveItem ? [cmsActiveItem] : [])`). **No separate `pinnedItems` API in source** — and consequently none in the library (F-04). Ordering is consumer-controlled via the `items` array.

### 8.12 User journeys (traced)

**Journey 1: Personal → Business switch**
1. User on `/home` (personal). AccountSwitcher trigger shows "Personal".
2. Open popover → list: [Personal (active), Acme Corp, Beta Inc, Platform].
3. Click "Acme Corp" → `setOpen(false)` → `router.push("/bconsole/acme/dashboard")`.
4. `usePathname` updates → `useNavContext` returns business context.
5. `useFilteredNav` finds Acme membership → filters NAV_CONFIG.business by perms.
6. SidebarNav re-renders. BottomNavbar's `getBottomNavItems(context)` returns business 4-item set.
7. AccountSwitcher trigger now shows "Acme Corp" + Check on the active row.

**Journey 2: Business → CMS sub-mode**
1. User on `/bconsole/acme/dashboard`. Sidebar shows business nav.
2. Click "CMS Console" in sidebar (`href: "/cconsole/{slug}/sites"` perm `can_view_cms_content`).
3. `<NavItem>` calls `resolveHref` → `/cconsole/acme/sites`. Navigate.
4. `useNavContext`: `pathname.startsWith("/cconsole")` → segments[1] = "acme" ∉ CCONSOLE_PLATFORM_SEGMENTS → CMS-business context.
5. `useFilteredNav` → cms_business config. CMS-specific sections render.
6. AccountSwitcher: cmsActiveItem now `"Acme Corp CMS"` (pinned first, active). Acme Corp regular entry no longer active.

**Journey 3: Governance entry**
1. User navigates to `/gconsole/dashboard` (URL-only, no switcher path).
2. `AuthGuard` (or similar) verifies governance-token (separate from auth-token); redirects to `/gconsole/authenticate` if missing.
3. `useNavContext` → governance context. `useFilteredNav` finds platform membership → filters NAV_CONFIG.governance.
4. Sidebar renders: AccountSwitcher (mislabels — see §8.10) + **GovernanceSessionBar** + governance nav.
5. SessionBar timer counts down; auto-locks at 0.

### 8.13 What this means for the v0.2 migration plan

The previous §4 (proposed migration plan) is **largely correct** but needs these refinements — applied in §4.2 / §4.3 above:

1. **account-switcher-01 supports dual-entry items via distinct keys** — same conceptual account can appear twice (e.g., "Acme Corp" + "Acme Corp CMS") under different `key`s. Ordering is consumer-controlled via plain array order — no separate `pinnedItems` API needed (the source just prepends via spread). **Applied in §4.3.**

2. **account-switcher-01's `footerSlot` accepts arbitrary `ReactNode`** — the kasder `BusinessCreationRequestButton` is a 6-state widget; library doesn't model it. **Applied in §4.3.**

3. **account-switcher-01 needs a `fallbackActiveItem`** — avoids the source's "show Personal when in governance" UX bug (§8.10). **Applied in §4.3.**

4. **rich-sidebar v0.2.0 ships a single `topSlot`** — consumer stacks switcher + governance bar + breadcrumbs via Fragment inside. Simpler API than two slots. **Applied in §4.2.**

5. **`{slug}` template support** — literal `{key}` placeholder substitution via `String.prototype.replaceAll`. Two surfaces: `hrefTemplateValues` prop (common path) + `resolveHref` callback (escape hatch). **Applied in §4.2.**

6. **`useFilteredNavSections` helper hook signature** (locked from §8.7) — no `context` parameter; `bypassFiltering` is the explicit personal-context discriminator. **Applied in §4.2.**

7. **Don't ship `useNavContext`** — too tightly coupled to Next + app-specific route prefixes. Document the pattern with recipes (Next.js, TanStack Router, plain `window.location`).

8. **Don't subsume `BusinessCreationRequestButton`** — 6-state consumer-side widget tied to a feature-specific polling hook. Library stays out.

9. **Governance entry handling** — fall back to `fallbackActiveItem` when nothing matches; library doesn't silently mis-classify.

10. **account-switcher-01 collapsed-mode UX** — rich-sidebar has an icon-collapsed mode the source lacks (ilinxa extension). Detailed icon-only switcher behavior (trigger render, popover placement, label hide rules) is locked at GATE 1 — see F-10.

11. **Slot naming** (`topSlot` vs `aboveBrandSlot` vs `chromeSlot`) is bikeshed-level. Decided at GATE 1 — see F-11.

---

## 9. Risks and open questions (REVISED with deep-dive context)

The original §6 questions, now answered or refined:

| # | Question / Risk | Resolution |
|---|---|---|
| Q1 | Should account-switcher-01 ship before or alongside rich-sidebar v0.2.0? | **Alongside.** Both reference the same slot; lock specs together. |
| Q2 | `{slug}` syntax — `{slug}` vs `:slug` vs `[slug]`? | **`{slug}`** — match source. Generic via `{key}` template syntax. |
| Q3 | `hrefTemplateValues` prop vs `resolveHref` callback? | **Both.** Prop is the common path; callback wins precedence for custom transforms. |
| Q4 | `topSlot` only vs multi-slot above nav? | **`topSlot` only.** Consumer stacks vertically inside. |
| Q5 | `useFilteredNavSections` in rich-sidebar or shared `_shared`? | **In rich-sidebar for now.** When bottom-tab-bar-01 ships, extract to a shared package if both consume it. |
| Q6 | `isOwner` + `currentMaxMembers` as raw props vs opaque membership? | **Raw props.** Confirmed by §8.7. |
| Q7 | `NavContext` concrete vs generic type? | **Concrete for v0.2.0.** Match source's 5-type union. Generic version = v0.3+ over-engineer. |
| Q8 | `ownerOnly` + `minMembers` too kasder-specific? | **No.** Tests confirm general applicability. Keep. |
| Q9 (NEW, REVISED post-rev2) | Should account-switcher-01 ship a `pinnedItems` prop separate from `items`? | **No** — source just prepends via spread (`...(cmsActiveItem ? [cmsActiveItem] : [])`). Ordering is consumer-controlled via a single `items` array. Dropping the separate API simplifies the surface (F-04). |
| Q10 (NEW) | Dual-entry items (same conceptual account, two distinct keys)? | **Yes** — §8.11. Key uniqueness IS enforced; consumer creates multiple items with **different keys** pointing to the same conceptual account. Documented in guide. |
| Q11 (NEW) | Fallback active item when nothing matches? | **Provide `fallbackActiveKey` or `fallbackActiveItem`** prop. Avoids the source's governance-mislabel bug. |
| Q12 (NEW) | Should rich-sidebar v0.2 keep its collapse-to-icon mode (source has no equivalent)? | **Yes** — it's an addition beyond the source, useful for desktop power-users. Don't drop. |
| Q13 (NEW) | Should the library ship `useNavContext`? | **No.** Too coupled to Next + app prefixes. Document the pattern only. |
| Q14 (NEW) | CMS-platform-segment reserved-word collision (§8.9) — library API impact? | **None directly.** Library doesn't bake URL routing. Document as a consumer-side constraint in the guide for any consumer building a CMS-sub-mode system. |
| R1 | rich-sidebar v0.1.x consumers won't break — additions opt-in. | ✅ Confirmed additive. |
| R2 | F-cross-13 surface grows with Popover (account-switcher-01). | Standard pre-emption pattern. Defensive `onOpenChange` typeof-guard from day one. |
| R3 | Storybook/docs site needs to demo all 5 context types — fixtures grow. | Acceptable. Will expand `dummy-data.ts`. |
| R4 (NEW) | Active fallback when nothing matches → consumer must explicitly handle governance-like cases. | Documented in §8.10 + new prop in Q11. |
| R5 (NEW) | Permission code drift between backend and frontend (no typed enum in source). | Consumer concern. Library's `permissions: ReadonlySet<string>` is the right shape — opaque to the library. |

## 10. Files preserved for future reference

All source files are in [`original/`](original/) (14 files, 1196 LOC total):

- `original/components/AccountSwitcher.tsx` (172 LOC) — the missing feature
- `original/components/BottomNavbar.tsx` (134 LOC) — context-driven mobile bar
- `original/components/MobileMenuSheet.tsx` (86 LOC) — drawer composition
- `original/components/NavItem.tsx` (35 LOC) — link primitive
- `original/components/Sidebar.tsx` (23 LOC) — top-level desktop composition
- `original/components/SidebarNav.tsx` (37 LOC) — sectioned nav list
- `original/components/Topbar.tsx` (125 LOC) — auth-aware app banner (adjacency)
- `original/components/UserMenu.tsx` (88 LOC) — profile dropdown (adjacency)
- `original/components/index.ts` (9 LOC) — barrel
- `original/hooks/use-nav-context.ts` (85 LOC) — URL → context
- `original/hooks/use-filtered-nav.ts` (103 LOC) — config + memberships → filtered
- `original/lib/navigation-config.ts` (487 LOC) — declarative catalog + helpers
- `original/types/navigation.ts` (98 LOC) — type system
- `original/types/rbac.ts` (40 LOC) — Membership shape (Role + MembershipPermission + MembershipStatus + AccountType)

## 11. Re-validation pass log (self-audit, 2026-05-22)

A consistency-pass over the deep-dive surfaced 11 findings (3 ⚠️ High, 4 🔸 Medium, 4 🔹 Low). All applied in-place; the analysis is now internally consistent. Findings catalogued for the audit trail:

| ID | Sev | What | Fixed in |
|---|---|---|---|
| F-01 | ⚠️ High | §4.2 had `betweenTopAndNavSlot` second slot; §8.13/§9 Q4 lock on single `topSlot`. Inconsistent. | §4.2 rewritten — single slot only. |
| F-02 | ⚠️ High | §4.2 `useFilteredNavSections` signature had a `context` param; §8.7 has `bypassFiltering`. Mismatch. | §4.2 #6 rewritten to match §8.7 — `bypassFiltering` is the explicit discriminator. |
| F-03 | ⚠️ High | §4.2 only mentioned `hrefTemplateValues` prop; §9 Q3 says both prop AND callback. Incomplete. | §4.2 #2 rewritten with both `hrefTemplateValues` prop AND `resolveHref` callback. |
| F-04 | 🔸 Medium | §8.13 + §9 Q9 proposed a `pinnedItems` API. Source just prepends via array spread — over-engineered. | Dropped from §4.3 + §8.13 + §9 Q9 revised. |
| F-05 | 🔸 Medium | §4.3 SwitcherItem had speculative fields (`description`, `groupId`, `meta`, `triggerVariant`) absent from source. | §4.3 SwitcherItem stripped to source-matching shape: `{ key, label, icon?, href? }`. v0.2+ may expand. |
| F-06 | 🔸 Medium | §8.11 "no key uniqueness enforcement" was misleading — source uses distinct keys (`biz-acme` vs `cms-biz-acme`). | §8.11 rewritten — key uniqueness IS preserved; dual-entry uses distinct keys. |
| F-07 | 🔸 Medium | §8.5 permission-code-drift framing was overstated (symmetric drift). Risk is asymmetric (BE→FE). | §8.5 prefaced with revised drift framing. |
| F-08 | 🔹 Low | §3 row 5 "Hook auto-derives" was ambiguous (URL-derive vs filter-derive). | §3 row 5 rewritten to clarify filter-derive ships; URL-derive stays consumer. |
| F-09 | 🔹 Low | §8.6 missing one fallback rule — non-matching URL prefix defaults to personal regardless of memberships. | §8.6 bullet added (verified via `use-nav-context.test.ts:72-80`). |
| F-10 | 🔹 Low | account-switcher-01 collapsed-mode UX undefined — source has no equivalent. | §4.3 + §8.13 + §9 Q12 note: detailed behavior locked at GATE 1. |
| F-11 | 🔹 Low | Slot naming (`topSlot` vs `aboveBrandSlot` vs `chromeSlot`) — bikeshed. | Provisional `topSlot`; final name locked at GATE 1. |

**Verdict:** Analysis internally consistent after fixes. Ready to author GATE 1 descriptions for `account-switcher-01` and `rich-sidebar` v0.2.0.

---

### Files investigated but NOT copied (consumer-side, kept for reference)

These were read in source but not copied (intentionally — they're consumer/app-feature code, not library candidates):

- `hooks/use-nav-context.test.ts` (286 LOC) — 19 test cases covering URL→context derivation. **Key reference for the documented `useNavContext` pattern.** Edge cases: missing memberships → fallbacks; suspended memberships ignored; CCONSOLE_PLATFORM_SEGMENTS routing.
- `hooks/use-filtered-nav.test.ts` (268 LOC) — 14 test cases covering three independent gates (permission / ownerOnly / minMembers). **Key reference for `useFilteredNavSections` library hook spec.**
- `components/navigation/{AccountSwitcher,BottomNavbar,NavItem,Topbar,UserMenu}.test.tsx` (combined ~700 LOC) — UX behavior locked. Used to refine §8.2 (switcher), §8.12 (journeys), and the dual-entry pattern.
- `stores/membership-store.ts` (81 LOC) — `useShallow`-memoized selectors for derived states. Consumer-side.
- `stores/auth-store.ts` (74 LOC) — `user`, `isAuthenticated`, `isInitialized`. Consumer-side.
- `features/auth/api/membership-api.ts` (8 LOC) — `GET /users/me/memberships/`. Consumer's API client.
- `features/business/components/{BusinessCreationRequestButton,CreateBusinessDialog}.tsx` — switcher footer state machine + business-creation dialog. Consumer-side feature.
- `features/governance/components/GovernanceSessionBar.tsx` (77 LOC) — governance-token timer + lock. Consumer-side widget; rich-sidebar v0.2's `topSlot` lets consumers drop this in.
- `app/(app)/layout.tsx` + `app/(public)/layout.tsx` — confirm the sidebar-as-sibling-of-main shell shape; rich-sidebar already aligned (§8.1).
