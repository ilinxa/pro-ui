"use client";

import { useCallback, useMemo, useState } from "react";
import { RichCard } from "@/registry/components/data/rich-card";
import type { RichCardJsonNode } from "@/registry/components/data/rich-card";
import { KanbanBoard } from "./kanban-board-01";
import { kanbanCardRenderer } from "./parts/kanban-card";
import { kanbanNoteRenderer } from "./parts/kanban-note";
import type { KanbanCardRenderer, KanbanData } from "./types";

// Rich-card adapter — registers the full <RichCard> as a kanban renderer.
// Items with rendererId="rich-card" carry a RichCardJsonNode. We use
// dragHandle="header" so the kanban grip strip handles outer reorder while the
// RichCard body keeps its click-to-edit + internal DnD intact.
function makeRichCardRenderer(
  onItemDataChange: (itemId: string, next: RichCardJsonNode) => void,
): KanbanCardRenderer<RichCardJsonNode> {
  return {
    id: "rich-card",
    label: "Rich card",
    dragHandle: "header",
    render: (data, ctx) => (
      <div className="rounded-b-md border-x border-b border-border bg-card text-card-foreground shadow-xs">
        <RichCard
          key={ctx.itemId}
          defaultValue={data}
          editable
          defaultCollapsed={(level) => level >= 1}
          metaPresentation="popover"
          onChange={(tree) => onItemDataChange(ctx.itemId, tree)}
          aria-label={`Rich card item ${ctx.itemId}`}
          className="text-xs"
        />
      </div>
    ),
    newItem: () => ({
      __rcid: `rc-${Date.now().toString(36)}`,
      title: "New rich card",
    }),
  };
}

