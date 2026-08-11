import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "content-composer",
  name: "Content Composer",
  category: "media",

  description:
    "Multi-step content authoring shell — each content type is a JSON config composing form, rich text, and media editing steps.",
  context:
    "A single procomp shell for CMS content authoring. It owns the cross-cutting lifecycle — step navigation, dialog/inline presentation, autosave, dirty tracking, the draft → publish → schedule state machine, and the between-step validation gates — and mounts four substrate slots per step: metadataFields → json-form, bodySlot → rich-text-editor/Plate (or a plaintext fallback), mediaSlot → media-editor (single hero), mediaCarouselSlot → carousel-composer (multi-media post). Each content type is one declarative ComposerConfig; per-type adapters map the collected draft to/from the backend ContentItem (news-card's NewsCardItem). The wrapping CMS pro-page owns routing, data, permissions, and the upload implementation. v0.2 ships news (single hero) + post (multi-media carousel) configs; post authoring is live, its publish/upload deferred to the v0.3 post backend; event/project follow as JSON files.",
  features: [
    "Single configurable shell — a new content type is one JSON config, not a new component",
    "Four substrate slots per step: metadataFields (json-form) / bodySlot (rich-text-editor Plate or plaintext) / mediaSlot (media-editor single hero) / mediaCarouselSlot (carousel-composer multi-media)",
    "Draft → publish → schedule state machine (schedule = publish with a future publishAt)",
    "Blocking between-step validation gates (forward-gated, backward-free; publish re-runs all)",
    "Autosave split: per-mutation onDraftChange vs debounced onAutosave; aggregated dirty across three asymmetric slots",
    "Controlled / uncontrolled draft triplet (value / defaultValue / onChange)",
    "Per-content-type adapters: collected draft ↔ NewsCardItem (CMS re-edit round-trip)",
    "Shell owns upload (uploader / uploadUrl); lazy upload-on-publish",
    "Inline / dialog / auto presentation",
    "Multi-media post step (v0.2): `mediaCarouselSlot` backed by carousel-composer — drop/browse N mixed photo+video, reorder, per-item edit (news keeps the single mediaSlot)",
  ],
  tags: [
    "content-composer",
    "composer",
    "cms",
    "authoring",
    "multi-step",
    "json-config",
    "shell",
  ],

  version: "0.3.0",
  status: "alpha",
  createdAt: "2026-06-04",
  updatedAt: "2026-08-11",

  author: { name: "ilinxa" },

  dependencies: {
    // shadcn primitives used by the shell chrome + custom field renderers.
    // Plate / Konva / RHF / Zod / @dnd-kit arrive transitively through the
    // substrate procomps (registryDependencies), not re-declared here.
    // Directly-imported npm (lucide-react) IS declared — the b2 reverse
    // check (validate:meta-deps) enforces it since 2026-08-10.
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
    npm: { "lucide-react": "^1.11.0" },
    internal: [
      "media-editor",
      "carousel-composer",
      "rich-text-editor",
      "json-form",
      "news-card",
    ],
  },

  related: [
    "media-editor",
    "carousel-composer",
    "rich-text-editor",
    "json-form",
    "news-card",
  ],
};
