import type { FormSchema } from "@/registry/components/forms/json-form/json-form";
import type { ComposerConfig } from "../types";

/**
 * The `post` content type. Adding a content type is mostly config-only
 * divergence: a different step set, a plaintext body, no gates step, and — the
 * Instagram-feed difference — a MULTI-media step backed by
 * media-carousel-editor-01 (`mediaCarouselSlot`) instead of news's single
 * `mediaSlot`. Authoring (drop/browse N mixed photo+video → reorder → per-item
 * edit) is fully live in the media step.
 *
 * `adapterId: "post-content-item"` is intentionally NOT registered yet — the
 * post → backend mapping (a social-post item) and the durable upload-at-publish
 * of the carousel's N blobs ship together behind the post backend. Publishing a
 * post today surfaces a "no adapter" error; the media STEP is live (the draft
 * persists each item's structure + editorState; local-only blobs that aren't yet
 * uploaded don't survive a full reload — that rides with the upload-at-publish).
 */

const captionSchema: FormSchema = {
  fields: [
    {
      name: "caption",
      type: "textarea",
      label: "Caption",
      placeholder: "What's happening?",
      rows: 3,
      validators: { required: "Write a caption." },
    },
    { name: "tags", type: "tags", label: "Hashtags", dependsOn: [] },
  ],
};

export const postComposerConfig: ComposerConfig = {
  id: "post",
  version: "1.0.0",
  title: "Post",
  adapterId: "post-content-item",
  presentation: "auto",
  autosave: { enabled: true, debounceMs: 800 },
  publishModes: ["draft", "publish"],
  steps: [
    {
      id: "media",
      title: "Media",
      // Posts are multi-media (Instagram-feed semantics) → the carousel slot,
      // backed by media-carousel-editor-01. News keeps the single mediaSlot.
      slot: "mediaCarouselSlot",
      slotConfig: {
        fieldName: "media",
        maxItems: 10,
        accept: ["image", "video"],
        aspect: "auto",
        enabledTools: ["crop", "filters", "adjust", "text", "stickers"],
      },
      validation: {
        mode: "custom",
        rules: [
          { field: "media", mediaRequired: true, message: "Add at least one photo or video." },
        ],
      },
    },
    {
      id: "caption",
      title: "Caption",
      slot: "metadataFields",
      slotConfig: { columns: 1, schema: captionSchema },
      validation: { mode: "all-fields-valid" },
    },
    // No gates step — posts have a simpler lifecycle than news articles.
  ],
};