const INITIAL_DATA: KanbanData = {
  swimlanes: [
    { id: "lane-platform", title: "Platform" },
    { id: "lane-product", title: "Product" },
  ],
  columns: [
    {
      id: "col-todo",
      title: "To do",
      color: "slate",
      items: [
        {
          id: "item-1",
          rendererId: "kanban-card",
          swimlaneId: "lane-platform",
          data: {
            title: "Wire OAuth flow for new SDK",
            description:
              "Validate against the staging IDP; fall back to existing token endpoint.",
            tags: [{ label: "auth" }, { label: "platform" }],
            assignees: [
              { id: "u-ada", name: "Ada Lovelace" },
              { id: "u-bo", name: "Bo Yang" },
            ],
            meta: [{ key: "due", label: "due", value: "May 12" }],
          },
        },
        {
          id: "item-rich-1",
          rendererId: "rich-card",
          swimlaneId: "lane-product",
          data: {
            __rcid: "rich-onboarding",
            __rcmeta: {
              owner: "design",
              created: "2026-04-29",
              priority: "high",
            },
            title: "Onboarding flow v2",
            summary: "Replace splash modal with an inline tour",
            estimated_hours: 16,
            blocked: false,
            quote:
              "Friction in the first 30 seconds defines the whole product.",
            list: [
              "audit current funnel",
              "wireframe v2",
              "prototype",
              "user-test",
              "ship",
            ],
            requirements: {
              __rcid: "rich-onboarding-req",
              __rcmeta: { source: "PM brief", revision: 3 },
              browsers: ["Chrome", "Safari", "Firefox"],
              minimum_version: "ES2020",
              codearea: {
                format: "ts",
                content:
                  "type OnboardingStep =\n  | 'welcome'\n  | 'connect'\n  | 'invite'\n  | 'done';\n\ninterface FlowState {\n  step: OnboardingStep;\n  startedAt: string;\n}",
              },
            },
            metrics: {
              __rcid: "rich-onboarding-metrics",
              kpi: "completion rate",
              baseline: 0.41,
              target: 0.62,
              table: {
                headers: ["step", "drop-off (v1)", "target"],
                rows: [
                  ["welcome", 0.08, 0.05],
                  ["connect", 0.31, 0.15],
                  ["invite", 0.18, 0.1],
                ],
              },
            },
          } satisfies RichCardJsonNode,
        },
        {
          id: "item-2",
          rendererId: "kanban-note",
          swimlaneId: "lane-platform",
          data: {
            title: "Reminder",
            body: "Coordinate with the auth team on the new session shape before merging.",
          },
        },
      ],
    },
    {
      id: "col-doing",
      title: "In progress",
      color: "lime",
      maxItems: 3,
      items: [
        {
          id: "item-rich-2",
          rendererId: "rich-card",
          swimlaneId: "lane-platform",
          data: {
            __rcid: "rich-migration",
            __rcmeta: {
              ticket: "PLAT-482",
              risk: "medium",
              window: "2026-05-09T22:00:00Z",
            },
            title: "Migrate session store",
            stage: "implementation",
            rollback_ready: true,
            image: {
              src: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=70",
              alt: "Architecture diagram",
            },
            steps: {
              __rcid: "rich-migration-steps",
              expected_duration_minutes: 45,
              list: [
                "snapshot current store",
                "drain in-flight sessions",
                "swap connection pool",
                "verify auth probe",
                "monitor 30m",
              ],
            },
            schema: {
              __rcid: "rich-migration-schema",
              codearea: {
                format: "sql",
                content:
                  "ALTER TABLE sessions\n  ADD COLUMN store_version SMALLINT NOT NULL DEFAULT 2;\n\nCREATE INDEX CONCURRENTLY idx_sessions_v2\n  ON sessions (user_id, store_version);",
              },
            },
          } satisfies RichCardJsonNode,
        },
        {
          id: "item-4",
          rendererId: "kanban-card",
          swimlaneId: "lane-product",
          data: {
            title: "Empty-state polish",
            description: "Tighten spacing on the notifications panel.",
            tags: [{ label: "design" }],
            assignees: [{ id: "u-cn", name: "Cy Nguyen" }],
          },
        },
      ],
    },
    {
      id: "col-review",
      title: "Review",
      color: "indigo",
      items: [
        {
          id: "item-rich-3",
          rendererId: "rich-card",
          swimlaneId: "lane-product",
          data: {
            __rcid: "rich-spec",
            __rcmeta: { reviewer: "Ada Lovelace", round: 2 },
            title: "API spec — billing v3",
            status: "in-review",
            breaking_changes: false,
            quote:
              "If we get the deprecation window right, nobody notices the migration.",
            endpoints: {
              __rcid: "rich-spec-endpoints",
              count: 6,
              table: {
                headers: ["method", "path", "auth"],
                rows: [
                  ["GET", "/v3/invoices", "scope:read"],
                  ["POST", "/v3/invoices", "scope:write"],
                  ["GET", "/v3/customers/:id", "scope:read"],
                  ["DELETE", "/v3/invoices/:id", "scope:write"],
                ],
              },
            },
            sample: {
              __rcid: "rich-spec-sample",
              codearea: {
                format: "json",
                content:
                  '{\n  "id": "inv_82a",\n  "amount_cents": 12500,\n  "currency": "EUR",\n  "due": "2026-05-30"\n}',
              },
            },
            notes: ["soft-deprecate v2 by EOY", "x-version header optional"],
          } satisfies RichCardJsonNode,
        },
        {
          id: "item-5",
          rendererId: "kanban-card",
          swimlaneId: "lane-platform",
          data: {
            title: "Cache eviction policy",
            description:
              "Decide between LRU and ARC for the new session cache layer.",
            tags: [{ label: "perf" }, { label: "infra" }],
            assignees: [{ id: "u-bo", name: "Bo Yang" }],
            meta: [{ key: "due", label: "due", value: "May 9" }],
          },
        },
      ],
    },
    {
      id: "col-done",
      title: "Done",
      color: "emerald",
      allowReorder: false,
      items: [
        {
          id: "item-6",
          rendererId: "kanban-card",
          swimlaneId: "lane-product",
          data: {
            title: "Empty-state illustrations",
            tags: [{ label: "design" }],
            assignees: [{ id: "u-fe", name: "Farah Eid" }],
          },
        },
        {
          id: "item-7",
          rendererId: "kanban-note",
          swimlaneId: "lane-platform",
          data: {
            title: "Postmortem ready",
            body: "Posted in #infra-incidents — link in the action items list.",
          },
        },
      ],
    },
  ],
};

export default function KanbanBoard01Demo() {
  const [data, setData] = useState<KanbanData>(INITIAL_DATA);

  // Rich-card renderer fires this whenever its inner state changes — we walk
  // the board and replace the matching item's data so kanban stays the source of truth.
  const updateRichCardData = useCallback(
    (itemId: string, next: RichCardJsonNode) => {
      setData((prev) => ({
        ...prev,
        columns: prev.columns.map((col) => ({
          ...col,
          items: col.items.map((it) =>
            it.id === itemId ? { ...it, data: next } : it,
          ),
        })),
      }));
    },
    [],
  );

  const renderers = useMemo(
    () => [
      kanbanCardRenderer,
      kanbanNoteRenderer,
      makeRichCardRenderer(updateRichCardData),
    ],
    [updateRichCardData],
  );

  return (
    <div className="h-160 w-full overflow-hidden rounded-md border border-border bg-background">
      <KanbanBoard
        renderers={renderers}
        data={data}
        onChange={setData}
      />
    </div>
  );
}
