# Session Handoff — graph-system Planning Sprint

> **Created:** 2026-04-28
> **Purpose:** Comprehensive continuation context for resuming the graph-system planning work in a fresh Claude session.
> **First read:** This is the doc you should ask Claude to read at session start. It complements [.claude/CLAUDE.md](CLAUDE.md) (project conventions) and [.claude/STATUS.md](STATUS.md) (live project state). Read all three before doing anything.

If you're a fresh Claude session reading this: orient using §1–§4, then jump to §6 for the concrete next step. Don't try to derive what's been done — it's all here.

---

## 1. The 60-second project orientation

**Project:** [ilinxa-ui-pro](../) — a private high-level component library. Pro-components (fully-composed, dependency-explicit) built on top of shadcn/ui that don't exist as primitives. Single Next.js 16 app for development; eventual NPM / shadcn-registry publish target.

**Tech stack:** Next 16.2, React 19.2, Tailwind 4 (OKLCH, CSS variables only, no `tailwind.config.*`), shadcn v4 (Radix base, Nova preset, neutral), TypeScript 5, pnpm 10. `babel-plugin-react-compiler` enabled.

**Critical convention — procomp gate** ([.claude/CLAUDE.md](CLAUDE.md) §Workflow): every new pro-component must pass through three written stages BEFORE any code lands:
1. `<slug>-procomp-description.md` (what & why)
2. `<slug>-procomp-plan.md` (how)
3. `<slug>-procomp-guide.md` (consumer-facing usage notes)

Stages 1 and 2 are signed-off gates. Stage 3 is authored alongside implementation. Folder: `docs/procomps/<slug>-procomp/`.

**Critical convention — design tokens** ([.claude/CLAUDE.md](CLAUDE.md) §Design system mandate): signal-lime accent (`oklch(0.80 0.20 132)` / `oklch(0.86 0.18 132)`), Onest + JetBrains Mono fonts (NOT Inter / Roboto / Geist / system defaults), cool off-white light bg, graphite-cool dark bg, `reveal-up` keyframe for orchestrated reveals. OKLCH only; no hard-coded colors.

**Critical convention — Next 16 has breaking changes** ([AGENTS.md](../AGENTS.md)): your training data is wrong for Next 16. READ `node_modules/next/dist/docs/` before writing any route code.

**Where things live:**
- `src/registry/components/<category>/<slug>/` — the components themselves (sealed folders following `data-table` shape)
- `src/registry/types.ts`, `categories.ts`, `manifest.ts` — registry plumbing
- `src/app/` — docs site (consumes registry)
- `src/components/ui/` — shadcn primitives (treat as third-party)
- `docs/procomps/<slug>-procomp/` — per-component planning docs (the gate)
- `docs/systems/<slug>-system/` — system-level planning docs (NEW — see §3)

**Existing components in registry** (3, all in [src/registry/manifest.ts](../src/registry/manifest.ts)):
- `data/data-table` (alpha v0.1.0) — canonical template
- `data/rich-card` (beta v0.4.0) — JSON-driven recursive card-tree viewer + editor + safety net
- `layout/workspace` (alpha v0.1.0) — splittable canvas

---

## 2. What this session is about — the graph-system planning sprint

**The big picture:** the user is designing a **graph-system** — a knowledge-graph visualization + editing + DB-adapter system. The original spec ([graph-visualizer-old.md](../graph-visualizer-old.md), v4) was a single 9-week monolithic component; this session decomposed it into 5 generic Tier 1 pro-components + 1 graph-specific Tier 2 + 1 Tier 3 assembled-experience page.

**Three usage modes** the system must support:
1. **DB visualizer** — Kuzu / Neo4j / Memgraph, all read-only at the visualizer level
2. **Personal Obsidian-like KG** — user owns all data, full CRUD
3. **Hybrid documenter** — read-only DB content + user-authored markdown notes that annotate/group/link DB nodes

These are the **same component with different data distributions**, distinguished by an **`origin: "system" | "user"`** field on every node and edge — the cornerstone of the architecture.

