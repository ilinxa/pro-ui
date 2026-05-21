# HANDOFF — session pause after json-form v0.2.3 + article-body-01 v0.2.2

**Paused:** 2026-05-21 (end of long session — json-form v0.1.5 → v0.2.3 arc complete + article-body-01 v0.2.2 root-cause echo guard).
**Branch:** `master`, fully pushed.
**Tip:** `bce274d` — `fix(article-body-01,json-form): content-equality echo guard at the substrate`.
**Working tree:** clean except `.claude/scheduled_tasks.lock` (gitignored artifact — leave alone).

---

## What's done (this session's surface area)

### json-form

| Bump | Date | Scope |
|---|---|---|
| v0.1.5 | 2026-05-21 | F-S1 cross-procomp `/types` rewrite fix + ChangeBridge echo guard |
| v0.1.6 | 2026-05-21 | narrow-deps `useConditional`/`useComputed` + 9 robustness fixes |
| v0.1.7 | 2026-05-21 | Additive substrate (compile split, `dependsOn` typed flag, `<JsonFormDevtools>`, narrow-deps headless hooks, `defineFieldRenderer`) |
| v0.2.0 | 2026-05-21 | Behavioral — default-registry watch drop (FieldWrapper renders 20→1–4 on a 20-field form) + deep-merge `defaultValues` |
| v0.2.1 | 2026-05-21 | Docs/devtools patch — closes 4 of 5 v0.2.0 GATE 3 follow-ups (F-01 JSDoc, F-02 JSDoc, F-06 devtools fallback, F-08 BigInt) |
| v0.2.2 | 2026-05-21 | Consumer-side `useStableRichtextValue` attempt to fix React #185 — **REVERTED in v0.2.3** (caused focus-stealing) |
| v0.2.3 | 2026-05-21 | Reverts v0.2.2 — `parts/field-richtext.tsx` back to v0.2.1 simple shape; the proper fix lives upstream in article-body-01 v0.2.2 |

### article-body-01

| Bump | Date | Scope |
|---|---|---|
| v0.2.1 | 2026-05-21 | Additive — package-level re-exports `ArticleBodyValue` + `ARTICLE_BODY_EMPTY_VALUE` |
| v0.2.2 | 2026-05-21 | Content-equality echo guard in the controlled-mode sync effect (replaces ref-equality); fixes the React #185 / focus-stealing class of bug under RHF / json-form controllers |

All bumps pushed; path-b smoke clean post-deploy (0 errors in json-form + article-body-01 on the consumer-tsc baseline at `e:/tmp/ilinxa-smoke-consumer/`).

## Why two commits to fix the richtext loop

`bce274d` is the **substrate-grade** fix (article-body-01 sync effect uses content-equality). `b057d36` was an earlier **consumer-side band-aid** in json-form's `parts/field-richtext.tsx` (`useStableRichtextValue` JSON-hash-keyed `useMemo`) that prevented the React #185 crash but broke typing — `lastSyncedValueRef.current` got Plate's new ref while the cached stableValue returned the OLD ref, so the effect's ref-equality check failed every render, fired `setValue` on every keystroke, and reset Slate's selection. Reverted in v0.2.3 once the root-cause fix landed. Decision: [`2026-05-21-article-body-01-v0.2.2-content-equality-echo-guard.md`](decisions/2026-05-21-article-body-01-v0.2.2-content-equality-echo-guard.md).

## Open follow-ups (load-bearing — read these first next session)

From the v0.2.0 GATE 3 full-checklist review ([reviews/2026-05-21-v0.2.0-checklist.md](../docs/procomps/json-form-procomp/reviews/2026-05-21-v0.2.0-checklist.md)):

| ID | Severity | Title | Bump target |
|---|---|---|---|
| **F-03** | ⚠️ **High** | default-registry whitelist drift lint — build a `validate-meta-deps`-style script that scans the 25 whitelisted built-in renderers in `BUILTIN_RENDERER_TYPES_SKIPPING_ALL_VALUES` for any `args.allValues` access and surfaces drift. Chain into `pnpm vercel-build`. | v0.2.x patch or v0.3.0 |
| F-07 | 🔹 Low | `defineFieldRenderer` config-key narrowing | indefinite defer |

F-01/F-02/F-06/F-08 closed in v0.2.1. F-04 (path-b smoke) and F-05 (`MAX_CONDITIONAL_COUNT` magic-number JSDoc) closed in v0.2.0 C3/C5.

## Doc-sync done this session

- [`docs/procomps/json-form-procomp/json-form-procomp-guide.md`](../docs/procomps/json-form-procomp/json-form-procomp-guide.md) — header bumped v0.1.7 → v0.2.3; "What ships in v0.2" section authored (v0.2.0/v0.2.1/v0.2.3 sub-blocks); `dependsOn` performance section rewritten to past tense; stable-identity tip added; anti-pattern reworded; `FieldDefinition.dependsOn` JSDoc comment in code block updated.
- [`docs/procomps/article-body-01-procomp/article-body-01-procomp-guide.md`](../docs/procomps/article-body-01-procomp/article-body-01-procomp-guide.md) — v0.2.1 + v0.2.2 entries added under "What's new in v0.2"; new "Controlled mode (RHF / json-form)" section authored with RHF Controller worked example; Known-limits "Closed in v0.2" bullet extended.

Both guides verified consistent with shipped code. tsc + validate:meta-deps (45/45) clean post-doc-update.

## Active component queue (unchanged from yesterday)

Remaining queued procomps — no GATE 1 yet for any of them:
- `rich-graph-2`
- `chat-panel`
- `notification-system`
- `todo-rich-card-in-flow` (flow-canvas-01 adapter for `todo-rich-card`; sibling slot under `data/`)

User has not picked the next direction. Last assistant offer was: (1) F-03 whitelist drift lint, (2) next component from queue, (3) `todo-rich-card-in-flow` GATE 1, (4) memory entry codifying "exercise the actual interaction in a browser before claiming controlled-mode fixes pass" — paired with (1) as a 5-min warmup. Resume by asking which way.

## Don't redo

- ❌ Don't re-attempt consumer-side stabilization of the richtext value reference. The substrate fix in article-body-01 v0.2.2 is the right layer; band-aids above it invert the bug.
- ❌ Don't restore the v0.2.2 `useStableRichtextValue` hook — it's gone for a reason; commit `b057d36` is the carrier.
- ❌ Don't claim a controlled-mode fix passes without actually typing into the field in a dev browser. tsc + lint + page-load all passed for v0.2.2 while typing was broken.

## Verification snapshot at pause

```
git log --oneline -3
  bce274d fix(article-body-01,json-form): content-equality echo guard at the substrate
  b057d36 fix(json-form): v0.2.2 — richtext controlled-mode echo loop (React #185)
  e098e40 docs(json-form): close v0.2.1 — path-b smoke clean post-deploy

pnpm tsc --noEmit            → 0
pnpm validate:meta-deps      → 45/45 clean (0 findings)
pnpm registry:build          → clean
```

All commits pushed to origin/master.
