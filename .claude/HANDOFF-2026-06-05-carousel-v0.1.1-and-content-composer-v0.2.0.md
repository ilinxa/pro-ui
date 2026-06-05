# HANDOFF — carousel v0.1.1 (review-hardening) + content-composer-01 v0.2.0 (integration)

**Date:** 2026-06-05
**Status:** ✅ Built + all gates green + local-registry smoke clean (0 errors) + GATE 3 (both Pass-with-follow-ups). **Commit + push pending user confirmation.**

---

## TL;DR

Two things, same day, on top of the carousel v0.1.0 first ship (`132e49a`):

1. **content-composer-01 v0.2.0** — the carousel is now **wired into the post step**
   (the original purpose). New additive `mediaCarouselSlot` kind + substrate +
   `CarouselLiveCacheContext`. News untouched.
2. **media-carousel-editor-01 v0.1.1** — a **3-agent adversarial review** (code /
   UX+a11y / architecture) found **24 real findings**; re-validated + fixed the
   blockers + highs + most mediums.

## The headline fix

All 3 agents flagged **silent local-media data loss** (add photos in the post media
step → go to caption → back → gone). Fixed with a shell live-items cache
(`CarouselLiveCacheContext`) + the carousel running `revokeOnUnmount={false}` so its
object URLs survive step unmount; the composer root revokes them on its own unmount.
Step-nav is now lossless within a session.

## F-01 caught again by the smoke

The rewriter resolves a barrel import to the `.tsx`, which didn't tail-re-export the
carousel's types → consumer-tsc error. Fixed with a **tail type band** on
`media-carousel-editor-01.tsx` + `.tsx`-path cross-procomp imports. Re-smoke clean.

## Gates (all green)

tsc 0 · lint 81-22 baseline (no new) · meta-deps 53/53 · `pnpm build` ✓ (62 pages) ·
registry:build ✓ · **local-registry consumer-tsc smoke: 0 errors** (carousel +
content-composer).

## Deferred (honest)

Multi-blob **upload-at-publish** + the `post-content-item` adapter = the **v0.3 post
backend cohort**. Authoring is fully live; publish surfaces the existing "no adapter"
error (no silent loss). Cross-RELOAD durable persistence of local blobs rides with it.

## STATE LOCKED (2026-06-05 session close)

- **Committed `75e9f68`** (30 files), **NOT pushed** — `master` is ahead of origin by 1.
- Working tree CLEAN. tsc 0 · lint 81-22 baseline · meta-deps 53/53 · build 62 pages ·
  registry:build ✓ (carousel 14+1, content-composer 34+1). Artifacts carry the tail band.

## NEXT ACTION (resume here)

**Push, then post-deploy re-smoke.** The only thing pending is the outward push:

```
git push origin master
```

**Smoke nuance (be precise):** the tail-band F-01 fix is confirmed by (a) the tail band
being present in the built `public/r/media-carousel-editor-01.json` artifact content, and
(b) a manual consumer-patch → `pnpm tsc --noEmit` **0 errors**. A single clean end-to-end
`shadcn add` after the fix was NOT completed — the re-install hit a `pnpm add` deps hiccup
(the documented harness drift). So after push + Vercel deploy, run the standard post-deploy
re-smoke (`pnpm dlx shadcn@4.6.0 add @ilinxa/content-composer-01` against the deployed
registry → consumer `tsc`) as the final confirmation. Expected clean (artifact already has
the fix).

## Pointers

- Decision: [`.claude/decisions/2026-06-05-media-carousel-editor-01-v0.1.1-and-content-composer-01-v0.2.0.md`](decisions/2026-06-05-media-carousel-editor-01-v0.1.1-and-content-composer-01-v0.2.0.md)
- Reviews: carousel [v0.1.0+v0.1.1](../docs/procomps/media-carousel-editor-01-procomp/reviews/2026-06-05-v0.1.0-spotcheck.md) · content-composer [v0.2.0](../docs/procomps/content-composer-01-procomp/reviews/2026-06-05-v0.2.0-spotcheck.md)
- Test: http://localhost:3000/components/content-composer-01 ("Post" tab) + http://localhost:3000/components/media-carousel-editor-01
