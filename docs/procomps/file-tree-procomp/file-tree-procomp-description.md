# file-tree — procomp description

> Stage 1: what & why. The "should we build this at all?" doc.
>
> **Greenfield component.** Not a migration. First component in a "file-system" family. Future siblings already on the active queue: `folder-manager` (Mac-Finder-style content pane that uses `file-tree` as an optional sidebar slot). Both share an `FsNode` data shape; `file-tree` lands first because its decisions lock the substrate.

## Problem

Every internal tool with hierarchical content — code/console/preview surfaces, document workspaces, asset libraries, knowledge bases, low-code builders, configuration UIs, log explorers, schema browsers — needs the same surface: **a vertical, indented, expand-collapse tree that can show files and folders with format-aware icons and supports the basic CRUD a user expects from a real explorer**.

Today's options all fail one way:

- **Roll your own with `<details>` / `<ul>`** — works for read-only display; falls apart the moment you need keyboard navigation, focus management, drag-drop, multi-select, or rename. Every team rebuilds the same accessibility + DnD code with subtle bugs.
- **Radix UI / shadcn primitives** — there is no shadcn `tree`. Radix has no tree primitive. The closest is `Collapsible`, which gives you one level. A real tree is recursion + focus management + arrow-key navigation, none of which Radix provides.
- **Headless tree libraries (`react-arborist`, `react-complex-tree`)** — capable but each comes with its own opinionated styling escape hatch, peer-dep weight (5–15 KB gz each), and quirks. Theming them to ilinxa tokens is wrapper-on-wrapper. They also all assume you want one specific data shape.
- **Per-app rebuilds** — what teams actually do today. The result is N slightly-different trees with N slightly-different keyboard maps, N different drag-drop semantics, N different rename UX patterns. This is exactly the duplication ilinxa-ui-pro exists to delete.

This component closes that gap with one opinionated, themeable, controlled-data tree that drops in anywhere a hierarchical-node list exists — file system, project structure, org chart, taxonomy, schema namespace.

## In scope

- **VSCode-shaped vertical tree** — indented, with chevron-style expand/collapse, optional indent guide lines, single-line nodes (icon + label, optional badge / hover-actions). The shape that 90% of consumers picture when they say "file tree."
- **Arbitrary depth** — recursion all the way down. No level cap. Indentation scales linearly per level.
- **Files and folders** — two node types: `'folder'` (has children, expandable, exclusive to certain ops) and `'file'` (leaf node, format determines icon).
- **Format-aware icons** — files render an icon based on extension (`.ts`, `.tsx`, `.json`, `.md`, `.pdf`, `.png`, `.svg`, `.css`, `.html`, `.py`, `.lock`, `.gitignore`, plus a generic-file fallback). Folders render open / closed / loading variants. Icon set is overridable via consumer-supplied `iconForNode` map or render function.
- **Controlled data** — consumer owns the tree (`nodes: FsNode[]`). Component renders what it's given; mutations happen via callbacks, consumer updates state, component re-renders. No internal mutable model.
- **Lazy children loading** — optional `onLoadChildren?: (args: { nodeId, node }) => Promise<FsNode[]>` for folders whose children aren't pre-loaded. Component shows a loading spinner inline at the folder's expansion state. Once children resolve, consumer merges them into the tree and component re-renders.
- **Expand / collapse state** — controlled (`expandedIds: Set<string>` + `onExpandedChange`) OR uncontrolled (component holds a `Set<string>` internally, defaults to all-collapsed). Click chevron / click folder label / arrow-key Right expands; arrow-key Left collapses.
- **Selection** — controlled (`selectedIds: Set<string>` + `onSelectedChange`) OR uncontrolled. Single-select default; multi-select opt-in via `selectionMode='multi'`. Cmd/Ctrl+click toggles in multi-select; Shift+click selects the visible range; click alone replaces selection. Distinct from focus (which is keyboard cursor position).
- **Right-click context menu** — replaces the browser's default within the tree surface. Default actions (each gated by a boolean prop, all defaulting to `true` if the corresponding callback is wired):
  - Open / Reveal (fires `onOpen`)
  - New File (when right-click target is a folder; fires `onCreate({ parentId, type: 'file' })`)
  - New Folder (same; `type: 'folder'`)
  - Rename (fires inline rename mode; commit via Enter / blur, cancel via Esc → `onRename`)
  - Delete (fires `onDelete({ ids }`); confirms via shadcn `<AlertDialog>` by default — overridable via `confirmDelete={false}` or `renderDeleteConfirm` slot)
  - Refresh (when right-click target is a folder; fires `onRefresh({ nodeId })`)
  - Cut / Copy / Paste — **out of scope for v0.1.0**. Defer to `folder-manager`. Tree's contribution is move-by-drag.
