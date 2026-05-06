import type { KanbanData } from "./types";

export const KANBAN_BOARD_01_DUMMY: KanbanData = {
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
            description: "Validate against the staging IDP; fall back to existing token endpoint.",
            tags: [{ label: "auth" }, { label: "platform" }],
            assignees: [
              { id: "u-ada", name: "Ada Lovelace" },
              { id: "u-bo", name: "Bo Yang" },
            ],
            meta: [{ key: "due", label: "due", value: "May 12" }],
          },
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
        {
          id: "item-3",
          rendererId: "kanban-card",
          swimlaneId: "lane-product",
          data: {
            title: "Settings page polish",
            description: "Tighten spacing on the notifications panel.",
            tags: [{ label: "design" }],
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
          id: "item-4",
          rendererId: "kanban-card",
          swimlaneId: "lane-product",
          data: {
            title: "Onboarding flow v2",
            description: "Replace the splash modal with an inline tour.",
            tags: [{ label: "growth" }],
            assignees: [{ id: "u-cn", name: "Cy Nguyen" }],
            meta: [{ key: "due", label: "due", value: "May 8" }],
          },
        },
      ],
    },
    {
      id: "col-blocked",
      title: "Blocked",
      color: "rose",
      acceptsRendererIds: ["kanban-card"],
      items: [
        {
          id: "item-5",
          rendererId: "kanban-card",
          swimlaneId: "lane-platform",
          locked: true,
          data: {
            title: "Migration: legacy session store",
            description: "Pinned — waiting on infra approval.",
            tags: [{ label: "infra" }, { label: "blocked" }],
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
      ],
    },
  ],
};
