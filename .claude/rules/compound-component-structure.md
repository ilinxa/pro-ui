---
paths:
  - "src/registry/components/**"
  - "docs/procomps/**"
---

# Rule: Big components ship as a shadcn-style compound (multi-component)

> **MANDATORY for any "big" / multi-part library artifact.** A component that is more than a single visual unit — i.e. it has distinct regions (chrome + content + overlays), composes other procomps, or a consumer could reasonably want only *part* of it — MUST be authored as a **shadcn-style compound**: a headless provider + flat à-la-carte parts + one batteries-included assembly, not a single monolithic component with a god-prop surface.
>
> **Why:** the library's identity is composition + portability + pay-for-what-you-use. Consumers' needs vary; forcing the full surface (and its heavy deps — pdf.js / CodeMirror / Konva / etc.) on someone who wants only the grid is wrong. This is the user's standing directive (2026-06-09): *"must be developed so we can customize it … in cases we don't need that much features or sub-components we just drop some and use a lighter version … like some shadcn component."*

## When it applies

Trigger if **any** of these hold:
- The component has ≥ 3 distinct mountable regions (e.g. toolbar / grid / sidebar / preview / overlay).
- It composes ≥ 1 other procomp.
- It pulls a heavy dep (pdf.js, CodeMirror, Konva, shiki, marked, a charting lib) that not every consumer needs.
- A reasonable consumer would want a subset (e.g. "just the preview", "no sidebar").

If none hold, a single sealed component (the `data-table` shape) is fine — don't over-engineer a one-part widget.

## Required structure (three tiers + flat exports)

1. **Tier B — headless `Root` provider.** Owns ALL state, handlers, context, and any single cross-cutting context (DndContext, etc.) + the imperative handle. Renders `children`. Takes the data + handler props (`<Name>RootProps`). Lives in `parts/<name>-root.tsx`.
2. **Tier B — context-connected parts.** One module per region under `parts/`. Each reads `use<Name>()` for state — **no prop-drilling**, assembly is declarative (place the part, it wires itself). Exported with a flat `<Name><Region>` name (`MediaLibraryFileGrid`, not `MediaLibrary.FileGrid`).
3. **Tier C — standalone primitives.** Dumb, prop-driven, **context-free** pieces usable anywhere (`FilePreview`, `QuotaBar`, `FileCard`). Pattern: each part module holds a dumb core (Tier C) + a thin context wrapper (Tier B) that reads context then renders the core — one file, two exports, zero duplication.
4. **Tier A — the full assembly.** `<Name>` = `<NameRoot>` + a fixed child tree gated by `show*` / `preview` / `enable*` toggles. It contains **NO logic the parts don't** — anything the full component does, a hand-assembly can do. The demo + screenshot use Tier A.

## Hard requirements

- **Flat exports, never a namespace object.** Export `NameRoot`, `NameGrid`, … — NOT `Name.Root`. A dotted namespace object defeats tree-shaking (the bundler keeps the whole object). This is shadcn's own choice (`SidebarProvider` / `SidebarContent`).
- **Tree-shaking must be real.** Each part is its own module re-exported from the barrel. Heavy delegated viewers are `React.lazy(() => import(...))` so dropping a part drops its weight. Dropping the preview parts ⇒ pdf.js / CodeMirror / marked never enter the consumer's graph. State this explicitly in the plan; verify the lazy boundaries.
- **`Root` holds the cross-cutting context**, not the assembly — so hand-assembled layouts get the same behavior (dnd, etc.).
- **Capability-gated affordances.** Omit a handler (`onUpload`/`onMove`/…) → its button + menu item + dnd hide. A read-only variant must fall out for free.
- **The plan must enumerate the tier inventory** (which parts are Tier B, which Tier C, what the assembly mounts) at GATE 2 — alongside the type/state surface, not after.

## Gate integration

- **GATE 1 (description):** state that the artifact is multi-part and will ship as a compound; list the rough part inventory.
- **GATE 2 (plan):** the export surface (§"three tiers") + tree-shaking story + "Root holds context, assembly is logic-free" are part of the implementation contract. A reviewer rejects a plan that bolts everything into one component with a god-prop list.
- **GATE 3 (review):** verify flat exports, Tier-A-contains-no-extra-logic, lazy boundaries, and that a hand-assembled subset actually renders (the demo should include a "lighter / composed" example).

## Worked example

`media-library-01` (2026-06-09) is the reference implementation: `MediaLibraryRoot` (provider + DndContext + handle) + ~10 flat context parts (`MediaLibraryQuotaBar` / `…TypeFilters` / `…FolderRow` / `…FileGrid` / `…DetailsPane` / `…Lightbox` / …) + standalone primitives (`FilePreview`, `QuotaBar`, `FileCard`) + `MediaLibrary01` assembly. The four file viewers are `React.lazy`. Its demo has a "Lighter (composed)" tab proving the subset path. See [`docs/procomps/media-library-01-procomp/`](../../docs/procomps/media-library-01-procomp/).

## Cross-references

- Tier model: [`docs/library-tiers-charter.md`](../../docs/library-tiers-charter.md)
- Readiness review (GATE 3): [`.claude/rules/readiness-review.md`](readiness-review.md)
- Procomp workflow: [`.claude/CLAUDE.md`](../CLAUDE.md), [`docs/procomps/README.md`](../../docs/procomps/README.md)

---

**Established:** 2026-06-10 (after the `media-library-01` build). **Authority:** Binding for multi-part artifacts added after this date. Single-unit components are exempt.
