"use client";

import * as React from "react";
import type {
  ComposerCtx,
  ComposerDraft,
  ComposerStepCtx,
  ComposerStepValue,
  ContentCardItem,
  ContentComposer01Handle,
  ContentComposer01Props,
  ExportMetadata,
  GateResult,
  SlotHandle,
  SlotKind,
  SlotValueFor,
} from "./types";
import { makeEmptyDraft } from "./lib/reducer";
import { DEFAULT_SUBSTRATES } from "./lib/substrates";
import { evaluateStep } from "./lib/gates";
import { resolveUploader } from "./lib/upload";
import { resolvePublishCtaArms } from "./lib/publish-cta";
import { getAdapter } from "./adapters/adapter-registry";
import { useComposerState } from "./hooks/use-composer-state";
import { useSlotHandles } from "./hooks/use-slot-handles";
import { useAutosave } from "./hooks/use-autosave";
import { ComposerContext, ComposerStepContext } from "./hooks/use-composer-context";
import { ComposerShell } from "./parts/composer-shell";
import { ComposerDialog } from "./parts/composer-dialog";
import { SlotMount } from "./parts/slot-mount";
import { CarouselLiveCacheContext } from "./parts/media-carousel-substrate";
import type { MediaCarouselItem } from "@/registry/components/media/media-carousel-editor-01/media-carousel-editor-01";
import { PublishBar } from "./parts/publish-bar";

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/**
 * content-composer-01 — the multi-step content-authoring SHELL.
 *
 * One JSON `ComposerConfig` per content type drives the steps; each step's slot
 * is rendered by a substrate (json-form / article-body-01 / media-editor-01).
 * The shell owns step navigation + the blocking gates, autosave (draft-level
 * dirty), the draft → publish → schedule FSM, lazy upload-on-publish, and the
 * per-content-type adapter to the backend `ContentCardItem`.
 */
export const ContentComposer01 = React.forwardRef<
  ContentComposer01Handle,
  ContentComposer01Props
