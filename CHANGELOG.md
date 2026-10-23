# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The registry as a whole is tracked by date; individual components carry their own SemVer versions, listed in [docs/component-versions.md](docs/component-versions.md).

<!-- wl:changelog.unreleased -->
## [Unreleased]
<!-- /wl -->

### Components
- `app-sidebar` 0.5.1 — source comments only: two escape notes for the new consumer-contract gate (the deprecated `side="left" | "right"` aliases are physical by definition; the drawer's Escape listener never acts on typing). No behaviour change; bumped so one version always means one file content.

### Registry
- The consumer contract (C1–C12) is now a build gate: palette colours, physical inline-axis utilities, `{placeholder}` label templates, locale-less formatting, render-time clock reads, hard-coded JSX text and unguarded window keydown listeners fail `registry:build` and `pnpm lint` beyond a checked-in baseline that can only shrink. Rules and escapes: [component guide §19](docs/component-guide.md#19-consumer-contract-c1c12).
- `globals.css` defines the contract tokens `--brand`, `--success`, `--info` (each with `-foreground`), `--story-ring-from` / `--story-ring-to` and `--media-overlay` / `--media-overlay-foreground`. The README has a generated token table listing which items map each one.
- Every npm dependency in `registry.json` is pinned to the range pro-ui installs and tests (`package.json`). The build fails on a bare name or a drifted range. Heavy items (`media-editor`, `rich-text-editor`, `markdown-editor`, `pdf-viewer`, `code-block`, `flow-canvas`) are flagged in `meta.ts`; a new static import or `registryDependencies` edge into one — directly or through an item that already pulls one — fails the build. The existing edges are listed in `scripts/heavy-edges-baseline.json` and close as each component moves to a slot.
- Test helpers for component authors in `tests/helpers/`: render with `dir` / `locale`, an axe assertion, jsdom stubs (matchMedia, ResizeObserver, IntersectionObserver, layout, Embla, media playback) and `describeContract`, which runs the six consumer-contract checks; `expandable-text` is the reference.
- New components scaffold with a typed `labels` interface, `default<Name>Labels`, a `number | null` count, a `locale` prop and an optimistic `use-controllable-state` hook, each with tests.

## [2026-10-23] — Social-platform hardening

Every component version from here on has an entry in this file; `pnpm registry:build` fails on a version without one (`scripts/validate-changelog.mjs`). Versions that predate the rule are listed in `scripts/changelog-baseline.json`.

### Components
- `app-sidebar` 0.5.0 — controlled `isCollapsed` toggles from the rendered value and never touches storage; the mobile drawer always shows full labels; CSS variables set on any ancestor win and reach the portalled drawer (`drawerClassName`, `drawerStyle`, `--ilinxa-sidebar-drawer-w`); `labels` covers every string, with badge-aware row names and `formatBadgeCount`; `side="start" | "end"` with RTL; presence and badge colours use tokens. **Breaking:** rows are 2.75rem tall, `data-side` reads `"start"` by default, expanded badge rows are named "Label, 5".
- `story-rail` 0.4.0 — optional `previewImage` with avatar fallback and `onPreviewError` refresh; `--story-ring-from` / `--story-ring-to`; `muted` authors; `arrows="fine-pointer"`; controlled `items` + `onItemsChange`; RTL; scroll-aware edge fades; the Add tile reads the rail's `labels`. **Breaking:** `ref.scrollTo(i)` no longer lands one tile off with `leading`; the Add tile's default name is "Add story".
- `story-viewer` 0.5.2 — removing the current story no longer freezes playback; reply-box keys no longer drive the viewer; `triggerReply` content and per-item drafts are kept.
- `story-composer` 0.5.0 — the publishing overlay renders inside the dialog, so Retry and Cancel work. Needs `media-editor` 0.4.0 or later.
- `media-editor` 0.4.0 — nested `labels` apply; new `overlay` prop; not-implemented handle methods carry `@notImplemented` and warn in development.
- `rich-text-editor` 0.4.0 — embeds are sandboxed and checked against `embedAllowList` / `isEmbedAllowed`; links pass through `safeHref`.
- `post-card` 0.5.1 — double-tap only ever likes, never unlikes.
- `carousel-composer` 0.2.1 — `openEditor()` refuses video items (there is no WebM-free re-encode path).
- `video-player` 0.2.1 — taps on the controls no longer count towards a double-tap.
- `event-calendar` 0.5.1 — a prop that does nothing yet now says so in development.
- `news-card` 0.4.3 — a prop that does nothing yet now says so in development.
- `card-tree` 0.6.3 — three runtime error strings no longer name a future version.

### Registry
- Theme tokens ship as `cssVars.theme` mappings with `var()` fallbacks, never `light` / `dark` values, so the CLI never overrides a consumer's own theme. `--destructive-foreground` is defined.

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
