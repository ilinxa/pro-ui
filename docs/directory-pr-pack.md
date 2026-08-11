# Directory PR pack — `@ilinxa` → shadcn-ui/ui `apps/v4/registry/directory.json` (P2.6)

> Assembled 2026-08-11 at P2 close. Submission is gated on: P2 deployed ✅ + `ui.ilinxa.com` DNS live (user action) + post-deploy clean-project audit (§3). Verified flow + requirements: [registry-directory-plan.md](registry-directory-plan.md).

## 1. The entry (exact JSON — one alphabetical insert)

```json
{
  "name": "@ilinxa",
  "homepage": "https://ui.ilinxa.com",
  "url": "https://ui.ilinxa.com/r/{name}.json",
  "description": "High-level composed components for shadcn/ui — kanban, gantt, calendar, media editors, story viewers, flow canvas, forms, and more, each with optional demo fixtures.",
  "logo": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 48 48\" fill=\"var(--foreground)\"><rect x=\"6\" y=\"6\" width=\"16\" height=\"16\" rx=\"4\"/><rect x=\"26\" y=\"6\" width=\"16\" height=\"16\" rx=\"8\"/><rect x=\"6\" y=\"26\" width=\"16\" height=\"16\" rx=\"8\"/><rect x=\"26\" y=\"26\" width=\"16\" height=\"16\" rx=\"4\"/></svg>"
}
```

Logo: square 48×48 viewBox, single `var(--foreground)` fill (theme-aware per the directory Zod schema requirement), 2×2 tile mark with alternating radii — legible at 16px, no brand colors to clash with either theme.

## 2. PR draft

- **Repo:** fork of `shadcn-ui/ui`, branch `add-ilinxa-registry`, PR against `main`.
- **Diff:** exactly one entry in `apps/v4/registry/directory.json`, alphabetical position.
- **Pre-push check:** `pnpm validate:registries` in the fork (validates the Zod schema incl. logo).
- **PR title:** `feat(registry): add @ilinxa to the registry directory`
- **PR body:**
  > Adds **@ilinxa** (ilinxa pro-ui) to the registry directory — 63 MIT-licensed, high-level composed components built on shadcn/ui (kanban board, gantt timeline, event calendar, media editors, story viewer/composer, flow canvas, forms, gamification), each with an optional `-fixtures` sibling for demo data.
  >
  > - Registry index: https://ui.ilinxa.com/r/registry.json (flat, no `content` in index `files[]`)
  > - Items: `https://ui.ilinxa.com/r/{name}.json` — verified installable via `shadcn add` from a clean project (Radix and Base UI consumers, full-catalog smoke)
  > - Homepage/docs: https://ui.ilinxa.com · AI reference: https://ui.ilinxa.com/llms.txt
  > - Source: https://github.com/ilinxa/pro-ui (MIT)
- **After merge:** verify `@ilinxa` appears in `https://ui.shadcn.com/r/registries.json`, zero-config `add` from a clean project, shadcn-MCP discoverability; then flip site install docs to lead with the namespace command. No pinging reviewers — no SLA.

## 3. Clean-project audit checklist (run post-deploy, pre-PR)

Fresh `create-next-app` + Tailwind v4 + `components.json` with:

```json
"registries": { "@ilinxa": "https://ui.ilinxa.com/r/{name}.json" }
```

| Verb | Command | Pass condition |
|---|---|---|
| list | `pnpm dlx shadcn@latest list @ilinxa` | 63 base + fixtures items listed, no aliases confusion |
| view | `pnpm dlx shadcn@latest view @ilinxa/card-tree` | files + deps render |
| search | `pnpm dlx shadcn@latest search @ilinxa -q kanban` | kanban-board found |
| add | `pnpm dlx shadcn@latest add @ilinxa/kanban-board` | installs + `tsc` clean |
| add fixtures | `pnpm dlx shadcn@latest add @ilinxa/kanban-board-fixtures` | pulls base + dummy-data |
| alias redirect | `pnpm dlx shadcn@latest add @ilinxa/kanban-board-01` | resolves via alias to the new item |

## 4. Standing obligations once listed (fold into P5.3 sweep)

URL template stability (`ui.ilinxa.com` locked at P2.1) · registry stays publicly accessible · MIT LICENSE intact · item descriptions kept current (validate:naming enforces the copy canon).
