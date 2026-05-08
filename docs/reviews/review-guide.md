# Review guide — the 14 dimensions

This is the **content** reference for procomp reviews — what to actually look for in each of the 14 dimensions. Pair with [`review-process.md`](review-process.md) (the flow) and the templates in [`templates/`](templates/) (the deliverable).

For each dimension this guide gives:

- **Why it matters** — the failure mode this dimension catches.
- **What to check** — concrete bullet items.
- **Good signals** — what a passing review looks like.
- **Bad signals / common smells** — what to flag.

---

## 1. Procomp planning docs

**Location:** `docs/procomps/<slug>-procomp/<slug>-procomp-{description,plan,guide}.md`

### Why it matters
The library's gate against "build first, design later". A drifted doc means the next contributor reads stale intent and re-litigates settled questions — or worse, ships a feature the docs claim doesn't exist.

### What to check
- All three docs exist and are signed off (description, plan, guide).
- Description **§5 use cases** match what `demo.tsx` actually exercises.
- Description **out-of-scope** list is still accurate (nothing snuck in).
- Plan-stage decisions (often appended at the bottom of plan.md) are still honored in the code. Flag every drift.
- Guide is **consumer-shaped, not implementer-shaped** — reads like usage, not architecture.
- Code snippets in guide compile against the **current** public API.
- v0.2+ components have explicit "v0.x update" sections in each doc capturing what changed.
- If migrated from another app: description has the `> Migration origin: docs/migrations/<slug>/` one-liner.

### Good signals
- Description, plan, and guide can be read in any order and tell a coherent story.
- Plan's "decisions made beyond description" list is non-empty and explains *why* — not just *what*.
- Guide reads like a stranger could ship against this component without asking questions.

### Bad signals / smells
- Guide examples reference props that no longer exist.
- Plan documents an approach that the code abandons silently.
- "TODO: write guide" left in a shipped component.
- Description §5 promises five archetypes; demo shows two.

---

## 2. Public API

**Location:** `<slug>.tsx` root component props + `types.ts`.

### Why it matters
**The hardest thing to fix later.** Once a consumer is shipping against a prop shape, every change is a breaking change. The library's stated rule (per memory): *"add it later" is a breaking change. Bar is "plausible consumer override," not "any way to configure".*

