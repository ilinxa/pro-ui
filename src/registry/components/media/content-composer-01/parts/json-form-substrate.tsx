"use client";

import { useMemo } from "react";
import { JsonForm } from "@/registry/components/forms/json-form/json-form";
import type {
  FieldRenderer,
  JsonFormHandle,
} from "@/registry/components/forms/json-form/types";
import type { SlotHandle, SlotRenderArgs } from "../types";
import { assignRef } from "../lib/assign-ref";
import { tagsFieldRenderer } from "./field-tags";
import { authorPickerFieldRenderer } from "./field-author-picker";

const NOOP = () => {};

/**
 * Build the uniform `SlotHandle` over a json-form imperative handle. The shell
 * reads all three substrates through this same shape.
 */
function makeJsonFormSlotHandle(
  formApi: JsonFormHandle,
): SlotHandle<Record<string, unknown>> {
  return {
    getValue: () => formApi.getValues(),
    getIsDirty: () => formApi.isDirty(),
    validate: async () => {
      // trigger() force-validates ALL fields first — validationMode "onTouched"
      // would otherwise report a never-touched required field as valid — THEN
      // read isValid().
      const ok = await formApi.trigger();
      return ok && formApi.isValid();
    },
    loadValue: (v) => formApi.reset(v), // reset() clears dirty + history (re-baseline)
  };
}

/**
 * `metadataFields` substrate mount. Mounts `<JsonForm>` controlled by the slot
 * value, captures its imperative handle via `onReady` into the shell's
 * `handleRef`, and registers the two composer-owned custom field renderers
 * (`tags` + `author-picker`). The shell owns the publish CTA, so the form's own
 * submit button is disabled and `onSubmit` is a no-op.
 *
 * Controlled `values` round-trip is loop-safe: json-form's ChangeBridge carries
 * a stableStringify structural-equality guard that breaks the controlled-mode
 * echo (so `onChangeDebounce={0}` per-mutation emit is safe).
 */
export function JsonFormSubstrateMount({
  slotConfig,
  value,
  onChange,
  handleRef,
}: SlotRenderArgs<"metadataFields">) {
  const registry = useMemo<Record<string, FieldRenderer>>(
    () => ({
      tags: tagsFieldRenderer,
      "author-picker": authorPickerFieldRenderer,
    }),
    [],
  );

  return (
    <JsonForm
      schema={slotConfig.schema}
      columns={slotConfig.columns}
      fieldRegistry={registry}
      submitButton={false}
      onSubmit={NOOP}
      onChangeDebounce={0}
      values={value}
      onChange={({ values }) => onChange(values)}
      onReady={({ formApi }) =>
        assignRef(handleRef, makeJsonFormSlotHandle(formApi))
      }
    />
  );
}
