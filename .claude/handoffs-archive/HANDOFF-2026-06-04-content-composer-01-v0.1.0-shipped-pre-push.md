# HANDOFF — content-composer-01 v0.1.0 SHIPPED+PUSHED → v0.1.1 SMOKE-FIX (DONE)

**Date:** 2026-06-04
**Status:** ✅ v0.1.0 shipped + PUSHED (`c95a8e5`) → post-deploy smoke confirmed F-01 → **v0.1.1 fix (`0c55016`) re-smoke CLEAN (34→0)**. The 4-ship pattern is complete. v0.1.1 + docs push once committed.

> **v0.1.1 update (smoke fix):** the post-deploy consumer-tsc smoke confirmed F-01 — the shadcn rewriter mangles cross-procomp `@/registry/.../types` imports. Fixed by (a) tail `export type {…}` re-exports on json-form/media-editor-01/content-card-news-01 `.tsx` + repointing the composer's imports to the `.tsx` path, and (b) **adding `content-card-news-01` as a registryDependency** (a type-only dep STILL needs the module installed for consumer-tsc). Local-registry re-smoke → 0 content-composer errors. See the [decision §v0.1.1](decisions/2026-06-04-content-composer-01-v0.1.0-first-ship.md) + [GATE 3 F-01](../docs/procomps/content-composer-01-procomp/reviews/2026-06-04-v0.1.0-spotcheck.md).

---

## TL;DR

Resumed the C3-pause and drained the full **C4→C18** chain, pushed v0.1.0, then ran
the post-deploy smoke → confirmed + fixed F-01 in **v0.1.1**. `content-composer-01`
(52nd procomp, category `media`) is the multi-step content-authoring SHELL that
`media-editor-01` was extracted for. **News ships first.** GATE 3 **Pass with
follow-ups** (F-01 now closed).

## Git state

`master` is **ahead of origin by 18** — the 4 prior gate/foundation commits
(`44d1a05`/`576e448`/`c12986e`/`80c787a`) + the 14 this session:

| SHA | Commit |
|---|---|
| `a97fe0a` | C4 substrate registry + missing-substrate fallback + slot-mount |
| `7432e8a` | C5 context + step indicator + shell + dialog |
| `c326ce7` | C6 jsonForm substrate + hydration + tags/author-picker |
| `4d9fae1` | C7 bodySlot substrate (lazy Plate + Textarea) + baseline dirty |
| `4cb75be` | C8 mediaSlot substrate + clampMediaSources + pull-only export |
| `64d29e1` | C9 validation gates (value-based + active-handle) |
| `6d2afd2` | C10 autosave (draft-level dirty) + slot-handle registry |
| `5e5eb80` | C11 FSM publish/schedule + uploader + root composition |
| `e9094c8` | C12 news config + adapter — **NEWS SHIPS** |
| `3cb6f78` | C13 post config (clamp proof) |
| `6a91828` | C14 demo (SwipeTabsList) + re-edit fixtures |
| `c8b0fc8` | C15 meta deps audit + usage |
| `a45b379` | C16 registry.json base + fixtures + registryDependencies |
| `8e1bff4` | C17 guide + GATE 3 spotcheck |
| (this) | C18 STATUS + decision + memory + handoff |

Working tree: C18 docs uncommitted at time of writing.

## Gates (all green)

tsc 0 · lint 81/22 baseline (no content-composer findings) · meta-deps 52/52 ·
`pnpm build` ✓ (61 static pages) · `registry:build` ✓ (33 base + 1 fixtures, no
demo/usage/meta).

## TO PUSH (when the user confirms)

```
git push origin master
```

✅ **DONE** — v0.1.0 (`c95a8e5`) + v0.1.1 (`0c55016`/`8255280`) are pushed and synced
(0 ahead / 0 behind). content-composer-01 is **fully shipped + smoke-verified**; nothing
about it is pending for a resume. The deployed-artifact re-smoke is optional confirmation
only — the local-registry re-smoke (which tests the exact same artifacts through the
rewriter) already returned 0 content-composer errors. Don't poll Vercel artifacts faster
than 60s (`feedback_vercel_bot_mitigation_on_polling`).

## Open follow-ups (GATE 3 — all Low, none blocking; candidates for a future patch)

- ~~**F-01** consumer-tsc smoke~~ — ✅ **CLOSED in v0.1.1** (`0c55016`): cross-procomp
  `/types` rewriter mangling → `.tsx`-path imports + `content-card-news-01` registryDependency;
  local re-smoke 34→0.
- **F-02 (Low):** non-active-step metadata gate is required-presence-only.
- **F-03 (Low, → v0.1.2):** inline body-image upload unwired (ExportMetadata mismatch). *(Was
  tagged v0.1.1 in the GATE 3 review; v0.1.1 was spent on the smoke fix, so this rolls to v0.1.2.)*
- **F-04 (Low, → v0.2):** `export?` leaks into the uniform `SlotHandle` → `MediaSlotHandle` subtype.
- **F-05 (Low, → v0.2):** video re-edit blob re-attach (news is photo-only).
- **post backend adapter** ships behind media-editor-01 v0.2 `"library"`.

There is **no required next action** for content-composer-01. A fresh session can pick up the
above follow-ups (all optional), the concurrent cms-panel-01 GATE 1 sign-off, or new work.

## Key pointers

- Decision: [`.claude/decisions/2026-06-04-content-composer-01-v0.1.0-first-ship.md`](decisions/2026-06-04-content-composer-01-v0.1.0-first-ship.md)
- GATE 3: [`docs/procomps/content-composer-01-procomp/reviews/2026-06-04-v0.1.0-spotcheck.md`](../docs/procomps/content-composer-01-procomp/reviews/2026-06-04-v0.1.0-spotcheck.md)
- Guide: [`docs/procomps/content-composer-01-procomp/content-composer-01-procomp-guide.md`](../docs/procomps/content-composer-01-procomp/content-composer-01-procomp-guide.md)
- Plan (impl bible): [`docs/procomps/content-composer-01-procomp/content-composer-01-procomp-plan.md`](../docs/procomps/content-composer-01-procomp/content-composer-01-procomp-plan.md)

## Other in-flight (unchanged)

cms-panel-01 GATE 1 awaiting sign-off: [`HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md`](HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md).
