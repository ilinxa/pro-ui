import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "article-body-01",
  name: "Article Body 01",
  category: "data",

  description:
    "Plate-based WYSIWYG rich-text editor + RSC-friendly read-only viewer for long-form article bodies.",
  context:
    "First Plate (platejs) component in pro-ui. Two exports from one folder: `<ArticleBodyEditor>` is a 'use client' editor (~150KB gzip) with a full toolbar (marks, headings, lists, blockquote, link, image, table, code-block, font-family, font-size, color, highlight, indent); `<ArticleBodyViewer>` is server-renderable via `platejs/static` (~30KB gzip). Both consume the same JSON shape (`Value` from platejs). Storage format is JSON, not HTML — Plate's docs warn against HTML round-trips. Bring-your-own image-upload backend via `onImageUpload(file)` Promise contract. Cmd/Ctrl+S triggers `onSave(currentValue)`. Composes with article-meta-01 (above the body) and share-bar-01 (below) to build a complete article column.",
  features: [
    "Editor + Viewer split — same JSON shape, different bundle profiles",
    "Toolbar with marks (bold/italic/underline/strike/code/highlight/sub/sup), headings (h1–h4), blockquote, code block, horizontal rule",
    "Lists (bullet + ordered) with indent support",
    "Link insertion (URL prompt) — inline anchor with target=_blank rel=noopener",
    "Image insertion via onImageUpload(file) Promise OR URL prompt fallback",
    "Tables (3×3 default insert; rows/cols editable inline)",
    "Font family / size / color / background-color via Plate's basic-styles",
    "Indent / outdent on paragraphs / headings / blockquotes / code blocks",
    "Controlled OR uncontrolled value (echo-guarded sync from external value prop)",
    "Cmd/Ctrl+S → onSave(value); platform-aware key descriptor in footer",
    "JSON-as-storage (not HTML round-trips per Plate's storage guidance)",
    "Read-only mode hides toolbar; editor still selectable",
    "Pure server-renderable viewer via createStaticEditor + PlateStatic",
    "Full Tailwind v4 + signal-lime token integration; prose styling via @tailwindcss/typography",
  ],
  tags: [
    "article-body-01",
    "rich-text",
    "wysiwyg",
    "editor",
    "viewer",
    "plate",
    "platejs",
    "data",
  ],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-05-02",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["button"],
    npm: {
      platejs: "^53.0.3",
      "@platejs/basic-nodes": "^53.0.0",
      "@platejs/basic-styles": "^53.0.0",
      "@platejs/code-block": "^53.0.0",
      "@platejs/indent": "^53.0.0",
      "@platejs/link": "^53.0.3",
      "@platejs/list": "^53.0.2",
      "@platejs/media": "^53.0.1",
      "@platejs/table": "^53.0.0",
      "lucide-react": "^0.x",
    },
    internal: [],
  },

  related: ["article-meta-01", "share-bar-01", "markdown-editor"],
};
