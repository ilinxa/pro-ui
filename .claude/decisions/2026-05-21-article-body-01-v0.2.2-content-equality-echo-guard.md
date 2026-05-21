---
date: 2026-05-21
type: fix
commits: [pending — added after push]
components: [article-body-01, json-form]
findings: [F-controlled-mode-ref-equality-echo, F-v0.2.2-stabilization-focus-loss]
status: shipped
---

# article-body-01 v0.2.2 + json-form v0.2.3 — content-equality echo guard

## Summary

Two coordinated bumps fix the richtext controlled-mode echo loop that surfaced today as React #185 and (after a failed v0.2.2 json-form attempt) as focus-stealing. The root cause was reference-equality in `ArticleBodyEditor`'s sync effect; the proper fix lives in `article-body-01.tsx` (content-equality), so json-form v0.2.3 reverts v0.2.2's consumer-side `useStableRichtextValue` band-aid.

| Bump | Scope | Risk |
|---|---|---|
| **`article-body-01` v0.2.1 → v0.2.2** | Sync effect echo guard changed from `controlledValue !== lastSyncedValueRef.current` (reference) to `serializeValueKey(controlledValue) !== lastSyncedKeyRef.current` (content). New file-local `serializeValueKey()` helper (JSON.stringify with try/catch fallback). | Low — JSON.stringify of a Plate tree is O(n) but cheap relative to a keystroke's frame budget; no public API change. |
| **`json-form` v0.2.2 → v0.2.3** | Reverts `parts/field-richtext.tsx` to the v0.2.1 simple shape; drops the `useStableRichtextValue` + `useCallback` wrappers added in v0.2.2 (those were a consumer-side band-aid for the upstream ref-equality bug, no longer needed). | Low — the deleted helpers were file-local, never exported. |

## Why two-step on json-form

The v0.2.2 fix attempt stabilized the `value` reference passed to `<ArticleBodyEditor>` by content-keyed `useMemo`. That broke the echo loop's React #185 symptom but introduced a different bug: `lastSyncedValueRef.current` was being set by Plate's `handleChange` to the NEW Plate-emitted reference, while my `useStableRichtextValue` returned the OLD cached reference — so the effect's `controlledValue !== lastSyncedValueRef.current` check ALWAYS failed (different refs by construction), fired `setValue` every render, and reset Slate's selection on each keystroke. The user reported "type one letter, focus lost, click again, type next letter."

The proper fix is at the substrate: `ArticleBodyEditor` itself should use content equality, not reference equality. That makes consumer-side stabilization unnecessary and unlocks the natural RHF-controlled flow.

## How the loop traced

Before fix:

```
[user types "5"]
  → Plate inserts. editor.children = V1.
  → Plate emits onChange(V1).
  → handleChange: lastSyncedValueRef.current = V1; outer onChange(V1).
  → controller.onChange(V1) → RHF state[summary] = V1.
  → React re-render.
  → field-richtext: safe = V1.
  → ArticleBodyEditor: controlledValue = V1.
  → useEffect [controlledValue, editor]: V1 !== V1 (lastSyncedValueRef)? FALSE → no setValue. ✓
```

Wait — that should have worked even before v0.2.2. The reason it DIDN'T:

RHF emits a NEW reference on every state change (even when content is identical) for some internal path. Or Plate normalizes the value on emit, producing a slightly different content/ref each time. Either way, the reference equality check fires `setValue` repeatedly when content is actually stable, which resets Slate's selection and (on rapid succession) trips React's max-update-depth guard.

After fix (article-body-01 v0.2.2):

```
[user types "5"]
  → Plate inserts. editor.children = V1.
  → Plate emits onChange(V1).
  → handleChange: lastSyncedKeyRef.current = stringify(V1); outer onChange(V1).
  → controller.onChange(V1) → RHF state[summary] = V1.
  → React re-render.
  → field-richtext: safe = V1.
  → ArticleBodyEditor: controlledValue = V1 (or RHF's clone with same content).
  → useEffect: stringify(V1) === lastSyncedKeyRef.current → return early. No setValue. ✓
```

Content equality holds regardless of how many fresh references RHF/Plate pipe through.

## Verification

- `pnpm tsc --noEmit` clean.
- `pnpm validate:meta-deps` clean (45/45).
- `pnpm registry:build` clean.
- `/components/json-form` and `/components/article-body-01` render 200 in dev.
- **User browser verification pending** — user reports the previous v0.2.2 fix produced focus-stealing; this two-bump batch removes both the React #185 and the focus-loss symptoms.
- **Path-b smoke** runs separately after push.

## Patch-bump exemption (both)

Per [`.claude/rules/component-readiness-review.md`](../rules/component-readiness-review.md), patch-level non-public-API bug fixes skip GATE 3. v0.2.0/v0.2.1/v0.2.2 verdicts carry forward.

## Lessons learned

1. **Consumer-side stabilization of a stateful library's controlled prop is brittle.** When the substrate uses reference equality internally, hoisting a content-stable wrapper above it INVERTS the bug: instead of "always firing setValue", you get "always firing setValue at the wrong moment." Fix the equality check at the substrate.
2. **The 'three-defenses' controlled-mode pattern still applies — but defense #2 is content-equality, not reference-equality.** This is the canonical lesson from `flow-canvas-01` v0.2.3 (round-trip echo guard). article-body-01 v0.2.2 brings it into line.
3. **Don't ship a fix without dev-browser interaction-level verification.** The v0.2.2 fix passed tsc, lint, registry-build, dev page-load — all green. But the actual interaction (typing) was broken. SSR + page-fetch verification can't catch this class of regression.

## Open items inherited from v0.2.0 review

| Finding | Severity | Status |
|---|---|---|
| F-03 — default-registry whitelist drift lint | ⚠️ High | Still open. v0.2.x patch or v0.3.0. |
| F-07 — `defineFieldRenderer` config-key narrowing | 🔹 Low | Indefinite defer. |
