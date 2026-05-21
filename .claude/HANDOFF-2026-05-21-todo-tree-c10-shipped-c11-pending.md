## Session pause — 2026-05-21 (todo-tree C1–C10 + v0.1.1 patch shipped; C11 GATE 3 pending)

> **Status at pause:** `todo-tree@v0.1.1` is **SHIPPED** to Vercel and consumer-installable via `pnpm dlx shadcn@4.6.0 add @ilinxa/todo-tree @ilinxa/todo-tree-fixtures`. C1–C10 of the plan §18 11-commit chain are complete. **Only C11 (GATE 3 spotcheck review + STATUS.md + decision file + component-versions.md) remains** to formally close the procomp per the readiness-review rule.
>
> **Tip:** `5aba0cd` — `fix(todo-tree): v0.1.1 — F-cross-13 hit on Checkbox.onCheckedChange`
>
> **Active handoffs prior to this:** [2026-05-20 todo-tree C1 scaffold pause](HANDOFF-2026-05-20-todo-tree-c1-scaffold-pause.md) → resumed and fully drained in this session.

---

### What shipped this session

48 component files (+ 1 fixtures file) implementing the locked GATE 1 + GATE 2 surface, then patched to v0.1.1 after the F-cross-11 path-b smoke surfaced one F-cross-13 hit. Full commit chain `aa623a0 → 5aba0cd`:

| # | Commit | Scope |
|---|---|---|
| C1 | `aa623a0` | scaffold + type catalog + manifest entry *(pre-session)* |
| C2 | `974ea03` | lib/ — 14 pure functions (reducer + tree ops + pipeline) |
| C2-fix | `0582614` | reference-equality + SELECT_REPLACE action + drop reducer's computeVisibleItems |
| C3 | `d3e974b` | hooks/ — 7 hooks (state + controlled-mode + selection + events + utils) |
| C3-fix | `8296241` | onChange reason routing + echo skip + selectItem semantics + useSelection fire-routing |
| C4 | `1bdb77e` | parts/ row primitives (chevron + status + checkbox + name + description + person + row-content) |
| C4-fix | `71816d1` | chevron click bubble + dead Tailwind padding cleanup |
| C5 | `5d98835` | list + virtualization + host wiring (TodoTreeStateContext + TodoTreeRenderContext provider chain) |
| C6 | `5623450` | Dual DnD — @dnd-kit grip + HTML5 cross-procomp + edge-zone + circular-drop ban + reason-tracking refactor (lastChangeReason in State) |
| C6-fix | `9454698` | same-tree HTML5 drop noop + touch grip visibility |
| C4-C6 sweep | `2156c9d` | wire renderRow + renderDragOverlay slots (gap caught in cross-commit review) |
| C7 | `c99fc3f` | toolbar — 6 parts (search + sort + filter-active + filter + bulk-action-bar + composer); F-cross-13 pre-emption at Select.onValueChange |
| C7-fix | `0e60ab7` | bulk action buttons invoke handle methods (UX fix) |
| C8 | `b3a0392` | keyboard nav + a11y + empty state (SET_FOCUS action + focusedItemId on state) |
| C8-fix | `bb4e28b` | bail in interactive targets + Enter fires onItemClick (TodoTreeItemEvent.event widened to MouseEvent \| KeyboardEvent) |
| C9 | `032110b` | TodoTreeWithEditor wrapper + demo (7 sub-demos) + usage (8 sections) + meta.ts final pass |
| C9-fix | `0845c74` | wrapper transparency (drop owned items state) + callback-ref forwarding (replaces frozen useImperativeHandle) |
| C10 | `f3d4f94` | registry.json base (48 files) + fixtures (1 file) + pnpm registry:build → artifacts public/r/todo-tree.json (183KB) + todo-tree-fixtures.json (4.2KB) |
| v0.1.1 | `5aba0cd` | F-cross-13 hit on Checkbox.onCheckedChange (= "indeterminate" check failed Base UI's narrower boolean signature) — typeof guard fix |

### Surface shipped

- 21 reducer actions / 26 handle methods / 16 event names / 8 slot props / 9 shadcn primitives / 3 npm peer deps (lucide-react + @dnd-kit/core + @tanstack/react-virtual) / 1 cross-registry internal dep (todo-rich-card).
- `<TodoTree>` main component + `<TodoTreeWithEditor>` convenience wrapper + `useTodoTreeState` headless hook + full TypeScript types.
- Full plan §16 WAI-ARIA tree pattern (role=tree + role=treeitem + aria-level + aria-expanded + aria-selected + aria-multiselectable + tabindex management).
- Dual DnD (@dnd-kit grip for internal moves with Mouse 5px + Touch 300ms long-press + Keyboard sensors; HTML5 dataTransfer for cross-procomp drops with todo-rich-card via shared `application/x-ilinxa-todo+json` MIME).
- Virtualization auto-enables at ≥200 rows; auto-suspends during drag (R7).
- Three-defenses controlled-mode pattern fully wired (microtask defer + structural resync guard + isDraggingRef mid-drag bail).

### F-cross-11 path-b smoke result

Ran twice (post-C10 → 1 F-cross-13 hit → v0.1.1 patch → re-smoke clean).

```
Initial smoke (v0.1.0):
  src/components/todo-tree/parts/todo-tree-checkbox.tsx(37,23):
    error TS2367: This comparison appears to be unintentional because
    the types 'boolean' and 'string' have no overlap.

Re-smoke after v0.1.1 (5aba0cd):
  0 todo-tree errors.
```

Pre-existing consumer-side errors in code-block (TooltipProvider.delayDuration) + flow-canvas-01 (@xyflow/react missing) + json-form (react-hook-form/zod missing) + pdf-viewer (peer deps not installed) flagged as out-of-scope per memory's smoke baseline.

**F-S1 verified clean** — `../todo-rich-card/types`, `../../todo-rich-card/types`, and `../todo-rich-card/todo-rich-card` relative paths all preserved verbatim by shadcn rewriter. THIRD same-category cross-procomp ship to pass F-S1 → memory updated with the lock as battle-tested project default.

---

## Git state at pause

```
On branch master
Tip: 5aba0cd  fix(todo-tree): v0.1.1 — F-cross-13 hit on Checkbox.onCheckedChange

Working tree: clean (after `git checkout -- src/app/components/[slug]/_lib/source-map.generated.ts`
                   if it shows modified — that's auto-regen from pnpm build/registry:build)
```

**All 19 commits pushed to origin/master.** Vercel auto-deployed v0.1.1 (`https://ilinxa-proui.vercel.app/r/todo-tree.json` reflects the fix).

## Verification at pause

```
pnpm tsc --noEmit                  → 0 errors
pnpm lint                          → 0 errors for todo-tree (3 pre-existing virtualizer warnings: file-tree + file-manager + todo-tree)
pnpm validate:meta-deps            → 45/45 clean
pnpm build                         → succeeds, 46 component routes (was 45 before todo-tree promoted to shipped — actually 45 + 1 docs route stays 45 in catalog)
pnpm registry:build                → public/r/todo-tree.json + todo-tree-fixtures.json regenerated
F-cross-11 path-b smoke (re-run)   → 0 todo-tree errors
```

---

## Pending work on resume — C11 only

### C11 — GATE 3 spotcheck + STATUS + tracking

Per [`.claude/rules/component-readiness-review.md`](rules/component-readiness-review.md) — every v0.1.0 first-ship must pass a structured spotcheck review BEFORE the component is considered "closed" per the rule. todo-tree is v0.1.1 (one patch already shipped) but still pre-GATE-3.

**Work items:**

1. **Author `docs/procomps/todo-tree-procomp/reviews/2026-05-21-v0.1.1-spotcheck.md`** using [`docs/reviews/templates/review-spotcheck.md`](../docs/reviews/templates/review-spotcheck.md) — 5 dimensions (4 fixed core + 1 rotating).

   **Fixed core** (always covered):
   - Procomp planning docs (description + plan + guide — note guide.md doesn't exist yet; either author it or document the gap)
   - Registry distribution (live endpoint resolves; targets follow locked convention; demo/usage/meta NOT shipped — verify by inspecting `public/r/todo-tree.json` items)
   - Meta + manifest sync (version 0.1.1 + status alpha + STATUS.md row honest)
   - Verification (tsc + lint + build clean; F-cross-11 path-b smoke ran clean)

   **Rotating dimension recommendation** — **Public API**. Largest surface in the project (26 handle methods + 8 slot props + 16 events + 21 reducer actions). The F-cross-12 callback-shape lessons + the in-flight Permissions-not-wired gap (see findings below) are the highest-signal axes to audit. Alternative rotating dims: Robustness (edge cases — what happens on circular-drop, on items[] === [], on very deep trees, on focused-id pointing at nothing), or Accessibility (the WAI-ARIA tree pattern is dense and worth a careful pass).

   **Expected verdict**: `Pass with follow-ups`. The implementation is solid but several documented gaps (below) make a clean `Pass` unrealistic.

2. **Author the procomp guide** at `docs/procomps/todo-tree-procomp/todo-tree-procomp-guide.md`. The plan + description docs exist (GATE 1 + GATE 2 signed off in the prior session); the consumer-facing guide is the third doc that traditionally lands with implementation. **Not yet authored.** Optional for spotcheck pass (template's "Procomp planning docs" dimension would dock this as a finding) — could either author now OR ship as a v0.1.2 follow-up. **Recommendation:** author it during C11 since the implementation is fresh.

3. **Update STATUS.md row + Recent activity pointer**:
   - Components table row: `todo-tree | data | alpha | 0.1.1` (currently `0.1.0-scaffold (C1)`).
   - Banner: shipped state.
   - Recent activity list — add link to new decision file.
   - 45 → 45 (todo-tree already counted; just promotes from scaffold to shipped).

4. **Author decision file** at `.claude/decisions/2026-05-21-todo-tree-v0.1.0-and-v0.1.1-first-ship.md` with YAML frontmatter per [`.claude/decisions/README.md`](decisions/README.md):
   ```yaml
   ---
   date: 2026-05-21
   session: <id>
   phase: ship
   type: feature + patch
   commits: aa623a0..5aba0cd  # entire C1-C10 + v0.1.1
   components: [todo-tree]
   findings: [F-cross-13 carrier expansion to Checkbox.onCheckedChange]
   status: shipped
   ---
   ```

5. **Update `docs/component-versions.md`** with todo-tree v0.1.1.

6. **Commit + push**: single commit `chore(todo-tree): C11 — GATE 3 spotcheck + tracking + status`.

### Standing findings to address (all visible during spotcheck)

These were surfaced during in-session audits but deferred. C11 spotcheck can either close them as v0.1.2+ candidates OR fix in-place:

- **F-perm (Medium)** — Permissions prop integration is a project-wide gap. `TodoTreeProps.permissions` is declared but not threaded through `useTodoTreeState` or `useTreeKeyboard`. Keyboard Space (toggleActive) and Delete (removeItem) bypass `canToggleActive` / `canRemoveItem` predicates. Same gap exists for C6's DnD hooks (`canDropIntoChildren` / `canDropAsSibling` props on `useTreeDndInternal` are never wired from the host). Either wire end-to-end in a v0.1.2 patch OR document as a deliberate "advanced consumers gate at affordance level" choice.
- **F-event (Low)** — The Enter handler now fires onItemClick via the widened `TodoTreeItemEvent.event = MouseEvent | KeyboardEvent` union. Verify the C8-fix didn't break any existing call sites (the in-session check passed tsc but a render walkthrough would surface UX edge cases).
- **F-grip-clip (Cosmetic)** — Grip is `absolute -left-4`; may clip against narrow containers. Cosmetic; consumer-side padding mitigates.
- **F-html5-edge (Doc)** — External HTML5 drops always land as last child of the over row (no edge-zone for HTML5; only @dnd-kit gets top/middle/bottom). Document in usage if not already.
- **F-stray-docs (Repo hygiene)** — `0e60ab7` swept in unrelated `README.md` + `docs/component-guide.md` + `public/llms.txt` edits via `git add -A`. The doc additions are real content (Tailwind v4 prerequisites docs) but rode under a todo-tree commit. Acknowledge in spotcheck; no fix needed (additions are useful).

### Standing design choices (documented during in-session audits)

- **D-reducer-state** — `State.lastChangeReason` written by reducer wrapper; raw-dispatch consumers route correct reason to onChange.
- **D-handle-row-click** — `TodoTreeStateValue.handleRowClick` added (additive on locked type).
- **D-event-union** — `TodoTreeItemEvent.event` widened to `MouseEvent | KeyboardEvent`.
- **D-permission-mapping** — Tree-only action codes `dropAsSibling` → `drag` rule key; `dropIntoChildren` → `addChildren` rule key (permissions.ts).
- **D-echo-guard** — `treesMatchStructurally` only checks (id, name, status, active, children) per plan §11. External value-only mutations to other fields silently dropped as echoes — plan-locked tradeoff.
- **D-grip-absolute** — see F-grip-clip above.

---

## Pre-resume reading list

Before starting C11, re-read:

1. **[`.claude/rules/component-readiness-review.md`](rules/component-readiness-review.md)** — the GATE 3 rule + what "close" means.
2. **[`docs/reviews/templates/review-spotcheck.md`](../docs/reviews/templates/review-spotcheck.md)** — the spotcheck template structure.
3. **[`docs/procomps/todo-rich-card-procomp/reviews/2026-05-20-v0.1.0-spotcheck.md`](../docs/procomps/todo-rich-card-procomp/reviews/2026-05-20-v0.1.0-spotcheck.md)** — closest precedent (same-day v0.1.0 + v0.1.1 ship with F-cross-13 hit; mirror its structure).
4. **[`.claude/decisions/2026-05-20-todo-rich-card-v0.1.1-f-cross-13-fix.md`](decisions/2026-05-20-todo-rich-card-v0.1.1-f-cross-13-fix.md)** — the same-day F-cross-13 fix decision pattern.
5. **The plan + description docs** at `docs/procomps/todo-tree-procomp/`.

## Resume checklist

```
[ ] 1. git status — confirm working tree clean (only auto-regen files like source-map.generated.ts may differ harmlessly)
[ ] 2. pnpm tsc --noEmit + pnpm validate:meta-deps + pnpm lint — confirm baseline clean
[ ] 3. Read the 5 docs above
[ ] 4. (Optional but recommended) Author docs/procomps/todo-tree-procomp/todo-tree-procomp-guide.md — consumer-facing usage notes, mirrors the structure of todo-rich-card-procomp-guide.md
[ ] 5. Run the GATE 3 spotcheck review per the readiness-review rule. Rotating dim recommended: Public API. Author at docs/procomps/todo-tree-procomp/reviews/2026-05-21-v0.1.1-spotcheck.md.
[ ] 6. Update STATUS.md (Components table row + banner + Recent activity).
[ ] 7. Author decision file at .claude/decisions/2026-05-21-todo-tree-v0.1.0-and-v0.1.1-first-ship.md.
[ ] 8. Update docs/component-versions.md.
[ ] 9. Single commit + push: `chore(todo-tree): C11 — GATE 3 spotcheck + tracking + status`.
[ ] 10. Mark this handoff historical in STATUS.md after C11 commits.
```

---

## State of the surrounding world

- **Components total: 45** across 8 categories. todo-tree is now SHIPPED (was scaffold). 44 other components unchanged.
- **Active queue:** 7/8 progress (pdf-viewer + file-tree + file-manager + code-block + json-form + todo-rich-card + **todo-tree**); 1 remaining when todo-tree formally closes (notification-system; chat-panel was in the original queue but I don't have evidence it's still in queue post-todo-tree). Verify with [`.claude/STATUS.md`](STATUS.md) Active queue § on resume.
- **Sibling procomp** to todo-tree: `todo-rich-card-in-flow` (flow-canvas-01 adapter mirroring rcif's shape) still queued for its own ship cycle — no GATE 1 doc yet.
- **F-cross-13 carrier list grew by 1** this session: `Checkbox.onCheckedChange` (alongside `Select.onValueChange` + `TooltipProvider.delayDuration`). Memory updated.
- **F-S1 lock** confirmed battle-tested across 3 procomps (json-form + rcif + todo-tree). Memory updated.
- **No new open project-wide decisions** beyond the F-perm gap noted above.

## Memory locations
- `MEMORY.md` index (truncates at 200 lines)
- Updated this session: `project_shadcn_primitive_radix_baseui_divergence.md` (added Checkbox to F-cross-13 carrier list)
- Updated this session: `project_cross_procomp_imports.md` (F-S1 third confirmation)

This handoff captures everything a fresh session needs to land C11 without re-discovering the design decisions. Mark historical in STATUS.md after C11 commits.
