# Systems (`docs/systems/`)

A **system** is a multi-component product surface that composes several pro-components, plus host code (page wiring, app-shell concerns, persistence adapters), into one coherent experience.

Pro-components live in [docs/procomps/](../procomps/) and ship through the procomp gate (description → plan → guide). A system sits **above** that — it is the integration contract that ties multiple pro-components together and locks the cross-cutting concerns (data model, permissions, communication patterns) that no single procomp could decide alone.

## When you need a system doc

You need a system doc when:

- **More than one pro-component must agree on a shared data model.** Example: every component in the graph system must understand the `origin: "system" | "user"` field. A single procomp doc cannot mandate this on the others.
- **Cross-cutting concerns span the components.** Permissions, real-time updates, source adapters, theme tokens that exceed [globals.css](../../src/app/globals.css).
- **The components are useful standalone but their composition is the actual product.** Each pro-component still gets its own procomp folder; the system doc tells you how they fit.

You **do not** need a system doc for a single pro-component, no matter how complex. That's what procomp docs are for.

## Folder shape

```
docs/systems/<slug>-system/
├── <slug>-system-description.md   ← Stage 1: what & why (sign off before Stage 2)
├── <slug>-system-plan.md          ← Stage 2: how (build order across components, integration tests)
└── <slug>-system-guide.md         ← Stage 3: consumer-facing composition guide
```

Same three-stage gate as procomps, scoped to the system rather than a single component.

## Relationship to procomp docs

- The system description **declares** which pro-components belong to it and what role each plays.
- Each pro-component still has its own `docs/procomps/<slug>-procomp/` folder with its own description / plan / guide.
- The system description **must reference** each procomp's docs and their sign-off status.
- When a cross-cutting decision is made (e.g., "every node has an `origin` field"), it is recorded in the system description's **Locked Decisions** section, and each procomp doc references that section rather than re-deciding.

## Current systems

| System | Status | Description |
|---|---|---|
| [graph-system](graph-system/graph-system-description.md) | draft, pending sign-off | Knowledge graph visualization, editing, and DB-adapter system. Composes 5 generic pro-components plus a graph-specific Tier 2 component. |
