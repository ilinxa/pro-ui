# `rich-sidebar` v0.2.0 — Plan Addendum (Stage 2)

> **Stage:** 2 of 3 · **Status:** 🟡 Drafted, awaiting sign-off
> **Slug:** `rich-sidebar` (unchanged) · **Target version:** `0.2.0`
> **Companion to:** [`rich-sidebar-procomp-description-v0.2.0.md`](rich-sidebar-procomp-description-v0.2.0.md) (GATE 1 v0.2.0, closed 2026-05-23)
> **Base plan:** [`rich-sidebar-procomp-plan.md`](rich-sidebar-procomp-plan.md) (v0.1 — still authoritative for everything NOT touched here)
> **Sibling-of:** `account-switcher-01` v0.1.0 (GATE 2 plan: [`../account-switcher-01-procomp/account-switcher-01-procomp-plan.md`](../account-switcher-01-procomp/account-switcher-01-procomp-plan.md))

This is the **plan addendum** for v0.2.0. It documents only the **delta** v0.1.x → v0.2.0. The base plan still defines architecture, file structure, state model, mobile-drawer strategy, CSS-variable theme surface, F-cross-13 pre-emption pattern, and every internal subsystem from v0.1. This file extends only the surfaces that change. When v0.2.0 ships, this addendum is FOLDED INTO the base plan (per Foldback plan in description addendum Appendix C) and removed.

---

## 1. Inherited inputs (delta)

From the v0.2.0 description addendum (GATE 1 closed 2026-05-23):

- **12 new locks (L41–L52)** — on top of v0.1's L1–L40.
- **6 Q-Ps resolved at default** — Q15/Q16/Q17/Q19/Q21/Q22. Q18 + Q20 struck during pre-close revalidation.
- **5 new public API additions** — `topSlot?`, `{key}` href templates (2 surfaces), `NavItem.ownerOnly?`, `NavItem.minMembers?`, exported helpers (`type NavContext` + `useFilteredNavSections` hook).
- **4 new sidebar props** — `isOwner?`, `currentMaxMembers?`, `bypassFiltering?`, `resolveHref?`, `hrefTemplateValues?`.
- **Migration analysis:** [`docs/migrations/socialmedia-adv-nav-system/analysis.md`](../../migrations/socialmedia-adv-nav-system/analysis.md).
- **Sibling procomp:** `account-switcher-01` mounts in the new `topSlot`.

**Zero breaking changes.** Every v0.1.x consumer compiles unchanged.

---

## 2. Final API delta (locked from description addendum)

### 2.1 Type changes — `types.ts`

**Add to `NavItem` (additive optional fields):**

```ts
export interface NavItem {
  // ... v0.1 fields unchanged ...

  /**
   * v0.2.0 — When `true`, item is hidden in the filter pass unless the
   * sidebar's `isOwner` prop is also `true`. Default `false`. Works alongside
   * `permission` and `minMembers` — all three gates pass independently
   * (intersection per L46).
   */
  ownerOnly?: boolean;

  /**
   * v0.2.0 — When set, item is hidden unless sidebar's `currentMaxMembers`
   * prop is `>=` this value. Default unset (no min). Useful for plan-tier
   * gating (Members tab visible only when seat capacity ≥ N).
   */
  minMembers?: number;
}
```

**Add to `RichSidebarProps` (new optional props):**

```ts
export interface RichSidebarProps {
  // ... v0.1 props unchanged ...

  /**
   * v0.2.0 — Slot above the brand row. Geographically distinct from v0.1's
   * `headerSlot` (which is INSIDE the brand row, to the LEFT of brand).
   * Hierarchy top → bottom: topSlot → headerSlot → brandSlot → navAccessorySlot.
   * Consumer Fragment-stacks if multiple widgets needed (L41).
   */
  topSlot?: ReactNode;

  /**
   * v0.2.0 — Map of placeholder values for href substitution. When present,
   * every `{key}` substring in any NavItem's href is replaced with
   * `templateValues[key]` via `String.prototype.replaceAll`. Items whose
   * href has no `{...}` placeholders render unchanged. Combines with
   * `resolveHref` — `resolveHref` wins when both provided (L43).
   */
  hrefTemplateValues?: Record<string, string>;

  /**
   * v0.2.0 — Escape-hatch callback for href resolution. When provided, wins
   * precedence over `hrefTemplateValues` substitution. Library calls it for
   * every item whose href is rendered. Return value is the final href string.
   * Lets consumers do arbitrary transforms (subdomain rewrites, locale
   * prefixes, conditional sub-paths). Should be a stable function (useCallback)
   * — library does NOT memoize calls (R10).
   */
  resolveHref?: (item: NavItem, templateValues: Record<string, string> | undefined) => string;

  /**
   * v0.2.0 — Whether the current user is an owner. Fed into the filter pass;
   * default `false` → all `ownerOnly` items hidden. Raw scalar, not opaque
   * membership object (L52).
   */
  isOwner?: boolean;

  /**
   * v0.2.0 — Current plan-tier seat capacity. Fed into the filter pass;
   * default `Infinity` → all `minMembers` items visible.
   */
  currentMaxMembers?: number;

  /**
   * v0.2.0 — When `true`, bypass the three permission gates (permission /
   * ownerOnly / minMembers). `hidden: true` is still respected (Q21).
   * Use case: personal-context shortcuts, admin overrides, debug views.
   */
  bypassFiltering?: boolean;
}
```

