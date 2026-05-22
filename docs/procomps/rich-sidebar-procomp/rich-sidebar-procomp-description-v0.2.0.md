# `rich-sidebar` v0.2.0 — Description Addendum (Stage 1)

> **Stage:** 1 of 3 · **Status:** 🟡 Drafted, awaiting sign-off
> **Slug:** `rich-sidebar` (unchanged) · **Target version:** `0.2.0`
> **Release model:** **additive expansion** on v0.1.x. Zero breaking changes; every v0.1 consumer keeps working unchanged.
> **Premise:** v0.1.x shipped from the **wrong source** (kasder's flat `SocialSidebar.tsx`). The real source — `E:/2026/socialmedia_adv_app/.../components/navigation/` — describes a multi-context app shell with a context-switcher at the top, `{slug}` href templates, and richer permission gating (`ownerOnly` + `minMembers`). The deep-dive sits at [`docs/migrations/socialmedia-adv-nav-system/analysis.md`](../../migrations/socialmedia-adv-nav-system/analysis.md). v0.2.0 lifts the missing app-agnostic features into the library.
>
> **This addendum** documents only the **delta** v0.1.x → v0.2.0. The base description ([`rich-sidebar-procomp-description.md`](rich-sidebar-procomp-description.md)) still defines the load-bearing v0.1 surface; this file extends it with five new lock categories (`topSlot`, `{slug}` templates, `ownerOnly`, `minMembers`, exports). When v0.2.0 ships, this file is FOLDED into the base description and removed — but until then, the two read together.

---

## 1. Problem (delta)

v0.1.x is a **static, single-context sidebar**: consumer passes a flat `items` array, library renders, badges and permissions gate. That's enough for one-workspace apps. It is NOT enough for the multi-tenant SaaS apps that motivated the migration:

- A user with three businesses + a platform membership needs to **switch contexts** at the top of the sidebar — without that, every context change is a manual URL edit or a separate page.
- A nav item like "Members" should resolve to `/bconsole/acme/members` when in acme's context and `/bconsole/globex/members` when in globex's — without `{slug}` templating, the consumer has to maintain N parallel `items` arrays per business and swap them on context change.
- Some items are owner-only (account settings, billing) — without `ownerOnly` on NavItem, the consumer has to pre-filter their array based on role.
- Some items require a plan tier (Members tab only visible when `account_max_members ≥ 2`) — without `minMembers`, same pre-filter dance.
- Exporting the `NavContext` discriminated union from the library means consumers stop hand-rolling the same five-case type union for every project.
- Exporting a `useFilteredNavSections` helper means the consumer's filter logic is one declarative call instead of 30 lines of nested filters per app.

v0.2.0 ships all of this **additively**: every v0.1.x prop and behavior is preserved exactly; new props are opt-in.

### Why this isn't a breaking v1.0.0

Because none of the v0.1.x semantics change. Items that don't have `ownerOnly` / `minMembers` filter the same way as before (no filtering). Items without `{xxx}` placeholders in `href` render literally (no substitution). Consumers without a `topSlot` see no top zone. The slug stays `rich-sidebar`; exports keep their `RichSidebar*` names.

The version bump is `0.1.x → 0.2.0` (minor) per semver: net-new functionality, zero breakage. Per the readiness-review rule, **GATE 3 is required** for this bump because it touches the public API surface (new props, new exports). Patch-bump exemption does NOT apply.

---

## 2. In scope / Out of scope (delta to v0.1)

### v0.2.0 — in scope

**5 additions:**

1. **`topSlot?: ReactNode`** (new prop) — single named slot above the brand zone. Consumer mounts `<AccountSwitcher01>` + any inter-section widgets (governance bars, breadcrumbs, status banners) here, stacked via Fragment if multiple. Renders nothing when omitted (v0.1 behavior).

2. **`{key}` href template support** (new opt-in mechanism) — two surfaces:
   - `hrefTemplateValues?: Record<string, string>` — when present, NavItem hrefs get every `{key}` substring replaced with the corresponding value via `String.prototype.replaceAll("{" + key + "}", value)` per entry. Items whose href has no `{...}` placeholders render unchanged.
   - `resolveHref?(item: NavItem, templateValues: Record<string,string> | undefined) => string` — escape-hatch callback. When provided, **wins precedence** over `hrefTemplateValues` substitution. Returns the final string. Lets consumers do arbitrary transforms (multi-tenant subdomain rewrites, locale prefixes, conditional sub-paths).
   - Both omitted → v0.1 behavior (literal href).

3. **`NavItem.ownerOnly?: boolean`** (new optional field) — when `true`, item is hidden in the filter pass unless the sidebar's new `isOwner?: boolean` prop is also `true`. Default `false`. Works alongside existing `permission?` and the new `minMembers?` field — all three gates pass independently (intersection).

4. **`NavItem.minMembers?: number`** (new optional field) — when set, item is hidden unless the sidebar's new `currentMaxMembers?: number` prop is `>=` this value. Default unset (no min). Useful for plan-tier gating (Members tab visible only on plans with seat capacity ≥ N).

5. **Exported helpers** (new public API additions):
   - **`type NavContext`** — discriminated union: `personal | business{slug, accountId, accountName} | platform{accountId} | governance | cms{platform|business{slug, accountId, accountName}}`. **Type-only re-export.** Consumer uses it to type their URL-derivation code. Library doesn't ship a `useNavContext` hook (analysis §8.13 #7) — that's consumer-side because it's coupled to their router.
   - **`useFilteredNavSections({ sections, permissions?, isOwner?, currentMaxMembers?, bypassFiltering? }) → NavSection[]`** — pure helper hook. Three gates per item (permission ∩ ownerOnly ∩ minMembers), then drops empty sections. `bypassFiltering: true` skips all gates (personal-context shortcut).

**Plus four new sidebar props to feed the filter logic:**

- `isOwner?: boolean` — fed into the filter pass; default `false` → all `ownerOnly` items hidden.
- `currentMaxMembers?: number` — fed into the filter pass; default `Infinity` → all `minMembers` items visible.
- The existing `permissions?: ReadonlySet<string>` prop is unchanged (already in v0.1).
- The new `bypassFiltering?: boolean` for the rare "show everything regardless of gates" case (debugging, admin views).

### v0.2.0 — explicitly OUT of scope

- **`useNavContext` URL→context hook.** Document the pattern (Next, TanStack Router, plain `location`); don't ship. Consumer's router coupling is their concern. (analysis §8.13 #7)
- **A canned `<AccountSwitcher>` recipe** baked into rich-sidebar. The switcher is a separate procomp (`account-switcher-01`); rich-sidebar accepts it via `topSlot` and nothing more. (analysis §8.13 #4)
- **Bottom-tab-bar-01 integration.** Carried into a separate procomp's GATE 1.
- **Mobile menu sheet composition.** The composition is a guide.md recipe using v0.1's existing `<RichSidebar>` mobile drawer mode + `<Sheet>` from shadcn. No new prop needed.
- **`{xxx}` placeholder syntax variants.** Only `{key}` is supported. No `:key`, `[key]`, or other syntaxes.
- **Async filter / suspense modes** on `useFilteredNavSections`. Synchronous only.
- **Permission code type narrowing** (typed enum / template-literal types over a Permission code union). Stays untyped — consumer controls their permission strings.

---

## 3. Target consumers (delta to v0.1)

v0.1's target audience is unchanged. v0.2.0 ADDS:

6. **Multi-tenant SaaS apps with role + plan-tier-aware navigation** — the new `ownerOnly` + `minMembers` gates.
7. **App shells with URL-derived workspace context** — the `{slug}` templates + `NavContext` type.
8. **Consumers who want declarative filter logic** — the `useFilteredNavSections` hook.

No consumer is excluded by v0.2.0. Single-tenant apps simply don't use the new props; nothing changes for them.

---

## 4. Rough API sketch (delta)

The full v0.1 surface stays. NEW additions in code:

```tsx
import {
  RichSidebar,
  useFilteredNavSections,
  type NavContext,
  type NavSection,
} from "@/registry/components/navigation/rich-sidebar";

// Consumer-side: derive NavContext from URL (rich-sidebar doesn't ship the hook)
function useMyNavContext(): NavContext {
  const pathname = usePathname();
  // ... consumer's pathname → context mapping
}

function ConsumerSidebar() {
  const pathname = usePathname();
  const context = useMyNavContext();
  const membership = useCurrentMembership(context);
  const permissions = useMemo(
    () => new Set(membership?.permissions?.map((p) => p.code) ?? []),
    [membership],
  );

  // Pick the config section list for the current context
  const sections: NavSection[] = useMemo(
    () => MY_NAV_CONFIG[context.type] ?? [],
    [context.type],
  );

  // Filter via the new helper
  const filteredSections = useFilteredNavSections({
    sections,
    permissions,
    isOwner: membership?.is_owner ?? false,
    currentMaxMembers: membership?.account_max_members,
    bypassFiltering: context.type === "personal",
  });

  // Substitute {slug} in business hrefs
  const templateValues = useMemo(() => {
    if (context.type === "business" || (context.type === "cms" && context.mode === "business")) {
      return { slug: context.slug };
    }
    return undefined;
  }, [context]);

  return (
    <RichSidebar
      items={filteredSections}
      currentPath={pathname}
      hrefTemplateValues={templateValues}
      isOwner={membership?.is_owner ?? false}
      currentMaxMembers={membership?.account_max_members}
      topSlot={
        <AccountSwitcher01
          items={accountSwitcherItems}
          activeKey={activeContextKey}
          onSelect={(item) => item.href && router.push(item.href)}
          fallbackActiveItem={fallbackItem}
          footerSlot={createOrRequestAffordance}
        />
      }
    />
  );
}
```

---

## 5. Example usages (delta to v0.1)

Three v0.1 example demos stay. Two NEW demos for v0.2.0:

### 5.1 Multi-context demo
Switcher in topSlot, business / personal / platform contexts, `{slug}` templates, permission filter, ownerOnly gate, minMembers gate. The "complete v0.2.0 vertical" demo.

### 5.2 Headless filter hook standalone
Consumer renders their own arbitrary sidebar UI but uses `useFilteredNavSections` to do the filter logic. Demonstrates the hook's independence from `<RichSidebar>`.

---

## 6. Success criteria (delta to v0.1)

All v0.1 success criteria stand. New v0.2.0 criteria:

9. **Zero breaking changes verified.** A v0.1.x consumer's existing code compiles + runs identically. tsc + lint + dev-page + smoke test all green without any source modifications to the consumer.
10. **`topSlot` renders above the brand zone with zero layout shift between absent/present.** When `topSlot` is null/undefined, the header chrome looks identical to v0.1 (no empty zone, no padding ghost). When present, the slot occupies its content's natural height; collapsed-mode passes through to whatever the slot renders (library doesn't second-guess the consumer's content sizing).
11. **`{key}` substitution works for arbitrary keys**, not just `{slug}`. Consumer can use `{accountId}`, `{locale}`, `{tenant}`, etc.
12. **`resolveHref` callback wins precedence over `hrefTemplateValues`.** When both are provided, callback is called for every item; its return value is the final href. Substitution is bypassed entirely.
13. **`useFilteredNavSections` exports as a regular `use*` hook**, follows React rules-of-hooks, returns referentially stable sections when inputs don't change.
14. **`NavContext` type re-export usable in consumer code.** Consumer types their own URL-derivation function with `(): NavContext` and TypeScript narrows correctly across the discriminant.

---

## 7. Locked decisions (L41–L52, continuing from v0.1's L1–L40)

| # | Lock |
|---|---|
| **L41** | **`topSlot` is the single named slot above the brand-row container.** Geographically distinct from v0.1's existing `headerSlot` (which renders INSIDE the brand row, to the LEFT of `brandSlot`). Hierarchy from top to bottom: `topSlot` (NEW v0.2) → `headerSlot` (v0.1, inside brand row) → `brandSlot` (v0.1) → `navAccessorySlot` (v0.1). No `betweenTopAndNavSlot`, no multi-slot above brand. Consumer Fragment-stacks if they want multiple widgets in `topSlot`. (analysis F-01) |
| **L42** | **`{key}` syntax — literal `{...}` placeholder, `String.replaceAll` substitution.** No regex, no nested braces, no escaping. Consumer passes `hrefTemplateValues` = `{ slug: "acme" }` and every `{slug}` in every NavItem's href is replaced. |
| **L43** | **Two surfaces for href resolution:** `hrefTemplateValues` (common-path prop) + `resolveHref?(item, values)` (callback escape hatch, wins precedence). (analysis F-03) |
| **L44** | **`ownerOnly: boolean`** on NavItem, paired with sidebar prop `isOwner: boolean`. Item hidden when `ownerOnly && !isOwner`. |
| **L45** | **`minMembers: number`** on NavItem, paired with sidebar prop `currentMaxMembers: number`. Item hidden when `minMembers && currentMaxMembers < minMembers`. |
| **L46** | **Three independent gates, all must pass: permission ∩ ownerOnly ∩ minMembers.** Then empty sections dropped. Matches source's `useFilteredNav` semantics (analysis §8.7). |
| **L47** | **`useFilteredNavSections({ sections, permissions?, isOwner?, currentMaxMembers?, bypassFiltering? })`** — final signature. `bypassFiltering` is the explicit personal-context discriminator; no `context` param. (analysis F-02) |
| **L48** | **`type NavContext` re-exported, no `useNavContext` hook.** Type-only library API; consumer ships the hook for their router. |
| **L49** | **`<RichSidebar>`'s collapse-to-icon mode stays.** Source has no equivalent — ilinxa extension beyond the source. (analysis §8.1) |
| **L50** | **Permission code drift framing — asymmetric (BE→FE).** Library accepts opaque strings; consumer maintains the source-of-truth list. (analysis §8.5) |
| **L51** | **No URL routing logic baked in.** `CCONSOLE_PLATFORM_SEGMENTS`-style reserved-word collisions are documented as a consumer concern. (analysis §8.9) |
| **L52** | **`isOwner` + `currentMaxMembers` are raw scalars,** not an opaque `membership` object. Consumer extracts the values from whatever auth store they use. |

---

## 8. Open questions — RESOLVED at GATE 1 sign-off (2026-05-23)

All Q-Ps below were signed off at GATE 1 close with defaults accepted. Kept here as historical record; future iteration replaces the table rather than re-opening individual rows.

| # | Q | Resolution |
|---|---|---|
| **Q15** | Final slot name: `topSlot` vs `aboveBrandSlot` vs `chromeSlot` vs `headerSlot` (wait — `headerSlot` is already taken in v0.1 for the HEADER row, distinct from above-the-brand zone). | ✅ **Locked `topSlot`** — analysis F-11 closed; terse wins. L41 stands. |
| **Q16** | Should `useFilteredNavSections` be a memoized hook (returns referentially-stable sections when inputs unchanged) or a pure function called inline? | ✅ **Locked memoized hook** — `useMemo` internally over `[sections, permissions, isOwner, currentMaxMembers, bypassFiltering]`. Aligns with the rest of rich-sidebar's hook patterns; R14 mitigation. |
| **Q17** | When `resolveHref` is provided, do we still pass `hrefTemplateValues` to it (as the second arg)? Or does the callback fully own substitution? | ✅ **Locked pass `templateValues` as the second arg.** Strict superset of default behavior; consumer-friendly. |
| ~~Q18~~ | ~~permission AND ownerOnly intersection vs union~~ — **already locked at L46** (three-gate intersection). Question removed as redundant; L46 stands. |  |
| **Q19** | Should the dev console warn when `hrefTemplateValues` has keys NOT referenced in any item, OR items reference `{xxx}` placeholders not present in `hrefTemplateValues`? | ✅ **Locked warn on missing placeholder values (items reference `{xxx}` not in map).** Helps consumers catch drift. No warn on unused values — those are common (one map, multiple sidebars). |
| ~~Q20~~ | ~~permissions value optional vs required~~ — **already implied by L47**'s `permissions?:` optional marker. Question removed; `undefined ≡ empty set` semantic is locked by the optional `?` in L47. |  |
| **Q21** | Should `bypassFiltering` truly bypass ALL gates (including `hidden: true`), or only the three permission gates? | ✅ **Locked three permission gates only.** `hidden: true` is an explicit per-item opt-out; respecting it is unconditional. |
| **Q22** | Should we ship a `validateNavContextConfig()` runtime helper that checks consumer's NAV_CONFIG-shaped object for common issues (duplicate keys, missing placeholders, dangling references)? | ✅ **Locked NO — v0.3+ candidate.** Consumer's responsibility for now. |

---

## 9. Risks (delta to v0.1)

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R8 | F-cross-13 surface unchanged from v0.1 (Tooltip + Sheet + DropdownMenu). No new Radix primitives in v0.2.0 unless we add a new slot uses Popover (not for rich-sidebar's own scope; account-switcher-01 ships that). | Low | No new pre-emption work in rich-sidebar v0.2.0. |
| R9 | A consumer migrating from v0.1.x might assume the new `useFilteredNavSections` MUST be used. Add migration guide.md note: "use it if you want declarative filtering; ignore it and pass pre-filtered `items` if you don't." | Low | Migration guide. |
| R10 | The `resolveHref` callback could be called per-render per-item — performance concern if consumer's callback is expensive. | Low | Document: callback should be a stable function (useCallback) and cheap. Library calls it during render; no internal memoization. |
| R11 | `{key}` substitution with values containing `{...}` substrings could cause double-substitution loops. | Low | Single-pass substitution — `String.replaceAll` doesn't re-scan replaced regions. No loop possible. |
| R12 | A consumer renders `topSlot` with content that includes its own `<nav>` element — could create nested-nav semantic confusion. | Low | Document: `topSlot` is INSIDE rich-sidebar's `<nav>` — content should not introduce a second `<nav>` element. ARIA landmark guidance in guide.md. |
| R13 | NavContext type re-export ties the library to the source's five-context union. Consumers with different context types would have to extend it. | Low | The exported type IS opinionated (matches the source). Consumers needing different shapes type their own; the lib type is a documented helper, not mandatory. Could extract to a generic v0.3. |
| R14 | `useFilteredNavSections` returning a new array reference on every render even when inputs unchanged → re-renders downstream. | Medium | Q16 default = memoized. Internal `useMemo([sections, permissions, isOwner, currentMaxMembers, bypassFiltering])`. |

---

## 10. Definition of "done" for THIS document (stage gate) — ✅ CLOSED 2026-05-23

GATE 1 for v0.2.0 is **closed**:

- [x] All 6 active Q-Ps (Q15/Q16/Q17/Q19/Q21/Q22) resolved at default. Q18 + Q20 struck during the pre-close revalidation pass (already locked at L46 / L47).
- [x] All 12 new locks (L41–L52) confirmed.
- [x] Re-validation pass (2026-05-23) — 11 findings on addendum applied (9 self + 2 cross-consistency); no further dynamicity-primacy gaps surfaced for rich-sidebar (the two findings from that pass landed in the sibling account-switcher-01 description).
- [x] User signed off 2026-05-23 ("Apply both — then accept all defaults").

GATE 2 plan authoring for v0.2.0 begins now at [`rich-sidebar-procomp-plan-v0.2.0.md`](rich-sidebar-procomp-plan-v0.2.0.md) (companion to this addendum). The plan will list the additive files, the migration shape inside `derive-visible-entries.ts`, the new hook implementation, the demo update, the type re-exports, etc.

---

## Appendix A — Improvements over source (deliberate deviations)

v0.2.0 ports the source's pattern but improves on it in seven specific places. Each is the library doing more than the source did — captured here so future contributors don't regress by "matching the source."

| # | Improvement | Source behavior | Library behavior | Locked in |
|---|---|---|---|---|
| **I-1** | **`{key}` generalized template syntax** | Source: only `{slug}` substring substitution, hardcoded for business + cms-business contexts. | Library: arbitrary `{key}` placeholders via `hrefTemplateValues: Record<string, string>`. Consumer uses `{slug}`, `{accountId}`, `{locale}`, `{tenant}`, etc. | L42 |
| **I-2** | **`resolveHref` callback escape hatch** | Source: no callback — substitution is hardcoded in `resolveHref()` lib function. | Library: optional `resolveHref?(item, values)` callback wins precedence over the built-in substitution. Lets consumers implement subdomain rewrites, locale prefixes, conditional sub-paths. | L43 |
| **I-3** | **`bypassFiltering` explicit flag** | Source: `useFilteredNav` branches on `context.type === "personal"` to skip the filter pass — implicit, hard-coded. | Library: explicit `bypassFiltering: true` flag on `useFilteredNavSections`. Consumer decides when to bypass (personal context, admin overrides, debug views). No baked-in context discrimination. | L47 |
| **I-4** | **`useFilteredNavSections` is a pure hook** | Source: `useFilteredNav` directly reads zustand stores (`useMembershipStore`) inside the hook. Tight coupling to a specific auth shape. | Library: pure hook with explicit inputs (`sections`, `permissions`, `isOwner`, `currentMaxMembers`, `bypassFiltering`). Consumer wires their own store reads outside. Portable across auth strategies. | L47 |
| **I-5** | **Raw scalar inputs (`isOwner`, `currentMaxMembers`)** | Source: passes opaque `membership` object through; filter logic reads `membership.is_owner`, `membership.account_max_members`. | Library: raw `boolean` + `number` props. Consumer extracts from whatever auth shape they have (Membership object, JWT claim, custom struct). | L52 |
| **I-6** | **Exported `NavContext` discriminated union type** | Source: defines `NavContext` internally; never exported from any package boundary (it's an app, not a library). | Library: re-exports `type NavContext` as part of the public API. Consumer types their URL-derivation code against the shared union; TypeScript narrows across the discriminant automatically. | L48 |
| **I-7** | **No URL routing logic baked in** | Source: `useNavContext` baked into `next/navigation` + the kasder app's specific route prefixes (`/bconsole/`, `/cconsole/`, `/pconsole/`, `/gconsole/`). Also has the latent `CCONSOLE_PLATFORM_SEGMENTS` reserved-word collision. | Library: ships zero URL-derivation code. Documents the pattern as a recipe (Next.js, TanStack Router, plain `window.location`). Consumers immune to the source's collision risk. | L51 |

### Improvements NOT in v0.2.0 but worth flagging

These are explicitly NOT v0.2 candidates but are worth surfacing here so we don't accidentally re-introduce them mid-implementation:

- **Typed permission-code enum.** Source uses inline strings; library does the same. A v0.3+ helper could narrow types, but that's a separate decision.
- **`validateNavContextConfig()` runtime helper.** Source has no such helper; library defers (Q22 default = no). v0.3+ candidate.
- **Async/suspense filter modes.** Source is synchronous; library matches.

---

## Appendix B — Semver tooth-grinding

We're going `0.1.x → 0.2.0`. Project convention so far: alpha components stay below `1.0.0` while their public API evolves. v0.2.0 is a minor bump because new public props + new exports are net-new functionality. **Patch-bump exemption does NOT apply** (this touches public API). GATE 3 is required.

If the next bump after this is also additive (e.g., adding a `searchable` prop or new prefab), it's `0.2.x → 0.3.0`. Breaking changes (any removal or rename of a v0.2 public prop) would justify `0.x → 1.0.0` — currently no such breaking changes are queued, so `1.0.0` is not on the near roadmap.

---

## Appendix C — Foldback plan

When v0.2.0 ships:

1. This addendum's §2 (in/out of scope) merges into the base description's §2.
2. L41–L52 inline-append the base description's L1–L40.
3. Q15–Q22 become resolved Q-Ps in the base description's §8 (kept as historical record).
4. R8–R14 merge into base description's §9.
5. This file (`rich-sidebar-procomp-description-v0.2.0.md`) AND its companion plan (`rich-sidebar-procomp-plan-v0.2.0.md`) are **deleted** as part of the v0.2.0 close commit; their content lives in the merged base description + plan.

Until that close, the base description remains the v0.1 record, and this addendum is the v0.2.0 spec. Two files reading together = the current intent.

---

## Appendix D — relationship to account-switcher-01

`account-switcher-01` ships SEPARATELY as a sibling procomp at version 0.1.0 (see [`docs/procomps/account-switcher-01-procomp/account-switcher-01-procomp-description.md`](../account-switcher-01-procomp/account-switcher-01-procomp-description.md)). The two procomps are **independently installable** via the shadcn registry; rich-sidebar v0.2.0 does NOT pull account-switcher-01 as a registry dependency.

The composition happens at the consumer's app code (drop `<AccountSwitcher01>` into `<RichSidebar topSlot={...} />`). Documented as a recipe in rich-sidebar's guide.md and demo'd on the docs site.

If consumers want to slot something else (custom workspace dropdown, command palette trigger, status indicator), the slot accepts anything. account-switcher-01 is just the canonical occupant.
