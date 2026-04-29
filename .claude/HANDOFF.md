# Session Handoff — post-Tier-1 cascade COMPLETE + decision #38 cascade applied (force-graph v0.1 unblocked)

> **Refreshed:** 2026-04-30 (supersedes the 2026-04-29 post-4-of-5-shipped refresh)
> **Purpose:** Comprehensive continuation context for the next session. **Tier 1 implementation cascade is COMPLETE** (5 of 5 shipped 2026-04-29: `properties-form`, `detail-panel`, `filter-stack`, `entity-picker`, `markdown-editor`). Build / typecheck / lint clean across all five; SSR + `/components` index render verified. **Browser interactivity is NOT verified** (no test runner wired). **System decision #38 signed off + cascade applied 2026-04-30** — dashed-edge feature REMOVED, Phase 0 risk spike CANCELLED, replaced with stock Sigma `EdgeRectangleProgram` + `@sigma/edge-arrow` and per-edge color/size differentiation. **Force-graph v0.1 implementation gate is NOW UNBLOCKED at the planning level** (no Phase 0 prerequisite remains).
> **First read:** This is the third doc to read in a fresh session. Read [.claude/CLAUDE.md](CLAUDE.md) (auto-loaded) and [.claude/STATUS.md](STATUS.md) (auto-loaded) FIRST. Then this doc — orient via §1–§4, then jump to §6 for concrete next-step options.

If you're a fresh Claude session: don't try to derive what's been done — it's all here. Trust this document plus STATUS.md plus CLAUDE.md.

---

## 1. The 60-second project orientation

**Project:** [ilinxa-ui-pro](../) — a private high-level component library. Pro-components built on top of shadcn/ui. Single Next.js 16 app for development; eventual NPM / shadcn-registry publish target.

**Tech stack:** Next 16.2, React 19.2, Tailwind 4 (OKLCH, CSS variables), shadcn v4, TypeScript 5, pnpm 10. `babel-plugin-react-compiler` enabled. **The React Compiler-aware ESLint plugin is strict** — see §5 for patterns learned the hard way during this implementation sprint.

**Critical conventions:**
- **Procomp gate** ([CLAUDE.md](CLAUDE.md) §Workflow): description → plan → guide. Stages 1+2 are signed-off gates.
- **Design tokens** ([CLAUDE.md](CLAUDE.md) §Design system mandate): signal-lime accent, Onest + JetBrains Mono fonts, cool off-white light bg, graphite-cool dark bg, `reveal-up` keyframe.
- **Next 16 has breaking changes** ([AGENTS.md](../AGENTS.md)): training data is wrong for Next 16. READ `node_modules/next/dist/docs/` before route code.

**Where things live:**
- `src/registry/components/<category>/<slug>/` — the components themselves
- `src/registry/{types,categories,manifest}.ts` — registry plumbing
- `src/app/` — docs site
- `src/components/ui/` — shadcn primitives
- `docs/procomps/<slug>-procomp/` — per-component planning docs
- `docs/systems/<slug>-system/` — system-level planning docs

**Components currently in registry** (7, all in [src/registry/manifest.ts](../src/registry/manifest.ts)):

| Slug | Category | Status | Notes |
|---|---|---|---|
| `data-table` | data | alpha 0.1.0 | Canonical template |
| `rich-card` | data | beta 0.4.0 | JSON-driven recursive card-tree viewer + editor |
| `workspace` | layout | alpha 0.1.0 | Splittable canvas |
| `properties-form` | forms | alpha 0.1.0 | **Shipped 2026-04-29** — Tier 1 #1; schema-driven controlled read/edit form |
| `detail-panel` | feedback | alpha 0.1.0 | **Shipped 2026-04-29** — Tier 1 #2; selection-aware compound container |
| `filter-stack` | forms | alpha 0.1.0 | **Shipped 2026-04-29** — Tier 1 #3; schema-driven filter panel |
| `entity-picker` | forms | alpha 0.1.0 | **Shipped 2026-04-29** — Tier 1 #4; searchable typed picker |

---

## 2. Planning state (unchanged since prior pause)