- **Toolbar / header (optional)** — slim header strip above the tree. Default contents (each gated by a boolean prop):
  - Title + node count
  - "New File" button (`showNewFile`, default `true`)
  - "New Folder" button (`showNewFolder`, default `true`)
  - "Refresh" button (`showRefresh`, default `true`)
  - "Collapse All" button (`showCollapseAll`, default `true`)
  - Replaceable wholesale via `renderHeader` slot. Set `header={false}` to hide.
- **Drag-and-drop** — internal node moves: drag any node onto a folder to move it there, fires `onMove({ ids, targetId, position: 'inside' | 'before' | 'after' })`. Drop position determined by hover y-position within the row (top third = `before`, middle = `inside`, bottom third = `after`). Visual drop indicator (line for before/after, ring for inside).
- **Drag-from-OS** — outermost surface accepts file drops from the desktop. While dragging external files, an overlay shows "Drop files here." On drop, fires `onExternalDrop({ files, targetId })`. Consumer handles upload + tree update. Opt-out via `enableExternalDrop={false}`.
- **Inline rename** — F2 (when a node is selected) or double-click on the node label puts the row into rename mode (the label becomes a small `<input>`). Enter commits; Esc cancels; clicking elsewhere commits. Validation hook: `validateRename?: (args: { node, nextName }) => string | null` returns an error message inline if invalid.
- **Keyboard navigation** — full keyboard map: ↑/↓ moves focus, →/← expands/collapses or moves into/out of folder, Enter opens (fires `onOpen`), Space toggles selection, F2 renames, Delete deletes (with confirm), Cmd/Ctrl+A selects all visible, Esc clears selection / cancels rename, Home/End jumps to first/last visible node.
- **Auto-virtualization** — for large trees (≥200 *visible* nodes by default), only render rows in the viewport + a small buffer. Threshold configurable via `virtualize: 'auto' | 'always' | 'never'` and `virtualizeThreshold={200}`. Off-screen nodes render as height-locked placeholders.
- **Sort** — default: folders first, then files, both alphabetical. Consumer override via `sortNodes?: (a: FsNode, b: FsNode) => number`. Setting `sortNodes={false}` (or passing a no-op) preserves consumer-supplied order.
- **Hidden nodes** — opt-in `showHidden` prop. When `false` (default), nodes whose `name` starts with `.` are hidden. Consumer can override the predicate via `isHidden?: (node: FsNode) => boolean`.
- **Empty state** — when `nodes` is empty, render a small placeholder ("No items" + optional "+ New File / + New Folder" buttons when those are enabled). Replaceable via `renderEmpty` slot.
- **Loading state** — when consumer passes `loading={true}` (e.g., initial fetch in flight), render a skeleton (3–5 ghost rows). Replaceable via `renderLoading` slot.
- **Object-shape callbacks** from day one (per F-cross-12 lessons): `onOpen`, `onCreate`, `onRename`, `onDelete`, `onMove`, `onRefresh`, `onExternalDrop`, `onSelectedChange`, `onExpandedChange`, `onLoadChildren` — every callback takes a single `args` object.
- **Polymorphic root** — accepts `className` and `style`. The component fills its parent's height/width; consumer is responsible for sizing.
- **Theme support** — light / dark via existing tokens. Selected row uses signal-lime accent at low chroma against `--secondary`; focus ring uses `--ring`; chevrons / icons inherit `--muted-foreground`; folder icons get a slightly warmer fill in light mode for visual hierarchy.
- **Accessibility** — `role="tree"` outer, `role="treeitem"` rows, `aria-expanded` on folders, `aria-selected` on selected rows, `aria-level` on every row, `aria-setsize` and `aria-posinset` for assistive nav. Focus is managed (single tab stop into the tree, then arrow keys). Live-region announcement on rename / delete / move. Contrast ≥ AA in both themes.
- **Soft-failure** — invalid `nodes` (cycles, missing parents, duplicate ids) render as best-effort with a `console.warn` in development. Component does not throw. `onLoadChildren` rejection shows an inline error row under the folder with a retry button.

