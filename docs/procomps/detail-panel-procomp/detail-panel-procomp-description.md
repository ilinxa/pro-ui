# `detail-panel` — Pro-component Description

> **Status:** draft v0.1 — pending sign-off
> **Slug:** `detail-panel`
> **Category:** `feedback`
> **Created:** 2026-04-28
> **Owner:** ilinxa team
> **Parent system:** [graph-system](../../systems/graph-system/graph-system-description.md) — Tier 1 (generic; no graph dependency)

This is Stage 1 of the [procomp gate](../README.md). It answers *should we build this at all, and what shape should it be?* It does NOT specify implementation — that's Stage 2 (`detail-panel-procomp-plan.md`).

The system-level constraints in [graph-system-description.md §8](../../systems/graph-system/graph-system-description.md) (decisions #6, #25, #35, #37) are inherited as constraints; this doc does not re-litigate them. detail-panel is the host of `properties-form` in mixed-permission editing scenarios — see [properties-form-procomp-description.md §6.2](../properties-form-procomp/properties-form-procomp-description.md) for the integration case.

---

## 1. Problem

Selection-driven UIs share a recurring shape:

- A graph node / edge / group is selected; show its details in a side panel
- A file is selected in a file browser; show metadata + preview in the right pane
- A row is selected in a list; show details in an inspector pane
- A contact is selected; show profile + actions
- An item from a search result is highlighted; show preview

Every one of these reimplements the same chrome: header showing what's selected, body showing detail with optional read/edit toggle, footer actions (Edit / Delete / etc.), an empty state when nothing is selected, a loading state while the entity is being resolved, an error state when resolution fails. Reimplementations diverge on small but consistently visible details — *where does the Edit button live? does the body scroll independently of the header? how does mode reset when selection changes? what does loading look like?* — producing a fragmented UX feel across the product.

In the graph-system specifically, detail-panel is the host surface for `properties-form`. The mixed-permission case ([properties-form §6.2](../properties-form-procomp/properties-form-procomp-description.md#62-annotating-a-system-origin-graph-node-mixed-permissions--the-showcase-case)) — system-origin canonical fields read-only sitting alongside user-owned annotations editable — only works if the panel chrome (mode toggle, action surface, layout) is consistent and predictable. Without a shared detail-panel, every selection-aware surface in the graph-system would need to reimplement that chrome.

**A reusable, slot-based detail-panel container closes this gap.** It owns the layout shell, the read/edit mode toggle UX, the empty/loading/error states, and the focus-management contract. Hosts plug in entity-specific content via slots; the panel handles the rest.

---

## 2. In scope (v0.1)

- **Selection-aware container.** Renders the empty state when `selection` is `null`; renders content when `selection` is set. The panel re-keys its content tree on `selection.id` change so per-selection state in slot content does not bleed across selections.
- **Compound subcomponent API**: `<DetailPanel.Header>`, `<DetailPanel.Body>`, `<DetailPanel.Actions>` — hosts compose these inside `<DetailPanel>` to populate the chrome zones.
- **Read / Edit mode** with toggle UX. Default behavior: the `<DetailPanel>` renders an "Edit" button in the Actions zone when `mode === "read"`, and "Save" / "Cancel" buttons when `mode === "edit"`. Hosts can override the default action set by passing custom children to `<DetailPanel.Actions>` (mode-aware via render function).
- **Mode reset on selection change**: when `selection.id` changes, `mode` is auto-reset to `"read"` (per [decision #6](../../systems/graph-system/graph-system-description.md): inline edit; reset prevents accidental edits leaking across entities).
- **Built-in empty state** with sensible default copy + override slot. Default: a centered `<EmptyState>` reading "Nothing selected" with a generic icon. Hosts pass `emptyState` prop to override (e.g., to add quick stats).
- **Loading state**: when `loading={true}`, panel renders skeleton placeholders for header + body (preserves layout; less jarring than a centered spinner).
- **Error state**: when `error` is set, panel renders an error UI with the message + an optional retry button (host-supplied callback).
- **Sticky header**: header zone sticks to the top of the panel; body zone scrolls independently. Standard explorer-pane behavior.
- **Action zone positioning**: Actions render in the **footer by default** (sticks to the bottom; persistent action surface). Hosts can opt into header-positioned actions via `<DetailPanel.Actions position="header">` (e.g., for terse single-icon actions).
- **Focus management**: on selection change, focus moves to the panel root (not into slot content) so screen readers announce the new selection. On mode toggle, focus moves into the body zone (first focusable element). On exit-edit (Cancel or Save), focus returns to the action that triggered the toggle.
- **ARIA contract**: `role="region"` with `aria-labelledby` pointing to the header's title, `aria-busy="true"` during loading, `aria-live="polite"` announcement on selection change.
- **Design system compliance** per [system decision #37](../../systems/graph-system/graph-system-description.md): OKLCH tokens, Onest + JetBrains Mono fonts, no hard-coded colors. Layout uses Tailwind v4 utility classes only.

---

## 3. Out of scope (deferred)

- **Multi-selection.** v0.1 panel shows one entity at a time. Multi-select detail (e.g., "5 nodes selected — bulk actions") is a separate pattern; can land as `<DetailPanel.MultiSelection>` companion in v0.2 if the graph-system needs it.
- **Modal / overlay mode.** Decision #6 locks inline edit; modal is explicitly out.
- **Tabs / split-panes within the panel.** Hosts can compose their own (`<DetailPanel.Body>` accepts arbitrary children including tabs); panel doesn't ship a `<DetailPanel.Tabs>`.
- **Drag-to-resize the panel itself.** Host owns the panel's outer dimensions (it's a Tier 1 component that drops into a host-supplied container).
- **Animation between selections.** v0.1 cuts hard on selection change. v0.2 may add a subtle cross-fade — but only if real consumers want it.
- **Persistent open/closed panel state.** The host owns whether the panel is mounted at all; detail-panel doesn't have an internal "collapsed" mode in v0.1.
- **Action confirmation flows** (e.g., "Delete? Are you sure?"). Host wires up confirmation if needed; panel just renders the buttons.
- **Optimistic update visualization.** Host owns optimistic updates via the source-adapter pattern (see [system §6.4](../../systems/graph-system/graph-system-description.md#64-applymutation-contract)); panel just reflects whatever entity state the host hands it.

The v0.1 surface is intentionally narrow. v0.2 additions are all *additive* — none would change the v0.1 API.

---

## 4. Target consumers

In dependency order:

1. **`force-graph` v0.3** (Tier 2) — the primary driver. force-graph has selection state for nodes / edges / groups; detail-panel renders the selected entity in the host's sidebar. The mixed-permission case (`properties-form` slotted into `<DetailPanel.Body>` for a system-origin node) is the showcase integration.
2. **Tier 3 graph-system page** — wires `force-graph`'s selection state to a `<DetailPanel>` instance in the page's right sidebar. This is where the panel + form composition happens for real.
3. **`data-table` inspection** (future) — when a table row is selected, a side panel could show row details + actions. Detail-panel is the right pattern.
4. **`rich-card` v0.5+ refactor** (future, speculative) — rich-card currently renders its inline selected-card metadata via custom parts (`meta-popover.tsx`, `meta-inline.tsx`). A future refactor might delegate to detail-panel; but rich-card's "in-tree" inline placement is different from a sidebar panel, so this is uncertain.
5. **Settings inspector** (any pro-component or page that needs a "selected setting → details" surface).

Critically, **detail-panel has zero graph dependency**. It is a generic explorer-pane shell. This is per [system decision #35](../../systems/graph-system/graph-system-description.md): Tier 1 components are independent — none imports another at the registry level. detail-panel does NOT import `properties-form`; the host slots properties-form into `<DetailPanel.Body>`.

---

## 5. Rough API sketch

A compound-component shape: `<DetailPanel>` is the chrome, with `Header`, `Body`, and `Actions` as named subcomponents the host composes inside.

```ts
type DetailPanelMode = "read" | "edit";

interface DetailPanelSelection {
  type: string;     // discriminator the host uses to pick which children to render
  id: string;       // stable identity used for re-keying on change
}

interface DetailPanelProps {
  selection: DetailPanelSelection | null;
  mode?: DetailPanelMode;                       // default: "read"
  onModeChange?: (mode: DetailPanelMode) => void;

  loading?: boolean;
  error?: { message: string; retry?: () => void } | null;

  emptyState?: ReactNode;                       // default: built-in <EmptyState>

  children: ReactNode;                          // typically DetailPanel.* compound parts

  className?: string;
}

interface DetailPanelHeaderProps {
  children: ReactNode;
  sticky?: boolean;                             // default: true
}

interface DetailPanelBodyProps {
  children: ReactNode;
  // No mode-aware switching here — host conditionally renders read view vs edit form
}

interface DetailPanelActionsProps {
  // children may be a render function receiving mode, or static ReactNode
  children:
    | ReactNode
    | ((ctx: { mode: DetailPanelMode; setMode: (m: DetailPanelMode) => void }) => ReactNode);
  position?: "footer" | "header";               // default: "footer"
}

interface DetailPanelHandle {
  focusBody(): void;
  resetMode(): void;                            // forces back to "read" without changing selection
}
```

Imperative handle is small — most control lives in props.

---

## 6. Example usages

### 6.1 Graph node detail panel (force-graph v0.3 → Tier 3 graph-system page)

```tsx
<DetailPanel
  selection={state.selection}
  mode={mode}
  onModeChange={setMode}
  loading={resolving}
  error={resolveError ? { message: resolveError.message, retry: refetch } : null}
>
  {state.selection?.type === "node" && node && (
    <>
      <DetailPanel.Header>
        <NodeHeader entity={node} />            {/* host-defined: label, kind badge, color swatch */}
      </DetailPanel.Header>

      <DetailPanel.Body>
        {mode === "read" ? (
          <NodeReadView entity={node} />
        ) : (
          <PropertiesForm
            schema={schemaFor(node)}
            values={flattenForForm(node)}
            mode="edit"
            onChange={setDraft}
            onSubmit={async (values) => {
              const result = await applyMutation({ type: "updateNode", id: node.id, patch: unflatten(values) });
              if (result.ok) setMode("read");
              return result;
            }}
            onCancel={() => setMode("read")}
            showSubmitActions={false}           {/* panel renders Save/Cancel via Actions */}
          />
        )}
      </DetailPanel.Body>

      <DetailPanel.Actions>
        {({ mode, setMode }) =>
          mode === "read" ? (
            <>
              <Button onClick={() => setMode("edit")}>Edit</Button>
              <Button variant="destructive" onClick={() => deleteNode(node.id)}>Delete</Button>
            </>
          ) : (
            <>
              <Button onClick={() => formRef.current?.submit()}>Save</Button>
              <Button variant="ghost" onClick={() => setMode("read")}>Cancel</Button>
            </>
          )
        }
      </DetailPanel.Actions>
    </>
  )}

  {state.selection?.type === "edge" && edge && (
    <>...</>                                    {/* edge-specific Header/Body/Actions */}
  )}
</DetailPanel>
```

This is the showcase. The panel chrome (mode toggle, sticky header, scrollable body, Save/Cancel placement) is consistent; the host owns the entity-specific Header / Body / Actions content.

### 6.2 Empty state with quick stats (the "nothing selected" enhancement)

```tsx
<DetailPanel
  selection={null}
  emptyState={
    <EmptyState>
      <EmptyState.Icon><InfoIcon /></EmptyState.Icon>
      <EmptyState.Title>Nothing selected</EmptyState.Title>
      <EmptyState.Description>Click a node, edge, or group on the canvas to see details.</EmptyState.Description>
      <EmptyState.Stats>
        <Stat label="Nodes" value={graph.nodeCount} />
        <Stat label="Edges" value={graph.edgeCount} />
        <Stat label="Groups" value={graph.groupCount} />
      </EmptyState.Stats>
    </EmptyState>
  }
>
  {null}
</DetailPanel>
```

### 6.3 File-browser inspector (no graph involvement)

```tsx
<DetailPanel selection={selectedFile ? { type: "file", id: selectedFile.path } : null}>
  {selectedFile && (
    <>
      <DetailPanel.Header>
        <h2>{selectedFile.name}</h2>
        <p className="text-muted-foreground">{selectedFile.path}</p>
      </DetailPanel.Header>
      <DetailPanel.Body>
        <FilePreview file={selectedFile} />
        <FileMetadata file={selectedFile} />
      </DetailPanel.Body>
      <DetailPanel.Actions>
        <Button onClick={() => download(selectedFile)}>Download</Button>
      </DetailPanel.Actions>
    </>
  )}
</DetailPanel>
```

Demonstrates the component's value far outside the graph system — generic explorer pattern.

---

## 7. Success criteria

The component is "done" for v0.1 when:

1. **Used by `force-graph` v0.3 with zero API additions or workarounds.** Mixed-permission editing showcase (§6.1) works end-to-end: selection drives content, mode toggle drives the read/edit body switch, Save commits via slotted properties-form, Cancel reverts, mode auto-resets to "read" on selection change.
2. **Compound API ergonomic in practice.** Hosts can compose `<DetailPanel.Header>` / `<DetailPanel.Body>` / `<DetailPanel.Actions>` without wrestling against the panel's internal layout. If consumers consistently want to render outside these zones, the API was wrong.
3. **Loading + error states tested**: skeleton placeholders preserve layout; error UI is dismissible via retry.
4. **Mode reset on selection change is reliable**: changing `selection.id` (with or without selection.type change) deterministically resets `mode` to "read" via `onModeChange`. No flicker of edit-mode content from the previous selection.
5. **A11y audit passes**: keyboard navigation moves through Header → Body → Actions in DOM order; focus management on selection change + mode toggle works as specified; screen-reader announces selection change.
6. **Bundle weight ≤ 8KB** (minified + gzipped) — pure layout component with no heavy deps.
7. **`tsc + lint + build` clean** with no React Compiler warnings.
8. **Demo at `/components/detail-panel`** demonstrates: selection-driven content, empty state with override, loading state, error state with retry, mode toggle with custom Actions render-fn, plain-content example without mode.

---

## 8. Open questions

These need answers before Stage 2 (plan) authoring begins:

1. **Composition pattern: compound subcomponents vs. render-prop vs. renderer-record.** The proposed shape is compound (`<DetailPanel.Header>`, etc.). Alternatives: (a) single `renderContent={(selection) => ...}` render-prop — terser but sacrifices the layout enforcement; (b) renderer-record `renderers={{ node: { read, edit, header, actions }, edge: {...} }}` keyed by `selection.type` — most structured but verbose for hosts. Recommendation: **compound subcomponents** — best balance of structure and host flexibility; matches shadcn primitive conventions (e.g., `<Card.Header>`); discoverable via TypeScript autocomplete.

2. **Mode reset on selection change: auto-reset vs. preserve.** Spec proposes auto-reset to "read" on `selection.id` change. Alternative: preserve mode (i.e., if user was editing node A and clicks node B, keep editing). Auto-reset is the safer default (prevents accidental cross-entity edit bleed); preserve-mode would surprise users. Recommendation: **auto-reset on selection.id change.** A `preserveModeAcrossSelections?: boolean` opt-in could land in v0.2 if real demand surfaces.

3. **Default position for `<DetailPanel.Actions>`: footer vs. header.** Spec proposes footer (persistent action surface, conventional). Alternative: header (terse, single-icon-button rows feel natural in the header). Recommendation: **footer default, with `position="header"` opt-in.** Most consumers will have multiple actions (Edit / Delete / Duplicate); footer scales better.

4. **Empty state: opinionated default copy vs. generic placeholder.** Spec proposes "Nothing selected" + generic icon. Alternative: completely empty default, forcing every consumer to supply `emptyState`. Recommendation: **opinionated default** — most consumers don't customize, so the out-of-box experience should be sensible. Custom override remains available.

5. **Loading state UI: skeleton vs. spinner.** Spec proposes skeleton (placeholder boxes that mimic layout). Alternative: centered spinner. Skeleton preserves layout (less jarring) but is more code. Recommendation: **skeleton.** Industry-standard for explorer panes. Plan stage may ship both with a `loadingStyle` prop — or punt to v0.2 if there's no real demand.

6. **Permission gating on the default Edit button.** When the panel renders the default Action set (Edit in read mode, Save/Cancel in edit mode), should it gate on a `canEdit` prop? E.g., `canEdit?: boolean | ((selection) => boolean)`. Without this, hosts must always provide custom Actions to hide the Edit button on un-editable entities. Recommendation: **add `canEdit?: boolean` prop on `<DetailPanel>`.** Default `true`. When `false`, the default Edit button is hidden; hosts can still supply their own Actions content. Simpler than a predicate for v0.1.

7. **Sticky header behavior with body scroll.** Spec proposes sticky header. Alternatives: (a) panel-level scroll (whole panel scrolls, header scrolls away); (b) configurable. Recommendation: **sticky by default; `<DetailPanel.Header sticky={false}>` opt-out.** Sticky is the right default for explorer panes — selected-entity title should always be visible while scrolling its details.

8. **Re-keying on `selection.id` change: opaque or composite.** Spec re-keys content tree on `selection.id` change. But what if two entity types share IDs (e.g., a node and a group both have id `"abc"`)? Composite key `${type}:${id}` is safer. Recommendation: **composite key `${type}:${id}`** for re-keying. Document.

9. **Imperative handle scope.** `DetailPanelHandle` exposes `focusBody()` and `resetMode()`. Should it also expose `getMode()`, `getSelection()` (for hosts that want to pull state imperatively)? Probably not — those are props, hosts already have them. Recommendation: **keep handle minimal: `focusBody()` and `resetMode()` only.** Add more if real consumers need them.

10. **Error state retry button — built-in or host-only.** Spec proposes the panel renders a "Retry" button when `error.retry` is supplied. Alternative: panel only shows the message; host renders retry however it wants. Recommendation: **built-in retry button when `error.retry` is supplied.** Standard error-state pattern; host can omit retry by passing `error: { message, retry: undefined }`.

---

## 9. Sign-off checklist

- [ ] Problem framing correct?
- [ ] Scope boundaries defensible (in / out)?
- [ ] Target consumers complete?
- [ ] API sketch covers the three example use cases?
- [ ] Compound API choice (Q1) is the right default?
- [ ] Success criteria measurable?
- [ ] Open questions §8 — recommendations acceptable, or any need re-discussion?

Sign-off enables Stage 2 (`detail-panel-procomp-plan.md`) authoring and unblocks parallel description authoring for `filter-stack`, `entity-picker`, `markdown-editor`. Plan must lock the open questions and define the file-by-file structure per the [component-guide.md anatomy](../../component-guide.md#5-anatomy-of-a-component-folder).
