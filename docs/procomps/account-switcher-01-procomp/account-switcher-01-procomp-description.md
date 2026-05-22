# `account-switcher-01` — Pro-component Description (Stage 1)

> **Stage:** 1 of 3 · **Status:** 🟡 Drafted, awaiting sign-off
> **Slug:** `account-switcher-01` · **Category:** `navigation`
> **Release model:** **single feature-complete v0.1.** The surface is intentionally tight (nine props — six render/data + three dynamicity-mandate ergonomics: controlled-open triplet + `ariaCurrent`); compactness IS the design. Expansion candidates (`description?` line, `groupId?` grouping, `triggerVariant?`) are explicitly deferred — see §2.
> **Conceptual lineage:** workspace/context switchers in Linear, Notion, Vercel dashboard, Slack ⌘K workspace dropdown, GitHub repo selector. Source pattern: combobox-style popover with an active row + a footer affordance.
>
> **Migration origin:** [`docs/migrations/socialmedia-adv-nav-system/`](../../migrations/socialmedia-adv-nav-system/) — extracts the `<AccountSwitcher>` pattern from the multi-context app shell (the THE-feature-the-user-flagged from the v0.1 sidebar migration miss). 172-LOC source at [`original/components/AccountSwitcher.tsx`](../../migrations/socialmedia-adv-nav-system/original/components/AccountSwitcher.tsx). 30% direct port / 70% generalization — source is tightly coupled to memberships + business-creation feature; library version is a domain-agnostic primitive.
>
> **Sibling-of:** `rich-sidebar` v0.2.0. Designed to mount inside rich-sidebar's new `topSlot` (above the brand). No hard dependency — works standalone, slotted anywhere the consumer needs a "current context + switchable other contexts + create-new affordance" UI.

This is the **description** doc. Its job is to pin down what we're building and why, surface open decisions, and earn sign-off before any planning or code.

---

## 1. Problem

Every multi-tenant SaaS surface has the same widget at the top of its app-shell: a button labeled with the user's currently-active context (workspace / account / project / sub-account / team) that opens a list of switchable contexts, with the active one marked, and a row at the bottom for "Create new …" (or its multi-state cousin: "Request access", "Pending review", "Action needed", "Available in 3 days"). Linear, Notion, Vercel, Slack, GitHub, Figma — same shape, every time.

shadcn ships none of this. The combobox primitive comes close visually but doesn't model active vs switchable, doesn't model dual-entry items (same conceptual account in two sub-modes), doesn't expose a footer for arbitrary state machines. The Popover + manual list pattern works but every consumer reinvents the same six props, the same aria-combobox dance, the same "what if the active context doesn't match any item" fallback.

`account-switcher-01` is the single-source-of-truth pattern: **active-context-aware popover-with-switchable-items**, with a `fallbackActiveItem` so the trigger never mis-labels (a real UX bug in the migration-origin source), and an arbitrary `footerSlot` so consumers can drop in their own state-machine widgets without the library taking on their domain.

### Why a separate procomp, not just a slot recipe in rich-sidebar?

Two reasons. (a) **Reuse beyond sidebars** — same UI applies to topbar workspace pickers, settings-page context switchers, command-palette mode toggles, multi-account avatar dropdowns. Coupling to rich-sidebar would lock out those cases. (b) **Sealed-folder ownership of the aria-combobox dance + collapsed-mode rendering + width-matches-trigger popover quirks.** Asking every consumer to wire these from primitives is exactly the maintenance load this library exists to remove.

### Release strategy — single feature-complete v0.1 (but small)

The user has stood up the **dynamicity-primacy** rule across the project: "add it later is a breaking change." So why is this surface only six props?

Because the source has exactly this surface, and stress-testing the catalog against speculative additions (`description?`, `groupId?`, `meta?`, `triggerVariant?`) didn't survive the re-validation pass at [`analysis.md §11 F-05`](../../migrations/socialmedia-adv-nav-system/analysis.md#11-re-validation-pass-log-self-audit-2026-05-22). Each was an over-engineer for an unverified consumer need. **Six props ship.** v0.2+ candidates are documented in §2 (out-of-scope) — additive when real demand arrives, not breaking.

