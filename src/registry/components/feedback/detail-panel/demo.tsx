"use client";

import { useCallback, useState } from "react";
import { Pencil, Pin, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DetailPanel, DetailPanelEmptyState } from "./detail-panel";
import { useDetailPanel } from "./parts/detail-panel-context";
import {
  DEMO_ENTITIES,
  findEntity,
  type DemoEntity,
} from "./dummy-data";
import type { DetailPanelSelection } from "./types";

function entitySelection(entity: DemoEntity | undefined): DetailPanelSelection | null {
  if (!entity) return null;
  return { type: entity.kind, id: entity.id };
}

function EntityHeader({ entity }: { entity: DemoEntity }) {
  return (
    <DetailPanel.Header>
      <div className="flex flex-col">
        <span className="text-base font-semibold text-foreground">
          {entity.label}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {entity.kind}
          {entity.kind === "node" ? ` · ${entity.nodeType}` : null}
        </span>
      </div>
      {entity.kind === "node" && entity.pinned ? (
        <Badge variant="secondary" className="gap-1">
          <Pin aria-hidden="true" className="size-3" />
          Pinned
        </Badge>
      ) : null}
    </DetailPanel.Header>
  );
}

function EntityReadView({ entity }: { entity: DemoEntity }) {
  switch (entity.kind) {
    case "node":
      return (
        <dl className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
          <dt className="text-muted-foreground">Type</dt>
          <dd>{entity.nodeType}</dd>
          <dt className="text-muted-foreground">Created</dt>
          <dd className="font-mono">{entity.createdAt}</dd>
          <dt className="text-muted-foreground">Pinned</dt>
          <dd>{entity.pinned ? "Yes" : "No"}</dd>
          <dt className="text-muted-foreground">Notes</dt>
          <dd className="whitespace-pre-wrap">{entity.description}</dd>
        </dl>
      );
    case "edge":
      return (
        <dl className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
          <dt className="text-muted-foreground">Source</dt>
          <dd className="font-mono text-xs">{entity.source}</dd>
          <dt className="text-muted-foreground">Target</dt>
          <dd className="font-mono text-xs">{entity.target}</dd>
          <dt className="text-muted-foreground">Weight</dt>
          <dd className="font-mono tabular-nums">{entity.weight.toFixed(2)}</dd>
        </dl>
      );
    case "group":
      return (
        <dl className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
          <dt className="text-muted-foreground">Members</dt>
          <dd className="font-mono tabular-nums">{entity.memberCount}</dd>
          <dt className="text-muted-foreground">Hull color</dt>
          <dd className="font-mono">{entity.color}</dd>
        </dl>
      );
    case "file":
      return (
        <dl className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
          <dt className="text-muted-foreground">MIME</dt>
          <dd className="font-mono text-xs">{entity.mime}</dd>
          <dt className="text-muted-foreground">Size</dt>
          <dd className="font-mono tabular-nums">
            {entity.size.toLocaleString()} bytes
          </dd>
          <dt className="text-muted-foreground">Uploaded by</dt>
          <dd className="font-mono text-xs">{entity.uploadedBy}</dd>
        </dl>
      );
  }
}

function EmptyDemo() {
  return (
    <div className="h-96">
      <DetailPanel selection={null} ariaLabel="Empty">
        {null}
      </DetailPanel>
    </div>
  );
}

function ReadDemo() {
  const entity = DEMO_ENTITIES[0];
  return (
    <div className="h-96">
      <DetailPanel
        selection={entitySelection(entity)}
        ariaLabel={entity.label}
      >
        <EntityHeader entity={entity} />
        <DetailPanel.Body>
          <EntityReadView entity={entity} />
        </DetailPanel.Body>
      </DetailPanel>
    </div>
  );
}

function ModeAwareNodeBody({
  entity,
  draftLabel,
  draftDesc,
  onDraftLabelChange,
  onDraftDescChange,
}: {
  entity: DemoEntity;
  draftLabel: string;
  draftDesc: string;
  onDraftLabelChange: (s: string) => void;
  onDraftDescChange: (s: string) => void;
}) {
  const { mode } = useDetailPanel();
  if (mode === "read") return <EntityReadView entity={entity} />;
  return (
    <div className="flex flex-col gap-3 text-sm">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Label</span>
        <input
          type="text"
          value={draftLabel}
          onChange={(e) => onDraftLabelChange(e.target.value)}
          className="h-8 rounded-md border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>
      {entity.kind === "node" ? (
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Notes</span>
          <textarea
            value={draftDesc}
            onChange={(e) => onDraftDescChange(e.target.value)}
            rows={4}
            className="rounded-md border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </label>
      ) : null}
      <p className="text-xs text-muted-foreground">
        In a real host, slot a Tier-1 properties-form here.
      </p>
    </div>
  );
}

