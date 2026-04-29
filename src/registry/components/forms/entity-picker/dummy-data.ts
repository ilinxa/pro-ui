import type { KindMeta } from "./types";

export interface GraphNode {
  id: string;
  label: string;
  kind: "person" | "org" | "project" | "doc" | "tag";
  pinned?: boolean;
  description?: string;
}

export interface User {
  id: string;
  label: string;
  email: string;
  avatar: string;
}

export const NODE_KINDS: Record<string, KindMeta> = {
  person: { label: "Person", color: "oklch(0.78 0.14 220)" },
  org: { label: "Org", color: "oklch(0.74 0.16 280)" },
  project: { label: "Project", color: "oklch(0.80 0.20 132)" },
  doc: { label: "Doc", color: "oklch(0.74 0.13 50)" },
  tag: { label: "Tag", color: "oklch(0.70 0.04 250)" },
};

export const GRAPH_NODES: GraphNode[] = [
  { id: "n-rina", label: "Rina Okafor", kind: "person", pinned: true, description: "Engineering lead — auth-v2 migration." },
  { id: "n-marc", label: "Marc Bernal", kind: "person", description: "Frontend platform; component library." },
  { id: "n-jules", label: "Jules Aalto", kind: "person", description: "Design systems; type & motion." },
  { id: "n-tomi", label: "Tomi Aida", kind: "person", description: "Backend — auth + permissions." },
  { id: "n-acme", label: "Acme Corp", kind: "org", pinned: true, description: "Pilot customer for v2 rollout." },
  { id: "n-verda", label: "Verda Holdings", kind: "org", description: "Customer in the prosperity tier." },
  { id: "n-helio", label: "Helio Labs", kind: "org", description: "Research partner; experimental graph workloads." },
  { id: "n-auth-v2", label: "auth-v2 migration", kind: "project", pinned: true, description: "Cross-team migration tracking work." },
  { id: "n-registry", label: "registry publish", kind: "project", description: "Cut the v0.1 NPM publish." },
  { id: "n-graph-sys", label: "graph-system Tier 3", kind: "project", description: "Tier 3 host page for the graph product." },
  { id: "n-runbook", label: "v2-runbook.md", kind: "doc", description: "Runbook for the security-team review queue." },
  { id: "n-tokens", label: "design-tokens.md", kind: "doc", description: "Lime accent + Onest font lock." },
  { id: "n-handoff", label: "session-handoff.md", kind: "doc", description: "Pause-point continuation context." },
  { id: "n-tag-sec", label: "security", kind: "tag" },
  { id: "n-tag-auth", label: "auth", kind: "tag" },
  { id: "n-tag-ui", label: "frontend", kind: "tag" },
  { id: "n-tag-ops", label: "ops", kind: "tag" },
  { id: "n-tag-tier1", label: "tier-1", kind: "tag" },
];

export const USERS: User[] = [
  { id: "u-rina", label: "Rina Okafor", email: "rina@ilinxa.dev", avatar: "RO" },
  { id: "u-marc", label: "Marc Bernal", email: "marc@ilinxa.dev", avatar: "MB" },
  { id: "u-jules", label: "Jules Aalto", email: "jules@ilinxa.dev", avatar: "JA" },
  { id: "u-tomi", label: "Tomi Aida", email: "tomi@ilinxa.dev", avatar: "TA" },
  { id: "u-petra", label: "Petra Schwarz", email: "petra@ilinxa.dev", avatar: "PS" },
  { id: "u-luis", label: "Luis Terán", email: "luis@ilinxa.dev", avatar: "LT" },
  { id: "u-anh", label: "Anh Le", email: "anh@ilinxa.dev", avatar: "AL" },
  { id: "u-benji", label: "Benji Halloran", email: "benji@ilinxa.dev", avatar: "BH" },
];