### What to check
- **Openness vs sealedness.** Are slots, render props, callbacks, polymorphic roots, public helpers exposed where a consumer might plausibly need them?
- **Defaults are sane** — component renders meaningfully with zero props.
- **Discriminated unions** for variants instead of bag-of-flags (`{ variant: 'a' | 'b' }` over `{ isA: boolean; isB: boolean }`).
- **`onBefore*` interceptor chains** for mutations the consumer might want to gate (flow-canvas's `onBeforeDrop` / `onBeforeConnect` is the pattern).
- **Public helpers exported** — utilities + config consts that consumers can re-use (`PROJECT_STATUS_CONFIG` is the pattern).
- **No `any` in public types.** Generics where they buy real safety.
- **Stable-identity rules** documented for callback / object / array props that flow into `useEffect` deps or `memo` boundaries.
- **Naming consistency:** verbs for callbacks (`onDrop`), nouns for slots, `xxxRenderer` for registry entries.
- **Future-proofness:** can the next obvious feature be added without breaking? If `dragHandle?: 'shell' | 'header'` lands in v0.2, would `'custom-element'` slot in cleanly in v0.3?

### Good signals
- A consumer can build a non-trivial variation without forking.
- Types are precise enough that wrong props produce loud errors at build time.
- `index.ts` re-exports the helpers a consumer would naturally reach for.

### Bad signals / smells
- The component has 18 boolean props.
- Internal types are exported because nothing else makes them reachable.
- Renderer / row / item props are typed `any` or `unknown` with no generic.
- `onChange` callback receives positional args (`onChange(id, value)`) instead of an object (`onChange({ id, value })`) — positional callbacks are a versioning trap.
- Optional props with no documented default behavior.

---

## 3. Component code (sealed folder)

**Location:** `src/registry/components/<category>/<slug>/`

### Why it matters
Code quality compounds: clean code makes future reviews fast; sloppy code breeds defects. The sealed-folder shape is what lets us extract to NPM later — break the shape and you break that exit.

### What to check
- **Folder shape conforms to `data-table`:** `<slug>.tsx`, `parts/`, `hooks/`, `types.ts`, `dummy-data.ts`, `demo.tsx`, `usage.tsx`, `meta.ts`, `index.ts`.
- **Import allowlist:** only `react`, `@/components/ui/*`, `@/lib/utils`, declared third-party. **Never `next/*`**, no app contexts, no env-specific code. Grep each file.
- **No dead code** — unused vars, commented-out blocks, `// removed` placeholders, unused `_` prefixed args.
- **No half-finished `// TODO later`** without a tracking issue.
- **Comments only when WHY is non-obvious.** No "this returns the user" comments above `return user`.
- **No premature abstraction.** Three similar lines beats a generic helper. Flag generics-for-no-reason.
- **`useCallback` / `useMemo` only where stable identity matters** — children depend on it, or it's a downstream `memo` boundary. Flag decorative memo.
- **Module-scope hoisting** for things that must never re-create per render: xyflow `nodeTypes` / `edgeTypes`, dnd-kit sensors, large constants, regex.
- **Parts decomposition is purposeful** — `Column.tsx`, not `Component2.tsx`. One responsibility per file.
- **No swallowed errors.** `catch (e) {}` is a smell. Even `console.warn` is better than silence.
- **`'use client'` only where it's actually needed.**

### Good signals
- A new contributor can find anything in the folder in under 30 seconds.
- Each `parts/` file has an obvious single purpose.
- Hooks are extracted from the root only when they're genuinely reusable inside the folder.

### Bad signals / smells
- A `utils.ts` or `helpers.ts` catch-all.
- `index.ts` re-exports 20+ symbols including internal ones.
- The root `<slug>.tsx` is over ~300 lines without an obvious reason.
- A `parts/` file is imported once and is < 30 lines (over-decomposed).
- `useMemo(() => x, [x])` (no-op).

---

## 4. Demo + usage

**Location:** `demo.tsx`, `usage.tsx`, `dummy-data.ts`.

### Why it matters
The demo is what the docs site shows; it's the consumer's first impression. The usage page is the consumer's first attempt to ship against the component. Weaknesses here prevent adoption regardless of code quality.

### What to check
- **Demo covers every archetype the description §5 promised.** Tabs / sections / variants — count them; flow-canvas-01 and kanban-board-01 set the bar.
- **Demo dataset is realistic and heterogeneous.** Edge cases included: empty state, locked items, max-cap reached, deep nesting, long content, narrow viewport, RTL if relevant.
- **Demo exercises extensibility** — if renderers / portTypes / edgeTypes / column configs are open, the demo plugs in at least one custom one.
- **Usage page reads like docs**, not "here's the component". Has: short intro, props table, code snippets that compile, "when to use vs alternatives" guidance.
- **`dummy-data.ts` is exported via the fixtures registry item** so consumers can `import { ... } from "@/components/<slug>/dummy-data"` for their tests.
- **Both light and dark mode look intentional.** Not just "doesn't crash in dark".
- **No console errors / warnings** when the demo runs.
- **No lorem ipsum** in copy that the demo prominently displays.

### Good signals
- The demo would convince a skeptical product-manager the component is shippable.
- The fixture is something someone would actually paste into their app and tweak from.

### Bad signals / smells
- "Three lorem items" demo for a heterogeneous renderer-registry component.
- Demo only shows the happy path; no empty state, no error path, no overflow case.
- Custom-renderer / custom-extension story is buried in code comments instead of demonstrated visually.
- `usage.tsx` is a copy of `demo.tsx`.

---

## 5. Dependencies

**Location:** `meta.ts` (`dependencies`, `shadcnDependencies`), `registry.json` (`registryDependencies`), and the actual imports in source files.

### Why it matters
Drift between declared deps and actual imports means consumer installs ship without packages they need, or with packages they don't. Bloated peer-deps add weight every consumer pays for, even those that never use the feature that requires them.

### What to check
- **`meta.ts.shadcnDependencies` matches every `@/components/ui/*` import** across the sealed folder. Grep imports and cross-check.
- **`meta.ts.dependencies` matches every external npm import.** Same grep, different filter.
- **`registry.json.registryDependencies` mirrors `meta.ts`.** A primitive dropped from one must be dropped from the other (kanban v0.2 dropped `scroll-area` from both — that's the discipline).
- **No unused deps.** A dep listed in `meta.ts` but not imported anywhere is a bug.
- **Peer-dep weight justified.** Each external package earns its presence. `xyflow` for `flow-canvas-01`: yes. `lodash` to dedupe an array: no.
- **Version pins for finicky deps** (Plate, xyflow, dnd-kit) are explicit, not floating-major. Caret ranges are fine; `*` and `latest` are not.
- **License compatible.** Default expectation: MIT / Apache-2 / ISC. Anything else flagged in the guide. (Example from STATUS: xyflow `proOptions: { hideAttribution: true }` technically requires Pro license — that flag should live in the guide, not silently in code.)
- **Internal sibling-component deps** declared via `registryDependencies` (e.g. kanban-board-01's rich-card adapter pattern; flow-canvas using shadcn primitives that other components also need).

### Good signals
- A clean install in a tmp consumer pulls only what's actually imported.
- Every external dep has a one-line reason traceable in the guide or code comments.

### Bad signals / smells
- `meta.ts` lists `react-dnd` but the code uses `@dnd-kit/*`.
- `registryDependencies` includes a primitive that was deleted three commits ago.
- A heavyweight dep (>50KB gzipped) used for a single utility function.
- License-restricted features used without a guide-level note.

---

## 6. Design system

**Location:** the visible component — root `.tsx`, `parts/`, plus any inline-styled SVG / token usage.

### Why it matters
The library's identity. Drift accumulates silently — one component using `bg-zinc-900` instead of `bg-card` looks fine in isolation but fragments the visual vocabulary across 37 components.

Reference: [`src/app/globals.css`](../../src/app/globals.css) defines the tokens.

### What to check
- **Fonts:** Onest (sans), JetBrains Mono (mono). Never Inter / Roboto / Geist / system-font fallbacks. Grep for explicit font families.
- **Accent:** signal-lime — `oklch(0.80 0.20 132)` light / `oklch(0.86 0.18 132)` dark. Always paired with near-black `--primary-foreground`. No other accent introduced.
- **Light backgrounds:** never pure white (`#fff`) as page background. `--background` is cool off-white `oklch(0.975 0.003 250)`; raised surfaces (`--card`, `--popover`) lift to pure white.
- **Dark backgrounds:** graphite-cool, not warm-grey. Base `oklch(0.13 0.006 250)`; raised `oklch(0.17 0.006 250)`; subtle (`--muted`, `--secondary`, `--accent`) `oklch(0.22 0.005 250)`.
- **Tailwind v4 syntax** correct: `bg-linear-to-X` not `bg-gradient-to-X`; `wrap-break-word` not `break-words`; `grayscale-N` not `grayscale-[N%]`. (This is a recurring kasder-port pitfall.)
- **No forbidden patterns:** pure-white page bg, purple-on-white gradients, neon-saturated lime (chroma > 0.20).
- **One reveal per page.** `reveal-up` keyframe + 60ms stagger. No per-section reveal cascade.
- **Spacing rhythm consistent.** 4 / 8 / 12 / 16 px ladder visible. No `p-[13px]` ad-hoc values.
- **Light + dark visual parity.** Both modes screenshotted side-by-side; both feel intentional.
- **Component-scoped CSS** uses the `--xy-*` / `--<slug>-*` namespace pattern when it overrides primitive tokens.

### Good signals
- The component is recognizable as belonging to ilinxa-ui-pro at a glance.
- Dark mode is not just "inverted" but designed.

### Bad signals / smells
- `text-white` instead of `text-primary-foreground`.
- Inline hex colors in className.
- Light-mode `bg-white` on the page background.
- Animation that re-fires on every state change.

---

## 7. Accessibility

**Location:** the rendered component — keyboard interaction, ARIA attributes, focus management, reduced-motion handling.

### Why it matters
Accessibility is non-negotiable for a public-distribution library. A11y bugs are also load-bearing UX bugs in disguise — keyboard-broken usually means flow-broken.

### What to check
- **Keyboard nav** for every interactive surface. Tab visits all controls; arrow keys navigate within composite widgets; Esc dismisses; Enter / Space activate.
- **No keyboard traps.** Tab cycles out of menus, modals, popovers.
- **ARIA roles + labels** where semantics aren't obvious from the element. `aria-label` defaults exist for major surfaces (flow-canvas defaults to "Flow canvas").
- **Live regions** announce async state — drop, connect, save, validation errors.
- **Focus rings visible** in both modes. Not removed by global `:focus { outline: none }` without a replacement ring.
- **Focus management on dynamic mounts** — opening a popover focuses the first control; closing returns focus to the trigger.
- **Reduced-motion respect** — `@media (prefers-reduced-motion: reduce)` disables decorative transitions.
- **Color contrast** — body text passes WCAG AA (4.5:1) in both modes; interactive elements pass 3:1.
- **Screen reader pass** — drag start / drop, selection changes, expanded / collapsed all announced.
- **Disabled states** are perceivable to assistive tech (`aria-disabled` plus visual + cursor change).

### Good signals
- The component is usable with keyboard alone, end-to-end.
- VoiceOver / NVDA narrates a coherent story walking through the component.

### Bad signals / smells
- Click handlers on `<div>` instead of `<button>`.
- Custom dropdowns without `role="listbox"` / `role="option"`.
- Drag-only operations with no keyboard alternative.
- Animation that ignores reduced-motion.

---

## 8. Performance

**Location:** profile in browser; read render boundaries in code.

### Why it matters
Performance failures show up at the worst time — in a consumer's stress demo, in production, on someone's old laptop. Fixing them later means renaming public callbacks (the most expensive kind of refactor).

### What to check
- **`React.memo`** on parts that re-render in lists (kanban cards, flow nodes, table rows).
- **Stable identity for props passed down** — callbacks via `useCallback`, objects/arrays via `useMemo` *where they cross a memo boundary*. Decorative memo is a smell, not a feature.
- **Module-scope constants** for heavy maps (xyflow's `nodeTypes` / `edgeTypes`, sensor configs). Re-creating these per render breaks xyflow's internal memoization — this is the canonical xyflow-react-pro footgun.
- **Narrow store selectors** — for xyflow / Zustand, never `useStore(s => s)`. Subscribe to specific slices only.
- **Virtualization or `onlyRenderVisibleElements`** when N > ~100 items. flow-canvas exposes the toggle.
- **No O(n²) walks per render.** Tree walkers (`findPortInTree` and friends) memoized or hoisted out of render.
- **Stress demo exists** for high-N components. Run it, watch DevTools Performance tab for jank > 16ms frames.
- **Bundle weight** — `pnpm build` then read the per-route bundle size. Each external dep lazy-loaded if optional.
- **No render loops.** A `useEffect` that updates state which re-fires the effect is a bug.

### Good signals
- 200-node stress demo runs at 60fps on mid-range hardware.
- React DevTools Profiler shows stable render graph during a typical interaction.

### Bad signals / smells
- `nodeTypes={{ custom: CustomNode }}` defined inline in JSX (re-creates every render — kills xyflow).
- `useMemo(() => fn(x), [])` with empty deps when fn closes over changing state.
- `console.log` in a render path.
- Inline `.filter()` / `.map()` chains over hundreds of items per render.

---

## 9. Registry distribution

**Location:** `registry.json` at repo root; output at `public/r/<slug>.json`.

### Why it matters
The library's distribution mechanism. A wrong target path or a docs-file leaking into the artifact means a broken `pnpm dlx shadcn add @ilinxa/<slug>` for every consumer.

Reference: [.claude/skills/shadcn-registry-pro/](../../.claude/skills/shadcn-registry-pro/) — the producer-side skill.

### What to check
- **Two items per shipped component:** `<slug>` (base) + `<slug>-fixtures` (sibling, depends on base, contains `dummy-data.ts`).
- **Locked target convention:** every file is `type: "registry:component"` with `target: "components/<slug>/<sub-path>"`. No exceptions.
- **Excluded files:** `demo.tsx`, `usage.tsx`, `meta.ts` are docs-site only — **never** appear in a registry item's `files` array.
- **`registry:build` output** at `public/r/<slug>.json` regenerates cleanly on `pnpm registry:build`. Spot-check the JSON — file count matches sealed folder minus the three excluded.
- **Smoke install from a tmp consumer** (`pnpm dlx shadcn@latest add @ilinxa/<slug>`): files land at correct paths, no missing sibling-component deps, no missing shadcn primitives.
- **`registryDependencies`** lists internal sibling components when one procomp depends on another.
- **`description` in `registry.json`** matches `meta.ts.description` and the doc-site card.
- **`vercel-build`** (which runs `shadcn build && next build`) succeeds locally and on Vercel.

### Good signals
- A fresh `pnpm dlx shadcn add @ilinxa/<slug>` in a clean app produces a working component without manual fix-up.
- The fixtures item is small enough that consumers can opt out cleanly.

### Bad signals / smells
- A registry item with `type: "registry:ui"` mixed with `type: "registry:component"` (project locked to `registry:component` everywhere).
- `demo.tsx` accidentally included in a registry item's `files`.
- `target: "src/components/<slug>/..."` (wrong — the locked convention is `components/<slug>/...`).

---

## 10. Meta + manifest sync

**Location:** `meta.ts`, `src/registry/manifest.ts`, `.claude/STATUS.md`, `docs/component-versions.md`.

### Why it matters
The library has multiple sources-of-truth-ish locations that need to agree. Drift between them means consumers, the docs site, and the team disagree about what version of what is shipped.

### What to check
- **`meta.ts.version` reflects reality.** A v0.2 ship with `version: "0.1.0"` is a bug.
- **`meta.ts.status` honest:** `alpha` = breaking changes likely; `beta` = stabilizing; only mark `stable` post-extensive-consumer use.
- **`meta.ts.tags`** searchable and not just slug-fragments.
- **`meta.ts.description`** matches the doc-site card and `registry.json` description.
- **Registered in `manifest.ts.REGISTRY` array** — all three: Demo, Usage, meta. Three import lines per component.
- **`STATUS.md` Components table** has a current row with version + status + notes that match `meta.ts`.
- **`STATUS.md` Recent decisions** mentions the latest version bump (with date).
- **`docs/component-versions.md`** snapshot regenerated if a version changed since its last snapshot date.
- **Author / updatedAt fields** in `meta.ts` updated on every bump.

### Good signals
- A grep for the version string finds it in `meta.ts`, `STATUS.md`, `component-versions.md`, and `registry.json` — same value everywhere.
- Status alpha/beta/stable matches the maturity story the description tells.

### Bad signals / smells
- `meta.ts.version: "0.1.0"` for a component that has shipped two breaking changes.
- A row missing from `STATUS.md` for a registered component.
- `updatedAt` from a year ago on a recently changed component.

---

## 11. UI copy / text

**Location:** every visible string in `<slug>.tsx`, `parts/`, plus tooltip/aria/error strings; placeholder and label strings in inputs.

### Why it matters
Boring but high-signal. Polish here disproportionately drives perceived quality. Lazy copy makes a sophisticated component feel half-built.

### What to check
- **Empty states** are real sentences, not "No data". "No items in this column yet — drag from another column or use the **+** to add one." beats "Empty.".
- **Error / warn messages** (`console.warn` for parse errors, toast text, validation errors) are actionable. State the cause + the next step.
- **Button labels** verb-first ("Add column", not "Column"; "Save changes", not "Submit").
- **Tooltips** terse, non-redundant with the visible label. If the button says "Delete", the tooltip shouldn't say "Delete this item". It should add: "Delete (Cmd+Backspace)".
- **Placeholder text** in inputs explains the format ("yyyy-mm-dd"), not "Enter date".
- **No lorem ipsum** in copy that the demo or usage prominently displays. Filler can stay deep in `dummy-data.ts` if the copy itself isn't the demo's point.
- **Pluralization** correct ("1 item" / "2 items"), no "1 items".
- **Sentence case, not Title Case**, for in-product UI (matches the design tokens' restraint).
- **Capitalized brand names spelled correctly** (xyflow, shadcn lowercase; React, TypeScript capitalized).
- **i18n-readiness flagged.** The library doesn't ship i18n today, but new components should not bury hard-coded English deep in renderers — keep visible strings near the top.

### Good signals
- Reading the component's surface aloud sounds professional.
- Empty states make a first-time user smile, not shrug.

### Bad signals / smells
- "TODO copy" in a shipped component.
- Tooltips that duplicate the visible label exactly.
- Toast messages like "Error" or "Failed".
- "Click here" anywhere.

---

## 12. Verification

**Location:** the terminal.

### Why it matters
This is the ground truth. Reviewers can disagree about taste; the build either compiles or doesn't.

### What to check

```bash
pnpm tsc --noEmit                           # Type-check
pnpm lint                                   # ESLint
pnpm build                                  # Production build (Next 16 + Turbopack)
pnpm registry:build                         # Registry artifact regeneration
```

- **All four pass cleanly** at the version under review. Pre-existing warnings noted; no *new* warnings.
- **Docs-site detail page renders** at `/components/<slug>` without runtime errors. Demo + usage both visible.
- **Browser validation** of every interactive path on the docs site — light + dark, narrow + wide. (kanban-board-01 v0.2 STATUS still flags this as pending — that's a real gap captured by this dimension.)
- **`pnpm dlx shadcn@latest add @ilinxa/<slug>`** from a tmp app, for full reviews. Files land at the locked target paths.
- **Console clean** during demo interaction — no warnings, no errors, no React-key warnings, no aria-related console barks.

### Good signals
- All four commands clean; browser shows zero console output during a thorough exercise of the demo.
- Smoke-install in a tmp consumer yields a working component first try.

### Bad signals / smells
- "Pre-existing warnings" used as a shield to ignore new ones — list them explicitly to verify.
- A `tsc` clean but `build` failure — Turbopack catches things `tsc` doesn't.
- Console warnings about missing keys, controlled/uncontrolled drift, or hydration mismatches.

---

## 13. Migration provenance (if applicable)

**Location:** `docs/migrations/<slug>/` (analysis + original source); the description.md's `> Migration origin` line.

### Why it matters
Migrated components carry a different risk profile — they preserve design DNA from another app while rewriting structure. Skip the analysis step and you either lose the design intent or carry over the structural debt.

### What to check
- **`docs/migrations/<slug>/` exists** with `original/` source dump + `source-notes.md` + `analysis.md`.
- **`analysis.md` was signed off** by the user before code began.
- **`analysis.md` covers the four required gap categories:** dependencies, dynamism (renderer-registry / slots), optimization, accessibility.
- **Description has the `> Migration origin: docs/migrations/<slug>/` one-liner.**
- **Design DNA preservation verified** — diff the original screenshot vs current render. What used to be visually distinctive is still recognizable.
- **Structural debt was rewritten, not preserved.** Original `useState` chains replaced with proper hooks; original `next/link` replaced with polymorphic root; original Tailwind v3 classes translated to v4.
- **Tailwind v3 → v4 translations applied:** `bg-gradient-to-X` → `bg-linear-to-X`, `break-words` → `wrap-break-word`, `grayscale-[N%]` → `grayscale-N`. (Per memory — recurring kasder-port issue.)
- **No leftover `next/*` imports.**
- **No leftover app-context imports** (workspace, theme provider, etc.) that won't exist in a consumer app.

### Good signals
- The migration analysis reads like a careful diff — not a copy-paste of the original.
- Side-by-side: original and ilinxa version are the same component, but ilinxa's is portable.

### Bad signals / smells
- `next/image` in a migrated component.
- Hard-coded URL paths from the source app.
- `useRouter()` calls.
- Tailwind v3 class names that lint flags.

---

## 14. Cross-component coherence

**Location:** the library as a whole — pattern reuse, naming consistency, theming-variable namespaces.

### Why it matters
At 37 components, internal consistency is the difference between a library and a pile of components. A new consumer learns one pattern and applies it across components — if patterns drift, every component is its own learning curve.

### What to check
- **Renderer-registry pattern consistency** — workspace, kanban-board-01, flow-canvas-01 all use the same shape: `rendererId` field on items + `renderers: { [id]: Renderer }` prop + built-ins shipped inside the component + consumer-extendable. New host components should not invent a fourth dispatch model.
- **Naming consistency:** `<slug>-01` suffix for one variant of a family (e.g. there will eventually be `kanban-board-02`); bare slug for the canonical version (`data-table`, `rich-card`; `flow-canvas-01` kept its suffix despite being canonical-for-now — flag if intentional).
- **Public-helper export naming** follows the convention — `KANBAN_*` / `FLOW_*` / `PROJECT_*` shoutable constants.
- **Theming variables** live in `globals.css`, not per-component, and follow the `--xy-*` / `--<slug>-*` namespace pattern.
- **Sealed-folder shape consistent** — every component matches `data-table`'s structure. New folders deserve a new structure only with explicit reason in the plan.
- **Categorization consistent:** "is this `data` or `feedback` or `forms`?" — judged by primary purpose, not where it visually lives.
- **Status conventions:** alpha/beta meaning is the same across the library.
- **Dependency hygiene:** if multiple components use the same primitive, they all declare it the same way.

### Good signals
- A consumer can guess the API shape of a new component after seeing two siblings.
- The category cards on the docs site read as a coherent library.

### Bad signals / smells
- One renderer-registry component using `kind` as the discriminator while others use `__type` and `rendererId`.
- A new component categorized in `data` when its primary purpose is form-input.
- A theming variable defined per-component instead of in `globals.css`.

---

## Appendix: severity calibration

When in doubt about severity, use these rules of thumb (mapped to [`review-process.md`](review-process.md) §3 scale):

| Question | If yes → severity |
|---|---|
| Will this break a current consumer's build? | 🚫 Blocker |
| Will fixing this later require a major version bump? | 🚫 Blocker |
| Is this a security or data-loss path? | 🚫 Blocker |
| Does this regress accessibility? | ⚠️ High |
| Does this violate a design-system token? | ⚠️ High |
| Is the code observably broken in a non-trivial demo path? | ⚠️ High |
| Is this code-cleanness / maintainability? | 🔸 Medium |
| Is this docs drift not affecting behavior? | 🔸 Medium |
| Is this naming, spelling, comment polish? | 🔹 Low |

Use this table when you're stuck — but trust your judgment. A "low" finding for a flagship public component is different from the same finding in an internal-only one.