## Out of scope

Explicitly deferred. Each is real demand we choose not to address now to keep scope tractable.

- **Cut / copy / paste clipboard ops** — these imply a "current folder" context that's natural in `folder-manager` (Finder-style) but ambiguous in a pure tree. `folder-manager` will own these.
- **Multi-pane layouts** — two-pane (tree + content), three-pane (tree + content + details). That's `folder-manager`'s surface. `file-tree` is the sidebar half.
- **Search / filter input** — a search box inside the tree header that filters visible nodes. Useful but not core; pushes us toward fuzzy-match scoring, expanded-on-match behavior, etc. Defer to v0.2.0 or sibling component.
- **Breadcrumbs** — `folder-manager`'s job.
- **Per-row hover actions toolbar** — VSCode shows tiny inline "+" / "+" / "..." buttons on hover over a folder. Useful but adds layout/spacing complexity. Defer until consumer demand surfaces; v0.1.0 ships the header-level buttons + RC menu only.
- **Cross-tree drag-drop** — dragging a node from one `<FileTree>` instance into another. Different lifecycle / data-ownership story. Defer.
- **Node decorations / status badges** — git status (M / A / D), unsaved-dot, error/warn squiggle markers, line counts. Useful for IDE-like consumers but each is its own visual + a11y concern. Reserve a `renderNode` / `nodeAdornment` slot for this in plan-stage; full default implementations defer.
- **File watching / external sync** — the tree reflects whatever the consumer passes in `nodes`. No filesystem subscription, no polling, no external-change reconciliation. Consumer's job.
- **Permissions / disabled nodes** — a node that's read-only / locked / un-droppable. Reserve `disabled` / `readOnly` flags on `FsNode` in plan-stage; ops on disabled nodes are no-ops + consumer-visible callback. Default visual treatment defer to v0.2.0.
- **Bulk-rename / batch ops** — selecting 10 files and renaming with a pattern. Not core.
- **Undo / redo** — the tree fires callbacks; consumer owns the data. Undo is consumer's job (and naturally a `folder-manager` surface concern).
- **Animation on expand / collapse** — Slide / height transition. Adds layout-thrash risk against virtualization. Defer; ship instant expand/collapse.

## Target consumers

- **Dev-tool / IDE-like surfaces** — code editors, query workbenches, log explorers, debugger panels. Sidebar tree of project files / saved queries / log sources.
- **Document workspaces** — knowledge bases, wiki sidebars, article folders.
- **Asset libraries** — design systems, image / icon / template libraries with hierarchical organization.
- **Schema / namespace browsers** — database UIs (schemas → tables → columns), API explorers (services → endpoints), GraphQL schema viewers, JSON-schema editors.
- **Low-code / no-code builders** — site / page / block hierarchies, form-step trees, workflow trees.
- **Configuration UIs** — nested settings panels, env-config explorers, feature-flag organizational hierarchies.
- **Org charts / taxonomies** — repurposed beyond strictly file-system data (hence `FsNode` is the *shape*, not the literal "must be a file" constraint).
- **`folder-manager`** itself — drops `<FileTree>` into its `sidebar` slot for the dual-pane Finder layout.

The consumer is a **frontend dev with a hierarchical-node array** and the requirement "render this as a tree, let the user expand/select/rename/move things, themed to match." They do not want to write keyboard handlers, drag-drop logic, or rename UX from scratch.

## Rough API sketch

