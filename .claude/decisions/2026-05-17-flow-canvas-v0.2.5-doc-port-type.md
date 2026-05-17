---
date: 2026-05-17
type: feat
commits: [acf2a67]
components: [flow-canvas-01]
findings: []
status: shipped
---

# flow-canvas-01 v0.2.5 — built-in `"doc"` port type (Workstream A of rich-card-in-flow v0.2.0 plan)

## Summary

`flow-canvas-01@v0.2.5` adds a sixth built-in port type to `defaultPortTypes`:

```ts
{ id: "doc", color: "var(--chart-3)", label: "Doc" }
```

This is **Workstream A** of the rich-card-in-flow v0.2.0 port-editor plan signed off 2026-05-17 (GATE 2 closed in commit `55c7d82`). It exists purely as the upstream prerequisite for Workstream B (rcif v0.2.0's `PortEditorStrip` — see [`.claude/decisions/2026-05-17-rich-card-in-flow-v0.2.0-port-editor.md`](2026-05-17-rich-card-in-flow-v0.2.0-port-editor.md)). The editor's type-picker offers `defaultPortTypes` (Q5-bis deferred custom-port-type registration in the picker to v0.3) and needs `"doc"` as one of the built-ins so consumers can attach doc ports to cards / subcards without registering a custom palette.

Single-line code change. No public API touch beyond the new array entry. **Patch-bump exemption** per the readiness-review rule — additive, non-breaking, no public-API-touch-of-existing — **GATE 3 skipped**; the v0.2.0 spotcheck verdict carries forward.

### Release notes

> **Patch bump.** `@ilinxa/flow-canvas-01@v0.2.5` (alpha) — adds `"doc"` to the built-in `defaultPortTypes` palette (color: `var(--chart-3)` teal, label: `"Doc"`). Used by `@ilinxa/rich-card-in-flow@v0.2.0`'s opt-in `PortEditorStrip` for the `doc` port-type category.
>
> **No runtime behavior change.** Doc-port side enforcement (force `bottom` side) is editor-side ONLY — implemented in rcif's PortEditorStrip, NOT in flow-canvas-01. Consumers wiring doc-ports without the editor can route them to any side via their own UI. This preserves flow-canvas-01's portType-neutral runtime contract.
>
> **No consumer install action required for existing apps.** The new entry is appended to `defaultPortTypes`; consumers who override `portTypes` via the prop see no change. Consumers using `defaultPortTypes` gain `"doc"` as a valid `port.type` value.

## Files

### A1 commit (`acf2a67`)

| File | What |
|---|---|
| `src/registry/components/data/flow-canvas-01/registries/port-type-registry.ts` | `defaultPortTypes` array gains `{ id: "doc", color: "var(--chart-3)", label: "Doc" }` as the 6th entry (after `event`). Source comment updated with doc-port line explaining the editor-side-only side enforcement. |
| `src/registry/components/data/flow-canvas-01/meta.ts` | Version `0.2.4 → 0.2.5`; `updatedAt: 2026-05-17`. Status remains `alpha`. No dep changes; no features array change (built-in palette additions don't need a feature line). |
| `public/r/flow-canvas-01.json` | Regenerated via `pnpm registry:build`. Artifact spot-checked: the `defaultPortTypes` array in `port-type-registry.ts` source carries the new entry as expected. |

## Verification

- `pnpm tsc --noEmit` — clean
- `pnpm lint` — 0 errors (2 pre-existing virtualizer warnings unchanged)
- `pnpm validate:meta-deps` — 43/43 clean (no dep changes)
- `pnpm registry:build` — clean; artifact spot-checked
- `pnpm build` — verified clean in final pre-push verification pass (43 routes including `/components/flow-canvas-01`)

## Why patch-bump and not minor

The change is **strictly additive to a built-in palette consumers override via prop**. Three criteria the readiness-review rule's `alpha → beta` and `minor` triggers screen for:

1. **Public API surface change?** No. `PortType` type unchanged; `defaultPortTypes` is exported as a `PortType[]` array — consumers iterate it, length-agnostic.
2. **Behavior change for existing consumers?** No. Existing consumers using `defaultPortTypes` get `"doc"` as a new valid `port.type` value they didn't previously have access to — but they wouldn't be using it. Consumers overriding `portTypes` see zero change.
3. **Status promotion?** No. `flow-canvas-01` stays `alpha` (controlled-mode saga closed in v0.2.4; v0.2.5 doesn't change the stability posture).

Per the rule's "Patch bump (v0.1.x → v0.1.y non-breaking, no public-API touch) — NOT required" row, GATE 3 is explicitly skipped. The previously-passed v0.2.0 spotcheck verdict (Pass with follow-ups, see [reviews/2026-05-16-v0.2.0-spotcheck.md](../../docs/procomps/flow-canvas-01-procomp/reviews/2026-05-16-v0.2.0-spotcheck.md)) carries forward.

## Rationale points worth keeping

**Why `var(--chart-3)` teal?** The 5 existing port types covered grey / lime / emerald / blue / cyan; teal (`--chart-3`) was the unused slot in the chart palette and reads as "document"-adjacent semantically (think Notion / Confluence's link-to-doc accent). Consumers can override via the `portTypes` prop if they want a different color.

**Why editor-side-only side enforcement?** The flow-canvas-01 runtime stays **portType-neutral** — no port type is special-cased in the canvas (no hardcoded "doc ports must be bottom" logic in `canvas.tsx` or `node-shell.tsx` or `default-edge.tsx`). The enforcement lives in rcif's PortEditorStrip via the auto-correct in `handleTypeChange` and disabled `<SelectItem>`s for non-`bottom` side options when type=`doc`. This means consumers can use `flow-canvas-01` WITHOUT the editor and still route doc-ports to any side via their own port-management UI. Rationale: keeps the host agnostic + lets future consumers experiment with alternative doc-port layouts before any opinion gets baked into the host. (Q-O1 lock from rcif v0.2.0 GATE 1.)

**Why ship as v0.2.5 instead of folding into rcif v0.2.0's commits?** flow-canvas-01 is its own procomp with its own registry artifact and version. Even one-line additive changes get bumped + tracked properly so consumers depending on `@ilinxa/flow-canvas-01@^0.2.5` (rcif v0.2.0's declared constraint) can resolve the requirement against the published registry artifact. Folding into rcif's chain without a bump would leave rcif's `^0.2.5` constraint unresolvable on a fresh install.

## What this does NOT include

- **Doc-file target resource** — separate future procomp. Doc-ports today are orphan slots; the editor surfaces this with a dev-mode tooltip (Q-O2 lock) so doc-file procomp planning has real consumer signal when it starts.
- **Custom port-type registration in PortEditorStrip's picker** — Q5-bis deferred to rcif v0.3. Today's picker uses `defaultPortTypes` hardcoded; v0.3 will add an explicit `portTypes?: PortTypeDef[]` prop on the strip.
- **Runtime doc-port enforcement** — explicitly out of scope. Editor-side only per Q-O1 lock above.
