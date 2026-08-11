"use client";

import {
  ADAPTER_REGISTRY,
  ContentComposer,
} from "@/registry/components/media/content-composer";
import type {
  ComposerConfig,
  NewsCardItem,
  ContentTypeAdapter,
} from "@/registry/components/media/content-composer";
import {
  STARTER_CONFIG,
  validateComposerConfig,
} from "../_lib/composer-config-schema";
import { JsonPlayground } from "./json-playground";

// ── Playground adapter (registered once on module load) ──────────────────────
// Any config's Publish / Save / Schedule assembles a visible result item — no
// real backend needed. ADAPTER_REGISTRY is the composer's mutable runtime
// registry; a config wires to this by setting `"adapterId": "playground"`.
const playgroundAdapter: ContentTypeAdapter<NewsCardItem> = {
  contentType: "playground",
  toContentItem: (draft, ctx) =>
    ({
      id: draft.contentId ?? `playground-${ctx.now.getTime()}`,
      contentType: draft.contentType,
      status: draft.status,
      scheduledFor: draft.scheduledFor,
      steps: draft.steps,
    }) as unknown as NewsCardItem,
  fromContentItem: () => ({ draft: {} }),
};
ADAPTER_REGISTRY.playground = playgroundAdapter;

// Fake uploader — turns a captured single-hero blob into a local object URL so
// the mediaSlot publish path resolves without a storage backend.
const playgroundUploader = async (blob: Blob) => ({
  url: URL.createObjectURL(blob),
});

export function ComposerPlayground() {
  return (
    <JsonPlayground<ComposerConfig>
      starter={STARTER_CONFIG}
      editorLabel="ComposerConfig · JSON"
      validate={validateComposerConfig}
      resultHint="assembled ContentItem (onPublish / onSaveDraft payload)"
      renderPreview={(config, setResult) => (
        <ContentComposer
          config={config}
          presentation="inline"
          uploader={playgroundUploader}
          onAutosave={() => {}}
          onSaveDraft={(item) => setResult("Saved draft", item)}
          onPublish={(item) => setResult("Published", item)}
          onSchedule={(item) => setResult("Scheduled", item)}
        />
      )}
    />
  );
}