**The new docs tier introduced this session:**
- [docs/systems/](../docs/systems/) — multi-component product surfaces (compositions of pro-components + host code)
- Sits ABOVE `docs/procomps/`. A system doc is the integration contract that ties multiple pro-components together and locks cross-cutting decisions.
- See [docs/systems/README.md](../docs/systems/README.md) for the tier governance.

**The system description (the master doc):**
- [docs/systems/graph-system/graph-system-description.md](../docs/systems/graph-system/graph-system-description.md) — **THE** authoritative cross-cutting contract for graph-system. Signed off 2026-04-28.
- 37 locked decisions (§8 of that doc) inherited as constraints by every constituent procomp.
- §11.5 maps every original-spec decision (graph-visualizer-old.md §13.1) to: inherited verbatim / reinterpreted / preserved as out-of-scope / new in this doc.

---

## 3. Decomposition — the component inventory

| Tier | Component | Category | Procomp doc status | Role |
|---|---|---|---|---|
| **1** (generic) | `properties-form` | forms | **signed off** | Schema-driven entity editor; mixed-permission rendering for system+user nodes |
| **1** | `detail-panel` | feedback | **signed off** | Selection-aware multi-state container; hosts properties-form via slots |
| **1** | `filter-stack` | forms | **signed off** | Composable filter UI (AND-across / OR-within); 4 built-in types + custom slot |
| **1** | `entity-picker` | forms | **signed off** | Searchable picker with kind badges; single + multi mode |
| **1** | `markdown-editor` | forms | **NOT STARTED** ← THIS IS NEXT | CodeMirror 6 wrapper with wikilink autocomplete + slot-able toolbar |
| **2** (graph) | `force-graph` | data | not started | The WebGL canvas (Sigma + graphology + FA2 worker). Phased v0.1–v0.6. |
| **3** (assembled) | (page, NOT a registry component) | — | — | `src/app/systems/graph-system/page.tsx` wires Tier 1 + Tier 2 |

