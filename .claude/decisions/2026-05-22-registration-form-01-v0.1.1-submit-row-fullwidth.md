---
date: 2026-05-22
type: fix
commits: [pending]
components: [registration-form-01]
findings: [submit-row-empty-left-misalignment]
status: shipped
---

# registration-form-01 v0.1.1 — submit-row full-width when no secondary actions

## Summary

User-reported layout glitch on the docs preview after v0.1.0 first ship. Default tab, single-step flow: the lone "Create account" button hugged the right edge of the form while the "Already have an account? Sign in" link below it sat centered — two different alignments stacked, reading as a layout bug. Same shape on step-1 of the two-step flow (with the button labelled "Continue").

Root cause in `parts/submit-row.tsx`:

```tsx
return (
  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
    <div className="flex gap-2">{/* Back / Skip — empty in single-step */}</div>
    <Button type="submit" ...>{effectiveLabel}</Button>
  </div>
);
```

`sm:justify-between` + an empty left-side flex child = primary action pushed to the right edge of the form. The empty left half is invisible; the misalignment against the centered sign-in link below is not. This was uniform across `Default`, `OAuth`, `Magic-link`, `Dense`, and `Controlled status` tabs (all single-step) plus step-1 of `Two-step`.

## Fix

`parts/submit-row.tsx` now derives `hasSecondaryActions = isStep2OfTwoStep` and collapses to a bare full-width button when false:

```tsx
const submitButton = (
  <Button
    type="submit"
    className={cn(!hasSecondaryActions && "w-full")}
    ...
  >
    {/* ... */}
  </Button>
);

if (!hasSecondaryActions) {
  return submitButton;
}

return (
  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
    <div className="flex gap-2">
      <Button type="button" variant="ghost" onClick={onBack}>{labels.backLabel}</Button>
      {skippableStepTwo ? (
        <Button type="button" variant="outline" onClick={onSkip}>{labels.skipForNowLabel}</Button>
      ) : null}
    </div>
    {submitButton}
  </div>
);
```

Single-step and step-1 of two-step: `<Button className="w-full">` standalone — no flex wrapper, no `justify-between`. Step-2 of two-step: unchanged — Back + optional Skip on the left, submit on the right.

The full-width primary action matches the email/password/consent input widths above it and reads as the deliberate next step under the centered `SignInLink`. No public-API change; no schema migration; no consumer call-site update required.

## Sibling demo polish (docs-only, not registry-shipped)

Two unrelated demo glitches surfaced and were fixed in the same commit since they affect the same preview surface but do not change shipped code:

1. **`TabsList` overlap with the "View Code" badge.** `flex w-full flex-wrap` → `flex flex-wrap gap-2`. The docs `[slug]` page renders an absolutely-positioned `<Button className="absolute right-3 top-3">View Code</Button>` over the preview wrapper. A `w-full` `TabsList` extended the last tab edge-to-edge, sliding "Controlled status" under the badge. Dropping `w-full` + adding `gap-2` matches the convention used by ~10 other tabbed demos in the registry (`article-meta-01`, `content-card-news-01`, `pricing-table-01`, `share-bar-01`, etc.). Last tab now sits cleanly inside the available width with the badge floating to its right.

2. **`Section` card wider than the form's natural width.** `flex flex-col gap-3 rounded-lg border border-border bg-card p-4` (full-width) → `mx-auto flex w-full max-w-md flex-col gap-3 rounded-lg border border-border bg-card p-6`. The form's default density caps at `max-w-md` (28rem); the previous full-width `Section` left ~half the card empty with the form pinned to the left. New width matches the form's natural max so the inputs fill the card content area (after `p-6` padding) with the heading and caption sitting flush above. Dense tab (compact density, `max-w-sm` form) retains a ~1rem left+right cushion inside the section — intentional for the compact density.

`demo.tsx` is never shipped via the registry per the locked target convention in [`CLAUDE.md`](../CLAUDE.md) (`Never include demo.tsx, usage.tsx, or meta.ts`). These changes affect only the docs preview surface.

## Verification

- `pnpm tsc --noEmit` → 0.
- `pnpm validate:meta-deps` → 47/47 clean.
- `pnpm validate:default-registry-whitelist` → 25/25 clean.
- `pnpm registry:build` → regenerates `public/r/registration-form-01.json` + `registration-form-01-fixtures.json` from the patched `parts/submit-row.tsx`; spot-checked the artifact for the new `w-full` class on the single-button path.
- Visual: dev server `/components/registration-form-01` — all 6 tabs render with the full-width submit on single-step + step-1 of two-step; step-2 preserves Back/Skip on the left + submit on the right. Tabs no longer collide with "View Code"; section cards are tight around the form.

## Patch-bump exemption

Non-breaking visual fix; no public-API change; no consumer migration. Patch-bump exemption per [`.claude/rules/component-readiness-review.md`](../rules/component-readiness-review.md) — GATE 3 skipped, v0.1.0 verdict carries forward. The 5 v0.1.0 GATE 3 follow-ups (F-01 magic-link password slot, F-02 step1Fields strategy-aware, F-03 demo OAuth icons, F-04 Medium path-b smoke, F-05 honeypot memo) remain queued for their respective bump targets — none overlap with this fix.

## Files touched

```
src/registry/components/forms/registration-form-01/parts/submit-row.tsx   (full-width branch when no secondary actions)
src/registry/components/forms/registration-form-01/demo.tsx                (docs-only — Section width + TabsList convention)
src/registry/components/forms/registration-form-01/meta.ts                 (version 0.1.0 → 0.1.1)
docs/component-versions.md                                                  (table row + Highlight)
.claude/STATUS.md                                                           (banner + Recent activity)
.claude/decisions/2026-05-22-registration-form-01-v0.1.1-submit-row-fullwidth.md  (this file)
```