**Add new exported type — `NavContext`:**

```ts
/**
 * v0.2.0 — Discriminated union for app-shell context types. Type-only export;
 * library does NOT ship a `useNavContext` hook (consumer's router coupling
 * is their concern — L48).
 *
 * Consumers use this type to narrow their URL-derivation code; TypeScript
 * narrows correctly across the discriminant.
 */
export type NavContext =
  | { type: "personal" }
  | { type: "business"; slug: string; accountId: string; accountName: string }
  | { type: "platform"; accountId: string }
  | { type: "governance" }
  | { type: "cms"; mode: "platform" }
  | { type: "cms"; mode: "business"; slug: string; accountId: string; accountName: string };
```

### 2.2 New exported hook — `useFilteredNavSections`

```ts
/**
 * v0.2.0 — Pure helper hook. Returns filtered NavSection array with all
 * three gates (permission ∩ ownerOnly ∩ minMembers) applied, then empty
 * sections dropped (L46). `bypassFiltering: true` skips permission gates
 * only — `hidden: true` is unconditionally respected (Q21).
 *
 * Memoized internally on `[sections, permissions, isOwner, currentMaxMembers,
 * bypassFiltering]` (Q16). Returns referentially-stable sections when inputs
 * unchanged.
 *
 * NOT coupled to the `<RichSidebar>` component — usable standalone for
 * consumers who render their own arbitrary sidebar UI.
 */
export function useFilteredNavSections(opts: {
  sections: ReadonlyArray<NavEntry>;
  permissions?: ReadonlySet<string>;
  isOwner?: boolean;
  currentMaxMembers?: number;
  bypassFiltering?: boolean;
}): ReadonlyArray<NavEntry>;
```

### 2.3 Type-export contract

`index.ts` adds (additive, no removals):

```ts
// New v0.2.0 exports
export { useFilteredNavSections } from "./hooks/use-filtered-nav-sections";
export type { NavContext } from "./types";

// All v0.1 exports remain
export { RichSidebar, /* ... */ } from "./rich-sidebar";
export type { /* ... */ } from "./types";
```

---

## 3. New files + modified files

### 3.1 New files

| File | Purpose | LOC budget |
|---|---|---|
| `lib/href-resolver.ts` | `{key}` substitution + `resolveHref` orchestration | ~50 |
| `hooks/use-filtered-nav-sections.ts` | Public hook wrapping `derive-visible-entries.ts` + new gates | ~60 |

### 3.2 Modified files

| File | Change |
|---|---|
| `types.ts` | Add `ownerOnly` + `minMembers` to NavItem; add 5 new props to RichSidebarProps; add NavContext discriminated union; export `useFilteredNavSections` signature |
| `lib/derive-visible-entries.ts` | Extend filter to apply ownerOnly + minMembers gates alongside existing permission gate; add `bypassFiltering` short-circuit; preserve `hidden: true` precedence |
| `rich-sidebar.tsx` | Render `topSlot` above brand row; thread new props through to filter pass + href resolver |
| `parts/sidebar-nav-row.tsx` | Apply href resolution via new `lib/href-resolver.ts` |
| `meta.ts` | Bump version `0.1.1 → 0.2.0` |
| `demo.tsx` | Add multi-context demo with `topSlot` + `<AccountSwitcher01>` slot occupant + permission filter + ownerOnly gate + minMembers gate + `{slug}` substitution |
| `usage.tsx` | Add "Headless filter hook standalone" usage pattern |
| `index.ts` | Add `useFilteredNavSections` + `NavContext` exports |

