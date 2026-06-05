---
date: 2026-06-05
session: carousel review-hardening + content-composer integration
phase: review (3-agent) → fix-all → integrate → smoke
type: ship
commits: [pending]
components: [media-carousel-editor-01, content-composer-01]
findings: [24-from-multi-agent-review-fixed, F-01-smoke-tail-band, N-egress-deferred-v0.3]
status: shipped (both Pass with follow-ups)
---

# media-carousel-editor-01 v0.1.1 (hardening) + content-composer-01 v0.2.0 (integration)

Same-day follow-on to the carousel v0.1.0 first ship (`132e49a`). The user (1) asked
to wire the carousel into content-composer's post step — the original purpose — and
(2) asked for a careful multi-perspective review + "fix all". Both done.

## content-composer-01 v0.2.0 — the integration

The `post` content type now authors **multi-media** via a new additive
**`mediaCarouselSlot`** kind backed by `media-carousel-editor-01`. `news` keeps the
single `mediaSlot` (untouched). New surface: `MediaCarouselSlotConfig` /
`MediaCarouselSlotValue` / `MediaCarouselItemRef`, a `media-carousel-substrate`
(controlled bridge: live blob-bearing items ↔ JSON-clean draft refs), gate +
`isStepEmpty` arms with `assertNever` exhaustiveness guards, and a shell
`CarouselLiveCacheContext`.

**Deferred (honest, with the already-deferred post backend):** the multi-blob
**upload-at-publish**. The shell's `captureMediaBlob`/`uploadHero`/`SlotHandle.export?`
are single-blob (`mediaSlot`-shaped); N-egress is the v0.3 "post backend" cohort,
co-owned with the `post-content-item` adapter (which isn't registered, so publish
already surfaces a clear "no adapter" error — no silent loss). Authoring is fully live.

## The multi-agent review (3 agents) → fix-all

The user asked to confirm it's "perfectly professional / seamless". Ran 3 adversarial
review agents (code-correctness / UX+a11y / architecture). **Honest verdict: NOT yet
— 24 real findings.** Re-validated each against live code (all genuine), then fixed
the blockers + highs + most mediums.

**The headline finding (all 3 agents):** silent local-media **data loss** — adding
local photos in the post media step, navigating to caption, and back → gone (the JSON
draft can't hold blobs; `reconstruct` dropped them). **Fix:** `CarouselLiveCacheContext`
— the shell stays mounted and caches the live items (with blobs); the carousel runs
`revokeOnUnmount={false}` so its object URLs outlive the step unmount; the composer
root revokes cached blob URLs on its own unmount. Step-nav is now lossless within a
session. (Cross-RELOAD durability still rides with the upload backend — a blob can't
be JSON.)

**Carousel v0.1.1 fixes:** orphan-URL revoke effect (leak on controlled value-swap) ·
synchronous `itemsRef` + cap-in-`addItems` (intake race) · loading state · in-UI
error/max surface · `aria-live` + dnd-kit announcements · export busy/`aria-busy` +
error surface · **re-edit double-overlay** (`initialSource` only when no `editorState`)
· video a11y dead-end → static caption · 24px hit targets · video poster
(`playsInline`+seek) · add-more drag-over · empty-main fallback · rail read-only cue ·
`nextId` prefix · dead `"max-items"` kind · exported `useCarouselState`.

**content-composer v0.2.0 fixes:** the data-loss cache (above) · dead `carouselRef`
removed · new public types exported from barrel · `getIsDirty` baseline (was
`length>0` → falsely-dirty restored draft) · `reconstruct` warns on dropped local
refs + drops unrecoverable `editorState` · `assertNever` gate guards.

## F-01 (smoke-caught, AGAIN) — the key lesson reinforced

The local-registry smoke caught it: the shadcn rewriter resolves a **barrel** import
(`@/registry/components/media/media-carousel-editor-01`) to the **`.tsx`** file —
which did NOT tail-re-export the carousel's types (only the barrel did). Consumer-tsc
errored (`MediaCarouselItem` not exported). **Fix:** add a **tail type re-export band**
to `media-carousel-editor-01.tsx` (mirroring media-editor-01) + point cross-procomp
imports at the `.tsx` path. Re-smoke → 0 errors.

**Lesson (now twice-proven):** a procomp that will be composed cross-procomp MUST
tail-re-export its public types from its `.tsx` entry; a barrel import is NOT safe (the
rewriter rewrites it to the `.tsx`). The local-registry smoke is the gate that catches
this pre-deploy.

## Gates

tsc 0 · lint 81-22 baseline (no new findings) · meta-deps 53/53 · `pnpm build` ✓ (62
pages) · registry:build ✓ (carousel 14+1; content-composer 34+1) · **local-registry
consumer-tsc smoke: 0 errors** (carousel + content-composer). GATE 3: carousel v0.1.1
appended to its spotcheck; content-composer
[v0.2.0 spotcheck](../../docs/procomps/content-composer-01-procomp/reviews/2026-06-05-v0.2.0-spotcheck.md)
— both Pass with follow-ups.

## Open follow-ups

- v0.3 (post backend cohort): multi-blob upload-at-publish (generalize `SlotHandle.export`
  → plural) + `post-content-item` adapter + durable local-item persistence (IndexedDB
  / eager upload).
- v0.2.x polish: motion-safe edit-swap transition; `aria-current="step"`; lime
  focus-ring contrast measurement.

## Pointers

- Carousel review (v0.1.0 + v0.1.1 section): [`reviews/2026-06-05-v0.1.0-spotcheck.md`](../../docs/procomps/media-carousel-editor-01-procomp/reviews/2026-06-05-v0.1.0-spotcheck.md)
- content-composer v0.2.0 review: [`reviews/2026-06-05-v0.2.0-spotcheck.md`](../../docs/procomps/content-composer-01-procomp/reviews/2026-06-05-v0.2.0-spotcheck.md)
- Prior carousel first-ship decision: [`2026-06-05-media-carousel-editor-01-v0.1.0-first-ship.md`](2026-06-05-media-carousel-editor-01-v0.1.0-first-ship.md)
