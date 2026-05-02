import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "article-body-01",
  name: "Article Body 01",
  category: "data",

  description:
    "Plate-based WYSIWYG rich-text editor + RSC-friendly read-only viewer for long-form article bodies. Syntax-highlighted code blocks, resizable images with captions, floating toolbar, HTML export.",
  context:
    "First Plate (platejs) component in pro-ui. Two exports from one folder: `<ArticleBodyEditor>` is a 'use client' editor (~165KB gzip after v0.2 additions) with a fixed top toolbar (marks / headings / lists / blockquote / link / image / table / code-block / font-family / font-size / color) PLUS a selection-anchored floating toolbar (marks + link). `<ArticleBodyViewer>` is server-renderable via `platejs/static` (~32KB gzip). Both consume the same Plate `Value` JSON shape. Storage format is JSON, not HTML — Plate's docs warn against HTML round-trips. v0.2 adds: lowlight code-block syntax highlighting (15 languages registered, tokens themed via chart-1..5 palette in globals.css); per-image resize handle + inline caption editor (width stored as %); floating toolbar (selection-anchored, anchored via @floating-ui/react); HTML serialization escape hatch via `serializeArticleBodyToHtml(value)` for RSS / email / OG-tag export boundaries.",
  features: [
    "Editor + Viewer split — same JSON shape, different bundle profiles",
    "Fixed top toolbar (marks, headings, lists, blockquote, link, image, table, code, font-family, font-size, color)",
    "Floating toolbar (selection-anchored marks + link insertion) — appears on text selection, anchored via @floating-ui/react virtual element",
    "Lowlight syntax highlighting on code blocks (15 languages: bash / css / diff / go / html / java / javascript / json / markdown / python / rust / shell / sql / typescript / xml / yaml; tokens themed via pro-ui chart palette)",
    "Image resize handle + inline caption editor (width stored as percentage, caption editable inline)",
    "HTML serialization escape hatch via serializeArticleBodyToHtml(value) — async, server-only, for export boundaries (RSS / email / OG tags)",
    "Image insertion via onImageUpload(file) Promise OR URL prompt fallback",
    "Tables (insert + keyboard-driven row/col ops via Plate's table plugin)",
    "Indent / outdent on paragraphs / headings / blockquotes / code blocks",
    "Controlled OR uncontrolled value (echo-guarded sync from external value prop)",
    "Cmd/Ctrl+S → onSave(value); platform-aware key descriptor in footer",
    "JSON-as-storage (not HTML round-trips per Plate's storage guidance)",
    "Read-only mode hides both toolbars; editor still selectable",
    "Pure server-renderable viewer via createStaticEditor + PlateStatic",
    "Tailwind v4 + signal-lime token integration; prose styling via @tailwindcss/typography",
  ],
  tags: [
    "article-body-01",
    "rich-text",
    "wysiwyg",
    "editor",
    "viewer",
    "plate",
    "platejs",
    "lowlight",
    "syntax-highlighting",
    "image",
    "html-export",
    "data",
  ],

  version: "0.2.0",
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
      "@platejs/caption": "^53.0.0",
      "@platejs/code-block": "^53.0.0",
      "@platejs/indent": "^53.0.0",
      "@platejs/link": "^53.0.3",
      "@platejs/list": "^53.0.2",
      "@platejs/media": "^53.0.1",
      "@platejs/resizable": "^53.0.0",
      "@platejs/table": "^53.0.0",
      "@floating-ui/react": "^0.27.19",
      lowlight: "^3.3.0",
      "highlight.js": "^11.11.1",
      "lucide-react": "^0.x",
    },
    internal: [],
  },

  related: ["article-meta-01", "share-bar-01", "markdown-editor"],
};