The original v4 spec ([graph-visualizer-old.md](../graph-visualizer-old.md)) was a single 9-week monolithic component. The planning sprint decomposed it into 5 Tier 1 pro-components + 1 Tier 2 pro-component (`force-graph`; phased v0.1–v0.6) + 1 Tier 3 assembled-experience page.

**System-level master doc:** [docs/systems/graph-system/graph-system-description.md](../docs/systems/graph-system/graph-system-description.md). 37 cross-cutting decisions locked.

### 2.1 Procomp descriptions (Stage 1) — ALL signed off ✓

All 6 descriptions signed off 2026-04-28: `properties-form`, `detail-panel`, `filter-stack`, `entity-picker`, `markdown-editor`, `force-graph`.

### 2.2 Plans (Stage 2) — 8 of 12 done

| Plan | Status |
|---|---|
| [`force-graph-v0.1-plan.md`](../docs/procomps/force-graph-procomp/force-graph-v0.1-plan.md) | ✓ signed off 2026-04-28 |
| [`force-graph-v0.2-plan.md`](../docs/procomps/force-graph-procomp/force-graph-v0.2-plan.md) | ✓ signed off 2026-04-29 |
| [`force-graph-v0.3-plan.md`](../docs/procomps/force-graph-procomp/force-graph-v0.3-plan.md) | ✓ signed off 2026-04-29 |
| [`properties-form-procomp-plan.md`](../docs/procomps/properties-form-procomp/properties-form-procomp-plan.md) | ✓ signed off 2026-04-29 |
| [`detail-panel-procomp-plan.md`](../docs/procomps/detail-panel-procomp/detail-panel-procomp-plan.md) | ✓ signed off 2026-04-29 |
| [`filter-stack-procomp-plan.md`](../docs/procomps/filter-stack-procomp/filter-stack-procomp-plan.md) | ✓ signed off 2026-04-29 |
| [`entity-picker-procomp-plan.md`](../docs/procomps/entity-picker-procomp/entity-picker-procomp-plan.md) | ✓ signed off 2026-04-29 |
| [`markdown-editor-procomp-plan.md`](../docs/procomps/markdown-editor-procomp/markdown-editor-procomp-plan.md) | ✓ signed off 2026-04-29 |
| `force-graph-v0.4-plan.md` | TBA — independent; can author anytime, but more useful AFTER markdown-editor implementation |
| `force-graph-v0.5-plan.md` | TBA — same |
| `force-graph-v0.6-plan.md` | TBA — speculative without full system stood up |
| `graph-system-plan.md` (system Stage 2) | TBA — authorable; better after Tier 1 implementations validate the assumptions |

### 2.3 Cross-cutting state — locked decisions

