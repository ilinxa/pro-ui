# Phase 4 plan — close F-cross-01 (4 missing-guide carriers + data-table all 3)

> **Author:** sweep session 7b · **Target:** session 7c (and possibly 7d)
>
> **Phase 4 origin:** the Phase decomposition (1-6) is defined in [`.claude/HANDOFF-sweep-paused-session-7.md`](HANDOFF-sweep-paused-session-7.md) §"Session 7b plan". Master plan ([`~/.claude/plans/now-as-we-have-snazzy-raccoon.md`](file:///C:/Users/AsiaData/.claude/plans/now-as-we-have-snazzy-raccoon.md)) §7 covers session 7 as "mid-sweep checkpoint" — the per-Phase split below the checkpoint level lives in the handoff.
>
> **Scope summary:** 4 Tier 1 components need procomp documentation work. 3 of them (markdown-editor, properties-form, entity-picker) are missing only the guide. data-table is missing all three docs (description + plan + guide). **6 documents total**, ~8.5 focused hours.

---

## 1. Why Phase 4 exists

Two cross-cutting findings drive this phase:

- **F-cross-01 (⚠️ High, open)** — the 3 forms components shipped without guides. The Tier 1 dimension closes when those land.
- **data-table v0.1 review F-01 (⚠️ High)** — the canonical sealed-folder reference fails its own framework's Dimension 1 gate. This is a "physician, heal thyself" embarrassment for the review system; it has to land alongside the guides.

Detail-panel + filter-stack also lack guides but are **deferred** to their Tier 2 reviews (sessions 8 + 12) per master plan.

---

## 2. Scope — 6 documents

| # | Component | Doc | Existing scaffolding | Notes |
|---|-----------|-----|----------------------|-------|
| 1 | data-table | description.md | none | Smallest API surface (typed table + column accessors); shortest description target |
| 2 | data-table | plan.md | none | Flat, no `parts/` / `hooks/` — "simple primitive" pattern reference (per review-guide §3) |
| 3 | data-table | guide.md | none | Composition-focused; how to build sortable / paginated / virtualized tables on top |
| 4 | markdown-editor | guide.md | description 382L + plan 1273L | Heaviest component, but guide targets ~400L (consumer-surface only — does NOT scale with plan length; plan covers internal architecture which the guide skips) |
| 5 | properties-form | guide.md | description 274L + plan 584L | Schema-driven form usage patterns; guide ~300-350L |
| 6 | entity-picker | guide.md | description 277L + plan 774L | Picker mode-aware typing + multi-mode chip cluster; guide ~300-350L |

### Out of scope for Phase 4

- **article-body-01** — already has all 3 docs; nothing to author
- **kanban-board-01, rich-card, flow-canvas-01, workspace** — Tier 1 components with complete doc trios
- **detail-panel** guide → session 12 (Tier 2 review)
- **filter-stack** guide → session 8 (Tier 2 review)
- **Tier 2 spot-check guides** — by review-process design, Tier 2 spot-checks don't author guides
- **API changes** to any of the 4 components — Phase 4 is documentation-only

---

## 3. Reference template — workspace guide

Per `HANDOFF-sweep-paused-session-7.md` Phase 4 step 6: "Use the workspace guide as the structural template."

Workspace guide section structure (291 lines; the structural target):

```
# `<slug>` — Pro-component Guide (Stage 3)
## When to use <Component>
## When NOT to use <Component>
## The five-minute walkthrough
## The mental model
## Composition patterns
  ### Pattern 1: ...
  ### Pattern 2: ...
  (3-5 patterns typical)
## Gotchas
  ### <subsection per gotcha>
  (5-8 gotchas typical)
## Common operations cookbook
  ### <subsection per recipe>
  (3-5 recipes typical)
## Known limitations / deferred to v0.X
## Migration notes
## Open follow-ups
## Reference
```

**Tone:** consumer-facing — "you are using this component, here's how". Not a spec. Not architecture. Not implementation rationale (those live in description + plan). Code examples are TS/TSX you can paste; gotchas are concrete failure modes the reader will hit; cookbook is recipes.

---

## 4. Authoring order

Sequence is deliberate — easier ramp-up, then larger surface, leaving the heaviest for last when the pattern is locked.

### 4.1 First — data-table trio (~3h)

data-table is the smallest API in the project; it sets the bar quickly. Authoring its description + plan + guide together also lets us embody the "simple primitive" pattern that review-guide §3 now references (post Phase 5 commit `153949c`).

Sub-order:
1. **description** (~30 min) — what & why; <DataTable> as the foundational primitive
2. **plan** (~60 min) — file shape (flat), API surface, no host-pattern parts
3. **guide** (~90 min) — sortable / paginated / virtualized composition recipes (the hosting components are NOT in this registry yet, so we describe the integration patterns)

Reference these existing forms-component triples as structural mirrors:
- description: shape mirrors the ~400-line workspace-description structure
- plan: shape mirrors the ~400-line workspace-plan structure (skip §3 architecture sub-sections that don't apply to a flat primitive)
- guide: shape mirrors the workspace-guide

### 4.2 Then — 3 forms guides (~5h)

In rough order of complexity (simplest → heaviest):

1. **properties-form-procomp-guide.md** (~90 min)
   - Source: 1273-line plan, 382-line description
   - Heaviest section: Composition patterns (renderer slots, layered permission resolver, schema-driven field types)
   - Cookbook: validation pipeline recipes, custom field renderer wiring, async submit + spinner
   - Gotchas: dirty tracking; first-error focus; sync-only validation

2. **entity-picker-procomp-guide.md** (~90 min)
   - Heaviest section: Composition patterns (single vs multi mode; mode-aware value typing via overloads; custom triggers; chip cluster)
   - Cookbook: kind badges; custom render slots; controlled-or-uncontrolled open
   - Gotchas: id-set selection equality; `<div role="button">` trigger rationale; `setState`-as-callback-ref (cite Phase 5's plan §6.3 note)

3. **markdown-editor-procomp-guide.md** (~120 min — heaviest)
   - Heaviest sections: Composition patterns (toolbar customization with `defaultMarkdownToolbar` spread; wikilink candidate prop; view modes); Common operations cookbook (extending CM6 via `extensions` prop with Prec.high; `getView()` escape hatch; `onSave` integration)
   - Gotchas: empty-string label sentinel for separators (cite Phase 5 plan §3.1 update); `getView() | null` pre-mount; reference-stability for wikilinkCandidates; `Cmd+S` only `preventDefault`s if handler is supplied; bundle ≤180KB
   - Migration notes: none (v0.1.0 first ship)

---

## 5. Per-doc method (every guide follows this)

Five steps, ~30-60 minutes each:

1. **Read the existing description + plan + meta.ts features list.** Build a mental model. Stop when you can write the "five-minute walkthrough" cold.

2. **Read `<slug>.tsx` + `parts/*` + `hooks/*` + `index.ts` exports.** This locks what's actually in the public surface vs internal. The guide cites only public exports.

3. **Spot-check `demo.tsx` + `usage.tsx`.** They contain working examples; the guide's recipes pull from there (or extend them).

4. **Author the guide.** Section-by-section per the workspace template. Aim for ~250-400 lines (workspace = 291). Don't pad.

5. **Verify** — read top-to-bottom for cross-doc consistency:
   - guide doesn't claim features the component doesn't have
   - guide doesn't contradict the plan
   - cited public-API exports exist in `index.ts`
   - imperative-handle methods listed match the actual `useImperativeHandle` set
   - import paths in code snippets are consumer-side (`@/components/<slug>`), not producer-side
   - section anchors used in cross-references resolve

   Note: markdown docs do NOT go through `pnpm tsc --noEmit` or `pnpm lint` — MDX is not wired up per CLAUDE.md gotchas, so .md files are static text from the build's perspective. Visual review is the verification. The only mechanical check is that any referenced exports exist; do that with a quick `grep` per export name in the slug folder's `index.ts`.

---

## 6. Integration with sweep tracker

For each completed doc, update sweep-tracker.md:

- F-cross-01 status cell: count down carriers (Tier 1 closes at 0; the 2 Tier 2 carriers stay until sessions 8/12)
- Per-component Tier 1 row: clear the "F-02 missing guide" bullet from the Notes column
- data-table Tier 1 row: clear the "F-01 NO procomp docs" bullet entirely

When all 4 land:
- F-cross-01 → "Open — Tier 1 closed; 2 Tier 2 carriers remain (detail-panel s12, filter-stack s8)"
- Add a session log row "7c — Phase 4 (4 guides + 3 data-table docs)"

If Phase 4 splits across 7c + 7d (likely), commit per-component (one commit per doc OR one commit per component for the data-table trio).

---

## 7. Commit strategy

Per the project's small-focused-commit convention (mirrors session 7's per-F-cross commits):

- **Commit per doc**: 6 commits (data-table-description, data-table-plan, data-table-guide, markdown-guide, properties-guide, entity-guide)
- OR **commit per component**: 4 commits (data-table all-3-docs as one, then 1 per forms guide)

Recommend **per-component**: 4 commits. data-table's three docs are mutually consistent and ship as a unit; the forms guides each stand alone.

Tracker update lands as a separate commit at the end (mirrors session 7 pattern: fix → tracker).

---

## 8. Time budget

| Block | Estimate |
|---|---|
| data-table description | 0.5h |
| data-table plan | 1.0h |
| data-table guide | 1.5h |
| properties-form guide | 1.5h |
| entity-picker guide | 1.5h |
| markdown-editor guide | 2.0h |
| Tracker + sign-off | 0.5h |
| **Total** | **8.5h** |

This realistically does NOT fit in one session for context-window reasons. Recommend split:

- **Session 7c (~5h):** data-table trio + properties-form guide (the simplest 4 docs)
- **Session 7d (~3.5h):** entity-picker guide + markdown-editor guide + tracker + sign-off

If Phase 6 (sign-off + STATUS.md) gets bundled into 7d, it becomes 7d (~5h total).

---

## 9. Success criteria

- [ ] data-table has description + plan + guide; all link from `docs/procomps/data-table-procomp/`
- [ ] markdown-editor / properties-form / entity-picker each gain a `<slug>-procomp-guide.md`
- [ ] All 6 new docs have `pnpm tsc --noEmit && pnpm lint` clean (no broken TSX snippets)
- [ ] sweep-tracker F-cross-01 status updated; data-table row's F-01 cleared
- [ ] Per-component v0.1 review files NOT touched (frozen historical record per convention)
- [ ] No code changes — docs only (with the one exception of fixing a doc snippet that turned out to be wrong, which would be a v0.1.2 patch)

---

## 10. Pitfalls to avoid

These are non-obvious things the docs-authoring work could trip on:

1. **Don't re-litigate API choices in the guide.** Description + plan locked them. Guide describes how to USE them. If you find yourself writing "we should have done X", that's a v0.2 plan note, not a guide.

2. **Don't duplicate the description.** A guide reader is a consumer who already decided to use the component. Skip the marketing.

3. **Don't author "internal architecture" sections in the guide.** Plan owns architecture. Guide stays at the public-API surface.

4. **Cite by exported name, not file path.** `import { DataTable } from "@/components/data-table"` not `src/registry/components/data/data-table/data-table.tsx`. The consumer's install puts it at `@/components/<slug>/`, per the locked target convention.

5. **Cookbook recipes must compile.** Test snippets in your head; a broken `import` in a guide reads as un-careful authoring.

6. **Reference-stability footgun is universal — surface it once per guide.** All 4 components have hosts that pass arrays/objects as props (columns / candidates / items / fields). React Compiler memoizes JSX-literal arrays in-repo, but NPM consumers without it must memoize manually. Lift to module scope OR `useMemo`. workspace guide §"State preservation" is the model.

7. **F-cross-08 is closed but `process.env.NODE_ENV` is still rare in shipped code.** Don't suggest it as a pattern in guides unless the component genuinely uses it (entity-picker, properties-form, markdown-editor do; data-table doesn't). Cite the entity-picker plan §12.5 #5 precedent if mentioned.

8. **Don't promise Tier 2 inheritance.** "filter-stack composes entity-picker" is fine to mention but the FILTER-STACK guide doesn't exist yet — link to detail-panel / filter-stack as `related` in meta.ts but don't write recipes that depend on those sibling components having authoritative docs.

---

## 11. After Phase 4

Phase 6 (sign-off) becomes the natural close. STATUS.md decision (option b: split STATUS-archive.md first, then add session 7b/c/d Recent-decisions line) waits until Phase 4 lands so that line covers the full picture. Final sweep-tracker close + Tier 2 sessions 8-12 begin.

---

## 12. Quick-start for session 7c

When resuming:

1. Read this plan top-to-bottom (~3 min).
2. Read `docs/procomps/workspace-procomp/workspace-procomp-guide.md` cover-to-cover (~10 min) — this is your structural template.
3. Read `docs/procomps/data-table-procomp/reviews/2026-05-08-v0.1.0-review.md` F-01 — the original framing of "all three docs missing".
4. Start with **data-table description.** Sub-section structure mirrors workspace-description's 12 numbered sections, scaled to the smaller surface.
5. Commit per-component (4 commits). Push at end of session 7c.

If session 7c context runs out before all 4 components land, write a STARTER-PROMPT-session-7d.md that points at this plan + which docs are still open.