**Critical rule (decision #35):** Tier 1 components are **independent at the component level** — none imports another at registry level. Composition happens only at host/Tier 3 via slot props. (E.g., `detail-panel` does NOT import `properties-form`; the host slots `properties-form` into `<DetailPanel.Body>`.)

**Per-phase plan-lock dependencies** ([§3.1 of system description](../docs/systems/graph-system/graph-system-description.md#L89)):
- `properties-form` + `detail-panel` plans → required for `force-graph` v0.3 plan
- `filter-stack` plan → required for v0.4 plan
- `markdown-editor` plan → required for v0.5 plan
- `entity-picker` is a utility; not a hard gate
- `force-graph` v0.1, v0.2, v0.6 compose zero Tier 1 — those plans can lock independently

---

## 4. What's been committed this session

Git log (most recent first):

```
47869dc docs(procomps/entity-picker): sign off description
d376f03 docs(procomps/entity-picker): draft v0.1 description
0c3fc41 docs(procomps/filter-stack): sign off description; reverse Q2, refine Q7
2d9d133 docs(procomps/filter-stack): draft v0.1 description
663ed66 docs(procomps/detail-panel): sign off description; refine Q6
1a05286 docs(procomps/detail-panel): draft v0.1 description
933c49f docs(procomps/properties-form): sign off description; revise Q2 + Q5
539d44f docs(procomps/properties-form): draft v0.1 description
7836c2e docs(systems/graph-system): sign off description
06a0892 docs(status): remove resolved VALID_CATEGORIES duplicate-source item
260d035 chore(scripts): derive VALID_CATEGORIES from types.ts (single source)
c2cfef6 docs(systems): introduce graph-system planning tier
cc44b55 feat(rich-card): ship v0.3 (structural mgmt) + v0.4 (safety net)
000169c feat: add workspace layout components and functionality (PRE-SESSION)
05c435e Initial commit from Create Next App (PRE-SESSION)
```

**What each session commit accomplished:**

- `cc44b55` — Cleared the rich-card backlog (v0.3 structural mgmt + v0.4 safety net) into git. ~50 files. STATUS.md described this work but it wasn't in git history before.
- `c2cfef6` — Introduced the `docs/systems/` tier with the graph-system description (37 decisions, ~620 lines), README for the tier, and `graph-visualizer-old.md` (the user's source spec).
- `260d035` + `06a0892` — Codegen fix: `VALID_CATEGORIES` in `scripts/new-component.mjs` now derived at runtime from `types.ts` ComponentCategorySlug union via regex. Eliminated the duplicate-source-of-truth issue.
- `7836c2e` — Signed off the system description after Q1–Q8 resolution (became locked decisions #28–#37).
- `539d44f` + `933c49f` — properties-form description drafted + signed off. Q2 (generic typing) + Q5 (error rendering) revised on review.
- `1a05286` + `663ed66` — detail-panel description drafted + signed off. Q6 (canEdit prop) refined to also expose in render-fn ctx.
- `2d9d133` + `0c3fc41` — filter-stack description drafted + signed off. Q2 (solo buttons) **reversed** from defer-to-v0.2 → ship-in-v0.1-as-opt-in; Q7 (isEmpty defaults) refined.
- `d376f03` + `47869dc` — entity-picker description drafted + signed off. No refinements; all 10 recommendations stood.

---

## 5. How we work — the iterative pattern

This session has settled into a tight pattern. Replicate it for `markdown-editor` and beyond:

### 5.1 Drafting a procomp description

1. **Read the system description** ([§8 locked decisions](../docs/systems/graph-system/graph-system-description.md#L362)) and any related procomp descriptions (signed-off Tier 1 docs).
2. **Pick the procomp slug + category.** Honor [decision #16](../docs/systems/graph-system/graph-system-description.md#L383) — `forms` is the new category for properties-form / filter-stack / entity-picker / markdown-editor; `feedback` for detail-panel.
3. **Create the folder** `docs/procomps/<slug>-procomp/`. Write `<slug>-procomp-description.md`.
4. **Follow the 9-section structure** (mirror the 4 signed-off Tier 1 descriptions):
   - Header block (Status, Slug, Category, Created, Owner, Parent system)
   - §1 Problem
   - §2 In scope (v0.1)
   - §3 Out of scope / deferred
   - §4 Target consumers (in dependency order)
   - §5 Rough API sketch
   - §6 Example usages (3 examples, including one showcase + one non-graph)
   - §7 Success criteria (numbered, measurable)
   - §8 Open questions (8–10, each with a recommendation)
   - §9 Sign-off checklist
5. **Reference cross-cutting constraints**: cite system decisions by number (e.g., "per [decision #35](...)") rather than re-arguing.
6. **Update [§9 sub-doc map](../docs/systems/graph-system/graph-system-description.md#L425)** with the new draft entry.
7. **Commit** with message format `docs(procomps/<slug>): draft v0.1 description`.

### 5.2 Sign-off pattern (always 2 commits per procomp: draft, then sign-off)

After drafting:

1. **Brief summary to the user** — what's in the doc, key design positions, the 8–10 questions in a table with my recommendations + impact rating.
2. **User says "validate" / "review" / "go ahead"** — proceed to step 3.
3. **Re-validate every recommendation** — go through each Q one by one looking for issues missed at draft time. Surface any refinements. (This pass has caught real problems on 3 of 4 procomps so far.)
4. **Apply locked decisions to §8** — convert from "Recommendation: X. Confirm." to "**Locked: X.** Reasoning..." Keep the section heading "Resolved questions (locked on sign-off YYYY-MM-DD)".
5. **Add §8.5 Plan-stage tightenings** — issues caught during review that aren't description-blocking but the plan must address.
6. **Update top status** — "**signed off YYYY-MM-DD.**" with last-updated note.
7. **Update sign-off checklist** — convert `- [ ]` to `- [x]`.
8. **Update §9 sub-doc map** in the system description — change "draft v0.1" link to "signed off YYYY-MM-DD".
9. **Commit** with message format `docs(procomps/<slug>): sign off description; <any refinements>`.

### 5.3 Recommendation style

The user values **decisive recommendations + impact analysis**:
- Don't list options without picking; pick a default with reasoning.
- For each open question, surface the trade-off + your recommendation + what changes downstream if revised later.
- Use tables for the open-question summary so the user can scan.
- Mark high-impact questions explicitly (the user prioritizes those for review).

### 5.4 Things the user has said yes to consistently

- Decomposition over monolith
- Phased delivery (rich-card precedent)
- Build-from-scratch state management when the surface is small (no RHF for properties-form)
- Native HTML inputs over heavy libraries when good enough (native date input v0.1; CodeMirror 6 only because markdown editor genuinely needs it)
- Pure controlled components (host owns state)
- Parameterized generics from v0.1 (don't defer typing strictness)
- Cross-component independence at registry level (Tier 1 doesn't import Tier 1)

### 5.5 Things to never do

- **Never import `next/*` from registry components** ([CLAUDE.md](CLAUDE.md)). Tier 3 page can; pro-components cannot.
- **Never hard-code colors.** Use CSS vars from [globals.css](../src/app/globals.css) ([decision #37](../docs/systems/graph-system/graph-system-description.md#L404)).
- **Never use Inter / Roboto / Geist / system-default fonts.** Onest + JetBrains Mono only.
- **Never use `git add -A`.** Stage specific paths.
- **Never skip hooks** (`--no-verify`, etc.). Investigate failures.
- **Never amend commits** — create new ones.
- **Never push to remote** without explicit user request.
- **Never run a Phase 0 risk spike in a single session** — it's 2 days of GPU benchmarking. Surface as separate work.

---

## 6. Concrete next step

**Author `markdown-editor-procomp-description.md`.**

Path: `docs/procomps/markdown-editor-procomp/markdown-editor-procomp-description.md`

This is the **last** Tier 1 procomp description. After it signs off, all 5 Tier 1 description-locks are in place and the `force-graph` description (Tier 2) is unblocked.

### 6.1 Critical constraints from the system description

- **[Decision #19](../docs/systems/graph-system/graph-system-description.md#L401)**: wraps **CodeMirror 6**. Wikilink autocomplete via custom CM6 extension. **NO building from scratch.** This is the only Tier 1 that uses an external library.
- **[Decision #20](../docs/systems/graph-system/graph-system-description.md#L402)**: toolbar is **slot-able**. Default toolbar ships; host can replace, extend, or hide via `toolbar` prop (render fn or config array, plan decides).
- **[Decision #30](../docs/systems/graph-system/graph-system-description.md#L412)**: **strict v0.1 scope** — CodeMirror 6 + standard toolbar + wikilink autocomplete + preview toggle. Slash commands, drag-drop image insertion, live wikilink hover preview deferred to v0.2+.
- **[Decision #26](../docs/systems/graph-system/graph-system-description.md#L408)**: ~150KB bundle weight is **accepted**. Markdown-editor will be the heaviest pro-component.
- **[Decision #36](../docs/systems/graph-system/graph-system-description.md#L418)**: wikilink reconciliation runs on doc save in `force-graph` v0.5+ (in addition to importSnapshot). The markdown editor itself just provides a save callback; reconciliation is handled by force-graph.
- **[Decision #35](../docs/systems/graph-system/graph-system-description.md#L417)**: Tier 1 independence applies — markdown-editor doesn't import other Tier 1 components.

### 6.2 Likely API surface

```ts
interface MarkdownEditorProps {
  value: string;                    // markdown content
  onChange: (value: string) => void;
  
  // Mode (analogous to other Tier 1 controlled components)
  readOnly?: boolean;               // default false
  
  // Wikilink support
  wikilinkCandidates?: ReadonlyArray<{ id: string; label: string; kind?: string }>;
  onWikilinkClick?: (target: string) => void;  // for preview-mode wikilinks
  
  // Toolbar
  toolbar?: ToolbarConfig | ((ctx: ToolbarCtx) => ReactNode);
  
  // Preview
  showPreviewToggle?: boolean;      // default true; off forces editor-only mode
  initialView?: "edit" | "preview" | "split";  // default "edit"
  
  // CM6 extension extension point (for power users)
  extensions?: ReadonlyArray<Extension>;
  
  // Lifecycle
  onSave?: (value: string) => void; // Cmd+S; force-graph v0.5 wires this to reconciliation
  
  className?: string;
  // ARIA
  ariaLabel?: string;
}
```

### 6.3 Likely open questions

- Toolbar config shape: array of action descriptors vs render fn vs both?
- Default keyboard shortcuts (Cmd+B / Cmd+I / Cmd+K for link / etc.)
- Edit vs Preview vs Split-view: how is split-view sized?
- Wikilink rendering in preview mode: clickable spans? Plain text with brackets?
- CM6 theming: derive from `globals.css` tokens or use CM6's theme API?
- Bundle weight discipline: import only the CM6 packages we need (don't pull in the whole `@codemirror/view` family)
- "Save" semantics — debounced auto-save vs explicit Cmd+S only?
- `wikilinkCandidates` shape — array of entities, or async resolver?
- Does the editor have its own undo/redo? (CM6 has it; do we expose it through an imperative handle?)

### 6.4 How to start

1. Read [docs/procomps/properties-form-procomp/properties-form-procomp-description.md](../docs/procomps/properties-form-procomp/properties-form-procomp-description.md) and [entity-picker-procomp-description.md](../docs/procomps/entity-picker-procomp/entity-picker-procomp-description.md) for the recent description style.
2. Read graph-system §3.1 (Tier 1 inventory) and the markdown-editor-related decisions (#19, #20, #26, #30, #36).
3. Note: `react-markdown` is NOT used (it's display-only; we need an editor). CodeMirror 6 + the standard markdown language package + a custom wikilink extension.
4. Draft the description following the §5 above pattern. Targets: ~400–500 lines, 8–10 open questions, 3 example usages including one outside the graph-system (e.g., a docs site README editor).
5. Commit `docs(procomps/markdown-editor): draft v0.1 description`.
6. Ask the user to validate. Re-validate when they say go-ahead. Sign off + commit.

---

## 7. After markdown-editor — the longer roadmap

Per [§9 of the system description](../docs/systems/graph-system/graph-system-description.md#L425), the order from here is:

1. **markdown-editor description** (in progress per §6)
2. **`force-graph` description** — Tier 2; with v0.1–v0.6 phasing baked in. Dependencies: original spec ([graph-visualizer-old.md](../graph-visualizer-old.md)) is the authoritative source for `force-graph` internals (custom WebGL programs, FA2 worker, hull math, multi-edge mechanics). The system description supersedes it for cross-cutting decisions only.
3. **`graph-system-plan.md`** — system-level Stage 2; gates on all per-procomp Stage 1 docs.
4. **Tier 1 plans** (5 of them) — author in parallel; force-graph phase needs determine priority (`properties-form` + `detail-panel` first for v0.3; `filter-stack` second for v0.4; `markdown-editor` third for v0.5).
5. **`force-graph` v0.1 plan** — depends on the v0.1 phase scope (no Tier 1 composition).
6. **Phase 0 risk spike** — 2-day technical research, INDEPENDENT of procomp gate. Build a prototype `DashedDirectedEdgeProgram` (custom Sigma WebGL edge program supporting solid+dashed × arrows × straight+curved). Test at 100k edge scale on integrated and discrete GPUs. Gate: ≥30 fps on integrated GPU. **If this fails, the entire system is replanned.** Should run in a focused work block, not crammed into a planning session.
7. **Implementation** (after plans) — start with `properties-form` + `detail-panel` (force-graph v0.3 dependencies), then v0.1 `force-graph` viewer-only.

---

## 8. Cross-cutting decisions to internalize

The 37 decisions in [system description §8](../docs/systems/graph-system/graph-system-description.md#L362) are all important. The ones that come up most often during procomp authoring:

- **#17 Origin field mandatory.** Every node + edge has `origin: "system" | "user"`. No defaults. Validates on `importSnapshot`.
- **#23 Mixed permission writability.** System nodes: canonical fields read-only, `annotations` writable. User nodes: everything writable. Permission resolver enforces.
- **#25 Permission resolver per-component v1.** Each component owns its own; shared `src/lib/permissions/` extracted only after rich-card AND force-graph both ship resolvers.
- **#33 Single `applyMutation` routing.** Annotations on system nodes route through `applyMutation` with a `setAnnotation` variant. NOT a separate `applyAnnotation` method.
- **#35 Tier 1 component independence.** Already cited above. The single most violated rule if you're not careful — it's tempting to import Tier 1 across components for "easy" composition.
- **#37 Design system mandate.** Already cited above.

The system's three usage modes (DB / personal / hybrid) are all the same code path. The `origin` field discriminates.

---

## 9. Things that are NOT in the registry

Worth knowing so you don't try to put them there:

- **The Tier 3 page** (`src/app/systems/graph-system/page.tsx`) — host code, not a registry component.
- **Source adapters (Kuzu, Neo4j, etc.)** — host code or separate companion packages. The registry component is generic over adapters.
- **Sigma container internals** — a `parts/` of `force-graph`, not a separate component.
- **Control sliders / advanced settings panel** — host-composed from shadcn primitives + an accordion. Not a pro-component.
- **A "graph database"** — we are a *client* of graph data, never a store.

---

## 10. Pitfalls I've already navigated this session

Things future sessions might re-discover and waste cycles on:

- **Edits to scripts/new-component.mjs containing ANSI escape characters fail** when the literal string in the Edit tool doesn't include the escape. I worked around this in commit `260d035` by editing in two smaller chunks that didn't span the ANSI-coded constants.
- **The original "6-chunk backlog commit" plan from decision #34 didn't match reality.** Most chunks were already in commit `000169c`. I revised to 2 commits and amended decision #34 in place with a footnote.
- **Markdown editor scope expansion vs. original spec.** The original v4 spec said v1 = read-only doc preview; we ship editing in `force-graph` v0.5 via the markdown-editor wrapper. This is documented as a deviation in [§11.5 of the system description](../docs/systems/graph-system/graph-system-description.md#L535).
- **`forms` category was already present** in `types.ts` / `categories.ts` / `new-component.mjs` pre-session. Decision #31's first half was already done; only the codegen fix needed work.

---

## 11. Files to read at session start, in order

If I'm a fresh Claude session about to continue this work, this is my reading order:

1. [.claude/CLAUDE.md](CLAUDE.md) (auto-loaded) — project conventions
2. [.claude/STATUS.md](STATUS.md) (auto-loaded) — live project state
3. **This file** ([.claude/HANDOFF.md](HANDOFF.md)) — session continuation context
4. [docs/systems/graph-system/graph-system-description.md](../docs/systems/graph-system/graph-system-description.md) — the master cross-cutting contract
5. [docs/systems/README.md](../docs/systems/README.md) — systems-tier governance
6. [docs/procomps/README.md](../docs/procomps/README.md) — procomp gate
7. [docs/component-guide.md](../docs/component-guide.md) — long-form component-build reference
8. The 4 signed-off Tier 1 descriptions (read in any order):
   - [docs/procomps/properties-form-procomp/properties-form-procomp-description.md](../docs/procomps/properties-form-procomp/properties-form-procomp-description.md)
   - [docs/procomps/detail-panel-procomp/detail-panel-procomp-description.md](../docs/procomps/detail-panel-procomp/detail-panel-procomp-description.md)
   - [docs/procomps/filter-stack-procomp/filter-stack-procomp-description.md](../docs/procomps/filter-stack-procomp/filter-stack-procomp-description.md)
   - [docs/procomps/entity-picker-procomp/entity-picker-procomp-description.md](../docs/procomps/entity-picker-procomp/entity-picker-procomp-description.md)
9. (Skim) [graph-visualizer-old.md](../graph-visualizer-old.md) — original v4 spec; authoritative for `force-graph` internals; system description supersedes for cross-cutting only.

After all that you'll have the full picture. Then start §6.4 (drafting markdown-editor description).

---

## 12. User pacing notes

The user has been:

- **Decisive** — short messages, direct decisions ("go ahead", "yes agreed", "all recommendations are agreed").
- **Iterative** — comfortable with draft → review → revise → sign off cycles. Doesn't try to lock everything up front.
- **Detail-tolerant for the right reasons** — willing to read 600-line docs if they're well-structured and decisional. Will push back if recommendations feel un-validated ("re-validate", "deeply review").
- **Schedule-respecting** — explicitly asked for a handoff before pausing the session. Treats long sessions as work blocks; expects clean continuation.

When in doubt, **be decisive with reasoning**. Don't surface every possible option — pick a default and explain why. The user values forward motion with reversible decisions over exhaustive deliberation.

---

*End of handoff. Pause here. Resume with §6.*
