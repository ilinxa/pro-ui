# cms-panel-01 — GATE 1 description (panel)

> **Tier:** pro-panel · **Slug:** `cms-panel-01` · **Display name:** CMS Admin Panel · **Status target:** alpha · **Version target:** 0.1.0
> **Gates:** GATE 1 (this doc) → GATE 2 (plan) → GATE 3 (integration spotcheck, peer/AI-required per [readiness-review rule §"Tier-scaled review mode"](../../../.claude/rules/readiness-review.md))
> **Distribution:** scaffold-fork (`registry:block` meta-block; mandatory per [charter](../../library-tiers-charter.md))
> **Install target:** `<consumer>/src/app/(cms)/` (route group) + `<consumer>/src/components/cms-panel-01/` (shell components)
> **Authored:** 2026-05-25 · **Awaiting sign-off**

---

## 1. Problem

Building a CMS admin panel from scratch is a 4–8 week project even when the underlying procomps exist. Every consumer wires the same shell (left nav + topbar + auth boundary + theme + toaster), the same per-route page-header pattern, the same CRUD shapes (table + form + delete confirm), the same dashboard layout, the same permission gates. The result: 80%+ of the work is reimplementing well-understood patterns, and 20% is the real business logic.

`cms-panel-01` ships the 80% as one installable bundle so consumers can focus on the 20%. It's a *scaffold-fork* (`registry:block` meta) — the consumer installs once with `pnpm dlx shadcn add @ilinxa/cms-panel-01`, owns the code from that moment, and customizes freely. The panel is a snapshot at install time, not a live dependency (per [charter §"Versioning + update story for scaffolds"](../../library-tiers-charter.md#versioning--update-story-for-scaffolds)).

This is the largest first-ship in project history: ~6–7 new sections + ~5 pages in v0.1.0 alone, with a 5-route v0.2 and a v0.3 unlock for `/analytics` behind a chart procomp.

## 2. In scope (v0.1.0)

The v0.1.0 panel ships 6 routes + the shell. The 5 deferred routes (v0.2.0 + v0.3.0) are *named here* so consumers can see the trajectory but **not** built in v0.1.

**v0.1.0 routes:**
- `/dashboard` — overview (stats row + activity feed + page header)
- `/posts` — bespoke posts CRUD (table + bespoke editor with `article-body-01` for rich content)
- `/pages` — bespoke static-page CRUD (table + bespoke editor with `json-form` settings)
- `/taxonomies/[slug]` — generalized `entity-crud-page-01` parameterized by taxonomy (serves tags + categories + any custom taxonomy from one page)
- `/library` — bespoke wrapping `file-manager` procomp
- `/users` — generalized `entity-crud-page-01` parameterized for user entity

**v0.1.0 shell:**
- `rich-sidebar` v0.3.0 left navigation with section grouping, role-aware visibility, and persisted collapse state
- `account-switcher-01` v0.1.0 as the sidebar's `topSlot` (current user + tenant switch placeholder)
- `page-header-section-01` rendered at the top of every route (title + breadcrumbs + page-level actions slot)
- Auth provider interface (`<CmsAuthProvider>`) — typed contract consumers wire NextAuth / Clerk / custom into
- Theme provider (`next-themes` — already in project deps)
- Toaster (notification system — depends on `notification-system` procomp from active queue)
- Permission context (`<CmsPermissionProvider>` — surfaces the 5-role capability matrix to every page)