```tsx
// Simplest read-only tree
<FileTree nodes={fileNodes} onOpen={({ node }) => openFile(node)} />

// Controlled selection + expansion
<FileTree
  nodes={fileNodes}
  selectedIds={selected}
  onSelectedChange={({ ids }) => setSelected(ids)}
  expandedIds={expanded}
  onExpandedChange={({ ids }) => setExpanded(ids)}
/>

// Full CRUD
<FileTree
  nodes={fileNodes}
  selectionMode="multi"
  onCreate={({ parentId, type }) => fs.create(parentId, type)}
  onRename={({ id, nextName }) => fs.rename(id, nextName)}
  onDelete={({ ids }) => fs.delete(ids)}
  onMove={({ ids, targetId, position }) => fs.move(ids, targetId, position)}
  onRefresh={({ nodeId }) => fs.refresh(nodeId)}
/>

// Lazy-load children (large filesystem)
<FileTree
  nodes={shallowNodes}
  onLoadChildren={async ({ nodeId }) => fs.list(nodeId)}
/>

// Drag-from-OS
<FileTree
  nodes={fileNodes}
  enableExternalDrop
  onExternalDrop={({ files, targetId }) => uploadTo(targetId, files)}
/>

// Custom icons
<FileTree
  nodes={fileNodes}
  iconForNode={(node) => myIconRegistry[node.kind] ?? defaultIcon(node)}
/>

// Header customization — only show "+New File" + "Refresh"
<FileTree
  nodes={fileNodes}
  showNewFolder={false}
  showCollapseAll={false}
  title="My Project"
/>

// Header off entirely
<FileTree nodes={fileNodes} header={false} />

// Custom RC menu (full replacement)
<FileTree
  nodes={fileNodes}
  renderContextMenu={({ node, defaultActions }) => (
    <MyMenu>
      {defaultActions.map(...)}
      <MyMenu.Item onSelect={() => duplicate(node)}>Duplicate</MyMenu.Item>
    </MyMenu>
  )}
/>

// Dropped into folder-manager's sidebar slot
<FolderManager
  sidebar={<FileTree nodes={projectNodes} onOpen={...} />}
  contents={<FolderContents folder={current} />}
/>
```

## Example usages

**1. Code-editor sidebar (dev-tool surface)**

A web IDE has `<FileTree nodes={projectFiles} />` in a left sidebar. Files render with format icons (`.ts`, `.tsx`, `.json`, `.md`). User clicks a file to open in the editor (`onOpen`); right-clicks to rename, delete, create a new file in the same folder. Drag-drops files between folders. Header shows the project name + "+File / +Folder / Refresh" buttons.

**2. Document workspace sidebar (knowledge base)**

A docs app shows `<FileTree nodes={articles} title="My Articles" showRefresh={false} />`. Folders are categories; files are articles. Format icons distinguish drafts (`.md`) from published (custom icon via `iconForNode`). Multi-select + delete for bulk archive. No external drop (uploads happen through a different flow).

**3. Schema browser (database UI)**

A SQL workbench renders `<FileTree nodes={schemaTree} onLoadChildren={fetchTables} />`. Top level: schemas; expand a schema, lazy-load its tables; expand a table, lazy-load its columns. Keyboard arrow nav lets the user drill in fast. Custom icons per node-kind (`schema`, `table`, `view`, `column`).

**4. Asset library (design system)**

A design ops tool renders `<FileTree nodes={iconRepo} selectionMode="multi" />`. Folders are icon categories; files are SVGs. User selects multiple icons across categories with Cmd+click, then triggers a "download selection" action (consumer-managed, outside the tree).

**5. Low-code page tree (site builder)**

A page builder shows `<FileTree nodes={pageHierarchy} />` of a site's page structure. Drag-drop reorders pages; rename via F2; delete with confirm. `onMove` updates the site's nav tree.

**6. Sidebar inside `folder-manager`**

The most common composition: `<FolderManager sidebar={<FileTree ... />} ...>`. Tree handles hierarchical nav; folder-manager handles the current-folder content pane.

## Success criteria

The component is "done" when:

