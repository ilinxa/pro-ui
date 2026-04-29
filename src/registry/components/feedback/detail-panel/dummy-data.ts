export type DemoEntityKind = "node" | "edge" | "group" | "file";

export interface DemoNode {
  id: string;
  kind: "node";
  label: string;
  nodeType: string;
  pinned: boolean;
  description: string;
  createdAt: string;
}

export interface DemoEdge {
  id: string;
  kind: "edge";
  label: string;
  source: string;
  target: string;
  weight: number;
}

export interface DemoGroup {
  id: string;
  kind: "group";
  label: string;
  memberCount: number;
  color: string;
}

export interface DemoFile {
  id: string;
  kind: "file";
  label: string;
  size: number;
  mime: string;
  uploadedBy: string;
}

export type DemoEntity = DemoNode | DemoEdge | DemoGroup | DemoFile;

export const DEMO_ENTITIES: DemoEntity[] = [
  {
    id: "node-rina",
    kind: "node",
    label: "Rina Okafor",
    nodeType: "Person",
    pinned: true,
    description:
      "Engineering lead for the auth-v2 migration. Owns the security-team review queue.",
    createdAt: "2025-11-12",
  },
  {
    id: "node-acme-corp",
    kind: "node",
    label: "Acme Corp",
    nodeType: "Organization",
    pinned: false,
    description: "Pilot customer for the v2 rollout. Multiple feature flags gated on their tenant.",
    createdAt: "2025-09-03",
  },
  {
    id: "edge-rina-acme",
    kind: "edge",
    label: "WORKS_WITH",
    source: "node-rina",
    target: "node-acme-corp",
    weight: 0.82,
  },
  {
    id: "group-security",
    kind: "group",
    label: "Security Team",
    memberCount: 7,
    color: "lime",
  },
  {
    id: "file-runbook",
    kind: "file",
    label: "auth-v2-runbook.md",
    size: 18420,
    mime: "text/markdown",
    uploadedBy: "rina@ilinxa.dev",
  },
];

export function findEntity(id: string): DemoEntity | undefined {
  return DEMO_ENTITIES.find((e) => e.id === id);
}