**v0.1.0 cross-page state:**
- Auth context (universal; current user + session)
- Permission context (universal; current user's role + derived capabilities)
- Theme context (universal; light/dark via next-themes)
- Toaster context (universal)
- Sidebar collapse state (panel-scoped; localStorage-backed)

## 3. Out of scope (v0.1.0)

**Deferred to v0.2.0:**
- `/comments` — moderation queue (generalized `entity-crud-page-01` + bulk approve/reject/spam actions)
- `/forms` — form submissions inbox
- `/settings` — site config (bespoke `settings-page-01`; tab-grouped `json-form`)
- `/profile` — current user's own settings (reuses settings form pattern)

**Deferred to v0.3.0:**
- `/analytics` — blocked on a `chart-card-01` procomp that doesn't exist yet. Authored as a separate ship before v0.3.

**Never in scope (out forever):**
- Multi-tenancy / multi-site routing. v0.1.0 assumes a single site; multi-site would change the URL shape, the permission model, and the shell composition. If a consumer needs multi-site, that's a different panel (`cms-multitenant-panel-01` someday).
- Built-in i18n translations. The panel uses a `useTranslator(key, params?) => string` callable signature consumers wire to react-i18next / Lingui / etc. Untranslated mode shows English defaults.
- Built-in auth implementation. Panel ships the `<CmsAuthProvider>` interface (TypeScript contract); consumers pick + wire NextAuth, Clerk, Auth.js, custom.
- The published site itself. This is the *admin* surface; the published-site rendering is the consumer's app.
- Server-side data access. Panel calls consumer-supplied data hooks (`useCmsPosts()`, `useCmsTaxonomy(slug)`, etc.); the panel doesn't talk to Postgres directly.
- Plugin / extension system. Routes are statically defined in v0.1; consumer-extensible plugins are a v0.4+ conversation if anyone asks.

## 4. Target consumers

- **Indie SaaS builder shipping a content-driven app.** Needs an admin to manage posts + pages + media + users; doesn't want to rebuild WordPress from scratch.
- **Agency / consultancy delivering CMS-shaped client work.** Has 5+ client projects that all need the same admin chrome; wants a fork-once-customize-per-client base.
- **Internal-tool builder.** Building a custom back-office (e.g. inventory CMS, knowledge-base admin) that's CMS-shaped but not WordPress-shaped; wants the patterns without the WP baggage.

Out-of-scope consumers: anyone shipping a non-CMS admin (e.g. e-commerce dashboard, analytics-first dashboard) — those would want a different panel.

## 5. Page roster

Each entry: route shape · one-line purpose · constituent procomps + sections · version target. **Per-page deep design happens in each page's own GATE 1, not here** — these are panel-level one-liners only.

| # | Route | Purpose | Procomps used | Sections used | Page slug | v |
|---|---|---|---|---|---|---|
| 1 | `/dashboard` | Overview + recent activity + KPI snapshot | `stat-card`, `progress-timeline-01` | `stats-row-section-01`, `activity-feed-section-01`, `page-header-section-01` | `dashboard-page-01` | 0.1 |
| 2 | `/posts` | Posts/blog CRUD with rich-content editor | `data-table`, `article-body-01`, `json-form` | `crud-table-section-01`, `crud-delete-confirm-section-01`, `page-header-section-01` | `posts-page-01` | 0.1 |
| 3 | `/pages` | Static-page CRUD with settings panel | `data-table`, `json-form` | `crud-table-section-01`, `crud-form-section-01`, `crud-delete-confirm-section-01`, `page-header-section-01` | `pages-page-01` | 0.1 |
| 4 | `/taxonomies/[slug]` | Generalized CRUD for any taxonomy (tags, categories, custom) | `data-table`, `json-form` | `crud-table-section-01`, `crud-form-section-01`, `crud-delete-confirm-section-01`, `page-header-section-01` | `entity-crud-page-01` *(parameterized)* | 0.1 |
| 5 | `/library` | Media library | `file-manager`, `file-tree`, `pdf-viewer` | `page-header-section-01` | `library-page-01` | 0.1 |
| 6 | `/users` | User management (admin only) | `data-table`, `json-form` | `crud-table-section-01`, `crud-form-section-01`, `crud-delete-confirm-section-01`, `page-header-section-01` | `entity-crud-page-01` *(parameterized)* | 0.1 |
| 7 | `/comments` | Moderation queue with bulk actions | `data-table` | (same CRUD sections + bulk-actions slot) | `entity-crud-page-01` *(parameterized)* | 0.2 |
| 8 | `/forms` | Form submissions inbox | `data-table` | (same CRUD sections; read-only mostly) | `entity-crud-page-01` *(parameterized)* | 0.2 |
| 9 | `/settings` | Site config (tab-grouped form) | `json-form` | `page-header-section-01` | `settings-page-01` | 0.2 |
| 10 | `/profile` | Current user's own settings | `json-form` | `page-header-section-01` | `profile-page-01` | 0.2 |
| 11 | `/analytics` | Stats + reports (charts) | `stat-card`, `chart-card-01` *(NEW; blocks /analytics)* | `stats-row-section-01`, `page-header-section-01` | `analytics-page-01` | 0.3 |

**Key insight on `entity-crud-page-01`:** the same parameterized page serves 4 routes in v0.1+v0.2 (`/taxonomies/[slug]`, `/users`, `/comments`, `/forms`). Each route mounts the page with a different `entityType` config (entity schema + columns + form fields + bulk actions + permissions). That's the single biggest reuse win in the panel.

## 6. Shell composition

The shell is what wraps every route. It's owned by the panel itself (lives in the panel's `<CmsPanelShell>` component) and uses these procomps:

| Slot | Procomp / construct | Version | Notes |
|---|---|---|---|
| Left navigation | `rich-sidebar` | ≥0.3.0 | Section-grouped nav with role-aware visibility (`isOwner` + `currentMaxMembers` + permission gates); persisted collapse state via localStorage |
| Sidebar `topSlot` | `account-switcher-01` | ≥0.1.0 | Current user + (optional) tenant switch placeholder; uses the sidebar's documented `topSlot` prop |
| Sidebar footer | inline `<NavUser>` prefab + sign-out | — | Uses rich-sidebar's footer slot pattern |
| Top page header | `page-header-section-01` *(new)* | 0.1.0 | Rendered at the top of every page; title + breadcrumbs + page-level actions slot |
| Auth boundary | `<CmsAuthProvider>` interface | — | Panel-owned TypeScript contract; consumer wires NextAuth / Clerk / custom. Provides `useCmsAuth()` returning `{ user, signOut, ... }` |
| Permission boundary | `<CmsPermissionProvider>` | — | Panel-owned; surfaces the 5-role capability matrix via `useCmsPermissions()` returning `{ can(capability), role, ... }` |
| Theme | `next-themes` `<ThemeProvider>` | already deps | Wires standard `data-theme` + persists choice |
| Toaster | `notification-system` procomp | from active queue *(must promote)* | Global toast surface used by every page for success/error feedback |

**Shell file tree (consumer-installed):**

```
<consumer>/src/components/cms-panel-01/
├── cms-panel-shell.tsx           ← root shell composition
├── cms-auth-provider.tsx         ← interface + context
├── cms-permission-provider.tsx   ← 5-role capability matrix
├── cms-nav-config.ts             ← rich-sidebar NavSection[] declaration
├── cms-toaster.tsx               ← notification-system instance
└── hooks/
    ├── use-cms-auth.ts
    ├── use-cms-permissions.ts
    └── use-cms-nav-context.ts
```

## 7. Permission model

WordPress-canonical 5-role system. Roles map to a capability matrix derived from role at runtime. Consumers can extend by adding custom roles to the matrix.

**Roles** (ordered by privilege):

| Role | Description |
|---|---|
| **Owner** | Site owner; full access incl. billing + dangerous destructive actions; usually 1 per site |
| **Admin** | Manages settings + users + all content + plugins; cannot delete site or transfer ownership |
| **Editor** | Can create/edit/publish/delete ANY post or page; cannot manage users or settings |
| **Author** | Can create/edit/publish/delete OWN posts; cannot edit others' content |
| **Contributor** | Can create/edit OWN posts as drafts; cannot publish; cannot delete own published content |

**Capability matrix (subset shown — full matrix in plan):**

| Capability | Owner | Admin | Editor | Author | Contrib |
|---|:-:|:-:|:-:|:-:|:-:|
| `cms.posts.read` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `cms.posts.create` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `cms.posts.edit.own` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `cms.posts.edit.any` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `cms.posts.publish` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `cms.posts.delete.any` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `cms.pages.*` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `cms.taxonomies.manage` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `cms.library.upload` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `cms.library.delete` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `cms.users.read` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `cms.users.create` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `cms.users.delete` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `cms.settings.read` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `cms.settings.edit` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `cms.profile.edit.own` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `cms.billing.manage` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `cms.site.delete` | ✅ | ❌ | ❌ | ❌ | ❌ |

