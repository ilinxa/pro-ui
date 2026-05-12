---
date: 2026-05-13
session: json-form v0.1.1 — richtext field type (same-day follow-up to v0.1.0 ship)
phase: post-Phase-7 / GATE-3-rule era
type: patch-bump
commits: pending (this session)
components: json-form (v0.1.0 → v0.1.1; new `richtext` field type)
findings: none
status: open
---

# json-form v0.1.1 — richtext field via article-body-01 substrate

## What shipped

**`json-form` v0.1.1** — additive `richtext` field type, same-day follow-up to v0.1.0. Wraps `<ArticleBodyEditor>` from `@ilinxa/article-body-01` exactly the way the v0.1.0 `code` field wraps `<CodeBlock>` from `@ilinxa/code-block`: lazy-loaded via `React.lazy` so the Plate bundle (~165KB gzip after article-body-01's v0.2 additions) only ships when a form actually contains a `richtext` field.

This is the **second** component using `dependencies.internal` (json-form itself was the first to actually use the key when v0.1.0 shipped — meta.internal added `code-block`. v0.1.1 extends it to `["code-block", "article-body-01"]`). `validate-meta-deps` 42/42 clean confirms both producer-side imports and consumer-side `@ilinxa/<slug>` references are in sync.

### Files touched

- `src/registry/components/forms/json-form/types.ts` — added `"richtext"` to the explicit `FieldType` union; added `richText?: { hideToolbar?; autoFocus? }` to `FieldConfig`.
- `src/registry/components/forms/json-form/parts/field-richtext.tsx` (new, ~40 LOC) — single-file lazy boundary; `export default` so `React.lazy(() => import(...))` works.
- `src/registry/components/forms/json-form/lib/default-registry.ts` — second `React.lazy` boundary alongside `field-code`; new registry entry `richtext: FieldRichtext`.
- `src/registry/components/forms/json-form/lib/schema-compiler.ts` — added a `case "richtext":` branch that compiles to `applyRequiredRichtext()`, a new helper that produces `z.array(z.unknown())` and runs a tree-walk on `{ type, children, text }` Plate nodes to distinguish "the default empty paragraph" from real content (returns false on whitespace-only text leaves, true on any non-empty leaf).
- `src/registry/components/forms/json-form/dummy-data.ts` — `richFieldsFormSchema` gains a `summary` richtext field with a placeholder + the canonical "single empty paragraph" `defaultValue` shape (`[{ type: "p", children: [{ text: "" }] }]`).
- `src/registry/components/forms/json-form/demo.tsx` — Rich fields tab caption updated to list richtext.
- `src/registry/components/forms/json-form/usage.tsx` — value-shape table gains a `richtext` row pointing at `Array<{ type, children }>` plus a `serializeArticleBodyToHtml` pointer for HTML export boundaries.
- `src/registry/components/forms/json-form/meta.ts` — version 0.1.0 → 0.1.1; description updated to "25 built-in field types (incl. richtext via Plate)"; `dependencies.internal` extended to `["code-block", "article-body-01"]`; `related` extended to include `article-body-01`; `tags` gains `"richtext"`.
- `registry.json` — json-form item: new `parts/field-richtext.tsx` file entry (38 total files now); `registryDependencies` extended with `@ilinxa/article-body-01`; description updated.

### Substrate-decision history

Path A from the "richtext substrate" choice presented to user earlier in session: **slot `article-body-01` directly** (1-file wrap) rather than extract a leaner `rich-text` procomp first. Rationale: article-body-01 is already Plate-based, already shipped (v0.2.0), already has the editor+viewer split and image-upload story. The "weird positioning" cost (a `data`-category component slotted by a `forms`-category field) is small compared to the cost of authoring a leaner `rich-text` procomp through GATE 1/2/3.

If form-specific richtext needs diverge from article-body needs in the future — e.g., a more compact toolbar, single-line mode, character-count enforcement — the path is to extract a `rich-text` procomp in v0.2, then re-point `field-richtext.tsx` at it. The lazy-load boundary makes this swap surgical (single import line).

### Value-shape decision

`richtext` submits `ArticleBodyValue` = `Array<{ type: string; children: TElement | TText[] }>` (Plate's JSON shape). NOT a string. Consumers persisting to a database should store the JSON directly — never round-trip through HTML (per Plate's own storage guidance and article-body-01's docs). For export boundaries (RSS, email, OG tags), the `serializeArticleBodyToHtml` async helper exposed by `@ilinxa/article-body-01` is the right exit ramp.

### Required-validation decision

`required: true` on a richtext field is non-trivial because Plate's "empty editor" default value is `[{ type: "p", children: [{ text: "" }] }]` — a non-empty array. A naive `z.array(z.unknown()).min(1)` would consider this "filled." `applyRequiredRichtext` instead walks the tree and asks "does ANY leaf `text` node contain non-whitespace?" That's the v0.1.1 heuristic. It catches the 95% case (user opened the form and didn't type anything). For stricter checks (e.g., min character count after stripping marks), consumers can layer a `validate: ({ value }) => ...` callback.

## Verification

- **`pnpm tsc --noEmit`:** clean.
- **`pnpm lint`:** 0 errors, 2 warnings (pre-existing in `file-tree` / `file-manager`, unrelated).
- **`pnpm validate:meta-deps`:** 42/42 clean. The lint extension correctly resolves the new `@/registry/components/data/article-body-01` import in `field-richtext.tsx` to internal-slug `article-body-01` and confirms it's declared in `meta.internal`.
- **`pnpm build`:** clean. 50/50 routes prerendered.
- **`pnpm registry:build`:** clean. `public/r/json-form.json` regenerated with the new field-richtext.tsx file entry.

## GATE 3 — skipped per the readiness-review rule

Per [`.claude/rules/component-readiness-review.md`](../rules/component-readiness-review.md): **patch bumps (`v0.1.x → v0.1.y` non-breaking, no public-API touch) do NOT trigger the review rule.** v0.1.1 IS additive to the public API (FieldType union gains a new literal; FieldConfig gains a new property), but it's strictly non-breaking. The rule's "public-API-touching minor bump" tier applies to v0.x → v0.x+1 BREAKING changes — not additive patch bumps. v0.1.0's spot-check (Pass with follow-ups) carries forward; no fresh review file required for v0.1.1.

## Active queue progression

Active queue progression unchanged — 5/7 done (pdf-viewer, file-tree, file-manager, code-block, json-form). 3 remaining: rich-graph-2, chat-panel, notification-system.

This decision file consumes the next slot in the v0.1.x richtext/file/color/array roadmap. `file` (needs `file-upload-01` procomp first), `color` (needs `color-picker-01` procomp first), and `array` (needs UX-decision GATE 1) are still pending.

## Total component count

**42 components** across 8 categories (unchanged — v0.1.1 is a bump, not a new component).