1. **Renders an arbitrary-depth tree** correctly; chevron expand/collapse works at every level; indent guides render cleanly.
2. **Format-aware icons** present for the documented set (~15 default mappings); fallback for unknown extensions; folder open / closed / loading variants distinct.
3. **Controlled + uncontrolled** modes both work for expansion + selection; toggling controlled props mid-life doesn't break.
4. **Lazy children** — `onLoadChildren` resolves correctly; loading spinner shows inline; error state with retry shows on rejection.
5. **Multi-select** with Cmd/Ctrl+click toggle, Shift+click range, Cmd/Ctrl+A select-all-visible.
6. **Keyboard navigation** complete per the documented map; tab order has a single stop on the tree; focus-visible rings render on all interactive elements.
7. **Right-click menu** replaces the browser default within the tree surface; default actions all fire correct callbacks; menu replaceable wholesale.
8. **Header buttons** wire to `onCreate` / `onRefresh` / `collapse-all`; each button gated by its boolean prop; header replaceable + hideable.
9. **Inline rename** — F2 + double-click both trigger; Enter commits; Esc cancels; click-elsewhere commits; `validateRename` shows inline error.
10. **Drag-drop reorder** within the tree — drop indicator (line / ring) renders correctly per hover position; `onMove` fires with right `position`; multi-select drag carries all selected nodes.
11. **Drag-from-OS** — external files dropped onto the tree fire `onExternalDrop` with the right `targetId`; visual overlay shows during drag.
12. **Auto-virtualization** kicks in at 200+ visible nodes; tested against a 5000-node sample; off-screen rows don't allocate event listeners.
13. **Sort + hidden + empty + loading** all work as documented; replaceable slots fire correctly.
14. **Theme support** — light + dark verified; signal-lime used at appropriate chroma for selected rows; contrast ≥ AA; focus ring visible against both backgrounds.
15. **Accessibility** — Lighthouse a11y ≥ 95 on demo; tree role / treeitem role / aria-expanded / aria-selected / aria-level all correct; live-region announcements on rename / delete / move.
16. **Object-shape callbacks** throughout — no positional shapes.
17. **Smoke harness install + tsc pass** — `pnpm dlx shadcn add @ilinxa/file-tree` against the smoke consumer; consumer-side `pnpm tsc --noEmit` clean.
18. **Procomp doc trio complete** — description (this), plan, guide. Demo demonstrates all major modes (read-only, full CRUD, lazy-load, multi-select, drag-from-OS, custom icons, custom header, custom RC menu).
19. **Meta + manifest in sync; registry.json shipped** (base + fixtures items).
20. **Build clean** — `pnpm tsc --noEmit`, `pnpm lint`, `pnpm build`, `pnpm validate:meta-deps` all pass.
21. **GATE 3 spot-check review** — verdict ≥ "Pass with follow-ups."

## Open questions

1. **Slug — `file-tree` or `file-tree-01`?** Existing pattern is mixed: composed-surface flagships drop the suffix (`data-table`, `markdown-editor`, `entity-picker`, `properties-form`, `workspace`, `detail-panel`, `stat-card`, `filter-stack`, `pdf-viewer`); pattern-style numbered variants keep it (`media-carousel-01`, `kanban-board-01`, `story-viewer-01`, etc.). **Recommendation:** drop the suffix → `file-tree`. This is a flagship primitive (anticipated to be referenced by name, not numbered), aligned with `data-table` and `pdf-viewer` precedent.

2. **Category — `data`, `layout`, or new `navigation`?** The roadmap already has `navigation/command-palette` queued, implying `navigation` is a planned category. file-tree is fundamentally a navigation primitive (consumer drills through hierarchy to act). **Recommendation:** add a new `navigation` category; place `file-tree` there. This sets up `command-palette` to land in the same category later. Updating `categories.ts` is a 2-line edit. Alternative: drop into `data` (like `data-table`) since the tree displays hierarchical data — but a tree's primary affordance is navigation, not data analysis. Confirm direction.

3. **Data model — `FsNode` shape.** Recommended starting shape:
   ```ts
   type FsNode = {
     id: string;            // stable across renders
     name: string;          // displayed label
     type: 'file' | 'folder';
     parentId?: string | null;
     children?: FsNode[];   // undefined = lazy / unknown; [] = empty folder
     // optional metadata, all advisory:
     ext?: string;          // explicit extension (otherwise derived from name)
     size?: number;         // bytes
     modifiedAt?: string;   // ISO
     icon?: ReactNode;      // pre-rendered override
     meta?: Record<string, unknown>; // consumer-defined passthrough
   };
   ```
   **Recommendation:** ship this shape. Deliberately *not* including `disabled` / `readOnly` in v0.1.0 — declaring fields without behavior leads to consumers setting them and expecting something to happen. Add in v0.2.0 alongside their visual treatment as a non-breaking additive change. `meta` passthrough lets consumers attach app-specific data without touching FsNode.

4. **`children: undefined` vs `children: []`.** Distinguishing "not yet loaded" from "empty folder" matters for lazy-load. **Recommendation:** `undefined` = unknown / not yet loaded → triggers `onLoadChildren` on first expand; `[]` = known-empty → renders empty state inline ("(empty)") without firing the loader. Document this clearly in guide.md.

