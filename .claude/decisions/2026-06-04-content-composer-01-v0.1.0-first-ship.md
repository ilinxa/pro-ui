---
date: 2026-06-04
session: content-composer-01 C4→C18 implementation
phase: procomp ship (GATE 3 closed)
type: component-ship
commits:
  - a97fe0a  # C4 substrate registry + fallback + slot-mount
  - 7432e8a  # C5 context + step indicator + shell + dialog
  - c326ce7  # C6 jsonForm substrate + hydration + tags/author-picker
  - 4d9fae1  # C7 bodySlot substrate + baseline dirty
  - 4cb75be  # C8 mediaSlot substrate + clampMediaSources
  - 64d29e1  # C9 validation gates
  - 6d2afd2  # C10 autosave (draft-level dirty) + slot-handle registry
  - 5e5eb80  # C11 FSM publish/schedule + uploader + root composition
  - e9094c8  # C12 news config + adapter (NEWS SHIPS)
  - 3cb6f78  # C13 post config (clamp proof)
  - 6a91828  # C14 demo + fixtures
  - c8b0fc8  # C15 meta deps + usage
  - a45b379  # C16 registry.json + fixtures
  - 8e1bff4  # C17 guide + GATE 3 spotcheck
components:
  - content-composer-01
findings:
  - F-01 (Med, v0.1.1): consumer-tsc smoke pending post-deploy (2nd inter-procomp install; expect F-cross-13 sub-traps)
  - F-02 (Low): non-active-step metadata gate is required-presence-only
  - F-03 (Low, v0.1.1): inline body-image upload unwired (ExportMetadata mismatch)
  - F-04 (Low, v0.2): export? leaks into the uniform SlotHandle
  - F-05 (Low, v0.2): video re-edit blob re-attach deferred (news photo-only)
status: SHIPPED pre-push (14 commits a97fe0a..8e1bff4 local; push user-gated)
---

# content-composer-01 v0.1.0 — first ship (C4→C18)

The multi-step content-authoring **shell that media-editor-01 was extracted for**.
52nd procomp (category `media`). Resumed from the C3 foundation pause and drained
the C4→C18 chain. **News ships first**; post is modeled-but-deferred.

## What shipped

A procomp SHELL: one declarative `ComposerConfig` per content type drives the
steps; each step's slot is rendered by a **substrate** behind a uniform
`SlotHandle`:

- `metadataFields` → json-form (controlled `values`, custom `tags` +
  `author-picker` field renderers, hydration seam for fn escape-hatches)
- `bodySlot` → article-body-01/Plate (lazy) or a `<Textarea>` plaintext fallback
- `mediaSlot` → media-editor-01 (1:1 dial passthrough, `mediaSources` clamped,
  pull-only export)

The shell owns: step nav (forward-gated / backward-free), blocking validation
gates, autosave, the draft → publish → schedule FSM, lazy upload-on-publish, and
the per-content-type adapter (`ComposerDraft` ↔ `ContentCardItem`). News + post
configs ship; the news adapter is registered; the post config proves config-only
divergence (`["upload","library"]` → clamp).

## Architecture refinements over the plan (load-bearing)

These came out of building against the real news config (which has **three**
`metadataFields` steps), and each is a genuine correctness improvement:

1. **Dirty is draft-level, not handle-aggregate.** Every slot mutation flows into
   the draft via per-mutation `onChange`, so `draft !== savedDraft` is the single
   correct dirty signal — and it **structurally averts the #1 Plate-autosave-loop
   trap** (no body baseline to mis-reset gates autosave). The body baseline stays
   only for the headless `SlotHandle.getIsDirty` contract.
2. **Gating is value-based against the always-current draft.** The plan's
   `slotHandles[step.slot]` (keyed by slot-kind) breaks when only the active step
   mounts and a config has multiple same-kind steps. The shell validates stored
   draft values for non-active steps; the active metadata step still gets full
   json-form `trigger()+isValid()`.
3. **Media export is pull-only at step-leave.** The hero step is unmounted by
   publish time, so the shell captures the blob via `handle.export()` when leaving
   the media step (stored in a `Map<stepId,Blob>`), and uploads lazily at
   publish. `SlotHandle` gained an optional media-only `export?` (F-04).
4. **Substrate mounts are dedicated `*-substrate.tsx` components** (not inline in
   `substrates.tsx`) — `substrate.render()` is called as a plain fn, so hooks
   must live in a component. Custom field renderers extract their hook body into
   an uppercase component (satisfies `react-hooks/rules-of-hooks`).

## Deferred / scoped out of v0.1

- Inline body-image upload (F-03), publisher field + auto-slug, video re-edit
  blob re-attach (F-05), full headless metadata validation (F-02), `MediaSlotHandle`
  subtype (F-04), the post backend adapter (behind media-editor-01 v0.2 `"library"`).

## Gates (all green)

tsc 0 · lint 81/22 baseline (no content-composer findings) · meta-deps 52/52 ·
`pnpm build` ✓ (61 static pages) · `registry:build` ✓ (33 base + 1 fixtures = 34
artifacts; no demo/usage/meta). GATE 3 verdict **Pass with follow-ups**.

## Open

- **Push is user-gated** (per the C3-pause handoff). 14 commits local
  (`a97fe0a..8e1bff4`) on top of the 4 already-local gate/foundation commits.
- F-01 consumer-tsc smoke runs post-deploy (the 4-ship pattern).

See: [GATE 3 review](../../docs/procomps/content-composer-01-procomp/reviews/2026-06-04-v0.1.0-spotcheck.md),
[guide](../../docs/procomps/content-composer-01-procomp/content-composer-01-procomp-guide.md),
[plan](../../docs/procomps/content-composer-01-procomp/content-composer-01-procomp-plan.md),
prior [gate-1-2 decision](2026-06-04-content-composer-01-gate-1-2-and-foundation.md).