---

## 2. In scope / Out of scope

### v0.1 — in scope

**SwitcherItem shape (tight)**

```ts
interface SwitcherItem {
  /** Stable unique key. Dual-entry items for the same conceptual account
   *  (e.g., business-mode + CMS-sub-mode of the same business) use
   *  distinct keys like `biz-acme` + `cms-biz-acme`. */
  key: string;
  label: string;
  icon?: ReactNode | ComponentType<{ className?: string }>;
  /** Optional — switcher fires `onSelect(item)` regardless of href.
   *  Consumer wires routing inside `onSelect` (router.push for SPA,
   *  href for SSR fallbacks, or both). */
  href?: string;
}
```

**Component surface**

- **`items: ReadonlyArray<SwitcherItem>`** — ordered list. Consumer controls ordering (no library-side `pinnedItems` API; the source's "CMS active context first" pattern is just `[...(cmsActiveItem ? [cmsActiveItem] : []), ...rest]` in the consumer).
- **`activeKey: string | null`** — the currently-active item's key. When null OR not found in items, the trigger falls back to `fallbackActiveItem` (if provided) then to `items[0]`.
- **`onSelect: (item: SwitcherItem) => void`** — fires on click. **Active-item clicks are no-ops at library level** (matches source behavior); consumer can re-affirm if they want.
- **`fallbackActiveItem?: SwitcherItem`** — shown in the trigger when `activeKey` doesn't resolve to an item. Avoids the source's "show Personal when actually in governance" UX bug (§8.10 of analysis).
- **`footerSlot?: ReactNode`** — rendered below the items list, separated by a divider. Consumer places "Create new …" / multi-state Request affordances / Settings link / sign-out / anything. The library does NOT model state — slot accepts arbitrary content.
- **`isCollapsed?: boolean`** — when true, the trigger collapses to icon-only mode (no label, no chevron). The popover content still shows full labels (the trigger collapses; the popover doesn't). Designed for slotting into `rich-sidebar`'s collapse-to-icon mode.
- **`"aria-label"?: string`** — defaults to `"Switch account context"` (matches source). Consumer overrides for non-account semantics.
- **`ariaCurrent?: "true" | "page" | "step" | "location" | "date" | "time" | false`** — value applied to the active item's `aria-current` attribute. Default `"true"` (generic active-state semantic, correct for a switcher). Consumer overrides to `"page"` when the switcher acts as primary navigation, `"step"` for stepper-style mode toggles, etc. Pass `false` to omit the attribute entirely (uncommon, e.g. when the consumer manages aria semantics externally). (L14)
- **`open?: boolean`** / **`defaultOpen?: boolean`** / **`onOpenChange?: (next: boolean) => void`** — controlled+uncontrolled open-state triplet, mirroring Radix Popover's canonical pattern. Uncontrolled by default. Lets consumers wire keyboard-shortcut openers (Cmd+K), tutorial-driven programmatic opens, multi-switcher sync, and test harnesses without a v0.2 break. `onOpenChange` is F-cross-13 typeof-guarded internally (per L11). (L13)
- **`className?: string`** — pass-through to the trigger element.

**Interaction model**

- Trigger: `role="combobox"`, `aria-expanded`, `aria-label`. Mirrors source's combobox-with-button-list compromise pattern (vs full listbox semantics) — common, accepted, ergonomic.
- Popover open: click trigger OR `ArrowDown` / `Enter` / `Space` on focused trigger.
- Inside popover: items are `<button>` elements; navigated via Tab and Arrow keys (Radix Popover's focus trap); `Enter` / `Space` activates.
- Active-item rendering: same row as the others, with a trailing `Check` icon and an `aria-current="true"` attribute. Clicking does NOT fire `onSelect` (no-op).
- Popover closes: Escape, outside click, item activation. Standard Radix Popover behavior.
- Width: popover content width = trigger width (Radix CSS var `--radix-popover-trigger-width`), so contents align with whatever container the trigger sits in.

**Out-of-the-box visual style**

- Trigger: `<Button variant="outline">` shadcn primitive at full container width, with chevron-up-down right-aligned. Active item's icon + label in the left slot.
- Popover content: rounded card, items as ghost-buttons with hover state, separator before footerSlot when present.
- Active item: subtle background highlight + check trail. Matches source.
- Collapsed-mode trigger: icon-only square button (40px), centered icon, no label, no chevron. Popover opens to the right (or left depending on viewport) instead of below.

**A11y mandate**

- Combobox aria pattern as above.
- Keyboard-only navigation works end-to-end (open / browse / select / close).
- Focus returns to trigger after close.
- `aria-current="true"` on the active item; screen-reader users hear "current item" when they reach it.
- Reduced motion respected (popover open/close animations are `motion-safe:` if any).

**Permissions & gating model**

NONE in the library. Consumer pre-filters their `items` array. If the user has no access to a context, the consumer simply doesn't include it in `items`. The library knows nothing about memberships, roles, or permissions — that's `rich-sidebar` v0.2.0's `useFilteredNavSections` territory, and even there it stays consumer-side.

### v0.1 — explicitly OUT of scope

Documented so the next contributor doesn't drift here without a description re-validation:

- **Search / filtering** inside the popover. Source has none; for >10 items, consumer can compose a Command (cmdk) primitive instead. v0.2 could add `searchable?: boolean` if real consumer demand emerges.
- **Groups / sections** within the items list (`groupId` field). Source flat-lists items. Sectioning is the consumer's job (insert separator items between groups via a custom rendering — though the v0.1 SwitcherItem has no `separator` kind, so this implies they'd compose multiple AccountSwitcher instances OR use a different primitive entirely).
- **Custom row renderer** (`renderItem` render-prop slot). The footer is the escape hatch for custom content; the item list is rigid by design.
- **Trigger variants** (`triggerVariant: "button" | "row" | "compact-icon"`). v0.1 ships one variant (button); `isCollapsed` is the only modifier. Multi-variant ergonomics belong to a richer v0.2 if there's demand.
- **Per-item `meta` / `description` / `disabled`**. Not in source; speculative until proven.
- **`onTriggerOpen?: (open: boolean) => void`**. Source has none — open state is internal to the popover. If consumers need observability, v0.2 candidate.
- **Async items loading state**. Consumer pre-resolves; if they have a loading state, they render the trigger with their own skeleton during it and pass `items={[]}` + `fallbackActiveItem={someSkeleton}`. Or use a different primitive.
- **Multi-select / checkbox mode**. This is a SWITCHER not a multi-picker. Different pattern → different procomp.

---

## 3. Target consumers

The same SaaS teams who consume `rich-sidebar`. Specifically:

1. **Multi-tenant SaaS app shells** — workspace switcher in the sidebar (Linear-style).
2. **Multi-context governance apps** — "you are now operating as Platform / Business X / Governance / CMS for Business X" mode switcher.
3. **Multi-account avatar widgets in topbars** — quick context flip without leaving the page.
4. **Settings / billing pages** — "billing for which workspace?" picker.
5. **Command-palette adjacencies** — when a command needs context, drop the switcher into the palette as the first row.

Out of the target audience: any single-tenant app (no contexts to switch). Any nav surface where the active label is determined by the parent (this widget OWNS the label).

---

## 4. Rough API sketch (NOT final — that's the plan stage)

Repeated from §2 in code form for at-a-glance reading:

```tsx
import { AccountSwitcher01 } from "@/registry/components/navigation/account-switcher-01";
import { Building2, Globe, User, Plus } from "lucide-react";

function ExampleConsumer() {
  const router = useRouter();
  const pathname = usePathname();
  const memberships = useMembershipStore((s) => s.memberships);

  // Consumer derives — library doesn't know about memberships
  const items = useMemo(() => [
    { key: "personal", label: "Personal", icon: User, href: "/home" },
    ...memberships.map((m) => ({
      key: `biz-${m.slug}`,
      label: m.name,
      icon: Building2,
      href: `/bconsole/${m.slug}/dashboard`,
    })),
    ...(hasPlatform ? [{ key: "platform", label: "Platform", icon: Globe, href: "/pconsole/dashboard" }] : []),
  ], [memberships, hasPlatform]);

  // Active key derivation also lives in consumer
  const activeKey = useMemo(() => derive(pathname, memberships), [pathname, memberships]);

  return (
    <AccountSwitcher01
      items={items}
      activeKey={activeKey}
      onSelect={(item) => item.href && router.push(item.href)}
      footerSlot={
        canCreate ? (
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Create Business
          </Button>
        ) : null
      }
    />
  );
}
```

Note: the consumer's `useMemo` deps + the `derive()` call are intentional — they live OUTSIDE the library. The library just renders.

---

## 5. Example usages

Three locked usage patterns. Each will land as a demo on the docs-site:

### 5.1 Workspace switcher in a rich-sidebar topSlot
The canonical pairing. Consumer wires memberships → items array, derives activeKey from pathname, slots into `<RichSidebar topSlot={...} />`. Demonstrates the full multi-context UX end-to-end.

### 5.2 Standalone in a topbar
Not in a sidebar. Used as a 240px-wide button at the top-right of a topbar. Demonstrates that the procomp doesn't depend on the sidebar — it's a generic primitive.

### 5.3 Collapsed-mode inside an icon-only sidebar
Same as 5.1 but with `isCollapsed: true`. Trigger renders as a 40px square icon; popover opens to the side. Demonstrates the ilinxa collapse-to-icon extension (the source has no equivalent — see [`analysis.md §8.1`](../../migrations/socialmedia-adv-nav-system/analysis.md#81-app-shell-layout--sidebar-is-a-sibling-not-a-wrapper)).

A fourth example — multi-state footer with `BusinessCreationRequestButton`-style 6-state widget — is documented in guide.md but NOT a demo (consumer-side complexity; library demo would have to mock the state machine).

---

## 6. Success criteria

The component "works" when ALL of these hold:

1. **Pure rendering primitive.** Consumer feeds derived data; library doesn't import auth stores, membership stores, routers, or anything domain-specific. Zero `next/*` imports.
2. **Active-state honest.** `activeKey` resolves to an item → that item shows the Check + `aria-current` + no-op click. Doesn't resolve → `fallbackActiveItem` shows in trigger (no mis-labeling).
3. **Aria-combobox correct.** Trigger has role + expanded + label. Keyboard nav works. Focus return after close. Active item readable as "current item" by screen readers.
4. **Width-matches-trigger.** Popover content tracks the trigger width via `--radix-popover-trigger-width`. No popover-narrower-than-trigger or jumping width.
5. **Footer slot accepts arbitrary state.** `BusinessCreationRequestButton`-style 6-state widget, `<Button>Create</Button>`, `<a href="/settings">Settings</a>` — all work. Library doesn't inspect children.
6. **Collapse-mode visually clean.** Icon-only 40px trigger; popover opens to the side; selecting an item still routes. No layout shifts.
7. **F-cross-13 pre-emption.** `Popover.onOpenChange` defensively typeof-guarded per project pattern. No F-cross-13 hits in the path-b smoke.
8. **Composes with rich-sidebar.** Drop into `<RichSidebar topSlot={<AccountSwitcher01 ... />} />` and the styling cooperates (width, color tokens, collapsed-mode aware).

---

## 7. Locked decisions (L1–L12, recorded pre-sign-off)

These are the calls already made — listed for explicitness so we can re-audit at sign-off and add more during planning.

| # | Lock |
|---|---|
| **L1** | **SwitcherItem shape is `{ key, label, icon?, href? }`** — four fields, three optional. No `description`, `groupId`, `meta`, `disabled`, `tooltipContent`. Tight v0.1. |
| **L2** | **Single `items` array, consumer-controlled ordering.** No separate `pinnedItems` API. The source's "CMS active context first" is just array prepend at the consumer (analysis F-04). |
| **L3** | **Dual-entry items via distinct keys.** Same conceptual account can appear twice in `items` (`biz-acme` + `cms-biz-acme`) — key uniqueness IS enforced. Violation behavior (warn vs throw vs silently accept) locked by Q2. |
| **L4** | **`fallbackActiveItem?: SwitcherItem`** prop — used in trigger when `activeKey` doesn't resolve. Avoids source's governance-mislabel bug (analysis §8.10). |
| **L5** | **`footerSlot: ReactNode`** is arbitrary content. Library doesn't model a "Create X" state machine; consumer brings their own widget. Separator + slot is the contract. |
| **L6** | **Library no-ops on active-item clicks.** `onSelect` does NOT fire when the user clicks the already-active item. Matches source behavior. Consumer can re-affirm via their own wrapper if needed. (Was previously a Q-P; promoted to lock since source behavior is unambiguous and matches the established UX expectation.) |
| **L7** | **Aria pattern: combobox + button-list.** Same as source. Matches Linear, Vercel, GitHub switchers. Listbox semantics not used (combobox is more flexible for the no-listbox-content cases). |
| **L8** | **Popover from shadcn's `popover` primitive.** Not Command (cmdk) — no search in v0.1. Not DropdownMenu — wrong semantic + no `aria-current` on items. Popover gives the most control. |
| **L9** | **Width-matches-trigger** via `--radix-popover-trigger-width` CSS var. No `widthMode` prop in v0.1; consumer wraps in a sized container. |
| **L10** | **Collapsed-mode trigger renders icon-only**; popover content shows full labels regardless. Designed to slot into `rich-sidebar`'s icon-collapsed mode. Detail behaviors (popover side, focus return after icon-trigger close, label-hide aria-label fallback) locked at GATE 2 plan. |
| **L11** | **F-cross-13 pre-emption from day one.** `Popover.onOpenChange` typeof-guarded `(next: unknown) => { if (typeof next !== "boolean") return; ... }` since shadcn@4.6.0 may ship Base UI primitives with different callback shapes. |
| **L12** | **Generic naming, account-agnostic semantics.** Default `aria-label="Switch account context"` matches source, but the prop is overridable. Component works for accounts, workspaces, projects, contexts, modes — any "current X + switchable other X's" surface. |
| **L13** | **Controlled-open triplet from v0.1** (`open?` / `defaultOpen?` / `onOpenChange?`). Mirrors Radix Popover's canonical controlled+uncontrolled pattern. Promoted from Q6 during the 2026-05-23 re-validation pass per the dynamicity-primacy rule (`add it later is a breaking change`). Zero default-behavior change for uncontrolled consumers; `onOpenChange` is F-cross-13 typeof-guarded per L11. |
| **L14** | **`ariaCurrent?` prop with `"true"` default.** Promoted from Q5 during the 2026-05-23 re-validation pass. Default value is unchanged (correct semantic for a switcher), but consumers can override to `"page"` / `"step"` / `false` / etc. for nav-style or stepper-style usages. |

---

## 8. Open questions — RESOLVED at GATE 1 sign-off (2026-05-23)

All Q-Ps below were signed off at GATE 1 close with defaults accepted unless noted. Kept here as historical record; future iteration replaces the table rather than re-opening individual rows.

| # | Q | Resolution |
|---|---|---|
| **Q1** | When `items.length === 0` AND no `fallbackActiveItem`, what does the trigger show? **(a)** empty button with chevron (current source behavior — undefined `items[0]` crashes); **(b)** disabled button with placeholder text; **(c)** library throws in dev, renders nothing in prod. | ✅ **Locked (b)** — disabled with placeholder. Defensive, no crashes. |
| **Q2** | Should the library enforce key uniqueness? **(a)** dev-warn + ignore duplicates; **(b)** dev-throw; **(c)** silently accept (last-write-wins for collision). | ✅ **Locked (a)** — dev-warn (`console.warn` in NODE_ENV !== "production"), strip duplicates at render. Matches React's key warning semantics. |
| ~~Q3~~ | ~~Active-row click semantics~~ — **promoted to L6 (locked).** |  |
| **Q4** | Popover-side in collapsed mode — `"right"` (always) vs `"right-then-flip"` (collision-aware, default Radix). | ✅ **Locked right-then-flip.** Radix's auto-flip is the right default; GATE 2 plan may expose `collapsedPopoverSide?` override prop. |
| ~~Q5~~ | ~~`aria-current` on active item — `"true"` vs `"page"`.~~ — **promoted to L14 (locked, prop exposed)** during re-validation pass. Default unchanged (`"true"`); consumer overridable. |  |
| ~~Q6~~ | ~~Expose `controlledOpen?: boolean + onOpenChange?: (open: boolean) => void` pair or keep internal?~~ — **promoted to L13 (locked, controlled-open triplet shipped from v0.1)** during re-validation pass. Dynamicity-primacy rule applied. |  |
| **Q7** | `footerSlot` separator — library renders an `<hr>` ABOVE the slot always, OR only when `footerSlot` is present? | ✅ **Locked only when present.** Empty slot = no separator. |
| **Q8** | Click-through-keyboard on items — should `Enter` AND `Space` both activate, or only `Enter`? | ✅ **Locked both.** Standard button semantics; consistent with shadcn defaults. |

---

## 9. Risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | F-cross-13 hits on `Popover.onOpenChange` post-deploy. | Medium | L11 pre-empts the typeof-guard; path-b smoke after first ship validates. Same-day patch budget allocated per project pattern. |
| R2 | Consumer confusion about who derives `items` (they always do). | Low | Demo + guide.md lead with "the library renders, you derive" pattern. |
| R3 | Trigger label width overflow on long account names. | Low | `truncate` + `min-w-0` baked in; tested at the demo with a 50-char fake business name. |
| R4 | Active-item flicker during async `activeKey` resolution (consumer's pathname → key derivation). | Low | `fallbackActiveItem` smooths this — consumer can render a loading-state fallback during async. |
| R5 | Collapsed-mode trigger and popover positioning interact badly when slotted in a fixed-width 80px sidebar. | Medium | Tested in the v0.1 demo against rich-sidebar's collapsed mode. Plan stage spells out exact CSS. |
| R6 | Consumer expects `searchable` for >10 items. | Low | Out-of-scope per §2; guide.md recommends cmdk Command primitive for that case. v0.2 candidate if real demand. |
| R7 | `footerSlot` rendering arbitrary content could break aria-combobox semantics if the consumer puts focusable content with conflicting roles in it. | Low | Document: footer is OUTSIDE the listbox semantic — focusable content is fine, but conflicting `role` attrs are the consumer's responsibility. |

---

## 10. Definition of "done" for THIS document (stage gate) — ✅ CLOSED 2026-05-23

GATE 1 is **closed**:

- [x] All 8 Q-Ps resolved — Q3/Q5/Q6 promoted to locks (L6/L14/L13); Q1/Q2/Q4/Q7/Q8 accepted at default values per §8.
- [x] Re-validation pass surfaced 2 dynamicity-primacy findings (Q5 hardcoded-aria-current, Q6 internal-only-open); both applied as L14 + L13 before close.
- [x] Final read-through complete — locks L1–L14 reflect every behavior contract; no orphan Q-Ps or undefined behaviors.
- [x] User signed off 2026-05-23 ("Apply both — then accept all defaults" on the GATE 1 close question).

GATE 2 plan authoring (`account-switcher-01-procomp-plan.md`) begins now: file structure, commit chain, internal implementation strategy, demo plans.

---

## Appendix A — relationship to rich-sidebar v0.2.0

`account-switcher-01` is the canonical occupant of rich-sidebar v0.2.0's new `topSlot`. **No hard dependency** — account-switcher-01 ships standalone in the registry under `@ilinxa/account-switcher-01`. Consumers who use only one of the two install only the one they want.

When both are used together:

- account-switcher-01 reads its `isCollapsed` from the consumer (passed through from rich-sidebar's collapsed state via a render-prop or via a small consumer-side context).
- rich-sidebar doesn't import anything from account-switcher-01. It just accepts `topSlot: ReactNode`.

This matches the `todo-rich-card` ↔ `todo-tree` sibling pattern shipped 2026-05-20/21: two independently-versionable procomps that compose without hard coupling.

---

## Appendix B — Improvements over source (deliberate deviations)

This component is **not a 1:1 port**. It carries the source's load-bearing pattern but improves on it in nine specific places. Each improvement is the library doing more than the source did — captured here as the audit trail so future contributors don't accidentally regress them by "matching the source."

| # | Improvement | Source behavior | Library behavior | Locked in |
|---|---|---|---|---|
| **I-1** | **`fallbackActiveItem` for un-resolved active key** | Source falls back to `items[0]` when `items.find(isActive)` is undefined — silently mis-labels the trigger (governance context shows "Personal"). | Library exposes `fallbackActiveItem?` so consumer controls what the trigger shows when nothing matches. | L4 |
| **I-2** | **Empty-items defensiveness** | Source crashes on empty `items` (undefined `items[0]` access). | Library renders a disabled placeholder when items is empty (Q1 default). | Q1 |
| **I-3** | **Key uniqueness enforcement** | Source has no guard — duplicate keys silently render multiple rows. | Library dev-warns + strips duplicates at render (Q2 default). | L3, Q2 |
| **I-4** | **Icon type widened** | Source: strict `LucideIcon` (only Lucide icons accepted). | Library: `ReactNode | ComponentType<{ className?: string }>` — accepts JSX elements, custom components, Lucide icons, image marks, anything. | L1 (SwitcherItem) |
| **I-5** | **Programmable `aria-current` on active item** | Source has no aria-current attribute — only visual Check icon. | Library adds `aria-current="true"` (default) AND exposes `ariaCurrent?` so consumers can override to `"page"` / `"step"` / `false` for nav-style or stepper-style usages. Screen-reader users always hear "current item" by default. | L14, L7, success #2, §2 a11y mandate |
| **I-6** | **F-cross-13 pre-emption on Popover.onOpenChange** | Source pre-dates the F-cross-13 era; uses Radix shape with no defensive typeof-guard. | Library wraps onOpenChange in `(next: unknown) => { if (typeof next !== "boolean") return; ... }` for shadcn@4.6.0 Base UI compatibility. Applies to both the internal handler AND the consumer-supplied `onOpenChange` (L13). | L11, L13 |
| **I-7** | **Collapsed-mode (icon-only) trigger** | Source has no collapse mode — desktop sidebar is fixed-width. | Library exposes `isCollapsed?` so the trigger can render as a 40px icon-only button when slotted into rich-sidebar's collapse-to-icon mode (an ilinxa extension beyond the source). | L10 |
| **I-8** | **Domain-agnostic + portable** | Source imports `useUser`, `useMembershipStore`, `useBusinessMemberships`, etc., directly. | Library imports zero auth/membership/router code. Consumer derives `items`, `activeKey`, and footer state outside the library. Zero `next/*` imports. | success #1, §2 "Permissions & gating model" |
| **I-9** | **Controlled-open triplet from v0.1** | Source: open state is internal — no programmatic open, no controlled mode, no event observability. Consumers wanting to open the popover from a keyboard shortcut, tutorial, or test had no path. | Library ships `open?` / `defaultOpen?` / `onOpenChange?` from day one, mirroring Radix Popover's canonical controlled+uncontrolled pattern. Uncontrolled by default (zero behavior change for default consumers); controlled unlocks Cmd+K openers, onboarding flows, multi-switcher sync, and test harnesses. F-cross-13 guard applies. | L13 |

---

## Appendix C — Source feature catalog reference

For traceability, each source feature mapped to v0.1 inclusion:

| Source feature | v0.1 |
|---|---|
| Popover trigger with combobox role | ✅ L7 |
| Active item highlighted with Check icon | ✅ L4, success #2 |
| Items list from current context + memberships | Consumer responsibility (out of scope per §2) |
| Pinned CMS-active item first in list | Consumer-controlled ordering (L2) |
| Dual-entry "Acme Corp" + "Acme Corp CMS" | ✅ L3 |
| `Create Business` button when `can_create_business: true` | `footerSlot` (consumer renders) |
| `BusinessCreationRequestButton` 6-state machine when `false` | `footerSlot` (consumer renders) |
| Refetch memberships + push after creation | Consumer-side (out of scope per §2) |
| Width-matches-trigger popover | ✅ L9 |
| `align="start"` on PopoverContent | Library-defaulted (locked in GATE 2 plan) |
| Trigger shows active item icon + label + chevron | ✅ §4 |
| Click active item = no nav | ✅ L6 |
| Build-list-from-current-context derivation | Consumer (the `items` prop) |