5. **DnD library — HTML5 native or `dnd-kit`?** HTML5 native (`draggable` + `dragstart` / `dragover` / `drop`) is zero peer dep, supports OS file drag-drop natively. `dnd-kit` is more capable (better touch, accessibility, customization) but ~16 KB gz peer dep + we'd be the first project component pulling it in. **Recommendation:** HTML5 native. Touch DnD on tree is a niche concern (most consumers are desktop-driven IDE-like surfaces); we can add a `dnd-kit` upgrade in v0.2.0 if real demand surfaces. This matches `pdf-viewer`'s "hand-rolled pinch / no peer dep" precedent.

6. **Icon source for default file-format mapping — `lucide-react`?** Already a project dep (carries the bulk of our iconography). The downside: lucide doesn't have rich format-specific icons (no real `.tsx` icon, no `.python`); we'd map ~15 generic ones (`<FileCode>`, `<FileImage>`, `<FileText>`, `<FileJson>`, `<File>`) by extension category. Alternatives: `simple-icons` (literal logos for languages, but cluttered for an IDE sidebar) or `material-icon-theme` (rich but heavy + not React-native). **Recommendation:** lucide with a curated extension→category map. Consumer can swap in any icon set via `iconForNode`. Document the default map in guide.md.

7. **Virtualization library — TanStack Virtual or hand-rolled?** TanStack Virtual is ~3 KB gz, the ecosystem standard, and gives us window-virtualization for free with sticky-row support. Hand-rolling a row-virtualizer for ~200 nodes is doable but loses dynamic-height support, which the tree needs (rename mode swaps the label for an `<input>`, height differs). **Recommendation:** TanStack Virtual. Already a stable, peer-dep-light option; adding it once here pays dividends for `folder-manager` and any future virtualized list (`notification-system` likely).

8. **Selection model — single by default, multi opt-in?** **Recommendation:** yes. `selectionMode: 'single' | 'multi'`, default `'single'`. Single-select is the most common consumer expectation; multi is a deliberate opt-in for surfaces that need bulk ops.

9. **Confirm-delete UX — built-in `<AlertDialog>` or consumer's job?** **Recommendation:** built-in `<AlertDialog>` by default (using shadcn primitive); opt-out via `confirmDelete={false}` (callback fires immediately on Delete keypress / RC menu click); replace via `renderDeleteConfirm` slot. Default UX should be the safe one.

10. **Multi-select drag — drag the whole selection, or drag-cancels-selection?** **Recommendation:** drag the whole selection. If you Cmd+click 5 files and start dragging any of the 5, all 5 move together. If you start dragging an unselected file, the selection clears and only that file moves. This matches Mac Finder + VSCode + Windows Explorer.

11. **Drop-position resolution — three-zones (before / inside / after) on every node, or two-zones (inside / between)?** Three-zones gives users the precision to reorder files within a folder without dropping into subfolders. **Recommendation:** three-zones for folders; two-zones (above / below) for files (since "drop inside a file" is meaningless). Document the exact y-fraction thresholds in plan-stage.

12. **Empty state copy — "No files" / "No items"?** Generic enough that it reads in non-FS consumers (asset libs, schema trees). **Recommendation:** default `"No items"`; consumer can override via `renderEmpty`. Document the broader-than-file semantic in guide.md.

13. **Header — separate `<FileTreeHeader>` part exported, or only via `renderHeader` slot?** Following pdf-viewer precedent: ship the parts as separately-exported atoms so consumers can reassemble subsets. **Recommendation:** export `<FileTreeHeader>`, `<FileTreeNewButton>`, `<FileTreeRefreshButton>`, `<FileTreeCollapseAllButton>` as standalone parts (callable inside a custom `renderHeader`). Mirror's pdf-viewer's `<PdfToolbar>` / `<PdfPageNav>` etc. pattern.

14. **Icon prop priority — node's own `icon` field, `iconForNode(node)` callback, or default?** Three layers. **Recommendation:** `node.icon` wins if set; else `iconForNode(node)` if provided; else built-in default by extension. Document in guide.md.

