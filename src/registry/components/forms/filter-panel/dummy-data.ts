export type GraphNodeKind = "person" | "org" | "project" | "doc";

export interface GraphNodeFixture {
  id: string;
  label: string;
  kind: GraphNodeKind;
  tags: string[];
  pinned: boolean;
  members: number;
  description: string;
}

export const NODE_FIXTURES: GraphNodeFixture[] = [
  {
    id: "n1",
    label: "Rina Okafor",
    kind: "person",
    tags: ["security", "auth"],
    pinned: true,
    members: 1,
    description: "Engineering lead — owns the auth-v2 migration.",
  },
  {
    id: "n2",
    label: "Marc Bernal",
    kind: "person",
    tags: ["frontend"],
    pinned: false,
    members: 1,
    description: "Frontend platform; component library maintainer.",
  },
  {
    id: "n3",
    label: "Acme Corp",
    kind: "org",
    tags: ["customer", "tier-1"],
    pinned: true,
    members: 240,
    description: "Pilot customer for the v2 rollout.",
  },
  {
    id: "n4",
    label: "Verda Holdings",
    kind: "org",
    tags: ["customer"],
    pinned: false,
    members: 88,
    description: "Customer in the prosperity tier.",
  },
  {
    id: "n5",
    label: "auth-v2 migration",
    kind: "project",
    tags: ["security", "auth", "tier-1"],
    pinned: true,
    members: 7,
    description: "Cross-team migration tracking work.",
  },
  {
    id: "n6",
    label: "registry publish",
    kind: "project",
    tags: ["frontend", "ops"],
    pinned: false,
    members: 3,
    description: "Cut the v0.1 NPM publish.",
  },
  {
    id: "n7",
    label: "v2-runbook.md",
    kind: "doc",
    tags: ["security", "auth"],
    pinned: false,
    members: 1,
    description: "Runbook for the security-team review queue.",
  },
  {
    id: "n8",
    label: "design-tokens.md",
    kind: "doc",
    tags: ["frontend"],
    pinned: false,
    members: 1,
    description: "Lime accent + Onest font lock.",
  },
];

export const KIND_OPTIONS = [
  { value: "person", label: "People" },
  { value: "org", label: "Organizations" },
  { value: "project", label: "Projects" },
  { value: "doc", label: "Docs" },
] as const;

export const TAG_OPTIONS = [
  { value: "security", label: "security" },
  { value: "auth", label: "auth" },
  { value: "frontend", label: "frontend" },
  { value: "tier-1", label: "tier-1" },
  { value: "customer", label: "customer" },
  { value: "ops", label: "ops" },
] as const;
