---
date: 2026-05-13
session: json-form v0.1.4 — pre-push path-b smoke against locally-served artifact
phase: post-Phase-7 / GATE-3-rule era
type: patch-bump
commits: pending (this session)
components: json-form (v0.1.3 → v0.1.4; consumer-tsc-clean post-smoke)
findings: closes F-01 from v0.1.0 spotcheck (smoke harness path-b)
status: open
---

# json-form v0.1.4 — F-cross-11 path-b smoke surfaces 4 real bugs producer-tsc didn't catch

## Setup

User asked to run smoke tests on json-form. Standard path-b smoke (`scripts/smoke-all.mjs` in `e:/tmp/ilinxa-smoke-consumer/`) pulls artifacts from `https://ilinxa-proui.vercel.app/r/{name}.json` — but local master is 2 commits ahead of `origin/master`, so neither code-block nor json-form were yet deployed there (commits `832e4f0` + `06fa086` never pushed). Smoking against the deployed URL would have failed pre-emptively at `@ilinxa/code-block` resolution (HTTP 404) before even reaching json-form.

To run the smoke pre-push, **served the local `public/r/` over HTTP** (`python -m http.server 8765` in the producer's artifacts dir) and **temporarily redirected the smoke consumer's `@ilinxa` namespace** from `https://ilinxa-proui.vercel.app/r/{name}.json` to `http://localhost:8765/{name}.json` (one-line edit to `components.json`). Reset both at the end of the session.

This pattern is generalizable: pre-push smoke against locally-served artifacts validates the registry-distribution shape AND the consumer-side install flow without requiring a Vercel round-trip. Worth documenting in `HARNESS.md` once we have a few more uses.

## What the smoke caught

Producer-side `pnpm tsc --noEmit` was **clean** at v0.1.3. Consumer-side `pnpm tsc --noEmit` after `pnpm dlx shadcn@4.6.0 add @ilinxa/json-form` surfaced four real errors in json-form's installed source:

### F-S1 — Cross-folder barrel imports get mis-rewritten

The producer side imported `@/registry/components/data/article-body-01` (the barrel `index.ts`) in two places:
- `parts/field-richtext.tsx` — for `ArticleBodyEditor`
- `index.ts` — for the `JSON_FORM_RICHTEXT_EMPTY_VALUE` re-export

shadcn's path rewriter (which converts producer paths to consumer paths at install time) doesn't know that the source path points at a directory's barrel. Instead, it appends the slug name as a file: `@/registry/components/data/article-body-01` → `@/components/article-body-01/article-body-01`. This rewrite hits a file (`article-body-01.tsx`) that doesn't export `ARTICLE_BODY_EMPTY_VALUE` or `ArticleBodyValue` (those live in `types.ts`). Result: consumer-side `TS2459: Module ... declares 'ARTICLE_BODY_EMPTY_VALUE' locally, but it is not exported`.

**Fix:** import from specific files, not the barrel:
```ts
// before (broken)
import { ArticleBodyEditor, ARTICLE_BODY_EMPTY_VALUE, type ArticleBodyValue }
  from "@/registry/components/data/article-body-01";

// after (works)
import { ArticleBodyEditor } from "@/registry/components/data/article-body-01/article-body-01";
import { ARTICLE_BODY_EMPTY_VALUE, type ArticleBodyValue }
  from "@/registry/components/data/article-body-01/types";
```

`field-richtext.tsx` rewrites correctly under this pattern. But `index.ts` does NOT — same source path, but shadcn's rewriter keeps the `data/` segment (`@/components/data/article-body-01/types`) on consumer side, leaving an unresolvable path. I also tried routing through a `lib/richtext-helpers.ts` shim, but the rewriter applied the SAME wrong rewrite there too. The rewriter's flattening behavior is inconsistent between `parts/*.tsx` and `index.ts` / `lib/*.ts`. I can't see why from the outside, and don't want to fork shadcn's CLI to debug.

**Workaround:** Dropped the `JSON_FORM_RICHTEXT_EMPTY_VALUE` re-export from json-form's barrel entirely. Consumers using `richtext` should import the empty default directly from `@ilinxa/article-body-01` — it's already a transitive dep, so no extra install cost. Documented in usage.tsx.

`field-code.tsx` got the same fix prophylactically (worked by accident in the prior rewrite because code-block's `code-block.tsx` file does export `CodeBlock`).

### F-S2 — zodResolver overload silently picks the wrong branch on consumer side

Producer-side `zodResolver(zodSchema) as never` matched the v4 overload (`z4.$ZodType`). Consumer-side, same code, **same pinned versions** (`react-hook-form@7.75.0`, `@hookform/resolvers@5.2.2`, `zod@4.4.3`) — but tsc tried both v3 and v4 overloads and failed both:

```
Overload 1 of 4 (Zod3Type): Property 'typeName' is missing in type '$ZodObjectDef'
Overload 2 of 4 ($ZodType): _zod.version.minor — Type '4' is not assignable to type '0'
```

The resolver's d.ts imports from `zod/v3` and `zod/v4/core` subpaths. Identical d.ts in both producer and consumer trees. Identical `zod@4.4.3` resolved. tsconfig is identical (both have `moduleResolution: "bundler"`, `skipLibCheck: true`). I cleared tsbuildinfo, cleared `.next`, re-ran — same result. The overload-resolution behavior differs between producer and consumer trees somehow.

**Fix:** Bypass overload matching entirely with an argument cast:
```ts
resolver: zodResolver(zodSchema as never) as never,
```

Runtime behavior is unchanged — `zodResolver` dispatches via `instanceof` at runtime regardless of which TS overload "matched."

### F-S3 — `field-select` non-combobox onValueChange null

The installed shadcn `Select`'s `onValueChange` callback signature is `(value: string | null) => void` in the consumer's installed version (it's `(value: string) => void` in the producer's installed version — slight version drift in `radix-ui` types). Producer-tsc-clean; consumer-tsc fails on:

```ts
onValueChange={(v) => onChange(coerceOptionValue(v, options))}
// v is `string | null`; coerceOptionValue expects `string`
```

**Fix:** Guard the null:
```ts
onValueChange={(v) => onChange(v == null ? null : coerceOptionValue(v, options))}
```

### F-S4 — `field-slider` `onValueCommit` doesn't exist + value type is union

Same type-drift class as F-S3. The installed Slider's value type is `number | readonly number[]`, and there's no `onValueCommit` prop (the radix v3 name; current shadcn export only has `onValueChange`).

**Fix:**
- Moved the onBlur wiring to the wrapper div (`<div onBlur={onBlur}>...<Slider />`).
- Added a `firstNumber` helper that normalizes `number | readonly number[]` to a single number.

## Process notes

### Harness drift caught along the way

Consumer's `package.json` had `cmdk@^1.11.0` from a prior session — cmdk's latest is 1.1.1, so 1.11.0 doesn't exist. Looks like a fat-finger from an earlier session (matches `HARNESS.md`'s note about a `@types/node: ^9.14.0` regression that originated the same way — probably an Edit-tool match landed on the wrong line). Reset via `git checkout -- package.json pnpm-lock.yaml && pnpm install --frozen-lockfile`.

### Pre-existing consumer-side errors flagged but NOT fixed in this bump

The consumer-side tsc surfaced three issues that pre-date json-form's install:
- `src/components/code-block/code-block.tsx:363` — `TooltipProvider delayDuration` not in props. Real bug in code-block; needs its own decision file when we touch code-block next.
- `src/components/pdf-viewer/*` — `pdfjs-dist` + `react-pdf` peer deps not installed in the smoke consumer. Harness-baseline gap; pdf-viewer's procomp guide tells consumers to install these manually.
- `src/components/ui/calendar.tsx:90` — older `react-day-picker` ClassNames type. Calendar version drift; affects multiple components.

None block json-form; documented for follow-up.

### Producer/consumer tsc divergence is real

F-S2 in particular shows that producer-tsc-clean is NOT a proof of consumer-tsc-clean even with identical dependency versions. The smoke harness path-b IS the only catch for this class of bug. v0.1.0 spotcheck listed F-01 (smoke not yet run) as a Medium follow-up; in retrospect should have been **Blocker for v0.1.0 release**. Updating the soft norm: **for any component with cross-registry deps or wrapped third-party APIs, smoke path-b is part of the v0.1.0 ship checklist, not a follow-up.**

## Verification

- **`pnpm tsc --noEmit`** (producer): clean.
- **`pnpm lint`** (producer): 0 errors, 2 pre-existing warnings (file-tree/file-manager).
- **`pnpm validate:meta-deps`**: 42/42 clean.
- **`pnpm build`** (producer): clean.
- **`pnpm registry:build`**: clean. `public/r/json-form.json` regenerated.
- **Consumer-side `pnpm tsc --noEmit`**: zero json-form errors. The remaining tsc errors all pre-date json-form's install (code-block.tsx delayDuration, pdf-viewer peers, calendar drift).

## GATE 3 — skipped per the rule

Patch bump (v0.1.3 → v0.1.4). All changes are non-breaking on the API surface (the dropped `JSON_FORM_RICHTEXT_EMPTY_VALUE` re-export was added in v0.1.3, never in any pushed release — net-zero from the consumer's perspective).

## F-01 from v0.1.0 spotcheck — CLOSED

The "run smoke harness path-b" follow-up that v0.1.0 deferred is now closed. Component is path-b-clean pre-push.

## Outstanding follow-ups (deferred)

- **code-block.tsx:363** — TooltipProvider delayDuration bug surfaced under consumer-side tsc. File a code-block patch bump or roll into next code-block touch.
- **pdf-viewer + calendar** — harness-baseline gaps; consumers using pdf-viewer need to install pdfjs-dist + react-pdf themselves (already in guide).
- **shadcn path-rewriter quirk** — index.ts and lib/*.ts handle cross-slug imports differently from parts/*.tsx. Worth filing upstream once we can repro outside this codebase.

## Total component count

**42 components** across 8 categories (unchanged; v0.1.4 is a bump).