### 3.3 Files NOT touched

Explicit list — these files are unchanged by v0.2.0:

- `parts/` — every other prefab part (NavBadge, NavBrand, NavPrimaryAction, NavUser, etc.) unchanged
- `hooks/use-sidebar-nav-state.ts`, `hooks/use-active-detection.ts`, `hooks/use-storage-sync.ts`, etc.
- `lib/active-variant-classes.ts`, `lib/compute-active-item.ts`, `lib/derive-css-vars.ts`, etc.
- `lib/sidebar-reducer.ts` — no new actions required
- `contexts/` — no new contexts

---

## 4. `useFilteredNavSections` implementation

### 4.1 Signature

```ts
// hooks/use-filtered-nav-sections.ts
import { useMemo } from "react";
import type { NavEntry } from "../types";
import { deriveVisibleEntries } from "../lib/derive-visible-entries";

export interface UseFilteredNavSectionsOpts {
  sections: ReadonlyArray<NavEntry>;
  permissions?: ReadonlySet<string>;
  isOwner?: boolean;
  currentMaxMembers?: number;
  bypassFiltering?: boolean;
}

export function useFilteredNavSections(
  opts: UseFilteredNavSectionsOpts,
): ReadonlyArray<NavEntry> {
  const { sections, permissions, isOwner, currentMaxMembers, bypassFiltering } = opts;

  return useMemo(
    () =>
      deriveVisibleEntries({
        items: sections,
        permissions,
        isOwner,
        currentMaxMembers,
        bypassFiltering,
      }).items,
    [sections, permissions, isOwner, currentMaxMembers, bypassFiltering],
  );
}
```

