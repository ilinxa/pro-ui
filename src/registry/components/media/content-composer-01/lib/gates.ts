import type { FormSchema } from "@/registry/components/forms/json-form/json-form";
import { evaluateCondition } from "@/registry/components/forms/json-form/lib/condition-evaluator";
import { getByPath } from "@/registry/components/forms/json-form/lib/path";
import type {
  BodySlotValue,
  ComposerConfig,
  ComposerDraft,
  ComposerStep,
  GateResult,
  MediaSlotValue,
  MetadataSlotConfig,
  SlotHandle,
  StepValidation,
} from "../types";
import { bodyMinLengthValid, isBodyEmpty } from "../hooks/use-body-dirty";

/**
 * Config-sourced BLOCKING gates (QP-9), evaluated imperatively at advance/
 * publish. Forward-gated / backward-free. DISTINCT from the non-blocking
 * missing-substrate fallback.
 *
 * Gate decisions run against the persisted draft values — the draft is ALWAYS
 * current (per-mutation onChange), and the news config has THREE metadataFields
 * steps so only the active step is ever mounted. For the active metadata step
 * the live handle's full json-form validation is preferred (catches pattern/
 * custom validators, not just required-presence); non-active steps fall back to
 * the value-based required-presence check (they were fully validated when the
 * user last left them forward).
 */

function isValueEmpty(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === "string") return v.trim().length === 0;
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

/** Merge every metadataFields step's value bag — the values namespace shared by
 *  step-level visibleWhen conditions. */
export function aggregateMetaValues(draft: ComposerDraft): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const sv of Object.values(draft.steps)) {
    if (sv.slot === "metadataFields") Object.assign(out, sv.value);
  }
  return out;
}

/** Headless required-presence check (the value-based metadata gate). */
export function evaluateMetadataValue(
  schema: FormSchema,
  value: Record<string, unknown>,
): boolean {
  for (const f of schema.fields) {
    if (f.type === "section" || f.type === "divider" || f.type === "hidden") {
      continue;
    }
    if (!f.validators?.required) continue;
    if (isValueEmpty(getByPath(value, f.name))) return false;
  }
  return true;
}

export function evaluateBodyValue(
  value: BodySlotValue | undefined,
  validation: StepValidation | undefined,
): boolean {
  const rule = validation?.rules?.find((r) => r.minLength != null);
  if (!rule?.minLength) return true;
  if (!value) return false;
  return bodyMinLengthValid(value, rule.minLength);
}

export function evaluateMediaValue(
  value: MediaSlotValue | undefined,
  validation: StepValidation | undefined,
  isDirty: boolean,
): boolean {
  if (!validation?.rules?.some((r) => r.mediaRequired)) return true;
  return !!value?.exportedUrl || isDirty;
}

/** Whole-step visibility (serializable Condition object form only). */
export function isStepVisible(
  step: ComposerStep,
  allValues: Record<string, unknown>,
): boolean {
  if (!step.visibleWhen) return true;
  return evaluateCondition(step.visibleWhen, allValues);
}

/** Is the step empty (for optional-skip)? */
export function isStepEmpty(step: ComposerStep, draft: ComposerDraft): boolean {
  const sv = draft.steps[step.id];
  if (!sv) return true;
  switch (sv.slot) {
    case "metadataFields":
      return (
        Object.keys(sv.value).length === 0 ||
        Object.values(sv.value).every(isValueEmpty)
      );
    case "bodySlot":
      return isBodyEmpty(sv.value);
    case "mediaSlot":
      return !sv.value.exportedUrl && !sv.value.editorState;
    default:
      return true;
  }
}

/**
 * Evaluate a single step's blocking gate. `activeHandle` is supplied ONLY for
 * the currently-mounted step (so metadata gets full json-form validation +
 * media gets live dirty); non-mounted steps validate against stored values.
 */
export async function evaluateStep(
  config: ComposerConfig,
  stepIndex: number,
  draft: ComposerDraft,
  opts: { activeHandle?: SlotHandle<unknown> } = {},
): Promise<GateResult> {
  const step = config.steps[stepIndex];
  if (!step) return { ok: true };

  // Hidden step → skip the gate (NON-blocking).
  if (!isStepVisible(step, aggregateMetaValues(draft))) return { ok: true };
  // Optional + untouched → pass.
  if (step.optional && isStepEmpty(step, draft)) return { ok: true };

  const sv = draft.steps[step.id];
  const fail = (): GateResult => ({ ok: false, firstInvalidStepId: step.id });

  switch (step.slot) {
    case "metadataFields": {
      if (opts.activeHandle) {
        // Active mounted step → full json-form validation (trigger + isValid),
        // which also surfaces inline field errors as a side effect.
        return (await opts.activeHandle.validate()) ? { ok: true } : fail();
      }
      const schema = (step.slotConfig as MetadataSlotConfig).schema;
      const value = sv?.slot === "metadataFields" ? sv.value : {};
      return evaluateMetadataValue(schema, value) ? { ok: true } : fail();
    }
    case "bodySlot": {
      const value = sv?.slot === "bodySlot" ? sv.value : undefined;
      return evaluateBodyValue(value, step.validation) ? { ok: true } : fail();
    }
    case "mediaSlot": {
      const value = sv?.slot === "mediaSlot" ? sv.value : undefined;
      const isDirty = opts.activeHandle?.getIsDirty() ?? false;
      return evaluateMediaValue(value, step.validation, isDirty)
        ? { ok: true }
        : fail();
    }
    default:
      return { ok: true };
  }
}