**Permission enforcement:**
- **Rich-sidebar:** routes the user can't access (`cms.posts.read = false` etc.) hide from the sidebar nav via `rich-sidebar`'s `isOwner` + `ownerOnly` + `minMembers` patterns (already supported in v0.3.0).
- **Per-page:** every page checks the relevant capability in its top-level component; renders a 403-style empty state if denied.
- **Per-action:** row actions (Delete, Publish, etc.) hide or disable based on capability check via `useCmsPermissions().can('cms.posts.publish')`.

**Consumer override:**
- Consumers can extend the role list (e.g. add `SuperAdmin`) by passing a custom matrix to `<CmsPermissionProvider matrix={customMatrix}>`. Default matrix exported as `defaultPermissionMatrix` for forking.

## 8. Cross-page state

State that spans multiple routes and lives in the shell, not per-page:

| Concern | Provider | Storage | Persists across reloads? |
|---|---|---|---|
| Auth (current user + session) | `<CmsAuthProvider>` | consumer-decided (NextAuth cookie / Clerk / etc.) | ✅ |
| Permission (current user's capability matrix) | `<CmsPermissionProvider>` | derived from auth at mount; recomputed on user change | ✅ (via auth) |
| Theme (light/dark) | `next-themes` `<ThemeProvider>` | localStorage `theme` | ✅ |
| Toaster (notifications) | `notification-system` provider | in-memory only; ephemeral | ❌ |
| Sidebar collapse (left nav state) | rich-sidebar's `defaultCollapsed` + `onCollapsedChange` | localStorage `cms.sidebar.collapsed` | ✅ |
| Current nav context (rich-sidebar's `NavContext`) | derived from `usePathname()` | URL is source of truth | ✅ (URL) |

**Page-local state stays page-local** — selection state in CRUD tables, draft form values, modal open state. The shell doesn't know or care.

## 9. Install-order graph

Bottom-up build order. Each constituent must close its own GATE 3 before the next layer can compose it (per [charter constituent rule](../../library-tiers-charter.md#cross-tier-invariant-constituents-never-skip-their-own-gates)).

**Layer 0 — missing procomps (must ship first):**
1. `notification-system` — from active queue position 10; promote ahead of panel work
2. (optional) `multi-select` — from roadmap; needed if CRUD filter UIs need multi-value selectors. Could defer to v0.2 if shadcn's Command primitive suffices for v0.1 filters.

**Layer 1 — sections (parallelizable; ship after Layer 0):**
3. `page-header-section-01` (no deps beyond shadcn primitives)
4. `crud-delete-confirm-section-01` (depends on shadcn dialog/alert-dialog)
5. `crud-table-section-01` (depends on `data-table` + lucide-react)
6. `crud-form-section-01` (depends on `json-form`)
7. `stats-row-section-01` (depends on `stat-card`)
8. `activity-feed-section-01` (depends on `data-table` or `info-list-01`)

**Layer 2 — pages (depend on Layer 1 sections + procomps):**
9. `entity-crud-page-01` — generalized; ship FIRST among pages because it validates the section composition + serves 2 v0.1 routes (`/taxonomies/[slug]` + `/users`)
10. `dashboard-page-01` (depends on stats-row + activity-feed + page-header sections)
11. `posts-page-01` (depends on crud-table + crud-delete + page-header sections + `article-body-01`)
12. `pages-page-01` (depends on crud-table + crud-form + crud-delete + page-header sections + `json-form`)
13. `library-page-01` (depends on `file-manager` + page-header section)

**Layer 3 — panel (depends on all Layer 2 pages):**
14. `cms-panel-01` v0.1.0 — wires shell + routing + cross-page state + permissions; references every Layer 2 page's GATE 3

**v0.2.0 additions (after v0.1.0 ships):**
- (Layer 2) `settings-page-01`, `profile-page-01`
- (Reuse Layer 2) `entity-crud-page-01` mounted at `/comments` + `/forms` (no new page slug — just new config)
- (Layer 3) Panel v0.2.0 minor bump adding the new routes

**v0.3.0 additions:**
- (Layer 0 again) `chart-card-01` procomp
- (Layer 2) `analytics-page-01`
- (Layer 3) Panel v0.3.0 minor bump adding `/analytics`

## 10. Theming hooks

Panel respects all design tokens defined in `<consumer>/src/app/globals.css` (matching the [project design-system mandate](../../../.claude/CLAUDE.md#design-system-mandate)). Additionally exposes CMS-specific design tokens consumers can override:

```css
:root {
  /* CMS panel-specific tokens */
  --cms-panel-sidebar-width: 16rem;
  --cms-panel-sidebar-collapsed-width: 4rem;
  --cms-panel-header-height: 3.5rem;
  --cms-panel-page-padding: 1.5rem;
  --cms-panel-max-content-width: 80rem;
}
```

These are documented in the panel's `cms-panel-01-guide.md` once shipped.

## 11. Customization model (scaffold-fork model)

Per the [charter](../../library-tiers-charter.md#versioning--update-story-for-scaffolds), scaffolds are snapshots. After install, the consumer owns the code; updating the panel means re-installing (overwrites) and reconciling diffs manually.

**Primary customization seams (designed to be edited):**
- `cms-nav-config.ts` — add/remove routes from the sidebar
- `cms-permission-provider.tsx` — extend the role matrix
- `cms-panel-shell.tsx` — swap shell components (e.g. add a global cmd+K search)
- Per-page editor configs — every page exposes a config object for fields, columns, actions

**Incidental seams (editable but consumer-owns-the-divergence):**
- Page-level layouts and per-route rendering
- Color tokens (already in `globals.css`)

**Out-of-band updates:**
- Procomp + section upstream improvements (`@ilinxa/rich-sidebar` 0.3.0 → 0.4.0 etc.) DO flow to consumers through `pnpm dlx shadcn add @ilinxa/rich-sidebar` re-install. Panel's reference to constituent versions is loose by design.

## 12. Example consumer integration sketch

```tsx
// consumer's src/app/(cms)/layout.tsx (written by the panel scaffold)
import { CmsPanelShell } from "@/components/cms-panel-01/cms-panel-shell";
import { CmsAuthProvider } from "@/components/cms-panel-01/cms-auth-provider";
import { CmsPermissionProvider } from "@/components/cms-panel-01/cms-permission-provider";
import { ThemeProvider } from "next-themes";
import { useMyAuth } from "@/lib/my-auth"; // consumer's auth lib

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class">
      <CmsAuthProvider value={useMyAuth()}>
        <CmsPermissionProvider>
          <CmsPanelShell>{children}</CmsPanelShell>
        </CmsPermissionProvider>
      </ThemeProvider>
    </ThemeProvider>
  );
}
```

```tsx
// consumer's src/app/(cms)/posts/page.tsx (written by the panel scaffold)
import { PostsPage } from "@/components/cms-panel-01/pages/posts-page";
import { useMyPostsData } from "@/lib/my-data";

export default function PostsRoute() {
  return <PostsPage useData={useMyPostsData} />;
}
```

## 13. Success criteria

The panel is **done** for v0.1.0 when:

1. All 6 v0.1.0 routes render correctly with realistic dummy data
2. Auth boundary works end-to-end with a sample NextAuth wire-in (documented in guide)
3. Permission gates hide/disable correctly for each of the 5 roles
4. Sidebar collapse persists across reloads; theme persists; toasts fire on CRUD actions
5. `pnpm dlx shadcn add @ilinxa/cms-panel-01` in a fresh Next 16 + shadcn consumer installs all 13 constituent artifacts (1 procomp + 6 sections + 5 pages + panel meta) in correct order
6. Consumer-side `pnpm tsc --noEmit` clean post-install
7. All 5 constituent pages have closed their own GATE 3
8. All 6 constituent sections have closed their own GATE 3
9. Panel GATE 3 integration spotcheck **Pass with follow-ups** verdict (peer or AI-assisted; design coherence dim fixed)
10. Guide documents the customization model, the auth interface contract, the permission matrix override pattern, and the v0.2/v0.3 trajectory

## 14. Open questions

These need answers before GATE 2 (plan):

- **Q1 — Page-header pattern:** is `page-header-section-01` always rendered by the panel shell (around `{children}` in the layout), or by each page individually? Trade-off: shell-rendered = consistent + less per-page boilerplate; page-rendered = each page can opt out or customize.
- **Q2 — Sidebar collapse state ownership:** localStorage-backed at shell level (one persisted value for the whole panel)? Or per-route? localStorage is simpler; per-route opens "user expects different nav state per page" UX.
- **Q3 — Auth provider TS shape:** what minimum surface does `<CmsAuthProvider>` require? Proposal: `{ user: { id, email, name, role, avatarUrl? } | null, signOut: () => Promise<void>, signIn?: (...) => Promise<void> }`. Anything missing?
- **Q4 — Permission denied UX:** 403-style empty state per page? Redirect to dashboard? Hide the route entirely from the nav so denied users never see it? Probably "hide from nav + 403 on direct URL access" — confirm.
- **Q5 — Data hooks contract:** every page consumes data via consumer-supplied hooks (e.g. `useCmsPosts`). What's the minimum hook contract? Proposal: `{ data: T[], loading: boolean, error?: Error, refetch: () => void, mutate: { create, update, delete } }`. Should we ship a `CmsDataProvider` interface that bundles all hooks together vs. per-entity?
- **Q6 — Bulk actions in CRUD tables:** v0.1 ships `entity-crud-page-01` with bulk-select + bulk actions slot? Or v0.1 ships single-row actions only, bulk in v0.2? `/comments` needs bulk approve/reject in v0.2 anyway.
- **Q7 — Mobile / responsive behavior:** v0.1.0 sidebar collapses to off-canvas drawer on mobile (rich-sidebar already supports this) — anything panel-specific to plan? Tables on mobile — horizontal scroll, stacked card view, or just "use a desktop"?
- **Q8 — i18n callable signature:** `useTranslator()` returns `(key: string, params?: Record<string, unknown>) => string`. Default key-as-fallback ("posts.title" → "posts.title" if untranslated)? Or fail loud in dev?
- **Q9 — Posts editor scope:** v0.1 `posts-page-01` editor — is it just title + body (`article-body-01`) + slug + status, or does it include cover image + tags + categories + scheduling + SEO meta in v0.1? Each additional field expands the page's GATE 1 surface.
- **Q10 — `entity-crud-page-01` config shape:** the page is parameterized by `entityType`. What's the config object? Proposal: `{ slug, displayName, fields: FormFieldSpec[], columns: TableColumnSpec[], rowActions, bulkActions?, permissions: { read, create, edit, delete } }`. Locks in GATE 2.

## 15. Cross-references

- Charter: [`docs/library-tiers-charter.md`](../../library-tiers-charter.md)
- Rule: [`.claude/rules/readiness-review.md`](../../../.claude/rules/readiness-review.md)
- Tier README: [`docs/panels/README.md`](../README.md)
- Active queue: [`.claude/STATUS.md`](../../../.claude/STATUS.md) (`notification-system` promote-ahead-of-panel; `multi-select` from roadmap)
- Procomps composed: `rich-sidebar`, `account-switcher-01`, `data-table`, `article-body-01`, `json-form`, `file-manager`, `file-tree`, `stat-card`, `progress-timeline-01`, `pdf-viewer`, (Layer 0) `notification-system`
- Reference panels in the wild: WordPress admin (5-role baseline), Sanity Studio (taxonomy CRUD reuse), Strapi (entity-CRUD generalization), Ghost (clean shell composition)

---

**Status:** awaiting sign-off. Review the 10 open questions in §14 before GATE 2. If anything in §2–§9 is wrong, the section roster + page roster need fixing here before plan work begins.
