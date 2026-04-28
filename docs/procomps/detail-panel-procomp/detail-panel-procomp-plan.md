# `detail-panel` — v0.1 Plan (Stage 2)

> **Status:** **signed off 2026-04-29.** Validate-pass refinements applied (7 fixes: dropped `defaultMode` prop §3.1/§4.1/§4.2/§10/Q-P1 (description Q2 lock spirit + 3-way internal inconsistency); §4.2 terminology fix; §7 ARIA generic announcement instead of raw `selection.id`; §6.4 + §10 error-precedence-vs-null-selection completion; §11.1 sticky-under-display:contents verification risk; Q-P10 wording aligned to §4.4 implementation; Q-P9 header-position actions clarification). All 10 Q-Ps locked.
> **Slug:** `detail-panel` · **Category:** `feedback` · **Tier:** 1 (generic; no graph dependency)
> **Parent description:** [detail-panel-procomp-description.md](detail-panel-procomp-description.md) (signed off 2026-04-28)
> **Parent system:** [graph-system](../../systems/graph-system/graph-system-description.md) — Tier 1 (independent at the registry level per [decision #35](../../systems/graph-system/graph-system-description.md))
> **Sibling completion:** pairs with [`properties-form` plan](../properties-form-procomp/properties-form-procomp-plan.md) (signed off 2026-04-29) to fully unblock the [`force-graph` v0.3 plan-lock](../force-graph-procomp/force-graph-procomp-description.md#9-sign-off-checklist).

---

## 1. Inherited inputs (one paragraph)

Builds against [detail-panel description §8 locked decisions](detail-panel-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28) (10 questions; Q6 refined on review) and [§8.5 plan-stage tightenings](detail-panel-procomp-description.md#85-plan-stage-tightenings-surfaced-during-description-review--re-validation) (5 surfaced). Inherits system constraints: [decision #6](../../systems/graph-system/graph-system-description.md) (DetailPanel Edit is inline — modal explicitly out), [#25](../../systems/graph-system/graph-system-description.md) (per-component permission resolver — N/A here; detail-panel doesn't run a resolver, it just exposes `canEdit`), [#35](../../systems/graph-system/graph-system-description.md) (Tier 1 independence — detail-panel does NOT import `properties-form`; the host slots properties-form into `<DetailPanel.Body>`), [#37](../../systems/graph-system/graph-system-description.md) (design-system mandate — Onest + JetBrains Mono, OKLCH only). Pairs with [`properties-form` plan §4.5](../properties-form-procomp/properties-form-procomp-plan.md#45-composition-with-detail-panel-the-showcase-integration) which documents the composition contract from properties-form's side: detail-panel's re-key behavior (Q8) remounts properties-form on selection change, bypassing properties-form's mode-toggle matrix entirely.

---

## 2. v0.1 scope summary

The deliverable is a single Tier 1 pro-component at `src/registry/components/feedback/detail-panel/`. Surface area:

- **Selection-aware container** with auto-reset of `mode` to `"read"` on `selection.id` change per [Q2 lock](detail-panel-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28).
- **Compound API** per [Q1 lock](detail-panel-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28): `<DetailPanel.Header>`, `<DetailPanel.Body>`, `<DetailPanel.Actions>`. Implementation via React Context (Q-P6) — children read parent state.
- **Composite re-key** on `${selection.type}:${selection.id}` per [Q8 lock](detail-panel-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28). Children unmount + remount on selection change; this is the mechanism that wipes slotted-form state per [properties-form plan §4.5](../properties-form-procomp/properties-form-procomp-plan.md#45-composition-with-detail-panel-the-showcase-integration).
- **Three primary states**: empty (selection null), loading (skeleton placeholders preserving layout per [Q5 lock](detail-panel-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28)), error (with optional retry per [Q10 lock](detail-panel-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28)).
- **Sticky header** by default per [Q7 lock](detail-panel-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28) with `<DetailPanel.Header sticky={false}>` opt-out.
- **Footer-default Actions** with `position="header"` opt-in per [Q3 lock](detail-panel-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28). Sticky footer keeps actions visible during body scroll.
- **Actions render-fn context** — `({ mode, setMode, canEdit }) => ReactNode` per [Q6 lock](detail-panel-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28) (refined on review to include `canEdit`).
- **Mode controlled / uncontrolled / locked matrix** per Q-P1 (description §8.5 #1) — supports all three configurations with dev-warn on the locked anti-pattern.
- **Opinionated empty state default** per [Q4 lock](detail-panel-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28) with override slot.
- **Minimal imperative handle** per [Q9 lock](detail-panel-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28): `focusBody()`, `resetMode()`.
- **Focus management** — focus moves to panel root on selection change; into body first focusable on mode toggle into edit; back to triggering action on exit-edit.
- **ARIA contract** — `role="region"`, `aria-labelledby`, `aria-busy` during loading, `aria-live="polite"` selection announcements.
- **No focus trap** in edit mode per Q-P5 (explorer-pane edit-in-place pattern; user can click canvas mid-edit).
- **Bundle ≤ 8KB** (per description success #6); zero heavy dependencies.

**Doesn't ship in v0.1** (per description §3): multi-selection (`<DetailPanel.MultiSelection>` companion in v0.2 if needed), modal mode (forbidden per decision #6), tabs (host composes), drag-resize (host owns dimensions), selection-change animation (cuts hard in v0.1), persistent open/closed state, action confirmation flows, optimistic-update visualization. All v0.2+ are designed as additive.

**Implementation budget:** ~1.5 weeks focused (per HANDOFF.md §5 and description §10.2 of system).

---

## 3. Final v0.1 API (locked)

Builds out [description §5](detail-panel-procomp-description.md#5-rough-api-sketch) into final shapes.

### 3.1 Top-level component props

```ts
type DetailPanelMode = "read" | "edit";

interface DetailPanelSelection {
  type: string;                                          // discriminator host uses for slot routing
  id: string;                                            // stable identity for re-keying
}

interface DetailPanelProps {
  selection: DetailPanelSelection | null;

  // Mode (controlled / uncontrolled / locked — see §4.1 matrix)
  mode?: DetailPanelMode;
  onModeChange?: (mode: DetailPanelMode) => void;

  // Permission gate
  canEdit?: boolean;                                     // default true per Q6

  // Lifecycle states
  loading?: boolean;
  error?: { message: string; retry?: () => void } | null;

  // Empty state override
  emptyState?: ReactNode;                                // default: built-in <DetailPanelEmptyState>

  // Children (typically DetailPanel.* compound parts)
  children: ReactNode;

  // ARIA / styling
  ariaLabel?: string;
  className?: string;
}
```

### 3.2 Compound subcomponent props

```ts
interface DetailPanelHeaderProps {
  children: ReactNode;
  sticky?: boolean;                                       // default true per Q7
  className?: string;
}

interface DetailPanelBodyProps {
  children: ReactNode;
  className?: string;                                     // host can adjust padding etc.
}

interface DetailPanelActionsProps {
  children:
    | ReactNode
    | ((ctx: { mode: DetailPanelMode; setMode: (m: DetailPanelMode) => void; canEdit: boolean }) => ReactNode);
  position?: "footer" | "header";                         // default "footer" per Q3
  className?: string;
}
```

### 3.3 Imperative ref handle

```ts
interface DetailPanelHandle {
  focusBody(): void;                                       // moves focus to the body zone (first focusable inside)
  resetMode(): void;                                       // forces back to "read" without changing selection
}
```

Per [Q9 lock](detail-panel-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28): minimal scope; other methods (`getMode()`, `getSelection()`) are redundant with props.

### 3.4 What's NOT on the API

- No `<DetailPanel.MultiSelection>` (v0.2 if needed).
- No `<DetailPanel.Tabs>` — host composes inside `<DetailPanel.Body>`.
- No `mode="locked"` discrete prop value — locked mode is the implicit configuration when `mode` is supplied without `onModeChange` (Q-P1).
- No animation API (v0.2+).
- No internal scrollbar styling override (uses native scroll on body; consumers can wrap in shadcn `ScrollArea` if needed).

---

## 4. Compound API + state model

### 4.1 Mode controlled / uncontrolled / locked matrix (Q-P1, per description §8.5 #1)

| Configuration | `mode` prop | `onModeChange` prop | Behavior |
|---|---|---|---|
| **Controlled** | supplied | supplied | Host owns mode; panel calls `onModeChange("read")` on selection.id change. setMode in Actions ctx delegates to `onModeChange`. |
| **Uncontrolled** | NOT supplied | NOT supplied | Panel manages internal mode state (initial value `"read"`); resets internal state to `"read"` on selection.id change per [description Q2](detail-panel-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28). setMode in Actions ctx mutates internal state. Hosts wanting a non-`"read"` initial mode use the controlled configuration. |
| **Locked (anti-pattern)** | supplied | NOT supplied | Panel cannot reset mode (no callback to invoke); mode stays as host set it. **Dev-only `console.warn` on mount + on selection.id change** flagging the anti-pattern. setMode in Actions ctx is a no-op + dev-only `console.warn` per call. Production builds suppress warnings; no runtime cost. |

The "locked" configuration is supported but warned-against because it's a semantic mismatch: the panel can't honor the auto-reset contract (Q2) without `onModeChange`. The dev-warn signals the misconfiguration loudly without forcing a runtime crash.

### 4.2 Internal state shape

```ts
// Only used in the uncontrolled configuration; locked reads `mode` directly from props
interface DetailPanelState {
  internalMode: DetailPanelMode;                          // initial "read"
}
```

Not a reducer; just `useState`. The compound API state is otherwise derived from props (`selection`, `loading`, `error`, `canEdit`).

### 4.3 React Context — the compound API mechanism (Q-P6)

```ts
interface DetailPanelContextValue {
  selection: DetailPanelSelection | null;
  mode: DetailPanelMode;
  setMode: (next: DetailPanelMode) => void;               // wraps controlled vs uncontrolled vs locked per §4.1
  canEdit: boolean;
  loading: boolean;
  hasError: boolean;
  // For the auto-reset effect to wire correctly without leaking into children
  selectionKey: string;                                    // composite "${type}:${id}" — used by re-key wrapper (§5)
}
```

Provider sits inside `<DetailPanel>`; `<DetailPanel.Header>` / `.Body` / `.Actions` consume via `useDetailPanel()` hook. **Single context instance**; all three subcomponents read the same value. Implementation file: `parts/detail-panel-context.tsx`.

Alternatives considered, rejected:
- **`React.Children.map` + `cloneElement` to pass props to children** — fragile; children must be direct descendants; breaks when host wraps a subcomponent (e.g., conditional rendering inside fragment).
- **Slot-children-by-displayName** — cleaner than cloneElement but still requires direct-descendant assumption; React Compiler interactions are uncertain.
- **Render-prop API on `<DetailPanel>`** — rejected at description Q1; the user needs the compound shape.

Context is the canonical shadcn-radix pattern (e.g., shadcn `Card.Header` works the same way under the hood for compound components that need shared state).

### 4.4 Auto-reset effect (Q2)

```ts
useEffect(() => {
  // Fires on selection.id change in controlled mode (deferred to host's onModeChange)
  // and uncontrolled mode (mutates internalMode directly).
  if (controlledMode) {
    if (mode !== "read" && onModeChange) {
      onModeChange("read");
    }
  } else {
    setInternalMode("read");
  }
}, [selectionKey]);  // selectionKey changes only on selection.type or selection.id change
```

Effect runs ONCE per selectionKey transition. Auto-reset is no-op when mode is already "read" (avoids needless onModeChange invocation that would cause a host re-render with no state change).

In the **locked** configuration (no `onModeChange`), the effect can't reset; this is where the dev-warn fires.

### 4.5 No focus trap in edit mode (Q-P5, per description §8.5 #5)

Standard form-modal trap-focus pattern is rejected for detail-panel. This is an explorer-pane edit-in-place component — the user must be able to click the canvas (or other surfaces outside the panel) mid-edit. That's a feature, not a bug.

Hosts wanting modal-style trap can wrap their slotted form in a focus-trap library; detail-panel itself does not impose one.

---

## 5. Re-key behavior (Q8 + Q-P7)

[Q8 lock](detail-panel-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28): composite key `${selection.type}:${selection.id}`. Implementation:

```tsx
function DetailPanel({ selection, children, ... }: DetailPanelProps) {
  const selectionKey = selection ? `${selection.type}:${selection.id}` : "__empty__";
  return (
    <Provider value={{ selection, mode, setMode, canEdit, ... }}>
      <div className="..." role="region" aria-label={ariaLabel}>
        {/* Re-key wrapper: any change to selectionKey unmounts + remounts children */}
        <div key={selectionKey} className="contents">
          {children}
        </div>
      </div>
    </Provider>
  );
}
```

The wrapper `<div className="contents">` is invisible in the box-model (`display: contents`); it exists solely to hold the `key` prop without injecting layout. React unmounts + remounts the entire child tree on selectionKey change.

**Edge case: `selection` transitioning to `null`.** selectionKey becomes `"__empty__"`. Children (typically host's conditional `selection?.type === "node" && ...`) collapse to `null`; the empty-state default renders alongside. On the next selection set, selectionKey changes again → re-mount.

**Edge case: same selection.id, different selection.type.** Composite key changes → re-mount. Per Q8 description rationale: prevents subtle state-bleed between two entity types that share an id.

**Edge case: identical selection set twice in a row** (host accidentally creates a new object literal each render). selectionKey computed as a string is stable across same-shape objects; no spurious re-mounts. ✓

---

## 6. Built-in subviews

### 6.1 Empty state default (Q4)

`parts/detail-panel-empty-state.tsx`:

```tsx
function DetailPanelEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
      <Info className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-medium">Nothing selected</p>
      <p className="text-xs text-muted-foreground">Select an item to view details.</p>
    </div>
  );
}
```

Exported as a sibling export per Q-P8 so hosts wanting to extend the empty state with quick-stats (description §6.2 example) can compose:

```tsx
import { DetailPanelEmptyState } from "@/registry/components/feedback/detail-panel";
// or use the default (no override) and let the panel render this internally
```

### 6.2 Loading skeleton shapes (Q5 + Q-P4, per description §8.5 #4)

`parts/detail-panel-skeleton.tsx`:

```tsx
function DetailPanelSkeleton() {
  return (
    <>
      {/* Header zone — matches sticky-header layout */}
      <div className="border-b border-border p-4">
        <Skeleton className="h-6 w-3/5" />              {/* title */}
        <Skeleton className="mt-2 h-4 w-2/5" />          {/* subtitle */}
      </div>
      {/* Body zone — three rectangular blocks */}
      <div className="space-y-4 p-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      {/* Actions zone — two button placeholders, footer-aligned */}
      <div className="border-t border-border p-4 flex gap-2 justify-end">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
      </div>
    </>
  );
}
```

`<Skeleton>` is the shadcn primitive — installed as the only Phase A pre-flight prerequisite (see [§8.2](#82-build-order-within-v01)). Layout intentionally mirrors the real panel structure so the transition from skeleton → loaded doesn't shift content.

### 6.3 Error state with retry (Q10)

`parts/detail-panel-error.tsx`:

```tsx
function DetailPanelError({ error }: { error: { message: string; retry?: () => void } }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center" role="alert">
      <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
      <p className="text-sm font-medium">{error.message}</p>
      {error.retry && (
        <Button variant="outline" size="sm" onClick={error.retry}>
          Try again
        </Button>
      )}
    </div>
  );
}
```

Retry button only renders when `error.retry` is supplied per Q10. The `role="alert"` ensures screen readers announce the error on appearance.

### 6.4 Loading / error / empty precedence

When both `loading: true` AND `error` are set: error wins. Loading-then-error is the standard async lifecycle; rendering both simultaneously is incoherent.

When `selection: null` AND `loading: true`: loading wins (host is fetching the new selection; show skeleton, not empty state).

When `selection: null` AND `error` is set: error wins (the loud-signal rule applies regardless of selection state — host fetched, fetch failed, then cleared selection; the failure should still surface).

**Full precedence chain: error > loading > content > empty.**

---

## 7. ARIA contract

| Element | ARIA |
|---|---|
| Panel root | `role="region"`, `aria-label={ariaLabel}` (or `aria-labelledby={headerTitleId}` if Header supplies a title), `aria-busy={loading}` |
| Header zone | wraps host children; supplies `id` for `aria-labelledby` if a child has `data-detail-panel-title` (host responsibility) |
| Body zone | scrollable container; no implicit ARIA (host children own their own roles) |
| Actions zone | `role="toolbar"` (semantic for action button cluster) |
| Empty state | `role="status"` + descriptive copy |
| Loading skeleton | `aria-busy="true"` on root (already covered); `aria-hidden="true"` on individual `<Skeleton>` elements |
| Error state | `role="alert"` (announced on appearance); retry button is just a regular `<Button>` |
| Selection change announcement | `aria-live="polite"` region updates with generic copy `"Selection changed"` — `selection.id` is a stable identifier (often UUID/hash), not human-readable, so it is NOT included in the announcement. v0.2 may add a `selectionLabel?: string` prop for richer host-supplied announcements (additive, non-breaking). Implementation lives in `parts/selection-announcer.tsx`. |

Focus management:
- **Selection change**: focus moves to panel root (`tabIndex={-1}` programmatically focused via `useEffect` keyed on selectionKey).
- **Mode toggle into edit**: focus moves into body zone, first focusable element. Implementation via `focusBody()` hook called from internal `useEffect` keyed on mode → "edit" transition.
- **Mode toggle exit-edit (Save / Cancel)**: focus returns to the action that triggered it. Mechanism: `<DetailPanel.Actions>` records `document.activeElement` on click before invoking host handler; on next mode change, focus is restored. Plan-stage detail in §11.

---

## 8. Files and parts

### 8.1 File-by-file plan

```
src/registry/components/feedback/detail-panel/
├── detail-panel.tsx                   # main component; Provider; auto-reset effect; re-key wrapper
├── types.ts                           # DetailPanelMode, DetailPanelSelection, props, handle, context type
├── parts/
│   ├── detail-panel-context.tsx       # React Context + useDetailPanel hook
│   ├── detail-panel-header.tsx        # compound subcomponent (sticky header)
│   ├── detail-panel-body.tsx          # compound subcomponent (scrollable body)
│   ├── detail-panel-actions.tsx       # compound subcomponent (footer/header positioned)
│   ├── detail-panel-empty-state.tsx   # default + sibling export
│   ├── detail-panel-skeleton.tsx      # loading skeleton with mirrored layout
│   ├── detail-panel-error.tsx         # error UI with optional retry
│   └── selection-announcer.tsx        # aria-live region for selection-change announcements
├── hooks/
│   ├── use-detail-panel-mode.ts       # controlled / uncontrolled / locked dispatch
│   └── use-focus-restore.ts           # captures + restores activeElement on action click
├── lib/
│   └── selection-key.ts               # composite-key factory (one-liner; isolated for testability)
├── dummy-data.ts                      # 4 fixtures: node, edge, group, file (covers all 3 example modes from description §6)
├── demo.tsx                           # 6 demos per description success #8 (single page, internal switch)
├── usage.tsx                          # consumer-facing patterns + properties-form composition recipe
├── meta.ts                            # registry meta
└── index.ts                           # DetailPanel + DetailPanel.* attached + DetailPanelEmptyState + types
```

**File count: 17.** Within the Tier 1 size envelope (smaller than properties-form's 22 — detail-panel is intentionally simpler).

`DetailPanel.Header`, `DetailPanel.Body`, `DetailPanel.Actions` are attached to the main `DetailPanel` function as static properties before export, mirroring shadcn's compound primitive pattern:

```tsx
DetailPanel.Header = DetailPanelHeader;
DetailPanel.Body = DetailPanelBody;
DetailPanel.Actions = DetailPanelActions;
export { DetailPanel, DetailPanelEmptyState };
```

### 8.2 Build order within v0.1

Three internal phases, each ~3-4 days:

**Phase A — context + state + skeleton (~3 days):**
- **Pre-flight (must precede everything else):** install missing shadcn primitive — `pnpm dlx shadcn@latest add skeleton`. **State of `src/components/ui/` verified 2026-04-29** — contains `badge`, `button`, `card`, `dropdown-menu`, `popover`, `scroll-area`, `separator`, `table`, `tabs`. `Button` already present; `Skeleton` is the only missing primitive. Commit separately so the install diff stays distinct from the component-add diff.
- `types.ts` — full type surface
- `lib/selection-key.ts`
- `parts/detail-panel-context.tsx` — Provider + hook
- `hooks/use-detail-panel-mode.ts` — dispatch logic for the 3-config matrix (§4.1)
- Unit-testable in isolation when Vitest lands.

**Phase B — composition + states (~4 days):**
- `parts/detail-panel-header.tsx`, `.body`, `.actions`
- `parts/detail-panel-empty-state.tsx`
- `parts/detail-panel-skeleton.tsx`
- `parts/detail-panel-error.tsx`
- `parts/selection-announcer.tsx`
- `hooks/use-focus-restore.ts`
- `detail-panel.tsx` — main component wiring everything

**Phase C — demos + integration (~3 days):**
- `demo.tsx` (6 sub-demos), `dummy-data.ts`, `usage.tsx`, `meta.ts`, `index.ts`
- Verify `tsc + lint + build` clean
- Verify the 6 success-criteria demos all work

---

## 9. Edge cases (locked)

| Case | Handling |
|---|---|
| `selection` is `null` AND `loading: true` | Loading wins; skeleton renders. Host is fetching the new selection. |
| `selection` set AND `loading: true` AND `error: null` | Loading wins (skeleton); host children NOT rendered to avoid flash. |
| `loading: true` AND `error: { ... }` | Error wins (loading-then-error is standard async lifecycle). |
| `selection.type` changes but `selection.id` is the same | Composite key changes → re-mount. Prevents state-bleed between entity types. |
| Same selection object reference passed twice | selectionKey is computed as a string; stable across same-shape inputs. No spurious re-mount. |
| `mode` supplied without `onModeChange` (locked anti-pattern) | Panel cannot auto-reset. Dev-only `console.warn` on mount + on selection.id change. setMode in Actions ctx is a no-op with dev-only `console.warn` per call. Production builds: silent. |
| `selection: null` AND `error` set | Error wins per §6.4 precedence chain. Empty state suppressed; error UI renders. Retry button surfaces if `error.retry` supplied; clicking retry is the host's signal — they typically also restore selection or trigger a fetch. |
| `<DetailPanel.Actions>` render-fn called when `mode` is undefined | Cannot happen — mode always resolves to either prop value, internal state, or `"read"` default. |
| `<DetailPanel.Header sticky={false}>` | Header renders inline (non-sticky); scrolls with body. |
| `<DetailPanel.Actions position="header">` | Actions render in the header zone, AFTER any `<DetailPanel.Header>` children. Both appear in the same sticky-header band. |
| Multiple `<DetailPanel.Actions>` in children | All render in DOM order; first determines `position`. No de-duplication. (Hosts shouldn't do this; not enforced.) |
| `<DetailPanel.Header>` outside `<DetailPanel>` | Context throws — `useDetailPanel()` requires a Provider ancestor. Standard shadcn pattern. Dev-only error message: "DetailPanel.Header must be used inside <DetailPanel>." |
| `selection` is `null` and host passes children (e.g., conditional inside fragment that resolves to `null`) | Empty state default (or `emptyState` override) renders; host children are silently ignored when no selection. Documented behavior. |
| `error.retry` is `undefined` | Retry button NOT rendered. Error message + icon only. |
| Auto-reset fires while host is mid-write to mode | Race resolved by React's batched render: auto-reset effect runs after both prop changes settle. Last-write-wins is the auto-reset ("read"). Per Q-P10. |
| Body has tall content; header sticky; actions sticky-footer | Body scrolls between fixed top and bottom bands. Tested visually in demo (large textarea body). |
| `focusBody()` called when body has no focusable children | No-op (querySelector returns null). Plan locks: silent, no warning. |
| `resetMode()` called in locked configuration | No-op + dev-only `console.warn` (no `onModeChange` to invoke). Same as setMode in Actions ctx. |

---

## 10. Performance + bundle

### 10.1 Performance

The component is layout-only and small-state. No optimization beyond standard React idioms is needed:

- Context provider value is `useMemo`'d on `(selection, mode, canEdit, loading, hasError, selectionKey)` to prevent spurious re-renders of consumers.
- Compound subcomponents do NOT need `React.memo` — they're typically a single read per panel; no field-row-density problem.
- `selectionKey` computed via `useMemo` keyed on `(selection?.type, selection?.id)`.
- Auto-reset effect's deps are `[selectionKey]` only — fires once per transition.
- Focus-restore hook stores `activeElement` in a ref; no state updates.

### 10.2 Bundle audit

Budget: **≤ 8KB minified + gzipped** per description success #6.

Realistic breakdown — detail-panel's *own* code:
- Component code: ~5-7KB (compound + context + sub-components + state + skeleton wrapper + error UI + empty state + announcer)
- `lucide-react` icons: tree-shaken; ~1KB for `Info` + `AlertCircle`.
- **Detail-panel-attributable total: ~6-8KB**, right at the ceiling. No headroom — additions in v0.2 must be considered carefully.

Newly-installed shadcn `Skeleton` (Phase A pre-flight): registry-shared infrastructure, ~1KB raw, NOT detail-panel-attributable. `Button` already in repo.

Wired via `size-limit` (or equivalent) at v0.1 implementation start — same posture as properties-form plan §11.2 and force-graph v0.1 plan §17.5 #3.

---

## 11. Risks & alternatives

### 11.1 Risks

| Risk | Mitigation |
|---|---|
| Bundle exceeds 8KB on first impl | Audit at end of Phase B. If over, candidates for cut: announcer (~0.5KB), focus-restore hook (~0.5KB) — both nice-to-have a11y. Prefer keeping; cut other places (tighter Tailwind class strings, fewer utility imports). |
| Compound API context value churn | useMemo'd per §10.1; verified with React DevTools profiler at end of Phase B. |
| React 19 + React Compiler interactions with context provider | useMemo'd context value is compiler-safe; no known issues. Smoke test with compiler enabled at end of Phase B. |
| Auto-reset effect fires on initial mount for "read" → "read" | Effect's deps are `[selectionKey]`; on mount it fires once but the body checks `if (mode !== "read")` before calling onModeChange — no spurious initial invocation. |
| Focus-restore breaks when triggering element is removed from DOM (e.g., Save button unmounts on mode change) | Capture `activeElement` BEFORE the click handler runs; restore by `id` lookup, not direct ref. If the id is gone, fall back to focusing the panel root. |
| Skeleton layout drifts from real layout when consumer customizes | Skeleton intentionally mirrors a "default" panel shape. Heavy customization (e.g., 5-button action bar) will create visual jump skeleton → loaded. Documented; v0.2 may add `<DetailPanel.Skeleton>` as a custom slot. |
| Sticky positioning under `display: contents` re-key wrapper | Verify at end of Phase B with a long-content body fixture: confirm sticky-header (top:0) and sticky-footer-actions (bottom:0) both behave correctly relative to body scroll. `display: contents` is well-supported in modern engines (Safari 11.1+, Chrome 65+, FF 37+) and children inherit the grandparent's containing block, so sticky should resolve to the panel root's scroll context — but the interaction is less battle-tested than each feature in isolation. If broken, fall back to keying the panel root directly OR restructure to put the scroll container outside the contents wrapper. |

### 11.2 Alternatives considered, rejected

- **Slot-children-by-displayName** (vs Context). Rejected per §4.3 — requires direct-descendant children; breaks under conditional rendering inside fragments.
- **`React.Children.map` + `cloneElement`**. Rejected — same fragility issue + harder to type.
- **Keeping `mode` purely as host-controlled prop, no `defaultMode` for uncontrolled**. Rejected per Q-P1 — the uncontrolled configuration is a real ergonomic win for hosts that don't need cross-component mode reads.
- **Separate `<DetailPanelLoadingSkeleton>` user-overridable slot**. Deferred to v0.2; v0.1's skeleton is opinionated. Hosts with extreme custom layouts can fall back to plain children via `loading={false}` and render their own.
- **Built-in dirty-confirmation modal on selection change**. Rejected — host responsibility per description §8.5 #2 + properties-form plan §4.5; detail-panel doesn't know about form state.

---

## 12. Resolved plan-stage questions (locked on sign-off 2026-04-29)

All 10 questions resolved at sign-off. **Q-P1 + Q-P9 + Q-P10 refined on validate pass** (Q-P1: dropped `defaultMode` per description Q2 lock spirit; Q-P9: added header-position actions clarification; Q-P10: wording aligned to §4.4 implementation). **High-impact:** Q-P1 (mode matrix), Q-P6 (compound API impl), Q-P7 (re-key impl). **Medium:** Q-P2 (host dirty-handling cross-ref), Q-P3 (setMode fallback), Q-P4 (skeleton shapes), Q-P9 (sticky positioning impl), Q-P10 (controlled-mode racing auto-reset). **Low:** Q-P5 (no focus trap), Q-P8 (empty state sibling export).

### Q-P1 (from description §8.5 #1; refined on validate pass) — Mode controlled / uncontrolled / locked matrix
**Locked: matrix in [§4.1](#41-mode-controlled--uncontrolled--locked-matrix-q-p1-per-description-851).** Three configurations supported; locked anti-pattern dev-warned (mount + selection.id change + per-setMode-call). Production builds suppress warnings. **Refined on validate pass:** dropped `defaultMode` prop entirely. Description [Q2](detail-panel-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28) locks "auto-reset to `'read'` on selection.id change" without a host-configurable initial-state caveat; introducing `defaultMode` would have been a quiet expansion of the lock and created a 3-way internal inconsistency. Hosts wanting a non-`"read"` initial mode use the controlled configuration.
**Impact:** high — defines the API's primary configuration shape.
**Trade-off:** "locked" is supported instead of forbidden so hosts that *intentionally* want a non-resetting mode (rare; possibly a pinned-detail-view case) aren't blocked. The dev-warn signals the misconfiguration without crashing. Hosts who wanted "uncontrolled but starts in edit" must now use controlled mode — uncommon use case; controlled mode is the right tool when the host has opinions about initial mode.

### Q-P2 (from description §8.5 #2) — Host-side dirty-state handling
**Locked: cross-ref [`properties-form` plan §4.5](../properties-form-procomp/properties-form-procomp-plan.md#45-composition-with-detail-panel-the-showcase-integration) + recipe in `usage.tsx`.** Detail-panel doesn't know about form state; host intercepts selection-change, reads `formRef.current?.isDirty()` BEFORE updating selection, optionally shows confirmation, then either propagates or aborts.
**Impact:** medium — the showcase composition's correctness depends on hosts honoring this.
**Trade-off:** none; alternative ("detail-panel offers a dirty-confirm hook") couples Tier 1 components, violating decision #35.

### Q-P3 (from description §8.5 #3) — `setMode` fallback in Actions render-fn context
**Locked: provided unconditionally; dispatches per the §4.1 matrix.** In controlled mode, calls `onModeChange`. In uncontrolled, mutates internal state. In locked, no-op + dev-warn. Render-fn always receives a callable `setMode`.
**Impact:** medium — implementation glue but visible in API contract.
**Trade-off:** none; alternative (`setMode` typed as `setMode?: ...`) forces every render-fn to null-check, hurts ergonomics.

### Q-P4 (from description §8.5 #4) — Skeleton shape specifics
**Locked: layout-mirroring shape per [§6.2](#62-loading-skeleton-shapes-q5--q-p4-per-description-854).** Header band (title + subtitle bars) + 3 body blocks + 2 actions buttons. Mirrors the "default" populated panel structure.
**Impact:** medium — affects perceived load time UX and skeleton→loaded transition smoothness.
**Trade-off:** opinionated default may not match every consumer's real layout. v0.2 considers a `<DetailPanel.Skeleton>` custom slot for radical layouts (large-textarea bodies, multi-section bodies, etc.).

### Q-P5 (from description §8.5 #5) — Focus trap in edit mode
**Locked: NO focus trap in edit mode.** Explorer-pane edit-in-place pattern: user must be able to click canvas / other surfaces mid-edit. Standard form-modal trap-focus pattern is rejected as a category mismatch.
**Impact:** low — primarily an a11y posture decision.
**Trade-off:** users editing inside the panel can Tab their way out into outer page chrome. For most hosts this is fine. Hosts wanting modal-style trap wrap their slotted form in a focus-trap library themselves.

### Q-P6 (NEW) — Compound API implementation: React Context vs cloneElement vs displayName
**Locked: React Context (§4.3).** Single `DetailPanelContext` Provider wraps content; subcomponents consume via `useDetailPanel()` hook. Standard shadcn-radix pattern; works under any rendering structure (conditional fragments, third-party wrappers, etc.).
**Impact:** high — touches the core implementation shape.
**Trade-off:** consumers writing `<DetailPanel.Header>` outside `<DetailPanel>` get a runtime error from the hook. Acceptable; shadcn primitives behave the same way. Alternatives (cloneElement, displayName-slot) are more fragile.

### Q-P7 (NEW) — Re-key implementation: where does the `key` go?
**Locked: invisible `<div className="contents">` wrapper around children with `key={selectionKey}` (§5).** `display: contents` keeps the wrapper out of the box-model so it can't influence layout. The wrapper's only job is to hold the React key.
**Impact:** high — defines remount semantics for slotted forms.
**Trade-off:** `display: contents` has minor a11y implications in older browsers (some assistive tech ignored the wrapper for a while). Modern browsers (Chrome 65+, FF 37+, Safari 11.1+) handle it correctly. Documented; if real consumers report issues, switch to `<React.Fragment key={...}>` (which has the same effect with no DOM node) — but Fragments don't accept className, so the layered approach via `<div className="contents">` is incrementally more flexible. Sticky-positioning interaction with this wrapper is verified at end of Phase B per [§11.1 risk row](#111-risks).

### Q-P8 (NEW) — Empty state component sibling export
**Locked: export `<DetailPanelEmptyState>` as a sibling from `index.ts`.** Hosts that want to extend the default (description §6.2 — quick-stats variant) can compose `<DetailPanelEmptyState>` plus their own additions inside `emptyState` prop. Without the export, hosts reinvent the icon + copy + spacing.
**Impact:** low.
**Trade-off:** minor API surface bloat (one additional named export). Worth it for the composition ergonomic.

### Q-P9 (NEW; refined on validate pass) — Sticky positioning implementation
**Locked: CSS `position: sticky` on Header (top: 0) and Actions when `position="footer"` (bottom: 0). Background uses `--background` token; subtle border via `--border`.** Sticky-header-only is the default Q7; sticky-footer activates with `position="footer"` Actions (default). **Refined on validate pass:** Actions when `position="header"` ride the Header's sticky-top band — they render inline inside the same wrapper as `<DetailPanel.Header>`, after the Header's children, with NO separate `position: sticky` (avoids double-stacking).
**Impact:** medium — visible in every showcase; failure modes are layout-jank.
**Trade-off:** `position: sticky` requires the panel's outer container to have a constrained height (host responsibility). Documented in usage as a host requirement: "wrap `<DetailPanel>` in a height-constrained container (e.g., `h-full` inside a flex parent) — without that, sticky positioning collapses to static."

### Q-P10 (NEW; refined on validate pass) — Controlled-mode change racing with selection-change auto-reset
**Locked: auto-reset takes precedence (selection change wins).** When both happen in the same render (host updated mode AND selection in one batch), React batches: auto-reset effect runs after both prop changes settle. Effect calls `onModeChange("read")` when `mode !== "read"`; no-op when already `"read"` (avoids needless host re-render — matches §4.4 implementation).
**Impact:** medium — defines the corner-case semantics of simultaneous prop updates.
**Trade-off:** alternative ("preserve incoming mode if selection.id is also new") is more nuanced but rarely useful. Current rule is simpler and matches the spirit of Q2 (auto-reset is sacrosanct on selection change).

## 12.5 Plan-stage refinements (surfaced during draft)

These bake into implementation but worth flagging:

1. **`DetailPanel.Header` aria-labelledby pattern via `data-detail-panel-title`.** Header zone scans for a child with `data-detail-panel-title` attribute; copies its `id` (or assigns one) to the panel root's `aria-labelledby`. If no marked title, panel uses `aria-label={ariaLabel}`. Documented in usage.
2. **Skeleton install is the only Phase A pre-flight.** Of the primitives detail-panel needs (`Button`, `Skeleton`), only `Skeleton` is missing today; `Button` already installed by other components (verified via `src/components/ui/`). Pre-flight: `pnpm dlx shadcn@latest add skeleton`. Bundle audit (§10.2) treats Skeleton as registry-shared infrastructure.
3. **Focus-restore via `id` lookup, not ref.** When a user clicks a button to enter edit mode, the activeElement may be unmounted by the time we exit edit mode (e.g., the Edit button is replaced by Save/Cancel). Restoring by `id` survives unmount/remount of the same logical element; falls back to panel-root focus if the id is no longer in the DOM.
4. **`selectionKey` factory is a one-line module.** `lib/selection-key.ts` exports `keyForSelection(s: DetailPanelSelection | null): string`. Isolated for unit-testability; trivial implementation.
5. **`React 19 ref-as-prop` for `DetailPanelHandle`.** Same pattern as [properties-form plan §13.5 #8](../properties-form-procomp/properties-form-procomp-plan.md#135-plan-stage-refinements-surfaced-during-draft) — function component accepts `ref` as a regular prop; no `forwardRef` boilerplate. Detail-panel is non-generic, so the trade-off is smaller than properties-form's, but the project posture is consistent.
6. **Production-build warning suppression.** Dev-only `console.warn` calls (locked-mode, useDetailPanel-outside-Provider, focusBody-no-focusable) are gated by `process.env.NODE_ENV !== "production"`. Bundlers strip the dead code in production.
7. **`useDetailPanel()` outside Provider error message.** Throws `Error("DetailPanel.Header / .Body / .Actions must be used inside <DetailPanel>.")`. Standard shadcn pattern; helps debugging.

---

## 13. Definition of "done" for THIS document (stage gate)

- [x] User reviewed §1–§11 (the locked plan body) and §12 (resolved Q-Ps + §12.5 refinements).
- [x] All 10 plan-stage questions resolved (Q-P1 to Q-P10); Q-P1 + Q-P9 + Q-P10 refined on validate pass.
- [x] User said **"go ahead"** — sign-off applied. Stage 3 (implementation) unlocks: run §8.2 Phase A pre-flight (`pnpm dlx shadcn@latest add skeleton`) FIRST, then `pnpm new:component feedback/detail-panel`.
- [x] `Recommendation:` form converted to `**Locked: X.**`; status header flipped; [system §9 sub-doc map](../../systems/graph-system/graph-system-description.md#9-sub-document-map) updated to mark `detail-panel` plan ✓ signed off.

The plan is signed off when both (a) v0.1 implementation can begin AND (b) the `force-graph` v0.3 plan-lock cascade fully unlocks — the [`properties-form` plan](../properties-form-procomp/properties-form-procomp-plan.md) signed off 2026-04-29 is the other half; this plan completes the gate.

---

*End of v0.1 plan draft. Pause for user validate pass per project cadence (draft → validate → re-validate → sign off → commit).*
