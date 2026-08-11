# Naming Canon — P2.1 decision doc (GATE 1)

**Authored:** 2026-08-11 · **Status: LOCKED 2026-08-11** — user delegated per-row sign-off to the revalidation pass (goal directive "revalidate the names then start P2"); revalidation executed same day (surface scan ~15k occurrences, collision check all-63 pairwise + shadcn-primitive check, exports inventory). **One flip vs the draft:** `gantt-timeline-01` → **`gantt-timeline`** (not `gantt-chart`) — the search keyword is `gantt`, present either way; the component's entire public vocabulary is `GanttTimeline*`, so the re-stem bought no searchability for ~200 churn sites. · Parent: [production-readiness-plan.md](production-readiness-plan.md) §P2 · Locked upstream: D1 (drop `-NN`), D6 (directory PR gated on P2)

**Scope note (revalidation):** the rename is applied to the FULL public surface — slugs, folders, file basenames, exported identifier families (`RichCard*`→`CardTree*`, `TodoRichCard*`→`TaskCard*`, `Todo*`/`todo*`/`TODO_*` type family→`Task*` equivalents, `ArticleBody*`→`RichText*`, `ContentCard*`→`NewsCard*`, `Registration*`→`Signup*` scoped to signup-form, `Workspace*`→`SplitWorkspace*` scoped, `RichSidebar*`→`AppSidebar*`, `CooperativeChallenge*`→`TeamChallenge*`, `TaskChoice*`→`TaskClaim*`, `GridLayout*`→`MagazineLayout*`, `FilterStack*`→`FilterPanel*`, `ThumbList*`→`ThumbnailList*`, `NewsletterCard*`→`NewsletterSignup*`, `PageHeroNews*`→`PageHero*`, `MediaCarouselEditor01*`→`CarouselComposer*`, `Calendar01`→`EventCalendar`, plus mechanical `Xxx01`→`Xxx` for all suffix-drops). Half-renamed surfaces (new slug, old symbols) would fail the consistency bar. History zones (decision files, review files, migrations, archives, `component-versions.md`) keep old names verbatim.

**Goal:** one professional naming system, applied once, before any consumer base grows. Names must be (user directive 2026-08-11):

1. **Predictable** — for human developers *and* AI agents: the slug contains the exact keyword someone would search for (`kanban`, `gantt`, `pdf`, `signup`, `pricing`).
2. **Simple + memorizable** — 1–3 kebab words, no filler.
3. **Informational** — the slug alone tells you what the component is and distinguishes it from its siblings.

## 1. The canon (rules — these feed `validate:naming` at P2.4)

| # | Rule |
|---|---|
| N1 | Slug = `<domain-keyword>[-<form>]`, kebab-case, 1–3 words, matching `^[a-z]+(-[a-z0-9]+){0,3}$`. |
| N2 | **Keyword-first:** the term a dev/AI would type when searching must appear in the slug (`gantt`, `kanban`, `signup`, `newsletter`, `thumbnail`), not a synonym or house word. |
| N3 | **Form suffix names what it renders:** `-card`, `-tree`, `-bar`, `-list`, `-grid`, `-editor`, `-viewer`, `-composer`, `-picker`, `-form`, `-panel`, `-canvas`, `-layout`. |
| N4 | **No version suffixes** (`-NN`) — version lives in the version field. `-2` returns only when a true second *variant* ships (D1, locked). |
| N5 | **No vague qualifiers** — `rich-`, `content-`, `info-` only where they carry real meaning; a qualifier must separate the component from an actual sibling. |
| N6 | **Families share stems:** `*-tree` (file / task / card), `*-composer` (story / content / carousel), `team-*` (all gamification), `media-*`, `story-*`, `filter-*`, `article-*`. |
| N7 | **No collision with shadcn/ui primitive names** (`calendar`, `sidebar`, `table`…) — a namespaced item that shadows a base primitive confuses consumers and AI agents in mixed registries. |
| N8 | No stem collisions inside the catalog (uniqueness checked by the validator). |

## 2. Description canon (locks P2.5's target)

One sentence, **≤160 chars**, capability-first, zero internal jargon (no `D-\d+` IDs, no version archaeology, no self/sibling slug references). Model: `data-table`'s 99-char form.

## 3. Rename table (63 rows — user signs per row)

Classes: **keep** (no change) · **drop** (remove `-NN` only) · **re-stem** (real rename, rationale given).

### 3a. Re-stems (19 — the judgment rows)

