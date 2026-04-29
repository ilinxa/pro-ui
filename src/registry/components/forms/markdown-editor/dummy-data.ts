import type { KindMeta, WikilinkCandidate } from "./types";

export interface GraphNode extends WikilinkCandidate {
  id: string;
  label: string;
  kind: "person" | "project" | "doc" | "tag";
  alias?: string;
}

// Resembles the force-graph fixture used elsewhere in the registry. Wikilinks in the
// sample documents reference these labels — case-insensitively + trimmed (Q4 lock).
export const GRAPH_NODES: GraphNode[] = [
  { id: "n1", label: "Rina Okafor", kind: "person", alias: "Rina" },
  { id: "n2", label: "Mateo Alvarez", kind: "person", alias: "Mateo" },
  { id: "n3", label: "Yuki Tanaka", kind: "person" },
  { id: "n4", label: "Ada Park", kind: "person" },
  { id: "n5", label: "Lighthouse rollout", kind: "project" },
  { id: "n6", label: "Dataset migration", kind: "project" },
  { id: "n7", label: "Q3 strategy", kind: "doc" },
  { id: "n8", label: "Onboarding playbook", kind: "doc" },
  { id: "n9", label: "Roadmap snapshot", kind: "doc" },
  { id: "n10", label: "research", kind: "tag" },
  { id: "n11", label: "infrastructure", kind: "tag" },
  { id: "n12", label: "design-system", kind: "tag" },
];

export const NODE_KINDS: Record<string, KindMeta> = {
  person: { label: "Person", color: "oklch(0.62 0.18 250)" },
  project: { label: "Project", color: "oklch(0.62 0.18 162)" },
  doc: { label: "Doc", color: "oklch(0.62 0.18 60)" },
  tag: { label: "Tag", color: "oklch(0.55 0.05 280)" },
};

export const SAMPLE_DOC = `# Q3 strategy notes

We're rolling out a new dashboard that touches three teams. Owner is [[Rina Okafor|Rina]] with [[Mateo Alvarez]] driving the design review.

## Open questions

- Will [[Lighthouse rollout]] block the [[Dataset migration]]?
- What does the [[Roadmap snapshot]] say about Q4 scope?
- Where does [[unknown reference]] fit? *broken link example*

## Action items

1. Sync with [[Yuki Tanaka]] on the API contract.
2. Update [[Onboarding playbook]] with the new flow.
3. File the bug under #infrastructure.

## Code

> A markdown editor should feel like writing in a notes app, not a form field.

Inline \`code\`, **bold**, and *italic* all work. Tables too:

| Surface | Status |
| --- | --- |
| Editor | shipped |
| Preview | shipped |
| Wikilinks | shipped |

- [ ] Static GFM checkbox (non-interactive in v0.1)
- [x] Static checked checkbox
`;

export const SHORT_DOC = `## Welcome

Type **bold**, *italic*, or \`inline code\`. Try \`[[\` to open the wikilink picker.

Tagged with [[research]] and [[design-system]].
`;

export const READ_ONLY_DOC = `# Onboarding playbook

This document is rendered as read-only. Toolbar and keymaps are disabled,
but syntax highlighting + preview still work.

- See [[Q3 strategy]] for context.
- Owner: [[Ada Park]]
`;
