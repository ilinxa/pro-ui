import type { RichCardJsonNode } from "./types";

/**
 * One rich demo tree exercising every v0.1 feature:
 *   • 6 levels of depth (root + 5 nested levels)
 *   • all five field types: string, number, boolean, date (ISO-8601), null
 *   • all five predefined keys: codearea, image, table, quote, list
 *   • per-card __rcmeta on multiple cards
 *   • a card without IDs (auto-canonicalization)
 *   • leaf cards with body content (proves "all cards collapsible")
 */
export const RICH_DEMO: RichCardJsonNode = {
  __rcid: "thesis-001",
  __rcorder: 0,
  __rcmeta: {
    author: "Hessam Hezaveh",
    started: "2026-01-15",
    pages: 87,
    chapters: 4,
    submitted: false,
    grade: null,
  },
  title: "Adaptive UI Components for Data-Heavy Applications",
  abstract:
    "A study of dynamic component patterns for hierarchical structured content in modern web apps.",
  word_count: 28400,
  status: "in-progress",
  approved: true,
  defense_date: "2026-06-15T14:00:00Z",
  last_edited: "2026-04-28",
  reviewer_count: null,

  list: [
    "structured-content",
    "tree-rendering",
    "json-native",
    "accessibility",
    "round-trip",
  ],

  image: {
    src: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
    alt: "Architecture diagram cover",
  },

  introduction: {
    __rcid: "ch1",
    __rcorder: 0,
    __rcmeta: { drafted: "2026-02-01", revisions: 4 },
    pages: 8,
    completed: true,

    quote:
      "The web demands components that adapt to their data, not the other way around.",

    motivation: {
      __rcid: "ch1-mot",
      __rcorder: 0,
      summary: "Why hierarchical structured content needs a first-class viewer",
      relevance_score: 8.5,
      addresses_gap: true,

      table: {
        headers: ["component-class", "static-shape", "adaptive-shape"],
        rows: [
          ["table", true, false],
          ["card-tree", false, true],
          ["form-builder", true, false],
          ["json-tree", false, true],
        ],
      },

      industry_need: {
        __rcid: "ch1-mot-ind",
        __rcorder: 0,
        summary: "Industry surveys 2024-2026",
        sample_size: 1240,
        confidence: 0.95,
        peer_reviewed: false,

        codearea: {
          format: "ts",
          content:
            "interface AdaptiveProps<T> {\n  data: T;\n  schema?: Schema<T>;\n  // shape inferred when schema is absent\n}",
        },

        survey_result: {
          __rcid: "ch1-mot-ind-srv",
          __rcorder: 0,
          finding: "73% of devs build custom tree-card UIs per project",
          methodology: "online survey + 14 interviews",
          response_rate: 0.42,
          completed: true,

          list: [
            "shadcn covers primitives, not compositions",
            "json-tree libs render as code, not content",
            "Notion-likes lock you into a block schema",
          ],

          top_excerpt: {
            __rcid: "ch1-mot-ind-srv-exc",
            __rcorder: 0,
            __rcmeta: {
              location: "remote interview",
              recorded_by: "research-asst-2",
              consent: true,
            },
            attribution: "Senior FE, public-traded SaaS",
            interview_id: 7,
            recorded: "2026-01-22T16:30:00Z",

            quote:
              "We rebuild this same hierarchical view for every product. Six weeks each, accessibility skipped, never reusable.",
          },
        },
      },
    },

    contributions: {
      __rcid: "ch1-con",
      __rcorder: 1,
      summary: "What this thesis adds to the field",
      novel_findings: 3,

      list: [
        "JSON-native data model with stable identity keys",
        "ARIA tree contract from day one",
        "Round-trip-safe serialization at every depth",
      ],
    },
  },

  methodology: {
    __rcid: "ch2",
    __rcorder: 1,
    __rcmeta: { drafted: "2026-02-20" },
    pages: 12,
    approach: "design + implementation + evaluation",

    quote:
      "Three components, three teams, six weeks each — measured against a single shared baseline.",
  },

  results: {
    __rcid: "ch3",
    __rcorder: 2,
    __rcmeta: { drafted: "2026-03-15", significant: true },
    pages: 18,
    significant: true,
    p_value: 0.003,
    effect_size: 0.81,

    table: {
      headers: ["metric", "baseline", "rich-card", "delta"],
      rows: [
        ["dev-time-days", 21, 2, "-90%"],
        ["a11y-score", 76, 98, "+29%"],
        ["bundle-kb", 45, 18, "-60%"],
        ["round-trip-fidelity", false, true, "—"],
      ],
    },
  },

  // No __rcid / __rcorder — auto-canonicalization on parse.
  conclusion: {
    pages: 4,
    written: false,
    summary: "Bring it home",
  },
};
