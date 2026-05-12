---
date: 2026-05-12
type: feature
components: []
status: shipped
---

# Component detail page — shadcn parity Phase 1

## Summary

Reshaped the `/components/<slug>` detail page to match the shadcn-style information architecture: added an **Installation** block (PM tabs + copy command), a **View Code** Dialog overlay on the Preview, and an inline **Demo source** code-block between Preview and Usage. Implemented via a new build-time source-map generator at [scripts/build-source-map.mjs](../../scripts/build-source-map.mjs) that extracts every `demo.tsx` source into a typed module the page imports. Zero per-component authoring required — every existing component picked up the new sections for free. Phase 2 (Examples) and Phase 3 (Composition + API Reference) are documented in the plan but deferred.

## Context

The user pointed to shadcn's Card page as the UX target. Our detail pages had: title + status + version + description + Context + `<Demo />` + `<Usage />` + Features + Tags + Dependencies. Missing the install command, the View-Code button on the demo, structured code blocks, composition, examples, and API reference.

Comprehensive plan authored under plan-mode at [`.claude/plans/create-a-comprehensive-plan-hidden-pebble.md`](../plans/create-a-comprehensive-plan-hidden-pebble.md) — 3 phases, user-locked decisions:
- **DP-1 Usage strategy** = hybrid + migration tracker (don't touch the 41 existing `usage.tsx` files; new components go structured; tracker at [docs/usage-migration-tracker.md](../../docs/usage-migration-tracker.md))
- **DP-3 View Code surface** = Dialog on Preview (Phase 1), inline collapsible on Examples (Phase 2)
- **DP-2 API ref source** = deferred until Phase 3 start

The exploration phase corrected three significant earlier claims of mine:
1. "Most guides have a composition tree" — FALSE; 0 of 6 sampled guides have ASCII trees.
2. "API reference exists in guides — extract it" — FALSE; only data-table has anything close.
3. "Build-time fs reads have precedent in src/app/" — FALSE; no `readFile`/`fs.promises` anywhere in `src/app/` before this commit.

These corrections meaningfully shaped the phasing — what looked like "stitch existing content together" is mostly "build new content surface, then backfill incrementally."

## Outcome

**Files created:**
- [scripts/build-source-map.mjs](../../scripts/build-source-map.mjs) — globs `src/registry/components/<category>/<slug>/demo.tsx` (+ future `examples/*.tsx`), emits a typed map at `src/app/components/[slug]/_lib/source-map.generated.ts`.
- [src/app/components/[slug]/_components/installation-block.tsx](../../src/app/components/[slug]/_components/installation-block.tsx) — Command / Manual outer tabs; pnpm / npm / yarn / bun PM sub-tabs; copy via existing `useCopyToClipboard`.
- [src/app/components/[slug]/_components/view-code-dialog.tsx](../../src/app/components/[slug]/_components/view-code-dialog.tsx) — Top-right button on Preview; Dialog opens to a full-source code-block.
- [src/app/components/[slug]/_components/demo-source-block.tsx](../../src/app/components/[slug]/_components/demo-source-block.tsx) — Inline code-block view of demo source with `maxLines=28` collapse + `showExpand` for long demos.
- [docs/usage-migration-tracker.md](../../docs/usage-migration-tracker.md) — 41 unmigrated rows; per-component flip as authors touch each next.

**Files modified:**
- [src/app/components/[slug]/page.tsx](../../src/app/components/[slug]/page.tsx) — page section order now: header → Context → **Installation** → **Preview (with View-Code button)** → **Demo source** → Usage → Features/Tags/Dependencies.
- [package.json](../../package.json) — added `predev` + `prebuild` + `build:source-map` scripts; extended `vercel-build` to call the generator before `next build` (vercel-build doesn't trigger the `prebuild` lifecycle hook).
- [.gitignore](../../.gitignore) — excludes `/src/app/components/[slug]/_lib/source-map.generated.ts`.

**Verification:**
- `pnpm tsc --noEmit` — exit 0, no output.
- `pnpm lint` — clean (only the 2 pre-existing TanStack Virtual `incompatible-library` warnings on file-manager + file-tree).
- `pnpm validate:meta-deps` — 41/41 clean.
- `pnpm build:source-map` — wrote 9,128-line generated module covering 41 demos, 0 examples.
- Browser verification (manual, by author): `pnpm dev` to boot, then visit `/components/<slug>` for stat-card, code-block, file-tree, flow-canvas-01 in light + dark. Confirm Install copies for all 4 PMs, View-Code Dialog renders correct source with Shiki highlighting in both themes, Demo source inline collapses past 28 lines.

**Authoring cost for Phase 1:** Zero per component. Structural-only.

## Post-ship fix (same day)

User asked "does `pnpm dlx shadcn@latest add @ilinxa/flow-canvas-01` really work?" — surfacing that the first cut of the Installation block only printed the `add` command, missing the **two prerequisite steps** every fresh consumer needs (shadcn init + the `@ilinxa` registries fragment in `components.json`). Per project memory `project_registry_live` and the canonical wording in [README.md](../../README.md) §"Install components in your app", the install flow is 3 steps:

1. `pnpm dlx shadcn@latest init` (once per project; seeds `lib/utils.ts`)
2. Add `"registries": { "@ilinxa": "https://ilinxa-proui.vercel.app/r/{name}.json" }` to `components.json` (once per project)
3. `pnpm dlx shadcn@latest add @ilinxa/<slug>` (per component; or `<slug>-fixtures` for dummy data)

Rewrote [installation-block.tsx](../../src/app/components/[slug]/_components/installation-block.tsx) to surface all three steps with numbered `<StepLabel>` markers, separate copy buttons for each (init command, registries JSON snippet, install command, fixtures install command), and per-PM runner prefixes (`pnpm dlx` / `npx` / `yarn dlx` / `bunx --bun`) applied uniformly across both `init` and `add`. tsc + lint clean.

## Cross-references

- Comprehensive plan: [`.claude/plans/create-a-comprehensive-plan-hidden-pebble.md`](../plans/create-a-comprehensive-plan-hidden-pebble.md) — covers Phase 2 (Examples convention + stat-card / flow-canvas-01 migrations) and Phase 3 (Composition + API reference) as deferred work
- Migration tracker (per DP-1): [docs/usage-migration-tracker.md](../../docs/usage-migration-tracker.md)
- Reused: [code-block](../../src/registry/components/code/code-block/) v0.1.0 (Shiki dual-theme view-mode), `useCopyToClipboard`, ui/tabs.tsx, ui/dialog.tsx
- Install-flow canonical wording: [README.md](../../README.md) §"Install components in your app" — keep all 4 surfaces (README / llms.txt / src/app/docs / src/app/page / and now this detail-page block) in sync per `project_registry_live` memory
- This is docs-site work, NOT a registry component → bypasses GATE 3 readiness review per the rule scope
