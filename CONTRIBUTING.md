<!-- wl:contributing.intro -->
# Contributing to ilinxa/pro-ui

Thanks for your interest. Useful contributions at this stage: bug reports from real consumer projects, fixes for install or type errors, and improvements to existing components. New-component proposals are welcome as issues first — every component here goes through a three-gate planning process before code, so an issue saves you from building something twice.
<!-- /wl -->

<!-- wl:contributing.setup -->
## Development setup

Requires Node 20+, pnpm 10.

```bash
git clone https://github.com/ilinxa/pro-ui.git
cd pro-ui
pnpm install
pnpm dev          # docs site at http://localhost:3000
```

Before pushing, run the same gates CI (Vercel) runs:

```bash
pnpm lint
pnpm tsc --noEmit
pnpm registry:build   # all validators + shadcn build
```

All three must pass clean. `registry:build` chains the project validators (meta-deps, naming, doc-drift, registry-json, artifact-size) — if one fails, the error names the file and rule.
<!-- /wl -->

<!-- wl:contributing.pr -->
## Pull requests

- Branch from `master`; name it `fix/<slug>-<what>` or `feat/<slug>-<what>`.
- Commits follow conventional-commit style: `fix(kanban-board): guard empty column drop`.
- Component code lives only in `src/registry/components/<category>/<slug>/` and may import only `react`, `@/components/ui/*`, `@/lib/utils`, and deps declared in the component's `meta.ts`. Never `next/*`.
- Changing a component's public API needs a version bump in its `meta.ts` and a CHANGELOG entry.
- One component (or one concern) per PR.

This is a small-team project; reviews usually land within a week, sometimes faster, sometimes not. If a PR sits longer than that, a polite bump on the thread is fine.

Full authoring reference — sealed-folder anatomy, design tokens, the gate workflow, a worked example: [docs/component-guide.md](docs/component-guide.md).
<!-- /wl -->

<!-- wl:contributing.bugs -->
## Reporting bugs

Use the bug-report issue template. The three things that make a report actionable: the component slug and version (from `docs/component-versions.md` or your install), your host setup (framework, React, Tailwind versions, package manager), and a minimal reproduction — the smallest snippet that shows the problem. "Install output + tsc error" is a perfectly good repro for install-time bugs.
<!-- /wl -->
