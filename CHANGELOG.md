# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The registry as a whole is tracked by date; individual components carry their own SemVer versions, listed in [docs/component-versions.md](docs/component-versions.md).

<!-- wl:changelog.unreleased -->
## [Unreleased]
<!-- /wl -->

<!-- wl:changelog.2026-08-12 -->
## [2026-08-12] — Public baseline

First tracked public snapshot of the registry.

### Added
- 64 components across 9 categories, installable via `pnpm dlx shadcn@latest add @ilinxa/<slug>` — each with an optional `<slug>-fixtures` sibling that adds demo data.
- `empty-state` (feedback) — contextual empty-state surface, v0.1.0.
- Feature slices: opt-in extras (e.g. `event-calendar-editing`, `media-editor-capture`) that install into an existing component without overwriting your copies.
- AI reference at [ui.ilinxa.com/llms.txt](https://ui.ilinxa.com/llms.txt) for coding assistants consuming the registry.
- Community docs: contributing guide, security policy, support routes, code of conduct.

### Changed
- **Breaking (2026-08-11):** component slugs dropped their numeric suffixes (`kanban-board-01` → `kanban-board`, 52 renames). Old slugs still resolve through registry aliases, so existing install commands keep working; new installs should use the new names.

### Fixed
- Full-catalog install verification: 64/64 components install clean from a fresh project (Radix and Base UI consumers) with zero TypeScript errors.
<!-- /wl -->