| Old | New (proposed) | Why | Alternative |
|---|---|---|---|
| `article-body-01` | `rich-text-editor` | It IS a Plate WYSIWYG editor + viewer; "rich text editor" is the #1 search term for this; pairs with `markdown-editor` / `media-editor` | `article-body` (keeps article-kit stem) |
| `calendar-01` | `event-calendar` | "event calendar" is the standard search term for month/week/day/agenda UIs; avoids shadowing shadcn's `calendar` date-picker (N7) | `task-calendar` (it renders TodoItem[]) |
| `content-card-news-01` | `news-card` | Magazine/news teaser card — `news` is the keyword; "content card" says nothing | — |
| `gantt-timeline-01` | `gantt-timeline` | **Revalidation flip:** keyword `gantt` present either way; `gantt-chart` re-stem bought nothing for ~200 churn sites — suffix-drop only | ~~`gantt-chart`~~ (rejected) |
| `rich-card` | `card-tree` | Recursive card-tree viewer/editor; "rich" is the vaguest word in the catalog; joins the `*-tree` family (file-tree, task-tree) | `card-tree-editor` (plan's example) |
| `rich-card-in-flow` | `card-tree-node` | It's the flow-canvas node renderer for card-trees — name says exactly that | `card-tree-flow-node` |
| `thumb-list-01` | `thumbnail-list` | "thumbnail" is the search keyword; "thumb" is ambiguous (thumbs-up?) | `thumb-list` |
| `todo-rich-card` | `task-card` | Fixed-schema task card — simplest true name; "task" is the professional keyword; anchors the task family | `todo-card` |
| `todo-tree` | `task-tree` | Family unification with `task-card` (same TodoItem substrate); `*-tree` stem intact | keep `todo-tree` |
| `filter-stack` | `filter-panel` | Schema-driven vertical filter panel — "filter panel" is what devs search; "stack" describes CSS, not purpose | keep `filter-stack` |
| `registration-form-01` | `signup-form` | It's an account signup (email+password+OAuth+magic-link) — "signup form" is the keyword. Also breaks the false pairing with `registration-card` (which is *event* registration) | `registration-form` |
| `cooperative-challenge-01` | `team-challenge` | `team-` prefix unification (locked); shorter, keyword intact | `team-coop-challenge` |
| `task-choice-control-01` | `team-task-claim` | `team-` unification; the core affordance is claim/volunteer/release — "choice control" is opaque | `team-task-choice` |
| `grid-layout-news-01` | `magazine-layout` | Its own description says "magazine layout"; instantly informational | `news-grid` |
| `workspace` | `split-workspace` | Locked example (P2.1); "workspace" alone is too generic; "split" names the capability | `split-panes` |
| `newsletter-card-01` | `newsletter-signup` | CTA + email signup — "newsletter signup" is the exact search phrase | `newsletter-card` |
| `page-hero-news-01` | `page-hero` | Generic hero band (badge/title/stats) — not news-specific; "hero" is the keyword | `hero-section` |
| `media-carousel-editor-01` | `carousel-composer` | Multi-item post creation (IG feed-post semantics) — joins the `*-composer` family (story-, content-) | `media-carousel-editor` |
| `rich-sidebar` | `app-sidebar` | App-shell sidebar; same vague `rich-` purge as rich-card; "app sidebar" is the standard shadcn-ecosystem term; avoids shadowing base `sidebar` (N7) | keep `rich-sidebar` |

### 3b. Suffix-drops (33 — mechanical, block-approvable)

`article-meta` · `blackboard` · `comment-thread` · `engagement-bar` · `event-card` · `expandable-text` · `flow-canvas` · `info-list` · `kanban-board` · `people-grid` · `post-card` · `progress-timeline` · `project-card` · `registration-card` · `schedule-list` · `story-rail` · `category-cloud` · `filter-bar` · `team-feedback-loop` · `team-progress-bar` · `team-quest-log` · `team-trophy-shelf` · `author-card` · `pricing-table` · `share-bar` · `content-composer` · `media-carousel` · `media-editor` · `media-library` · `story-composer` · `story-viewer` · `video-player` · `account-switcher`

### 3c. Unchanged (11)

`code-block` · `data-table` · `stat-card` · `detail-panel` · `entity-picker` · `json-form` · `markdown-editor` · `properties-form` · `pdf-viewer` · `file-manager` · `file-tree`

**Uniqueness check:** all 63 proposed slugs are pairwise distinct; no proposed slug collides with a shadcn/ui primitive name.

## 4. Domain lock (P2.1 requirement)

**✅ DECIDED 2026-08-11 (user): `ui.ilinxa.com`.** The directory entry's `url` template is effectively permanent (a move = a second PR to `shadcn-ui/ui`), so this is final.

Execution (rides P2.2–P2.6, before the directory PR):

1. Attach `ui.ilinxa.com` to the Vercel project (project → Settings → Domains); DNS: `CNAME ui → cname.vercel-dns.com` on the ilinxa.com zone.
2. Registry item URLs become `https://ui.ilinxa.com/r/<slug>.json`; `ilinxa-proui.vercel.app` keeps serving/redirecting (never removed — old consumers' `components.json` may pin it).
3. Update every URL surface in the same sweep: `registry.json` `homepage`, site `metadataBase`/OG, llms.txt + README catalog links, `components.json` registries examples, smoke-harness consumer config.
4. Directory PR entry (2.6) uses `https://ui.ilinxa.com/r/{name}.json`.

## 5. Downstream (for reference — not part of this sign-off)

- 2.2 scripted sweep renames: folders, `manifest.ts`, `registry.json` (**both** items per component — base + `-fixtures`), cross-procomp imports, `docs/procomps/` folder names, guide/meta text.
- 2.3 old slugs stay as deprecated thin alias items (`registryDependencies: [new]`) for one grace window.
- 2.4 `validate:naming` enforces §1 + §2 mechanically.

---

*Sign-off record (fill at approval): per-row verdicts + domain decision → then this doc flips to LOCKED and 2.2 begins.*