Thin wrapper over the existing `deriveVisibleEntries` (post-v0.2 extension). Returns only the `items` field of the diagnostic struct — hidden-item-count diagnostics stay internal (consumers calling this hook don't need them).

### 4.2 Performance characteristics

- O(N) over total items count per memo evaluation
- Memo invalidates only when the 5 inputs change by reference (or value for boolean/number)
- Returns referentially-stable array when inputs unchanged → downstream `<NavSection>` memos hold (R14 mitigation per Q16)

---

## 5. `lib/href-resolver.ts` (new)

```ts
// lib/href-resolver.ts
import type { NavItem } from "../types";

export interface HrefResolverOpts {
  templateValues?: Record<string, string>;
  resolveHref?: (item: NavItem, values: Record<string, string> | undefined) => string;
}

/**
 * Resolves an item's href to its final string form. Precedence (L43):
 *   1. resolveHref callback (if provided) — return value is final
 *   2. {key} substitution from templateValues (if present + item.href contains {...})
 *   3. item.href as-is
 *
 * Returns undefined when item has no href.
 *
 * In dev mode, warns when item.href contains {xxx} placeholders not present
 * in templateValues (Q19). No warn on unused values.
 */
export function resolveItemHref(
  item: NavItem,
  opts: HrefResolverOpts,
): string | undefined {
  const { templateValues, resolveHref } = opts;

  if (resolveHref) {
    return resolveHref(item, templateValues);
  }

  if (!item.href) return undefined;
  if (!templateValues) return item.href;

  return substituteTemplate(item.href, templateValues);
}

function substituteTemplate(
  href: string,
  values: Record<string, string>,
): string {
  // Re-validation finding 3 (⚠️ HIGH): Set-based dedup — duplicate
  // placeholders in the same href (e.g., `/x/{slug}/y/{slug}`) should
  // produce ONE replaceAll call, not N. Same for the missing-keys warn —
  // a duplicate placeholder shouldn't log twice.
  const placeholders = new Set<string>();
  for (const [, key] of href.matchAll(/\{([^}]+)\}/g)) {
    placeholders.add(key);
  }
  if (placeholders.size === 0) return href;

  const missingKeys = new Set<string>();
  let result = href;
  for (const key of placeholders) {
    if (key in values) {
      result = result.replaceAll(`{${key}}`, values[key]!);
    } else if (process.env.NODE_ENV !== "production") {
      missingKeys.add(key);
    }
  }

  if (missingKeys.size > 0 && process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.warn(
      `[rich-sidebar] href "${href}" references placeholder${missingKeys.size === 1 ? "" : "s"} ` +
        `{${Array.from(missingKeys).join("}, {")}} not present in hrefTemplateValues. ` +
        `Substitution skipped for missing keys.`,
    );
  }

  return result;
}
```

**Notes on the implementation:**
- `String.prototype.replaceAll` is the substitution primitive (L42). Single-pass — no re-scanning of replaced regions, so R11 (double-substitution loop) is structurally impossible.
- Set-based placeholder + missing-key dedup keeps both work and diagnostics linear in distinct placeholders, not total occurrences.
- Warning lives behind `process.env.NODE_ENV !== "production"` — tree-shaken from production bundles.
- Pure function — no React hooks. Called per item per render. Cheap enough to not need memoization at the caller site (just don't put the call inside a `useEffect`).

---

## 6. `lib/derive-visible-entries.ts` extension

Existing v0.1 signature (simplified):

```ts
deriveVisibleEntries({ items, permissions, keepEmptySections }) → { items, hiddenItemCount }
```

v0.2.0 signature (additive — keepEmptySections + new fields):

```ts
deriveVisibleEntries({
  items,
  permissions,
  keepEmptySections,
  isOwner,           // NEW v0.2 — default false
  currentMaxMembers, // NEW v0.2 — default Infinity
  bypassFiltering,   // NEW v0.2 — default false
}) → { items, hiddenItemCount }
```

### 6.1 Defaults for new params (re-validation finding 5)

The extension is **strictly additive**. v0.1 callers pass none of the new params; the function body defaults them so existing behavior is byte-identical:

```ts
export function deriveVisibleEntries(opts: {
  items: ReadonlyArray<NavEntry>;
  permissions?: ReadonlySet<string>;
  keepEmptySections?: boolean;
  isOwner?: boolean;            // NEW; default false
  currentMaxMembers?: number;   // NEW; default Infinity
  bypassFiltering?: boolean;    // NEW; default false
}) {
  const {
    items,
    permissions,
    keepEmptySections = false,
    isOwner = false,
    currentMaxMembers = Infinity,
    bypassFiltering = false,
  } = opts;
  // ...
}
```

### 6.2 Filter pass changes (NavItem branch)

```ts
// Current v0.1 (simplified):
if (item.hidden) { hiddenItemCount += 1; continue; }
if (item.permission && !permissions?.has(item.permission)) { continue; }

// v0.2.0:
if (item.hidden) { hiddenItemCount += 1; continue; }   // Q21: hidden ALWAYS respected

if (!bypassFiltering) {                                 // bypassFiltering skips perm gates only
  if (item.permission && !permissions?.has(item.permission)) { continue; }
  if (item.ownerOnly && !isOwner) { continue; }
  if (
    item.minMembers !== undefined &&
    currentMaxMembers < item.minMembers
  ) {
    continue;
  }
}
```

### 6.3 NavSection branch (re-validation finding 4 — bypassFiltering applies at BOTH levels)

Sections retain only the `permission` gate from v0.1 (no `ownerOnly` / `minMembers` — sections don't carry plan-tier semantics, per description). The `bypassFiltering` flag applies at this level too — otherwise a section with `permission` could be dropped while its items remain inside `bypassFiltering: true`, producing a "section disappears but children stay" inconsistency:

```ts
// v0.2.0 section branch:
if (section.hidden) continue;                            // Q21: hidden ALWAYS respected

if (!bypassFiltering) {                                  // SAME bypass for sections + items
  if (section.permission && !permissions?.has(section.permission)) {
    continue;
  }
}
```

This way, `bypassFiltering: true` reveals ALL non-`hidden:true` entries at both levels — a coherent "show everything" semantic.

### 6.4 keepEmptySections precedence

Unchanged. `keepEmptySections: true` is the legacy v0.1 prop; `bypassFiltering` is independent. Both can coexist: `bypassFiltering` skips per-item + per-section permission gates; `keepEmptySections` retains sections that ended up empty after gating.

---

## 7. `<RichSidebar>` topSlot wiring

In `rich-sidebar.tsx` render tree (existing v0.1 brand row region):

```tsx
{/* v0.2.0 — topSlot above brand zone */}
{topSlot ? <div className="ilinxa-sidebar-top-slot">{topSlot}</div> : null}

{/* v0.1 — brand row (unchanged) */}
<div className="ilinxa-sidebar-brand-row">
  {headerSlot}
  {brandSlot ?? <NavBrand ... />}
</div>
```

CSS class `.ilinxa-sidebar-top-slot` lives in the component's CSS-variable theme surface (existing `derive-css-vars.ts` pattern). Default styling: no padding, full width, content-determined height.

### 7.1 Collapsed-mode passthrough

When `isCollapsed={true}`, the topSlot's content is the consumer's responsibility — library does NOT inject collapse-aware styling on the slot. Consumers slotting `<AccountSwitcher01>` pass `isCollapsed={true}` to it via their own context wiring or prop passthrough; rich-sidebar does not auto-thread.

(This was discussed in description Appendix A — explicit handoff to the consumer.)

### 7.2 Zero layout shift (success criterion #10)

When `topSlot === undefined || topSlot === null`, the `<div>` is not rendered at all. No padding ghost, no empty zone. v0.1 consumers see byte-identical DOM.

---

## 8. Href resolution integration

`parts/sidebar-nav-row.tsx` (or wherever the `<a>` is rendered — verify in v0.1 source) currently uses `item.href` directly. Change to:

```tsx
import { resolveItemHref } from "../lib/href-resolver";

const finalHref = resolveItemHref(item, { templateValues, resolveHref });
```

`templateValues` + `resolveHref` are threaded down via the props chain from `<RichSidebar>` → list → row. No new context needed (existing prop drilling pattern matches v0.1).

---

## 9. `NavContext` type export

`types.ts` adds the type. `index.ts` re-exports. No runtime code. No new file. Type-only export (TS-erased at build).

Source-of-truth shape derived from migration analysis §8.2. Library is opinionated about the 5-case union (analysis identifies this; R13 acknowledges).

---

## 10. Dev-warn implementations (summary)

| Where | Trigger | Message |
|---|---|---|
| `lib/href-resolver.ts` | item.href contains `{xxx}` not in templateValues | `[rich-sidebar] href "..." references placeholders {x}, {y} not present in hrefTemplateValues. Substitution skipped.` |

No warn for: unused templateValues keys (Q19); `bypassFiltering: true` (legitimate use case); missing `isOwner` (intentional default).

All warns gate on `process.env.NODE_ENV !== "production"` (tree-shaken from prod).

---

## 11. Demo update

`demo.tsx` adds a 5th tab "Multi-context (v0.2)" demonstrating:

- `topSlot` filled with a stub `<AccountSwitcher01>` (or a simple inline workspace dropdown if account-switcher-01 isn't shipped yet)
- `hrefTemplateValues={{ slug: currentBusinessSlug }}` substitution
- `isOwner` toggle that flips Members + Billing visibility
- `currentMaxMembers` slider (1 / 2 / 5 / 25) that toggles Members visibility on plan-tier gate
- `bypassFiltering` checkbox for personal-context override
- Live console log showing filtered section count + diagnostic info

A 6th demo "Headless filter hook" demonstrates calling `useFilteredNavSections` outside of `<RichSidebar>` — consumer renders their own arbitrary UI.

---

## 12. Performance considerations

- `useFilteredNavSections` is memoized over 5 inputs (Q16 / R14 lock).
- `resolveItemHref` is called per item per render. NOT memoized at the caller site — consumer can wrap with `useMemo` if their item set is large. Library doesn't second-guess.
- `String.prototype.replaceAll` allocates a new string per call. At ≤200 items, this is sub-millisecond. At >1000 items, consumer should pre-resolve in their own `useMemo` and skip `hrefTemplateValues` / `resolveHref`.
- `derive-visible-entries.ts` already O(N); new gates are constant per-item additions.

---

## 13. Dependencies

### 13.1 No new shadcn primitives required

v0.2.0 adds zero new primitives. Existing v0.1 surface (tooltip + sheet + avatar + button + dropdown-menu) unchanged.

### 13.2 No new npm peers

Lucide-react remains the only peer.

### 13.3 `meta.ts` `dependencies.internal`

Still `internal: []` — rich-sidebar does NOT pull account-switcher-01 as a registry dependency. The composition happens at the consumer's code (drop AccountSwitcher into topSlot). Description Appendix D explicit on this.

### 13.4 `validate-meta-deps` audit

After v0.2.0 ships, lint runs against rich-sidebar with the same meta — no expected drift (no new imports of shadcn-primitives or npm peers in shipped source).

---

## 14. Implementation order (commit chain)

6 commits, ordered for incremental verifiability. Each commit lands a runnable state — tsc + lint clean at every checkpoint.

| # | Commit | Files touched | Verification |
|---|---|---|---|
| **C1** | `feat(rich-sidebar): v0.2.0 types — NavContext + ownerOnly + minMembers + new props` | `types.ts`, `index.ts` (type exports) | tsc clean; no behavior change yet |
| **C2** | `feat(rich-sidebar): lib/href-resolver + dev-warn` | `lib/href-resolver.ts` (new) | tsc clean; pure helper, no callers yet |
| **C3** | `feat(rich-sidebar): extend derive-visible-entries with ownerOnly + minMembers + bypassFiltering` | `lib/derive-visible-entries.ts` (extend) | tsc clean; v0.1 callers unchanged (new params default to no-op) |
| **C4** | `feat(rich-sidebar): useFilteredNavSections hook + export` | `hooks/use-filtered-nav-sections.ts` (new), `index.ts` (re-export) | tsc clean; hook callable standalone |
| **C5** | `feat(rich-sidebar): wire topSlot + href resolution into render path` | `rich-sidebar.tsx` (topSlot + threading), `parts/sidebar-nav-row.tsx` (resolveItemHref) | tsc clean; existing demo unchanged behaviorally |
| **C6** | `feat(rich-sidebar): v0.2.0 demo + usage + version bump + registry + ship` | `meta.ts` (0.2.0), `demo.tsx` (multi-context + headless tabs), `usage.tsx` (headless pattern), `registry.json` (bump version), GATE 3 spotcheck review file, `.claude/decisions/<date>-rich-sidebar-v0.2.0-ship.md`, STATUS, component-versions | All validators clean; build green; spotcheck verdict ≥ Pass with follow-ups |

(Path-b smoke runs post-deploy per project pattern; F-cross-13 patch loop reserved for v0.2.1 if smoke surfaces a hit.)

---

## 15. Smoke harness plan (path-b)

After C6 push + Vercel deploy:

```bash
cd e:/tmp/ilinxa-smoke-consumer
pnpm dlx shadcn@4.6.0 add @ilinxa/rich-sidebar @ilinxa/rich-sidebar-fixtures
pnpm tsc --noEmit
```

Expected outcomes:
- ✅ Install pulls 34 files (v0.1 baseline) + any new files: `lib/href-resolver.ts`, `hooks/use-filtered-nav-sections.ts` = 36 files.
- ✅ tsc clean. F-S1 lock holds — no cross-procomp imports added.
- ⚠️ F-cross-13 surface unchanged from v0.1 (Tooltip + Sheet + DropdownMenu already defensively pre-wired). No new primitives → no new F-cross-13 hits expected.

---

## 16. Plan-stage open questions — RESOLVED at GATE 2 sign-off (2026-05-23)

All PQs below were signed off at GATE 2 close with defaults accepted. Kept here as historical record.

| # | Q | Resolution |
|---|---|---|
| **PQ1** | Should `useFilteredNavSections` also return diagnostic info? | ✅ **Locked items-only.** Diagnostic struct stays internal to `<RichSidebar>`. If consumers using the hook standalone want diagnostics, expose `_unstable_useFilteredNavSectionsDiagnostic` later. |
| **PQ2** | `resolveHref` callback — strict `string` return type? | ✅ **Locked strict `string`.** Suppressing href requires removing the item from `items` entirely; conditional-href consumers pre-filter. Matches v0.1's `item.href: string \| undefined` semantic where undefined means "no nav, render as label". |
| **PQ3** | `topSlot` — wrap content in role/aria? | ✅ **Locked unlabeled `<div>`** (no role, no aria-label). Library doesn't know what the slot contains; AT semantics are the consumer's responsibility (R12). |
| **PQ4** | Warn at `<RichSidebar>` boundary on empty `hrefTemplateValues={}`? | ✅ **Locked NO.** Empty `{}` is valid (consumer building map dynamically before all keys arrive). Only warn at substitution site per §10. |
| **PQ5** | `bypassFiltering` + `keepEmptySections` interaction? | ✅ **Locked independent / composable.** `bypassFiltering` skips per-item + per-section permission gates (per Finding 4 §6.3); `keepEmptySections` retains sections that ended empty after gating. |

---

## 17. Risks (carried from description R8–R14 + plan-stage additions)

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R8 (desc) | F-cross-13 surface unchanged from v0.1 | Low | No new defensive pre-emption work in v0.2.0 |
| R9 (desc) | Consumer assumes `useFilteredNavSections` mandatory | Low | Migration guide in guide.md |
| R10 (desc) | `resolveHref` callback expensive (per-render per-item) | Low | Document: use `useCallback`; lib calls per render |
| R11 (desc) | `{key}` substitution double-loop | Low | Single-pass `String.replaceAll` — structurally impossible (§5 note) |
| R12 (desc) | `topSlot` nested-`<nav>` semantic confusion | Low | PQ3 default: no wrapper; document landmark guidance |
| R13 (desc) | NavContext type opinionated, 5-case union | Low | Document as helper, not mandatory; v0.3 candidate for generics |
| R14 (desc) | `useFilteredNavSections` non-memo re-renders | Medium | Q16 + §4 memoize over 5 inputs |
| **R15** (plan) | `derive-visible-entries.ts` v0.2 extension changes hidden-count semantics for `bypassFiltering: true` case | Low | When bypassing, items hidden by `permission` / `ownerOnly` / `minMembers` are NOT counted as hidden (they're rendered). Only `hidden: true` increments the counter. Documented in `derive-visible-entries.ts` JSDoc + plan §6. |
| **R16** (plan) | `permissions: ReadonlySet<string>` rebuilt every consumer render invalidates `useFilteredNavSections` memo | Medium | Guide consumer toward `useMemo(() => new Set([...]), [membership?.permissions])` pattern in the v0.2 demo + guide.md. Library does NOT deep-compare set contents (would mask the consumer-side reference instability). |

---

## 18. Definition of "done" for THIS document (stage gate) — ✅ CLOSED 2026-05-23

GATE 2 v0.2.0 is **closed**:

- [x] All 5 plan-stage Q-Ps (PQ1–PQ5) resolved at default per §16.
- [x] Re-validation pass surfaced 4 findings (1 ⚠️ HIGH on `substituteTemplate` efficiency + 2 🔸 Medium on `bypassFiltering` scope + defaults + 1 🔹 Low on R16 reframing); all applied in-place. See §19.
- [x] Final read-through complete — locks L41–L52 fully threaded through plan sections per Appendix A.
- [x] User signed off 2026-05-23 ("Accept all 10 PQ defaults — close both GATE 2s").

Implementation begins at C1. After C6 closes, GATE 3 spot-check + decision file + STATUS update + push.

---

## 19. Re-validation pass log (2026-05-23, self-audit before sign-off)

Per `feedback_re_validation_pass_catches_real_issues`, the draft of this plan addendum was re-audited against:

1. Description locks alignment (L41–L52)
2. v0.1 backward compatibility (zero breaking changes)
3. Performance / memoization correctness
4. Dynamicity coverage
5. Cross-section coherence (sections + items behave consistently)

**4 findings surfaced; all applied in-place before close.**

### Finding 3 (⚠️ HIGH) — §5 substituteTemplate efficiency + diagnostic dedup

- **Issue:** Draft loop iterated `matchAll` results, calling `replaceAll` per match. Duplicate placeholders in the same href (e.g., `/x/{slug}/y/{slug}`) triggered redundant `replaceAll` calls AND could log the same missing key twice in the dev-warn message.
- **Fix applied:** Set-based dedup of placeholders + missing keys. Work scales with distinct placeholders, not total occurrences. See §5 final code.

### Finding 4 (🔸 Medium) — §6 bypassFiltering scope inconsistency between sections and items

- **Issue:** Draft §6 documented item-level branch behavior but didn't explicitly state that `bypassFiltering` also applies to section-level permission gates. Without that, a section with `permission` could drop while its items remain (because items skip gating), producing a "section disappears, children stay" inconsistency.
- **Fix applied:** §6.3 NavSection branch now explicitly shows `if (!bypassFiltering)` wrapping the section permission check. Semantics: "bypass = show everything not explicitly `hidden: true`" at BOTH levels.

### Finding 5 (🔸 Medium) — §6 explicit defaults for new params

- **Issue:** Draft §6 added 3 new optional params (`isOwner`, `currentMaxMembers`, `bypassFiltering`) but didn't specify default values at the function-body level. C3 verification ("v0.1 callers unchanged") relies on defaults being applied; the contract should be explicit.
- **Fix applied:** New §6.1 documents the destructuring defaults: `isOwner = false`, `currentMaxMembers = Infinity`, `bypassFiltering = false`. v0.1 callers literally see no behavior change because all new branches gate on truthy values for these params.

### Finding 6 (🔹 Low) — §17 R16 re-framed

- **Issue:** Draft R16 covered "Popover outside-click closes on sidebar nav-item clicks" — but that's by-design Radix Popover behavior, not a risk specific to v0.2. Misclassified.
- **Fix applied:** R16 replaced with the real Medium-severity risk surfaced by Finding 5 sibling: `permissions: ReadonlySet<string>` rebuilt per render invalidates the `useFilteredNavSections` memo. Mitigation = consumer-side `useMemo` guidance in demo + guide.md.

### Validated unchanged

- §2 type additions — strictly additive; v0.1 consumers compile unchanged
- §4 useFilteredNavSections memo deps — 5 inputs sufficient (no hidden coupling)
- §7 topSlot zero-layout-shift — `null` short-circuits the wrapper `<div>`
- §13 deps — no new shadcn primitives, no new npm peers; meta-deps audit clean
- §14 commit chain — incremental verifiability holds at each checkpoint
- §16 PQ1–PQ5 — defaults sensible; no challenges

---

## Appendix A — Cross-reference matrix (description L41–L52 ↔ plan sections)

| Lock | Description ref | Plan ref | Implementation file |
|---|---|---|---|
| **L41** | `topSlot` single named slot above brand | §7 | `rich-sidebar.tsx` |
| **L42** | `{key}` literal placeholder, String.replaceAll | §5 | `lib/href-resolver.ts` |
| **L43** | Two surfaces (templateValues + resolveHref), callback wins | §5 | `lib/href-resolver.ts` |
| **L44** | `ownerOnly` + `isOwner` pairing | §6.1 | `types.ts` + `lib/derive-visible-entries.ts` |
| **L45** | `minMembers` + `currentMaxMembers` pairing | §6.1 | `types.ts` + `lib/derive-visible-entries.ts` |
| **L46** | Three independent gates intersection | §6.1 | `lib/derive-visible-entries.ts` |
| **L47** | `useFilteredNavSections` signature | §4 | `hooks/use-filtered-nav-sections.ts` |
| **L48** | `NavContext` re-export, no `useNavContext` | §2.1, §9 | `types.ts` + `index.ts` |
| **L49** | Collapse-to-icon mode stays | n/a — v0.1 inheritance | (unchanged) |
| **L50** | Permission code drift framing (BE→FE) | n/a — guide.md | (no code) |
| **L51** | No URL routing baked in | n/a — guide.md | (no code) |
| **L52** | `isOwner` + `currentMaxMembers` raw scalars | §2.1 | `types.ts` |

---

## Appendix B — File-LOC delta budget

| File | v0.1 LOC | v0.2.0 LOC | Delta |
|---|---|---|---|
| `types.ts` | ~280 | ~340 | +60 (NavContext type + new props + JSDoc) |
| `lib/derive-visible-entries.ts` | ~95 | ~115 | +20 (3 new gates + bypassFiltering branch) |
| `lib/href-resolver.ts` | 0 | ~50 | +50 (new file) |
| `hooks/use-filtered-nav-sections.ts` | 0 | ~60 | +60 (new file) |
| `rich-sidebar.tsx` | ~400 | ~415 | +15 (topSlot render + threading) |
| `parts/sidebar-nav-row.tsx` | ~80 | ~85 | +5 (resolveItemHref call) |
| `demo.tsx` | ~250 | ~330 | +80 (multi-context + headless tabs) |
| `usage.tsx` | ~180 | ~210 | +30 (headless usage pattern) |
| `index.ts` | ~25 | ~30 | +5 (new exports) |
| `meta.ts` | ~70 | ~75 | +5 (version + JSDoc note) |

Total delta: **~330 LOC added** across 10 files. **2 new files** in the sealed folder. Zero files removed.

---

## Appendix C — Foldback plan (cross-ref with description Appendix C)

When v0.2.0 ships at C6:

1. This plan addendum's §3 (new + modified files) merges into the base plan's §4 (file structure).
2. §4 (`useFilteredNavSections` impl) merges into base plan §5 (state model / hooks) or §15 (slot props) — TBD at fold time.
3. §5 (`href-resolver.ts`) merges into base plan §15 (`linkComponent` integration) — same general area.
4. §6 extensions merge into base plan §8 (section state machine).
5. §14 commit chain (C1–C6) appends to base plan §20 (implementation order) with a v0.2.0 sub-heading.
6. This file AND the description addendum (`rich-sidebar-procomp-description-v0.2.0.md`) are **deleted** as part of the v0.2.0 close commit; their content lives in the merged base description + plan.

Until that fold, the base plan + this addendum read together = the v0.2.0 plan-of-record.

---

## Appendix D — `account-switcher-01` composition note

The canonical occupant of `topSlot` is `account-switcher-01` (sibling procomp, GATE 1+2 closing on the same day, 2026-05-23). Demo at C6 uses it; guide.md will document the composition recipe. Zero hard dependency — consumers slotting other widgets get identical sidebar behavior.

See `account-switcher-01-procomp-plan.md` Appendix A for the matching sibling-side view.