37 decisions in [graph-system-description.md §8](../docs/systems/graph-system/graph-system-description.md#8-locked-decisions-index). The most operationally relevant:
- **#17** Origin field mandatory on every node + edge from v0.1
- **#22** Real-time deltas preserve UI state, do NOT enter undo stack
- **#23** System data canonical fields read-only; `annotations` field user-writable
- **#25** Permission resolver per-component in v1
- **#33** Single `applyMutation` routing (annotations route through `setAnnotation` variant)
- **#35** Tier 1 components are independent at the registry level — force-graph composes Tier 1 only at host/Tier 3
- **#36** Wikilink reconciliation runs on doc save in `force-graph` v0.5+
- **#37** Design-system mandate — Onest + JetBrains Mono, signal-lime, OKLCH only

System §8 has a "Note on plan references": legacy `force-graph-procomp-plan.md` citations mean per-phase plans (`force-graph-v0.{N}-plan.md`).

---

## 3. Implementation state (NEW — this is what's changed)

### 3.1 Tier 1 implementation cascade — 4 of 5 done

| # | Component | Files | Demo sub-tabs | Pre-flight install commit | Implementation commit | Force-graph gate impact |
|---|---|---|---|---|---|---|
| 1 | `properties-form` | 25 | 5 | `aacabcb` (input/select/switch/textarea/tooltip) | `1d719a6` | Half-unblocks v0.3 |
| 2 | `detail-panel` | 18 | 7 | `82e091f` (skeleton) | `bf59073` | **Fully unblocks v0.3** (paired with properties-form) |
| 3 | `filter-stack` | 21 | 5 | `003af2e` (checkbox/toggle/toggle-group) | `6a4d02e` | **Unblocks v0.4** |
| 4 | `entity-picker` | 18 | 8 | `3401af6` (command/dialog/input-group + cmdk peer dep) | `5f7951b` | Composed in v0.3+ host code; doesn't gate a phase |
| 5 | `markdown-editor` | TBA | TBA | `pnpm add @codemirror/state @codemirror/view @codemirror/commands @codemirror/language @codemirror/lang-markdown @codemirror/autocomplete @codemirror/search @lezer/markdown @lezer/highlight marked` (10 npm packages; no shadcn) | TBA | **Will unblock v0.5** |

**Cumulative: 82 files of registry code shipped.** Plus 5 pre-flight commits adding 13 shadcn primitives + cmdk peer dep to `src/components/ui/`.

### 3.2 What "shipped" means — and what it doesn't

For all four shipped components:

✓ **Validated (programmatic):**
- `pnpm tsc --noEmit` — clean (function overloads + generics narrow correctly where applicable, e.g., entity-picker)
- `pnpm lint` — clean except 1 pre-existing warning in rich-card's `use-virtualizer.ts` (TanStack Virtual lint exception; not new)
- `pnpm build` — production build succeeds; all routes prerendered
- SSR — `/components/<slug>` returns HTTP 200 with expected demo content
- Index page — `/components` lists every shipped entry with name + description

✗ **NOT validated (browser-only; deferred to manual testing):**
- Client-side hydration (any console errors during hydrate)
- Tab switching across demo sub-pages
- Form interactivity (typing, blur, Esc, debounce timing)
- Popover open/close + keyboard nav (cmdk ↑/↓/Enter/Esc, Backspace-on-empty-search chip removal, ToggleGroup arrow-key cycling)
- Focus management (mode-toggle into edit body in detail-panel, focus-restore by id, panel-root focus on selection change)
- Sticky positioning under `<div className="contents">` re-key wrapper (detail-panel §11.1 risk row flagged this for Phase B verification)
- aria-live announcements (selection changes in detail-panel)
- Dev-only console warnings firing as documented (locked-mode in detail-panel; reserved suffix in filter-stack; duplicate ids in entity-picker; unstable schema/categories/items >5 successive renders)
- Custom render slot error boundaries
- Imperative handle methods (no demo currently exercises them all — entity-picker's "Imperative handle" tab covers focus/open/close/clear; the other three components' handles are not demo-driven)

**No test runner is wired in this repo** (consistent with rich-card and workspace test-debt posture). Verification is demo-driven manual browser testing. **The pause point is exactly here:** the user steps away to do that browser testing before continuing implementation.

### 3.3 Plan deviations applied across the 4 implementations

These showed up repeatedly under the React Compiler-aware lint and are documented in commit messages + STATUS.md "Recent decisions". A future session implementing markdown-editor should expect to hit similar patterns — see §5 for the lint rules to anticipate.

**properties-form (`1d719a6`):**
1. field-row React.memo dropped (closure-staleness bug in plan §11.1's memo-on-value-only spec)
2. ID factory cache Map dropped (mutating render-time Map flagged by React Compiler-aware lint)
3. submit-id token kept at dispatch site, not in reducer (cleaner pure-reducer)
4. `mode-changed` reducer action dropped as dead code (Q-P7 matrix is enforced by dispatcher firing reset/submit-succeeded directly)
5. Auto-commit branch in field-row for Select + Switch (avoid props-propagation race in same React event tick)

**detail-panel (`bf59073`):**
1. Auto-reset implemented via key-paired derived state, not setInternalMode-in-effect (lint forbids setState in useEffect for derivable state)
2. Selection announcer simplified to key-based remount (same lint rule)
3. Demo imports `useDetailPanel` directly from `parts/detail-panel-context` (acceptable since demo.tsx is co-located)

**filter-stack (`6a4d02e`):**
1. `useDebouncedCallback` hook deleted as dead code (per-id different `debounceMs` doesn't fit a fixed-ms hook signature; useTextBuffer rolled raw setTimeout per-id)
2. Demos use predicate-as-useCallback with explicit `tagMode` dep instead of `valuesRef` closure (predicate runs during render via `applyFilters` in `useMemo`; ref-during-render lint failure)
3. `filter-stack.tsx` computes `allEmpty` inline from props, not via the imperative handle (same lint rule)
4. `commitText` callback uses a values ref-mirror updated in useEffect (write happens in useEffect, read happens in debounced timer — both post-render, lint-safe)

**entity-picker (`5f7951b`):**
1. Trigger node tracked via `useState<HTMLElement>` instead of `useRef<HTMLElement>` (state setter is React's own `Dispatch<SetStateAction>`, passes the ref-during-render lint when passed to `renderTrigger` slot)
2. Query reset moved out of `useEffect-on-open` and into a `setOpen` wrapper (setState-in-effect-for-derivable-state lint)
3. `hooks/use-imperative-handle.ts` deleted as dead code (inlined into main component; ~12 lines)

The pattern across all four: **React Compiler-aware lint pushed us toward simpler, more derived shapes**. The plans were written conservatively (state-and-effect heavy); the lint forced us to derive instead.

---

## 4. ~~The Phase 0 bottleneck~~ — RESOLVED 2026-04-30 per decision #38

**Section was: "The Phase 0 bottleneck (still the real implementation gate for force-graph)" — superseded.**

`force-graph` v0.1 implementation is **NO LONGER GATED** on a Phase 0 risk spike. Per [system decision #38](../docs/systems/graph-system/graph-system-description.md#8-locked-decisions-index) (signed off 2026-04-29; cascade applied 2026-04-30):

- The custom `DashedDirectedEdgeProgram` is **removed** from the v0.1 plan
- The dashed-edge feature is **dropped** at the description level
- v0.1 substrate is **stock Sigma** — `EdgeRectangleProgram` + `@sigma/edge-arrow`
- Visual differentiation between "soft" (doc-involving or per-type-flagged) and "default" edges via per-edge `color` + `size` attributes
- The 2-day spike budget reverts to v0.1 implementation (saves ~3-4.5 days vs custom shader development per v0.1 plan §12.1 #7)

**Force-graph v0.1 implementation gate is now UNBLOCKED at the planning level.** Sequential implementation order remains v0.1 → v0.2 → v0.3 → v0.4/v0.5/v0.6 in any order.

**The original [spike brief](../docs/procomps/force-graph-procomp/force-graph-phase-0-spike-brief.md)** is preserved with a SUPERSEDED banner; methodology sections may be reused if real-world performance regression surfaces in v0.6 perf-hardening. The original [PHASE-0-ACTION-PLAN.md](PHASE-0-ACTION-PLAN.md) (if it exists) is similarly historical-only.

**Tier 1 implementation continued in parallel and is now COMPLETE** (5 of 5 shipped — see §3). The decision-#38 amendment closes the only remaining force-graph implementation prerequisite that wasn't a Tier 1 ship.

---

## 5. Implementation patterns learned (must read before implementing markdown-editor)

The React Compiler-aware ESLint plugin (`react-hooks/refs`, `react-hooks/set-state-in-effect`, `react-hooks/immutability`) is stricter than React itself. Same code that would have run fine in React 18 throws lint errors here. Future implementation sessions WILL hit these. Patterns to anticipate:

### 5.1 Don't put setState in useEffect for derivable state

❌ **Flagged:**
```tsx
const [internalMode, setInternalMode] = useState("read");
useEffect(() => {
  if (selectionKey changed) setInternalMode("read");  // FAILS react-hooks/set-state-in-effect
}, [selectionKey]);
```

✓ **Pattern:** derive from a key-paired snapshot.
```tsx
const [snapshot, setSnapshot] = useState({ mode: "read", key: selectionKey });
const mode = snapshot.key === selectionKey ? snapshot.mode : "read";
const setMode = (next) => setSnapshot({ mode: next, key: selectionKey });
```

❌ **Also flagged:** `useEffect(() => { if (!open) setQuery(""); }, [open])` — query reset on close.

✓ **Pattern:** wrap setState in a setter that resets correlated state inline.
```tsx
const setOpen = useCallback((next) => {
  if (!next) setQuery("");
  rawSetOpen(next);
}, [rawSetOpen]);
```

### 5.2 Don't access refs during render (especially through callbacks passed to user code)

❌ **Flagged:**
```tsx
const valuesRef = useRef(values);
useEffect(() => { valuesRef.current = values; });
const predicate = useCallback((item, value) => {
  const mode = valuesRef.current["mode"];  // FAILS react-hooks/refs when predicate runs in useMemo during render
}, []);
```

✓ **Pattern:** derive observable inputs first, useCallback the consumer with derived value as dep.
```tsx
const tagMode = values["tags__mode"] === "intersection" ? "intersection" : "union";
const predicate = useCallback((item, value) => {
  if (tagMode === "intersection") return ...;
}, [tagMode]);
```

### 5.3 Don't pass ref-accessor functions to user-rendered slots

❌ **Flagged:**
```tsx
const triggerRef = useRef(null);
const customTriggerRef = useCallback((node) => { triggerRef.current = node; }, []);
return renderTrigger({ value, open, triggerRef: customTriggerRef });  // FAILS react-hooks/refs
```

✓ **Pattern:** use `useState<HTMLElement | null>(null)` to track the DOM node. The setter is React's own `Dispatch<SetStateAction>`, which passes the lint.
```tsx
const [triggerNode, setTriggerNode] = useState<HTMLElement | null>(null);
return renderTrigger({ value, open, triggerRef: setTriggerNode });
```

One state mount on first attach, no other re-render impact. Same pattern works for forwardRef-style refs (Radix Slot composition handles the dual-ref case automatically — see entity-picker §6.3 deviations).

### 5.4 Don't mutate Map/object created during render

❌ **Flagged:**
```tsx
return useMemo(() => {
  const cache = new Map();
  return (key) => {
    if (cache.has(key)) return cache.get(key);  // FAILS react-hooks/immutability
    cache.set(key, makeIds(key));
    return cache.get(key);
  };
}, [formId]);
```

✓ **Pattern:** drop the cache. Recompute fresh per call. Object identity rarely matters when callers don't memo on it.
```tsx
return (key) => ({
  fieldId: `${formId}-field-${safeKey}`,
  errorId: `${formId}-error-${safeKey}`,
});
```

### 5.5 Verify with `pnpm lint` early — Phase A end-gate

Plans always specified Phase A end-gate verification. The Phase A end-gate must include `pnpm lint` (not just `pnpm tsc --noEmit`). Each Tier 1 component shipped this session hit ≥1 of the above lint failures during Phase B or Phase C; cheaper to catch them at Phase A.

**For markdown-editor specifically** (per [its plan §13.5 Q-P5/Q-P9](../docs/procomps/markdown-editor-procomp/markdown-editor-procomp-plan.md)): the CM6 StateField + StateEffect + ViewPlugin pattern for runtime-updatable wikilink candidates uses `useEffect` to dispatch state effects. The lint may flag dispatch-from-effect; pre-emptive workaround: gate with a ref-comparison guard inside the effect body, OR use `useEffect` with the dispatch wrapped in a `requestIdleCallback` (defers to post-commit). Verify at Phase A.

---

## 6. Concrete next-step options

The user is pausing to **manually browser-test the four shipped components** before continuing. When they return, the natural next steps are below in priority order.

### Option A — Browser-verify shipped Tier 1 components (NEW; user-driven)

This is what the pause is for. The user opens the dev server (or production build), clicks through:

| Component | URL | Tabs | Manual checks per plan §X.5 + §10 edge cases |
|---|---|---|---|
| properties-form | `/components/properties-form` | 5 | Tab switching, blur-driven error visibility, 200ms spinner timing on submit, permission tooltip hover/focus, custom tags renderer keyboard (Enter/comma/Backspace), validation errors after blur, mixed-permissions read-only display |
| detail-panel | `/components/detail-panel` | 7 | Tab switching, mode toggle into edit, focus moves into Body (mode-toggle demo), focus restore by id on exit edit, sticky header + sticky footer Actions during body scroll, error retry click, selection switcher re-key (slotted form state wipes), aria-live announcements via screen reader |
| filter-stack | `/components/filter-stack` | 5 | Tab switching, Checkbox/Switch/ToggleGroup keyboard (Tab/arrow/Space/Enter), 250ms text debounce, ESC clears text field, solo-button hover-reveal + Tooltip, schema-instability dev-warn after 6 successive `categories` reference changes (open DevTools console; watch for `[filter-stack]` warn), error boundary on a custom render that throws |
| entity-picker | `/components/entity-picker` | 8 | Tab switching, popover open/close, cmdk keyboard nav (↑/↓/Enter/Esc), chip remove buttons + Backspace-on-empty-search chip removal, custom-trigger demo focus via imperative handle, dev-warn for duplicate ids (open DevTools), all imperative handle methods (focus/open/close/clear) |

Outcome of this pass: a list of any client-side bugs that need fixing before markdown-editor lands. If everything works, the user proceeds to Option B.

### Option B — Implement `markdown-editor` (last Tier 1; ~3 weeks focused)

Heaviest pro-component by bundle (~180KB ceiling) and complexity (CodeMirror 6 substrate). Plan: [docs/procomps/markdown-editor-procomp/markdown-editor-procomp-plan.md](../docs/procomps/markdown-editor-procomp/markdown-editor-procomp-plan.md) (~960 lines).

**Phase A pre-flight:** `pnpm add @codemirror/state @codemirror/view @codemirror/commands @codemirror/language @codemirror/lang-markdown @codemirror/autocomplete @codemirror/search @lezer/markdown @lezer/highlight marked` (10 npm packages; no shadcn install needed — Tabs/Button/Badge already in repo, Tooltip queued by properties-form Phase A).

**Implementation expectations:** the heaviest plan in the sprint by file count (28 files projected). 10 plan-stage Q-Ps. Per-instance `new Marked()` (not global `marked.use()`). CM6 StateField + StateEffect + ViewPlugin for runtime-updatable wikilink candidates. CM6 keymap composition with user extensions LAST. SyncAnnotation echo guard for the 4 sync effects. **Read §5 of this handoff before starting** — the React Compiler-aware lint will likely flag CM6 effect-dispatch patterns.

**After markdown-editor ships, force-graph v0.5 implementation gate is fully unblocked.**

### Option C — Author `force-graph` v0.4 / v0.5 / v0.6 plans

All three plans are unblocked, but **v0.4 and v0.5 plans benefit from validating against the shipped Tier 1 implementations first**. Real APIs surface plan-time blind spots. Wait until at least markdown-editor implements before authoring v0.5 plan.

`v0.6` (perf hardening + multi-edge expansion + advanced settings) is speculative without the full system stood up. Author last.

### Option D — Author `graph-system-plan.md` (system Stage 2)

Authorable. Tier 3 wiring; integration test patterns; handoff conventions between Tier 1 and Tier 2 components. Same caveat as v0.4/v0.5 plans: most beneficial after Tier 1 implementations validate the assumptions.

### ~~Option E — Run Phase 0 risk spike (NOT a Claude task)~~

**REMOVED 2026-04-30 per [decision #38](../docs/systems/graph-system/graph-system-description.md#8-locked-decisions-index).** Phase 0 risk spike CANCELLED; no longer a next-step option. v0.1 substrate is stock Sigma — see §4 above.

### Option E (replacement) — Implement `force-graph` v0.1 (3 weeks focused)

Now that Phase 0 is removed, force-graph v0.1 is the natural next implementation candidate. Plan: [docs/procomps/force-graph-procomp/force-graph-v0.1-plan.md](../docs/procomps/force-graph-procomp/force-graph-v0.1-plan.md) (~1090 lines post-amendment).

**Phase A pre-flight:** scaffold via `pnpm new:component data/force-graph`; install Sigma deps (`pnpm add sigma graphology graphology-types graphology-layout-forceatlas2 @sigma/edge-arrow`). No Tier 1 dependencies in v0.1 (per [decision #35](../docs/systems/graph-system/graph-system-description.md)) — composes happen at host/Tier 3 only.

**Implementation expectations:** ~32 files (the file tree at v0.1 plan §11.x; `parts/programs/` subdir DROPPED per #38). 11 plan-stage Q-Ps. Stock Sigma rendering via `EdgeRectangleProgram` + `@sigma/edge-arrow`; soft/default edge attributes via pure `softEdgeAttributes()` function in `lib/edge-attributes.ts`. Two-layer storage (graphology MultiGraph + Zustand `groupEdges` slice). FA2 layout in Web Worker. Read §5 of this handoff before starting — the React Compiler-aware lint will likely flag effects in the Sigma container lifecycle, store creation patterns, and graphology-adapter ref handling.

### Option F — Pause longer

The sprint has shipped 6 description sign-offs + 8 plan sign-offs + 5 of 5 Tier 1 component implementations + decision #38 cascade. STATUS.md is current. No urgent issues. A longer pause is reasonable.

**Recommendation rank:** A (browser-verify — required before more code) > E (implement force-graph v0.1 — heaviest impact, gates everything downstream) > C (v0.4 plan — useful after browser verification) > D (system Stage 2 plan) > F (pause).

---

## 7. Conventions to honor (must)

Anchored at the system-description level and bake into all per-component plans:

- **[Decision #35](../docs/systems/graph-system/graph-system-description.md):** Tier 1 components are independent at the registry level. `force-graph` does NOT import any Tier 1 component. Composition is host/Tier 3 only. **Single most violated rule.** None of the 4 shipped Tier 1 components imports another at the registry level — verified.
- **[Decision #11 footnote](../docs/systems/graph-system/graph-system-description.md):** Lucide icon atlas ships in `force-graph` v0.5 (not v0.1). v0.1–v0.4 use Sigma's stock `NodeCircleProgram` (plain disc nodes).
- **[Decision #17](../docs/systems/graph-system/graph-system-description.md):** Origin field mandatory.
- **Per-phase plan reference convention:** legacy `force-graph-procomp-plan.md` citations in system §8 mean per-phase plans.
- ~~**Phase 0 risk-spike pre-condition:** force-graph v0.1 implementation cannot begin until the spike completes.~~ **REMOVED 2026-04-30 per [decision #38](../docs/systems/graph-system/graph-system-description.md#8-locked-decisions-index)** — Phase 0 cancelled; v0.1 implementation can begin immediately.
- **CrudResult discriminated return shape** (v0.3 plan lock): all force-graph CRUD actions return `{ ok: true, ...payload } | { ok: false, code, reason?, entityIds? }`. Hosts always check `result.ok`.
- **React Compiler-aware lint patterns** (§5 of this handoff): derive instead of useState-in-effect; track DOM nodes via useState; wrap state-correlated cleanup in setOpen-style wrappers.

### Things to never do

- **Never import `next/*` from registry components.** Tier 3 page can; pro-components cannot.
- **Never hard-code colors.** Use CSS vars from globals.css.
- **Never use Inter / Roboto / Geist / system-default fonts.** Onest + JetBrains Mono only.
- **Never use `git add -A`.** Stage specific paths.
- **Never skip hooks** (`--no-verify`).
- **Never amend commits** — create new ones.
- **Never push to remote** without explicit user request.
- ~~**Never run a Phase 0 risk spike in a single Claude session** — it's 2 days of GPU benchmarking.~~ **N/A 2026-04-30** — Phase 0 cancelled per [decision #38](../docs/systems/graph-system/graph-system-description.md#8-locked-decisions-index).
- **Never let a Tier 1 plan reference another Tier 1 component's types directly** — opaque carriers (`unknown`, `Record<string, unknown>`) only.
- **Never claim browser-side validation succeeded without a real browser session** — programmatic checks (typecheck/lint/build/SSR/index render) are NOT a substitute for hydration + interactivity testing. Be explicit about this in commit messages and STATUS.md entries.

---

## 8. Files to read at session start, in order

For sessions continuing implementation OR reviewing prior implementations.

1. [.claude/CLAUDE.md](CLAUDE.md) (auto-loaded)
2. [.claude/STATUS.md](STATUS.md) (auto-loaded)
3. **This file** ([.claude/HANDOFF.md](HANDOFF.md))
4. **§5 of this file specifically** — React Compiler-aware lint patterns. Required before implementing markdown-editor.
5. [docs/systems/graph-system/graph-system-description.md](../docs/systems/graph-system/graph-system-description.md) — 37 locked decisions
6. The plan for the component you're working with: `docs/procomps/<slug>-procomp/<slug>-procomp-plan.md`
7. The shipped implementations under `src/registry/components/<category>/<slug>/` — read at least one (e.g., `forms/properties-form/`) end-to-end as the reference for the cadence.
8. (Skim) [docs/component-guide.md](../docs/component-guide.md) — long-form pro-component build reference.
9. (Skim) [graph-visualizer-old.md](../graph-visualizer-old.md) — original v4 spec; authoritative for `force-graph` internals **except where superseded by [decision #38](../docs/systems/graph-system/graph-system-description.md#8-locked-decisions-index) 2026-04-29** (custom `DashedDirectedEdgeProgram` in §11.3 / dashed-edge rule in §3.5 are no longer in scope; v0.1 plan §8.2 has the current rendering substrate).

---

## 9. Recent commits (for git-log orientation)

Most recent first. Implementation cascade visible as 4 paired (`chore(ui)` → `feat(<category>/<slug>)`) commits:

```
5f7951b feat(forms/entity-picker): ship v0.1 — searchable typed picker
3401af6 chore(ui): add command, dialog, input-group shadcn primitives
6a4d02e feat(forms/filter-stack): ship v0.1 — schema-driven filter panel
003af2e chore(ui): add checkbox, toggle, toggle-group shadcn primitives
bf59073 feat(feedback/detail-panel): ship v0.1 — selection-aware compound container
82e091f chore(ui): add skeleton shadcn primitive
1d719a6 feat(forms/properties-form): ship v0.1 — schema-driven controlled read/edit form
aacabcb chore(ui): add input, select, switch, textarea, tooltip shadcn primitives
ee3b514 docs(handoff, starter-prompt): refresh for post-Tier-1-cascade-COMPLETE pause  ← PRIOR (now-superseded) handoff
62a5bb7 docs(procomps/force-graph): sign off v0.3 plan; apply 7 refinements
```

Eight implementation commits in one session block (4 components × 2 commits each: pre-flight + ship). The previous handoff (commit `ee3b514`) is preserved in git history; this file's content has been replaced.

---

## 10. User pacing notes (carried forward + augmented)

- **Decisive** — short messages, direct decisions ("go ahead", "validate", "what is next?", numeric / letter picks from option lists). During implementation: terser still ("ok", "yes go ahead", "lets build this: <slug>").
- **Brevity preference** — explicitly told the assistant "be short and clear" mid-session. Long preambles, restated framing, and section-heavy summaries are unwelcome. Match question length.
- **Trusts the pattern** — the implementation cadence (pre-flight install → scaffold → Phase A → Phase B → Phase C → STATUS + system §9 + commit) was followed cleanly across all 4 ships. User said "go ahead" / "yes go ahead" at each commit gate; expected the pattern to hold.
- **Acknowledges plan-vs-reality friction** — when implementation deviated from the plan due to lint constraints, user accepted the deviation summaries in commit messages without re-prosecuting. Expected pattern: surface the deviation prominently, explain why, ship.
- **Schedule-respecting** — explicitly asked for full handoff refresh before pausing. Treats long sessions as work blocks; expects clean continuation. Returns after browser testing as a fresh session.

When in doubt, **be decisive with reasoning, in brief**. Pick a default; one sentence on why; one sentence on the trade-off. Don't surface every possible option.

---

*End of refreshed handoff. Pause here for browser testing of the 4 shipped Tier 1 components. Resume per §6 (next-step options) when continuing — recommendation: Option A (browser-verify; required) → Option B (implement markdown-editor as the final Tier 1).*
