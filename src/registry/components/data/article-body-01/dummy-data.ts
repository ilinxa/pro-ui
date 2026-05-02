import type { ArticleBodyValue } from "./types";

export const ARTICLE_BODY_01_DUMMY_RICH: ArticleBodyValue = [
  {
    type: "h1",
    children: [{ text: "How sustainable cities are rethinking density" }],
  },
  {
    type: "p",
    children: [
      { text: "Across Europe and the Americas, urban planners are " },
      { text: "rewriting the rules", bold: true },
      {
        text: " — turning suburbs into 15-minute neighborhoods and waterfronts into thriving public spaces.",
      },
    ],
  },
  {
    type: "h2",
    children: [{ text: "What changed in 2025" }],
  },
  {
    type: "p",
    children: [
      {
        text: "Three major policy shifts reshaped how cities approach growth: zoning reform, transit-oriented development, and ",
      },
      { text: "carbon-constrained budgets", italic: true },
      { text: "." },
    ],
  },
  {
    type: "blockquote",
    children: [
      {
        text: "We're no longer optimizing for cars — we're optimizing for the time people spend with their neighbors.",
      },
    ],
  },
  {
    type: "h3",
    children: [{ text: "Three ideas worth tracking" }],
  },
  {
    type: "ul",
    listStyleType: "disc",
    indent: 1,
    children: [
      { text: "Mixed-use density at every transit stop" },
    ],
  },
  {
    type: "ul",
    listStyleType: "disc",
    indent: 1,
    children: [
      { text: "Streets reclaimed as plazas (the Barcelona model)" },
    ],
  },
  {
    type: "ul",
    listStyleType: "disc",
    indent: 1,
    children: [
      { text: "Carbon-budgeted permitting (the Helsinki model)" },
    ],
  },
  {
    type: "p",
    children: [
      { text: "For more, see " },
      {
        type: "a",
        url: "https://example.com/sustainable-cities",
        children: [{ text: "the full report" }],
      },
      { text: "." },
    ],
  },
  {
    type: "hr",
    children: [{ text: "" }],
  },
  {
    type: "p",
    children: [
      { text: "Run an experiment: " },
      { text: "code-friendly", code: true },
      { text: " variations of urban planning APIs." },
    ],
  },
];

export const ARTICLE_BODY_01_DUMMY_SIMPLE: ArticleBodyValue = [
  { type: "h2", children: [{ text: "Quick note" }] },
  {
    type: "p",
    children: [
      { text: "Sometimes you just need " },
      { text: "a paragraph", bold: true },
      { text: ". This editor handles that." },
    ],
  },
];

export const ARTICLE_BODY_01_DUMMY_EMPTY: ArticleBodyValue = [
  { type: "p", children: [{ text: "" }] },
];

export const ARTICLE_BODY_01_DUMMY_TABLE: ArticleBodyValue = [
  { type: "h3", children: [{ text: "Comparison" }] },
  {
    type: "table",
    children: [
      {
        type: "tr",
        children: [
          { type: "th", children: [{ type: "p", children: [{ text: "Approach" }] }] },
          { type: "th", children: [{ type: "p", children: [{ text: "Strength" }] }] },
          { type: "th", children: [{ type: "p", children: [{ text: "Weakness" }] }] },
        ],
      },
      {
        type: "tr",
        children: [
          { type: "td", children: [{ type: "p", children: [{ text: "Markdown" }] }] },
          { type: "td", children: [{ type: "p", children: [{ text: "Portable" }] }] },
          { type: "td", children: [{ type: "p", children: [{ text: "Plain" }] }] },
        ],
      },
      {
        type: "tr",
        children: [
          { type: "td", children: [{ type: "p", children: [{ text: "Plate JSON" }] }] },
          { type: "td", children: [{ type: "p", children: [{ text: "Rich, queryable" }] }] },
          { type: "td", children: [{ type: "p", children: [{ text: "Format-locked" }] }] },
        ],
      },
    ],
  },
];

export const ARTICLE_BODY_01_DUMMY_CODE: ArticleBodyValue = [
  { type: "h3", children: [{ text: "Sample function" }] },
  {
    type: "code_block",
    lang: "javascript",
    children: [
      {
        type: "code_line",
        children: [{ text: "function reverse(s) {" }],
      },
      {
        type: "code_line",
        children: [{ text: "  return s.split('').reverse().join('');" }],
      },
      {
        type: "code_line",
        children: [{ text: "}" }],
      },
    ],
  },
  { type: "p", children: [{ text: "" }] },
  { type: "h3", children: [{ text: "TypeScript with syntax colors" }] },
  {
    type: "code_block",
    lang: "typescript",
    children: [
      {
        type: "code_line",
        children: [
          { text: "interface User { id: string; name: string; admin?: boolean }" },
        ],
      },
      {
        type: "code_line",
        children: [{ text: "" }],
      },
      {
        type: "code_line",
        children: [
          { text: "function greet(user: User): string {" },
        ],
      },
      {
        type: "code_line",
        children: [
          { text: "  return `Hello, ${user.name}` + (user.admin ? ' (admin)' : '');" },
        ],
      },
      {
        type: "code_line",
        children: [{ text: "}" }],
      },
    ],
  },
  { type: "p", children: [{ text: "" }] },
  { type: "h3", children: [{ text: "Bash" }] },
  {
    type: "code_block",
    lang: "bash",
    children: [
      {
        type: "code_line",
        children: [{ text: "# Install + start" }],
      },
      {
        type: "code_line",
        children: [{ text: "pnpm install" }],
      },
      {
        type: "code_line",
        children: [{ text: "pnpm dev --port 3010" }],
      },
    ],
  },
];

export const ARTICLE_BODY_01_DUMMY_IMAGE: ArticleBodyValue = [
  { type: "h2", children: [{ text: "Resizable image with caption" }] },
  {
    type: "p",
    children: [
      {
        text: "Hover over the image to reveal the right-edge resize handle. Drag to resize. Click the caption to edit it.",
      },
    ],
  },
  {
    type: "img",
    url: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?w=1200&h=800&fit=crop&auto=format",
    alt: "City skyline at dusk",
    caption: "Sustainable urbanism in practice — the Helsinki waterfront, 2024.",
    width: "75%",
    children: [{ text: "" }],
  },
  {
    type: "p",
    children: [
      {
        text: "Width is stored as a percentage on the node; the static viewer reads it for fidelity.",
      },
    ],
  },
];