15. **Indent guides — on by default?** Subtle vertical lines connecting siblings + showing depth. VSCode has them. **Recommendation:** on by default; opt-out via `indentGuides={false}`. Width = 1 px, color = `--border` at 50% opacity.

16. **Collapse-all behavior — all folders, or only top-level?** **Recommendation:** all folders (full collapse). Matches VSCode's "Collapse Folders in Explorer" command.

17. **`onOpen` semantics — files only, or files + folders?** Click on a folder typically expands it; click on a file should fire `onOpen` (e.g., open in editor). What about Enter on a focused folder? **Recommendation:** Enter on a file fires `onOpen({ node })`; Enter on a folder toggles expansion (does NOT fire `onOpen`). Click on a folder label toggles expansion. Click on the chevron also toggles. Consumer can wire `onOpen` for folders by adding their own keyboard handler if they want different semantics.

18. **What ships in `dummy-data.ts`?** A realistic, decently-sized fake project (~30–50 nodes, 3–4 levels deep) covering files + folders + a variety of extensions. Mirrors a real codebase shape. **Recommendation:** mock a small Next.js project (`src/`, `public/`, `package.json`, `tsconfig.json`, etc.) — universally recognizable, exercises every default icon, looks alive in the demo.

19. **Cut / copy / paste — defer to folder-manager only, or include in file-tree's RC menu?** Originally framed as "out of scope, folder-manager owns." But standalone file-tree consumers (IDE sidebars used without a Finder pane) reasonably expect Cmd/Ctrl+X/C/V on a selected node. The tradeoff: clipboard-state lives somewhere — either inside file-tree (each tree instance has its own clipboard) or in a shared singleton. **Recommendation:** still defer for v0.1.0. Reason: the most painful version is the half-implementation — file-tree clipboard-state that doesn't sync with folder-manager's clipboard. Better to land both at the same time when folder-manager arrives, with a shared clipboard primitive that both consume. Document the limitation in v0.1.0 guide.md and add to v0.2.0 plan when folder-manager lands.

20. **Default expanded state in uncontrolled mode.** Three reasonable defaults: (a) all-collapsed (user sees only root entries, drills in deliberately), (b) root-expanded (user sees top-level structure immediately, all subfolders collapsed), (c) consumer-supplied `defaultExpandedIds`. **Recommendation:** (b) — root-only expanded by default. Matches VSCode's "open project" UX (you see the project shape immediately, but subfolders stay closed until needed). Always overridable via `defaultExpandedIds` (uncontrolled) or `expandedIds` (controlled). For huge trees with lazy-load, root-expanded is fine since lazy folders show the chevron without firing the loader until clicked.

21. **Drop legality — does the tree prevent illegal moves, or fire `onMove` and let consumer reject?** Illegal moves: dropping a folder into one of its own descendants (cycle), dropping a node onto itself, dropping into a folder that already contains a node with the same name. **Recommendation:** the tree pre-validates *structural* invariants (cycle, self-drop) and never fires `onMove` for those cases — visual drop indicator turns red / disabled. Name-collision is consumer's concern (consumer might silently rename, prompt, or reject) — `onMove` fires; consumer decides. Cycle / self-drop checks are universal correctness; collision policy is app-specific.

> **Sign-off needed before Stage 2 (plan).** Open questions above represent active uncertainties; recommendations are starting positions. Reviewer should mark each open-question with their preferred resolution OR push back on the recommendation.

## Sign-off

**User confirmed 2026-05-10** — all 21 starting-position recommendations accepted.

Locked decisions for Stage 2:

- **Slug:** `file-tree`
- **Category:** new `navigation` category (added alongside `file-tree`; future home for `command-palette`)
- **Default expanded state (uncontrolled):** root-level expanded
- **Cut / copy / paste:** deferred to v0.2.0 (lands together with `folder-manager`'s shared clipboard)
- **Drop legality:** tree pre-validates structural invariants (cycle, self-drop); name-collision is consumer's call
- **DnD library:** HTML5 native (no peer dep)
- **Virtualization library:** TanStack Virtual (`@tanstack/react-virtual`)
- **Icon source:** `lucide-react` defaults; consumer overridable via `iconForNode`
- **`FsNode` shape:** id / name / type / parentId / children / ext / size / modifiedAt / icon / meta — no `disabled` / `readOnly` in v0.1.0
- **All other Q-recommendations:** accepted as written