function ModeToggleDemo() {
  const entity = DEMO_ENTITIES[0];
  const [draftLabel, setDraftLabel] = useState(entity.label);
  const [draftDesc, setDraftDesc] = useState(
    entity.kind === "node" ? entity.description : "",
  );

  return (
    <div className="h-96">
      <DetailPanel selection={entitySelection(entity)} ariaLabel={entity.label}>
        <EntityHeader entity={entity} />
        <DetailPanel.Body>
          <ModeAwareNodeBody
            entity={entity}
            draftLabel={draftLabel}
            draftDesc={draftDesc}
            onDraftLabelChange={setDraftLabel}
            onDraftDescChange={setDraftDesc}
          />
        </DetailPanel.Body>
        <DetailPanel.Actions>
          {({ mode, setMode, canEdit }) => {
            if (mode === "read") {
              return (
                <Button
                  id="mode-toggle-edit-btn"
                  size="sm"
                  variant="outline"
                  disabled={!canEdit}
                  onClick={() => setMode("edit")}
                >
                  <Pencil aria-hidden="true" className="size-3" />
                  Edit
                </Button>
              );
            }
            return (
              <>
                <Button size="sm" variant="ghost" onClick={() => setMode("read")}>
                  Cancel
                </Button>
                <Button size="sm" onClick={() => setMode("read")}>
                  Save
                </Button>
              </>
            );
          }}
        </DetailPanel.Actions>
      </DetailPanel>
    </div>
  );
}

function LoadingDemo() {
  return (
    <div className="h-96">
      <DetailPanel
        selection={{ type: "node", id: "loading-fixture" }}
        loading
        ariaLabel="Loading fixture"
      >
        {null}
      </DetailPanel>
    </div>
  );
}

function ErrorDemo() {
  const [retryCount, setRetryCount] = useState(0);
  const retry = useCallback(() => setRetryCount((n) => n + 1), []);
  return (
    <div className="flex h-96 flex-col gap-2">
      <DetailPanel
        selection={{ type: "node", id: "error-fixture" }}
        error={{
          message: "Couldn't load this entity. Network error (offline?).",
          retry,
        }}
        ariaLabel="Error fixture"
      >
        {null}
      </DetailPanel>
      <p className="text-xs text-muted-foreground">
        Retry clicked {retryCount} time{retryCount === 1 ? "" : "s"} (handler is host-supplied).
      </p>
    </div>
  );
}

function SelectionSwitcherDemo() {
  const [selectedId, setSelectedId] = useState<string | null>(DEMO_ENTITIES[0].id);
  const entity = selectedId ? findEntity(selectedId) : undefined;
  const selection = entitySelection(entity);

  return (
    <div className="grid h-96 grid-cols-[180px_1fr] gap-4">
      <div className="flex flex-col gap-1 overflow-y-auto rounded-md border border-border bg-card p-2">
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className={`rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
            selectedId === null
              ? "bg-primary/10 font-medium text-foreground"
              : "text-muted-foreground hover:bg-muted/50"
          }`}
        >
          (clear)
        </button>
        {DEMO_ENTITIES.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setSelectedId(e.id)}
            className={`flex flex-col rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
              selectedId === e.id
                ? "bg-primary/10 font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <span className="truncate text-foreground">{e.label}</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {e.kind}
            </span>
          </button>
        ))}
      </div>
      <DetailPanel
        selection={selection}
        ariaLabel={entity?.label ?? "No selection"}
      >
        {entity ? (
          <>
            <EntityHeader entity={entity} />
            <DetailPanel.Body>
              <EntityReadView entity={entity} />
            </DetailPanel.Body>
          </>
        ) : null}
      </DetailPanel>
    </div>
  );
}

function CustomEmptyDemo() {
  return (
    <div className="h-96">
      <DetailPanel
        selection={null}
        ariaLabel="Custom empty"
        emptyState={
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <DetailPanelEmptyState
              title="Pick a node"
              description="Click a graph node or use the search palette."
            />
            <Button size="sm" variant="outline">
              <RefreshCw aria-hidden="true" className="size-3" />
              Reload graph
            </Button>
          </div>
        }
      >
        {null}
      </DetailPanel>
    </div>
  );
}

export default function DetailPanelDemo() {
  return (
    <Tabs defaultValue="empty">
      <TabsList className="flex flex-wrap">
        <TabsTrigger value="empty">Empty</TabsTrigger>
        <TabsTrigger value="read">Read</TabsTrigger>
        <TabsTrigger value="mode">Mode toggle</TabsTrigger>
        <TabsTrigger value="loading">Loading</TabsTrigger>
        <TabsTrigger value="error">Error</TabsTrigger>
        <TabsTrigger value="switcher">Selection switcher</TabsTrigger>
        <TabsTrigger value="custom-empty">Custom empty</TabsTrigger>
      </TabsList>
      <TabsContent value="empty" className="mt-4">
        <EmptyDemo />
      </TabsContent>
      <TabsContent value="read" className="mt-4">
        <ReadDemo />
      </TabsContent>
      <TabsContent value="mode" className="mt-4">
        <ModeToggleDemo />
      </TabsContent>
      <TabsContent value="loading" className="mt-4">
        <LoadingDemo />
      </TabsContent>
      <TabsContent value="error" className="mt-4">
        <ErrorDemo />
      </TabsContent>
      <TabsContent value="switcher" className="mt-4">
        <SelectionSwitcherDemo />
      </TabsContent>
      <TabsContent value="custom-empty" className="mt-4">
        <CustomEmptyDemo />
      </TabsContent>
    </Tabs>
  );
}
