# Structure audit — content-composer v0.3.1 (2026-08-11)

> Consumer lockstepped to the P3 pilots (mediaSlot wires `@ilinxa/media-editor-capture`). Carries the
> known R4 follow-up MED-4 (owner: content-composer v0.4.0 fix-on-touch) — logged below as a
> pre-logged row per instruction, not re-litigated.

verdict: findings-logged
artifact: 154.1 KB / budget 180 KB (14.4% headroom)

## 1. Compound compliance (.claude/rules/compound-component-structure.md)

**Finding (new) — the default substrate map is fully eager; only `bodySlot`'s inner Plate chunk gets
a real `React.lazy` split.** `lib/substrates.tsx:4-7` statically imports all four substrate-mount
components (`JsonFormSubstrateMount`/`BodySubstrateMount`/`MediaSubstrateMount`/
`MediaCarouselSubstrateMount`) into `DEFAULT_SUBSTRATES` (`lib/substrates.tsx:43-48`), and
`content-composer.tsx:20` imports `DEFAULT_SUBSTRATES` at the shell's top level unconditionally — so
every `ContentComposer` consumer pulls the full substrate graph regardless of which `SlotKind`s their
`ComposerConfig.steps` actually reference. Only the richtext body gets deferred:
`body-substrate.tsx:17` (`const BodySubstratePlate = lazy(() => import("./body-substrate-plate"))`,
~165 KB Plate chunk, per its own comment). `media-substrate.tsx:11`
(`import { MediaEditor } from ".../media-editor/media-editor"`) and
`media-carousel-substrate.tsx:4` (`import { CarouselComposer } from
".../carousel-composer/carousel-composer"`) are both eager, top-level, unconditional.

Verified against the shipped configs, not just theorized: `news-composer.config.ts` uses only
`metadataFields`/`mediaSlot`/`bodySlot` (grep-confirmed — zero `mediaCarouselSlot` occurrences), yet a
news-only `ContentComposer` still eagerly bundles `CarouselComposer` and therefore its own npm deps —
`@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` (`carousel-composer/meta.ts:51-55`) —
weight P3 specifically fought to shed from `event-calendar`'s base (this same audit batch) leaks back
in here for a consumer that never renders a carousel. Symmetrically, `post-composer.config.ts` uses
only `mediaCarouselSlot`/`metadataFields` (no `bodySlot`, no `mediaSlot`), yet still eagerly bundles
the full `MediaEditor` + konva. The documented `substrates` prop escape hatch (`usage.tsx:91`) cannot
avoid this either — the override happens at runtime via object-spread
(`content-composer.tsx:98`, `{...DEFAULT_SUBSTRATES, ...props.substrates}`), which is after the
module import already happened at bundle time.

**Pre-logged (not re-litigated) — MED-4.** `parts/media-substrate.tsx:17-24,221` statically wires the
capture extension (`capture={mediaCapture}`) regardless of `slotConfig.mediaSources`/config intent —
an upload-only config still pulls the capture module graph. Confirmed still present at the cited
lines. Owner (per the R4 table, carried forward as-is): content-composer v0.4.0 fix-on-touch (design
change — make the wiring config-conditional, lazy or prop-injected — not a patch).

## 2. Dead / orphaned public API

None found. `useComposerStep`, `stripHydration`, and the individual substrate-record exports
(`jsonFormSubstrate`/`richTextSubstrate`/`mediaEditorSubstrate`/`mediaCarouselSubstrate`) have zero
internal mount or docs-site use, but each carries an explicit barrel-comment rationale for a plausible
standalone/escape-hatch use (custom shell authors reading live composer state, JSON-config
round-tripping, `substrates`-prop overriding) — not abandoned surface by the template's bar.

## 3. Undocumented prop semantics

None found beyond MED-4 (already tracked above). `usage.tsx` covers the controlled draft triplet, the
headless `useComposerState` escape hatch, substrate overrides, the two custom field renderers
(`tagsFieldRenderer`/`authorPickerFieldRenderer`), lazy upload-on-publish, and the blocking-gate model.

## 4. A11y baseline

No findings. `StepIndicator` uses real `<button>` elements with `aria-current="step"` and
focus-visible rings (`parts/step-indicator.tsx:30-49`) — natively keyboard-reachable, not a custom
click-only surface. `field-author-picker.tsx` builds its async combobox on shadcn
`Popover`/`Command` (native keyboard nav) with `aria-labelledby`/`aria-invalid` wired
(`field-author-picker.tsx:113-116`) and explicitly avoids the `asChild` F-cross-13 divergence class
per its own doc comment (`field-author-picker.tsx:186-187`).

## 5. Weight & slice candidacy

Core folder (excl. `demo.tsx`/`dummy-data.ts`/`usage.tsx`/`meta.ts`): **4,018 LOC**. Top-3:
`content-composer.tsx` 606 (15.1% — the shell itself), `types.ts` 429 (10.7%),
`configs/news-composer.config.ts` 385 (9.6% — data, not code).

No axis clears the ≥20% LOC bar, and content-composer's real weight (media-editor / carousel-composer
/ rich-text-editor / json-form) is already externalized as separate registry items via `internal`
deps — a further LOC-based feature-item split within content-composer's own folder isn't the
applicable lever here. **Not a slice candidate**; the growth to watch is the substrate eagerness
logged in §1 (a `React.lazy`-boundary fix, the same class of gap file-manager's audit found for
`@tanstack/react-virtual` — not a new feature item).

## Owners

| Finding | Severity (🚫/⚠️/🔸/🔹) | Owner target |
|---|---|---|
| `lib/substrates.tsx` eagerly imports all 4 substrate mounts (incl. `MediaSubstrateMount`/`MediaCarouselSubstrateMount`, neither `React.lazy`) regardless of which `SlotKind`s a `ComposerConfig` actually uses — a news-only consumer bundles `CarouselComposer` + its `@dnd-kit/*` deps it never renders | ⚠️ High | Next MINOR touch — `React.lazy` the media/carousel substrate mounts (same pattern already proven for `bodySlot`'s Plate chunk in `body-substrate.tsx:17`) |
| MED-4 (pre-logged, R4/P3 audit) — `media-substrate.tsx:17-24,221` statically wires capture regardless of config | 🔸 Medium | content-composer v0.4.0 fix-on-touch (owner: design change, not a patch — carried per plan) |
