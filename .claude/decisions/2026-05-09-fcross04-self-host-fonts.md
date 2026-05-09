---
date: 2026-05-09
session: 14
phase: 7-followup
type: cleanup
commits:
  - (this commit)
components: []
findings:
  - F-cross-04 (closed)
status: complete
---

# F-cross-04 closed — Self-hosted fonts replace `next/font/google`

Replaced all three Google Fonts loads with `@fontsource-variable/*` npm packages so `pnpm build` no longer requires network access to Google Fonts at build time.

## Summary

| Before | After |
|---|---|
| `import { Onest, JetBrains_Mono, Playfair_Display } from "next/font/google"` | `import "@fontsource-variable/onest"` (+ JBMono + Playfair) |
| Three font instances with `subsets`, `weight`, `display` configs | Three side-effect imports — variable fonts cover all weights in one woff2 each |
| `playfairDisplay.variable` className on `<html>` (Next.js injected) | Static `<html className="h-full antialiased">` — variables defined in globals.css |
| Build-time fetch from `https://fonts.googleapis.com` | Build-time read from `node_modules/@fontsource-variable/*` |

## Changes

**Code:**
- `src/app/layout.tsx` — removed `Onest` / `JetBrains_Mono` / `Playfair_Display` imports + their instance configs; replaced with three `@fontsource-variable/*` side-effect imports; `<html>` className simplified
- `src/app/globals.css` — added `:root { --font-onest / --font-jetbrains-mono / --font-playfair-display }` static declarations with system-font fallbacks; existing `@theme inline` references stay unchanged (still consume the same variables)
- `src/fontsource.d.ts` — new ambient TS declarations for the three CSS-shipping packages so side-effect imports typecheck

**Dependencies (package.json):**
- Added: `@fontsource-variable/onest@^5.2.11`, `@fontsource-variable/jetbrains-mono@^5.2.8`, `@fontsource-variable/playfair-display@^5.2.8`

## Why variable-font versions

The original setup had Playfair Display with `weight: ["400", "700"]`. Variable fonts ship a single woff2 covering all weights 100–900, so consumers can use any weight without per-weight CSS imports. Same pattern applied to Onest (already variable) and JetBrains Mono.

Trade-off: variable woff2 files are ~10–30% larger than per-weight files. But the per-weight pattern requires multiple imports per font (e.g., `@fontsource/playfair-display/400.css` + `/700.css`); variable is one import. For the docs site's font-loading pattern (small static set, cached after first paint), file size is not the constraint — simplicity is.

## Verification

- `pnpm tsc --noEmit` clean
- `pnpm lint` clean
- **`pnpm build` succeeds in 37s** — primary acceptance test for F-cross-04. 44 static pages generated. No font-fetch failure.

The two `[rich-card] at requirements.browsers / notes: array values are not supported as children` warnings during page generation are pre-existing schema notices from rich-card's v0.1 dummy-data; unrelated to font handling.

## What was lost

Next.js's automatic font-optimization tags (preconnect, preload to Google Fonts) are gone — but they were pointing at `fonts.googleapis.com`, which we explicitly don't want. The fontsource files are served from the app's own bundle, so preload happens via the standard CSS-loader pipeline (no extra `<link>` tags needed).

## Cross-references

- Sweep tracker F-cross-04 row updated: Open → CLOSED
- STATUS.md "Open decisions / TODOs" — F-cross-04 entry struck through
- Related: F-cross-04 was the last "informed-defer" in the smaller-opens cleanup ([`2026-05-09-session-14-smaller-opens-cleanup.md`](2026-05-09-session-14-smaller-opens-cleanup.md))