>(function ContentComposer01(props, ref) {
  const { config } = props;

  // ── Seed (T1): controlled value wins; else defaultValue; else inverse-adapter
  //    from initialItem; the body always re-seeds via the separate initialBody leg.
  const [initialDraft] = React.useState<ComposerDraft>(() => {
    const base = props.defaultValue ?? makeEmptyDraft(config.id);
    let seeded = base;
    if (!props.defaultValue && props.initialItem) {
      const adapter = getAdapter(config.adapterId);
      if (adapter) {
        const { draft: seed } = adapter.fromContentItem(props.initialItem);
        seeded = {
          ...base,
          ...seed,
          steps: { ...base.steps, ...(seed.steps ?? {}) },
        };
      }
    }
    if (props.initialBody) {
      const bodyStep = config.steps.find((s) => s.slot === "bodySlot");
      if (bodyStep) {
        seeded = {
          ...seeded,
          steps: {
            ...seeded.steps,
            [bodyStep.id]: { slot: "bodySlot", value: props.initialBody },
          },
        };
      }
    }
    return seeded;
  });

  const { draft, dispatch, phase, dispatchPhase } = useComposerState({
    contentType: config.id,
    value: props.value,
    defaultValue: initialDraft,
    onChange: props.onDraftChange,
  });

  const substrateMap = React.useMemo(
    () => ({ ...DEFAULT_SUBSTRATES, ...props.substrates }),
    [props.substrates],
  );

  const { registerHandle, getHandle } = useSlotHandles();
  const { isDirty, markSaved } = useAutosave({
    draft,
    phase,
    autosave: props.autosave,
    onAutosave: props.onAutosave,
    debounceMs: config.autosave?.debounceMs,
    dispatchPhase,
  });

  const blobMap = React.useRef(new Map<string, Blob>());
  // Live carousel items (with blobs) per step — keeps mediaCarouselSlot media
  // across step navigation (the carousel runs with revokeOnUnmount={false}, so
  // its object URLs outlive a step unmount; we revoke them on composer unmount).
  const carouselCache = React.useRef(new Map<string, MediaCarouselItem[]>());
  React.useEffect(() => {
    const cache = carouselCache.current;
    return () => {
      cache.forEach((items) =>
        items.forEach((it) => {
          if (it.url.startsWith("blob:")) URL.revokeObjectURL(it.url);
        }),
      );
      cache.clear();
    };
  }, []);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [announcement, setAnnouncement] = React.useState("");
  const [stepErrors, setStepErrors] = React.useState<Record<string, string[]>>({});
  const [scheduleValue, setScheduleValue] = React.useState("");

  const presentation = props.presentation ?? config.presentation ?? "auto";
  const resolvedMode: "inline" | "dialog" =
    presentation === "dialog" ? "dialog" : "inline";

  // ── Focus + announce on a blocked gate ──────────────────────────────────
  const jumpToFirstInvalid = React.useCallback(
    (stepIndex: number, res: GateResult) => {
      const step = config.steps[stepIndex];
      if (!step) return;
      dispatch({ type: "set-cursor", cursor: stepIndex });
      const msg =
        res.errors?.[step.id]?.[0] ??
        `Please complete “${step.title}” before continuing.`;
      setStepErrors({ [step.id]: [msg] });
      setAnnouncement(msg);
      requestAnimationFrame(() => {
        const el = rootRef.current?.querySelector<HTMLElement>(
          '[data-composer-step-body] :is(input,textarea,select,button,[tabindex],[contenteditable="true"])',
        );
        el?.focus();
      });
    },
    [config, dispatch],
  );

  // ── Pull-only media capture at step-leave (blob stored, uploaded at publish) ─
  const captureMediaBlob = React.useCallback(
    async (stepId: string) => {
      const handle = getHandle(stepId);
      if (!handle?.export) return;
      const sv = draft.steps[stepId];
      const mv = sv?.slot === "mediaSlot" ? sv.value : undefined;
      if (mv?.exportedUrl) return; // re-edit of an existing hero — no re-export
      if (!handle.getIsDirty() && mv?.pendingBlobRef) return; // unchanged capture
      try {
        const { blob, metadata } = await handle.export();
        blobMap.current.set(stepId, blob);
        dispatch({
          type: "set-step-value",
          stepId,
          value: {
            slot: "mediaSlot",
            value: { ...mv, pendingBlobRef: stepId, exportMetadata: metadata },
          },
        });
      } catch {
        // export failed — leave the value as-is; publish surfaces the error.
      }
    },
    [draft, getHandle, dispatch],
  );

  // ── Navigation: backward free, forward gated ────────────────────────────
  const goToStep = React.useCallback(
    async (target: number): Promise<GateResult> => {
      if (phase !== "editing") return { ok: false };
      const max = config.steps.length - 1;
      const clamped = Math.max(0, Math.min(target, max));
      const from = draft.cursor;
      if (clamped <= from) {
        dispatch({ type: "set-cursor", cursor: clamped });
        return { ok: true };
      }
      for (let i = from; i < clamped; i++) {
        const activeHandle =
          i === from ? getHandle(config.steps[i].id) : undefined;
        const res = await evaluateStep(config, i, draft, { activeHandle });
        if (!res.ok) {
          jumpToFirstInvalid(i, res);
          return res;
        }
        if (i === from && config.steps[i].slot === "mediaSlot") {
          await captureMediaBlob(config.steps[i].id);
        }
      }
      setStepErrors({});
      dispatch({ type: "set-cursor", cursor: clamped });
      requestAnimationFrame(() => {
        rootRef.current
          ?.querySelector<HTMLElement>(
            '[data-composer-step-body] :is(input,textarea,select,button,[tabindex],[contenteditable="true"])',
          )
          ?.focus();
      });
      return { ok: true };
    },
    [phase, draft, config, getHandle, dispatch, jumpToFirstInvalid, captureMediaBlob],
  );

  // ── Publish/Schedule re-run ALL gates ───────────────────────────────────
  const runAllGates = React.useCallback(async (): Promise<GateResult> => {
    for (let i = 0; i < config.steps.length; i++) {
      const activeHandle =
        i === draft.cursor ? getHandle(config.steps[i].id) : undefined;
      const res = await evaluateStep(config, i, draft, { activeHandle });
      if (!res.ok) {
        jumpToFirstInvalid(i, res);
        return res;
      }
    }
    return { ok: true };
  }, [config, draft, getHandle, jumpToFirstInvalid]);

  // ── Upload-on-publish (QP-10) + adapter assembly ────────────────────────
  const uploadHero = React.useCallback(
    async (snapshot: ComposerDraft): Promise<ComposerDraft> => {
      const uploader = resolveUploader(props.uploader, props.uploadUrl);
      let next = snapshot;
      for (const step of config.steps) {
        if (step.slot !== "mediaSlot") continue;
        const sv = next.steps[step.id];
        const mv = sv?.slot === "mediaSlot" ? sv.value : undefined;
        if (!mv || mv.exportedUrl) continue; // none, or already uploaded
        let exported: { blob: Blob; metadata: ExportMetadata } | undefined;
        if (mv.pendingBlobRef && blobMap.current.has(mv.pendingBlobRef) && mv.exportMetadata) {
          exported = {
            blob: blobMap.current.get(mv.pendingBlobRef)!,
            metadata: mv.exportMetadata,
          };
        } else {
          const handle = getHandle(step.id);
          if (handle?.export) exported = await handle.export();
        }
        if (!exported) continue; // no hero → toContentItem throws (image required)
        if (!uploader) {
          throw new Error(
            "content-composer-01: no `uploader`/`uploadUrl` provided to upload the hero.",
          );
        }
        const { url } = await uploader(exported.blob, exported.metadata);
        next = {
          ...next,
          steps: {
            ...next.steps,
            [step.id]: {
              slot: "mediaSlot",
              value: { ...mv, exportedUrl: url, exportMetadata: exported.metadata },
            },
          },
        };
      }
      return next;
    },
    [props.uploader, props.uploadUrl, config, getHandle],
  );

  const assembleItem = React.useCallback(
    async (
      snapshot: ComposerDraft,
    ): Promise<{ item: ContentCardItem; draft: ComposerDraft }> => {
      const adapter = getAdapter(config.adapterId);
      if (!adapter) {
        throw new Error(
          `content-composer-01: no adapter registered for "${config.adapterId}".`,
        );
      }
      const uploaded = await uploadHero(snapshot);
      const item = adapter.toContentItem(uploaded, { now: new Date() });
      const finalDraft = uploaded.contentId
        ? uploaded
        : { ...uploaded, contentId: item.id };
      dispatch({ type: "replace", draft: finalDraft });
      return { item, draft: finalDraft };
    },
    [config, uploadHero, dispatch],
  );

  // ── Lifecycle exits (FSM T7–T17) ────────────────────────────────────────
  const saveDraft = React.useCallback(async () => {
    const cb = props.onSaveDraft;
    if (!cb) return;
    const snapshot: ComposerDraft = { ...draft, status: "draft" };
    dispatchPhase({ type: "validate-begin" });
    dispatchPhase({ type: "intent-accepted", intent: { mode: "draft" } });
    try {
      const { item, draft: saved } = await assembleItem(snapshot);
      await cb(item);
      markSaved(saved);
      setAnnouncement("Draft saved.");
    } catch (e) {
      setAnnouncement(errorMessage(e));
    } finally {
      dispatchPhase({ type: "draft-ack" });
    }
  }, [props.onSaveDraft, draft, assembleItem, dispatchPhase, markSaved]);

  const publish = React.useCallback(async () => {
    const cb = props.onPublish;
    if (!cb) return;
    dispatchPhase({ type: "validate-begin" });
    const gate = await runAllGates();
    if (!gate.ok) {
      dispatchPhase({ type: "gate-fail" });
      return;
    }
    dispatchPhase({ type: "intent-accepted", intent: { mode: "publish" } });
    try {
      const snapshot: ComposerDraft = { ...draft, status: "published" };
      const { item, draft: saved } = await assembleItem(snapshot);
      await cb(item);
      markSaved(saved);
      setAnnouncement("Published.");
      dispatchPhase({ type: "publish-resolved" });
    } catch (e) {
      setAnnouncement(errorMessage(e));
      dispatchPhase({ type: "publish-rejected" });
    }
  }, [props.onPublish, draft, runAllGates, assembleItem, dispatchPhase, markSaved]);

  const schedule = React.useCallback(
    async (at: Date) => {
      const cb = props.onSchedule;
      if (!cb) return;
      if (!(at instanceof Date) || Number.isNaN(at.getTime()) || at.getTime() <= Date.now()) {
        setAnnouncement("Pick a future time to schedule.");
        return;
      }
      dispatchPhase({ type: "validate-begin" });
      const gate = await runAllGates();
      if (!gate.ok) {
        dispatchPhase({ type: "gate-fail" });
        return;
      }
      dispatchPhase({ type: "intent-accepted", intent: { mode: "schedule", publishAt: at } });
      try {
        const snapshot: ComposerDraft = {
          ...draft,
          status: "scheduled",
          scheduledFor: at.toISOString(),
        };
        const { item, draft: saved } = await assembleItem(snapshot);
        await cb(item, at);
        markSaved(saved);
        setAnnouncement("Scheduled.");
        dispatchPhase({ type: "schedule-resolved" });
      } catch (e) {
        setAnnouncement(errorMessage(e));
        dispatchPhase({ type: "publish-rejected" });
      }
    },
    [props.onSchedule, draft, runAllGates, assembleItem, dispatchPhase, markSaved],
  );

  // ── Imperative handle ───────────────────────────────────────────────────
  React.useImperativeHandle(
    ref,
    (): ContentComposer01Handle => ({
      saveDraft,
      publish,
      schedule,
      goToStep,
      getIsDirty: () => isDirty,
      getDraft: () => draft,
      loadDraft: (d) => dispatch({ type: "replace", draft: d }),
    }),
    [saveDraft, publish, schedule, goToStep, isDirty, draft, dispatch],
  );

  // ── Context + active step ───────────────────────────────────────────────
  const ctx = React.useMemo<ComposerCtx>(
    () => ({
      contentType: config.id,
      phase,
      cursor: draft.cursor,
      steps: config.steps,
      isDirty,
      stepErrors,
      publishModes: config.publishModes,
      goToStep,
      saveDraft,
      publish,
      schedule,
    }),
    [config, phase, draft.cursor, isDirty, stepErrors, goToStep, saveDraft, publish, schedule],
  );

  const activeStep = config.steps[draft.cursor];
  const activeStepValue = activeStep ? draft.steps[activeStep.id]?.value : undefined;

  const stepCtx = React.useMemo<ComposerStepCtx | null>(
    () =>
      activeStep
        ? {
            stepId: activeStep.id,
            contentType: config.id,
            mode: resolvedMode,
            isDirty,
            stepErrors: stepErrors[activeStep.id] ?? [],
          }
        : null,
    [activeStep, config.id, resolvedMode, isDirty, stepErrors],
  );

  const handleSlotChange = React.useCallback(
    (next: SlotValueFor<SlotKind>) => {
      if (!activeStep) return;
      dispatch({
        type: "set-step-value",
        stepId: activeStep.id,
        value: { slot: activeStep.slot, value: next } as ComposerStepValue,
      });
    },
    [activeStep, dispatch],
  );

  // ── Publish bar ─────────────────────────────────────────────────────────
  const scheduleReady = (() => {
    if (!scheduleValue) return false;
    const t = new Date(scheduleValue).getTime();
    return !Number.isNaN(t) && t > Date.now();
  })();
  const arms = resolvePublishCtaArms({
    publishModes: config.publishModes,
    phase,
    hasOnSaveDraft: !!props.onSaveDraft,
    hasOnPublish: !!props.onPublish,
    hasOnSchedule: !!props.onSchedule,
    scheduleReady,
  });

  const footer = props.renderPublishCTA
    ? props.renderPublishCTA(ctx)
    : arms.length > 0
      ? (
          <PublishBar
            arms={arms}
            onSaveDraft={() => void saveDraft()}
            onPublish={() => void publish()}
            onSchedule={() => void schedule(new Date(scheduleValue))}
            scheduleValue={scheduleValue}
            onScheduleValueChange={setScheduleValue}
          />
        )
      : null;

  const slotNode =
    activeStep && stepCtx ? (
      <ComposerStepContext.Provider value={stepCtx}>
        <SlotMount
          substrates={substrateMap}
          step={activeStep}
          value={activeStepValue}
          onChange={handleSlotChange}
          ctx={stepCtx}
          // Dispatch-boundary erasure: the per-step registry stores
          // SlotHandle<unknown> (SlotHandle is invariant in TValue via
          // loadValue), so the typed handleRef is cast here — runtime-correct,
          // the substrate populates the concrete handle.
          handleRef={
            registerHandle(activeStep.id) as React.Ref<
              SlotHandle<SlotValueFor<SlotKind>>
            >
          }
        />
      </ComposerStepContext.Provider>
    ) : null;

  const dialogDescription = `${config.steps.length}-step ${config.title} composer. Use the step navigation, then save, publish, or schedule.`;

  return (
    <CarouselLiveCacheContext.Provider value={carouselCache}>
    <ComposerContext.Provider value={ctx}>
      {resolvedMode === "dialog" ? (
        <ComposerDialog
          open={props.isOpen ?? false}
          onOpenChange={(o) => {
            if (!o) props.onClose?.();
          }}
          title={config.title}
          description={dialogDescription}
        >
          <div ref={rootRef}>
            <ComposerShell
              ctx={ctx}
              mode="dialog"
              footer={footer}
              announcement={announcement}
            >
              {slotNode}
            </ComposerShell>
          </div>
        </ComposerDialog>
      ) : (
        <div
          ref={rootRef}
          data-slot="content-composer-01"
          data-content-type={config.id}
        >
          <ComposerShell
            ctx={ctx}
            mode="inline"
            footer={footer}
            announcement={announcement}
            renderStepChrome={props.renderStepChrome}
          >
            {slotNode}
          </ComposerShell>
        </div>
      )}
    </ComposerContext.Provider>
    </CarouselLiveCacheContext.Provider>
  );
});
