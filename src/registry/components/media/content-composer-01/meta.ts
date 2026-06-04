import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "content-composer-01",
  name: "Content Composer 01",
  category: "media",

  description:
    "Multi-step content-authoring shell that composes json-form, article-body-01 (Plate), and media-editor-01 into one configurable surface — each content type (news / post / event / project) is a JSON config, not a new component.",
  context:
    "A single procomp shell for CMS content authoring. It owns the cross-cutting lifecycle — step navigation, dialog/inline presentation, autosave, dirty tracking, the draft → publish → schedule state machine, and the between-step validation gates — and mounts three substrate slots per step: metadataFields → json-form, bodySlot → article-body-01/Plate (or a plaintext fallback), mediaSlot → media-editor-01. Each content type is one declarative ComposerConfig; per-type adapters map the collected draft to/from the backend ContentItem (content-card-news-01's ContentCardItem). The wrapping CMS pro-page owns routing, data, permissions, and the upload implementation. v0.1 ships the news config first; post/event/project follow as JSON files.",
  features: [
    "Single configurable shell — a new content type is one JSON config, not a new component",
    "Three substrate slots per step: metadataFields (json-form) / bodySlot (article-body-01 Plate or plaintext) / mediaSlot (media-editor-01)",
    "Draft → publish → schedule state machine (schedule = publish with a future publishAt)",
    "Blocking between-step validation gates (forward-gated, backward-free; publish re-runs all)",
    "Autosave split: per-mutation onDraftChange vs debounced onAutosave; aggregated dirty across three asymmetric slots",
    "Controlled / uncontrolled draft triplet (value / defaultValue / onChange)",
    "Per-content-type adapters: collected draft ↔ ContentCardItem (CMS re-edit round-trip)",
    "Shell owns upload (uploader / uploadUrl); lazy upload-on-publish",
    "Inline / dialog / auto presentation",
  ],
  tags: [
    "content-composer-01",
    "composer",
    "cms",
    "authoring",
    "multi-step",
    "json-config",
    "shell",
  ],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-06-04",
  updatedAt: "2026-06-04",

  author: { name: "ilinxa" },

  dependencies: {
    // shadcn primitives used by the shell chrome + custom field renderers.
    // Plate / Konva / RHF / Zod arrive transitively through the three substrate
    // procomps (registryDependencies), not re-declared here. react + lucide-react
    // are baseline (audit-whitelisted). Re-audited via validate:meta-deps (F-cross-07).
    shadcn: [
      "badge",
      "button",
      "command",
      "dialog",
      "input",
      "popover",
      "separator",
      "textarea",
    ],
    npm: {},
    internal: [
      "media-editor-01",
      "article-body-01",
      "json-form",
      "content-card-news-01",
    ],
  },

  related: ["media-editor-01", "article-body-01", "json-form", "content-card-news-01"],
};
