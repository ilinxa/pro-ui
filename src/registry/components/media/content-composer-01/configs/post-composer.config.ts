import type { FormSchema } from "@/registry/components/forms/json-form/json-form";
import type { ComposerConfig } from "../types";

/**
 * The `post` content type — MODELED but DEFERRED. It proves that adding a content
 * type is config-only divergence: a different step set, a plaintext body, no
 * gates step, and a `mediaSources` declaration (`["upload","library"]`) that
 * includes `"library"` ahead of media-editor-01 v0.2. The mediaSlot substrate
 * CLAMPS `"library"` to `["upload"]` at runtime (no crash, no cosmetic leak), so
 * the SAME shell stays valid until media-editor-01 v0.2 lands the real source.
 *
 * `adapterId: "post-content-item"` is intentionally NOT registered in v0.1 — the
 * post → backend mapping (against a social-post item) ships fully behind
 * media-editor-01 v0.2. Publishing a post in v0.1 surfaces a "no adapter" error;
 * the config + clamp are the proof here.
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
      slot: "mediaSlot",
      slotConfig: {
        fieldName: "media",
        enabledModes: ["photo", "video"],
        enabledTools: ["crop", "filters", "adjust", "text", "stickers", "draw"],
        // "library" is declared ahead of media-editor-01 v0.2 — the substrate
        // clamps it to ["upload"] (clamp proof).
        mediaSources: ["upload", "library"],
        aspect: "1:1",
        presentation: "inline",
      },
      validation: {
        mode: "custom",
        rules: [{ field: "media", mediaRequired: true, message: "Add a photo or video." }],
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
