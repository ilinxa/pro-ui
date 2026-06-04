"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type {
  ComposerDraft,
  ContentComposer01Props,
  ContentComposer01Handle,
} from "./types";

/**
 * content-composer-01 — shell skeleton (C1/C2).
 *
 * A multi-step content-authoring SHELL that composes three substrate slots,
 * driven by one JSON `ComposerConfig` per content type:
 *   - metadataFields → json-form
 *   - bodySlot       → article-body-01 (Plate) / shadcn <Textarea> fallback
 *   - mediaSlot      → media-editor-01
 *
 * The shell owns step navigation, dialog/inline mode, autosave, dirty tracking,
 * the draft → publish → schedule state machine, the between-step validation
 * gates, the upload, and the per-content-type adapter to the backend item.
 *
 * This is the C1/C2 skeleton: it pins the public type surface and renders a
 * placeholder so the docs site + manifest resolve. The state machine, slot
 * mounting, gates, autosave, and adapters land across the C3–C12 chain; the
 * imperative handle methods dev-warn until then.
 */
export const ContentComposer01 = React.forwardRef<
  ContentComposer01Handle,
  ContentComposer01Props
>(function ContentComposer01(props, ref) {
  React.useImperativeHandle(
    ref,
    (): ContentComposer01Handle => ({
      saveDraft: async () => devWarn("saveDraft"),
      publish: async () => devWarn("publish"),
      schedule: async () => devWarn("schedule"),
      goToStep: async () => {
        devWarn("goToStep");
        return { ok: false };
      },
      getIsDirty: () => false,
      getDraft: () => emptyDraft(props.config.id),
      loadDraft: () => devWarn("loadDraft"),
    }),
    [props.config.id],
  );

  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border bg-card p-6 text-card-foreground",
      )}
      data-slot="content-composer-01"
      data-content-type={props.config.id}
      data-presentation={props.presentation ?? "auto"}
    >
      <p className="text-sm font-medium text-foreground">
        content-composer-01 — {props.config.title}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Shell skeleton. Step orchestration, the three substrate slots, validation
        gates, autosave, and the publish/schedule flow land across the C3–C12
        implementation chain.
      </p>
    </div>
  );
});

const NOT_IMPLEMENTED =
  "content-composer-01: the shell is at its C1/C2 skeleton stage — this method lands in the C3–C12 implementation chain.";

function devWarn(method: string) {
  if (process.env.NODE_ENV === "production") return;
  console.warn(`${NOT_IMPLEMENTED} (called ${method})`);
}

function emptyDraft(contentType: string): ComposerDraft {
  return { contentType, steps: {}, status: "draft", cursor: 0 };
}
