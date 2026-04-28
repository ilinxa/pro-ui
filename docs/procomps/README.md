# Pro-component planning docs (`docs/procomps/`)

Every new pro-component must pass through three written stages **before any code lands** in `src/registry/components/`. This directory holds those documents — one folder per component, three files per folder.

> The full rule (and *why* the gate exists) lives in [docs/component-guide.md §2](../component-guide.md#2-before-you-start) under "The procomp planning workflow (required gate)". This README is the operational reference: where files go, what each contains, and the order to write them.

## Folder shape

```
docs/procomps/<slug>-procomp/
├── <slug>-procomp-description.md   ← Stage 1: what & why (sign off before Stage 2)
├── <slug>-procomp-plan.md          ← Stage 2: how (sign off before any code)
└── <slug>-procomp-guide.md         ← Stage 3: consumer-facing usage notes
```

`<slug>` is the **same kebab-case slug** the component will use in the registry — e.g. `stat-card`, `multi-select`, `command-palette`. Folder names like `stat-card-procomp/` keep this directory grep-friendly when you have lots of components in flight.

## The three stages

### Stage 1 — Description (`<slug>-procomp-description.md`)

The "what & why". Cheap to revise. Aims to answer: *should we build this at all?*

Required sections:

- **Problem** — what user/team pain does this address?
- **In scope / Out of scope** — what this component IS and IS NOT (this is where most fights happen later if you skip it)
- **Target consumers** — who reaches for it, in what context (dashboard? landing page? auth flow?)
- **Rough API sketch** — 3–5 prop signatures, no implementation
- **Example usages** — 2–3 concrete scenarios where you'd drop it in
- **Success criteria** — how do you know the component is "done"?
- **Open questions** — things the author isn't sure about yet

**Gate: must be reviewed and signed off before Stage 2 begins.**

### Stage 2 — Plan (`<slug>-procomp-plan.md`)

The "how". This is the implementation contract.

Required sections:

- **Final API** — full prop types, exported names, generic parameters
- **File-by-file plan** — what goes in `<slug>.tsx`, `types.ts`, `dummy-data.ts`, `demo.tsx`, `usage.tsx`, `meta.ts`, `index.ts` (mirror the [component-guide §5 anatomy](../component-guide.md#5-anatomy-of-a-component-folder))
- **Dependencies** — shadcn primitives, npm packages, internal registry components
- **Composition pattern** — render-props? generics? slot props? headless+presentation? (see [component-guide §9](../component-guide.md#9-composition-patterns))
- **Client vs server** — does it need `"use client"`? Why?
- **Edge cases** — empty / loading / error states, long content, RTL, mobile
- **Accessibility** — keyboard interaction, ARIA, focus management
- **Risks & alternatives** — what could go wrong; what other shapes were considered

**Gate: must be reviewed and signed off before code begins.** Only after this is `pnpm new:component <category>/<slug>` allowed.

### Stage 3 — Guide (`<slug>-procomp-guide.md`)

The "how to use it" — written alongside (or after) the implementation. Eventually some of this content lands in the component's own `usage.tsx`, but this doc can go deeper than usage.tsx allows.

Suggested sections:

- **When to use / when NOT to use**
- **Composition patterns** — common ways consumers will assemble it
- **Gotchas** — non-obvious behavior, footguns, accessibility nuances
- **Migration notes** — if this supersedes another component
- **Open follow-ups** — known limitations, planned extensions

This doc is **not a hard gate**, but it should land in the same PR as the component.

## Workflow checklist

```
[ ]  1. Read .claude/STATUS.md — is this on the roadmap, or new?
[ ]  2. Grep src/registry/ for similar tags / features — surface naming collisions and duplicated work
[ ]  3. Create docs/procomps/<slug>-procomp/<slug>-procomp-description.md
[ ]  4. Get description signed off  ──── GATE 1
[ ]  5. Create docs/procomps/<slug>-procomp/<slug>-procomp-plan.md
[ ]  6. Get plan signed off          ──── GATE 2
[ ]  7. pnpm new:component <category>/<slug>
[ ]  8. Implement against the plan
[ ]  9. Author docs/procomps/<slug>-procomp/<slug>-procomp-guide.md
[ ] 10. Run the §13 verification checklist
[ ] 11. Update .claude/STATUS.md
```

## Why the gate exists

1. **Renaming and re-API-ing a published component is expensive.** Catching design issues at the description stage costs a paragraph; catching them after consumers exist costs a major version bump.
2. **The plan is the contract for review.** It is much easier to review "should we build this, and how?" against a written description than to argue against a half-finished implementation.
3. **The guide doc captures intent that the code can't.** Type signatures show shape; prose shows reasoning.

## What this directory is NOT

- **Not a changelog.** Use git history.
- **Not a long-form spec.** Each doc should be terse and decisional, not exhaustive.
- **Not a substitute for `meta.ts` / `usage.tsx`.** Those are the consumer-facing artifacts. Procomp docs are the planning trail.
- **Not where shipped components live.** Once the component is merged, the procomp folder remains as historical record but is no longer the source of truth — the code, `meta.ts`, and `usage.tsx` are.
