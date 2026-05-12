"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import type { FieldValues, Path } from "react-hook-form";
import { cn } from "@/lib/utils";
import type { FieldAriaProps, FieldDefinition, FieldRenderer } from "../types";
import { useConditional } from "../hooks/use-conditional";
import { useJsonFormContext } from "../json-form-context";

/**
 * Stable, SSR-friendly id slug for a field. Dots are escaped (HTML id can't
 * contain `.` reliably across browsers + CSS queries).
 */
export function fieldIdSlug(formId: string, name: string): string {
  return `${formId}-${name.replace(/\./g, "_")}`;
}

function widthToClass(w: FieldDefinition["width"]): string | undefined {
  if (w == null || w === "full") return undefined;
  if (w === "half" || w === "third" || w === "quarter") return "md:col-span-1";
  return undefined;
}

export interface FieldWrapperProps {
  field: FieldDefinition;
  renderer: FieldRenderer;
  formLabelPosition?: "top" | "left";
  loadingFallback?: ReactNode;
}

/**
 * The single layout shell every field renderer flows through.
 * Owns: label, helper text, error message, ARIA wiring (via `ariaProps`),
 * visibility unmount, disabled merging, RHF Controller binding.
 *
 * v0.1.2 — ARIA is now passed through `FieldRendererArgs.ariaProps` instead
 * of via `Slot.Root` (which silently failed for Popover-wrapped controls and
 * non-form group roots).
 */
export function FieldWrapper({
  field,
  renderer,
  formLabelPosition,
  loadingFallback,
}: FieldWrapperProps) {
  const { control, register, unregister } = useFormContext();
  const ctx = useJsonFormContext();
  const allValues = (useWatch({ control }) ?? {}) as Record<string, unknown>;
  const { visible, enabled, required } = useConditional(field);

  // Unmount-clean: when `visibleWhen` flips a field invisible and the consumer
  // hasn't set `keepValueWhenHidden`, drop the registered key so submission
  // strips it (C1 lock).
  useEffect(() => {
    if (field.type === "hidden") return;
    if (!visible && !field.keepValueWhenHidden) {
      unregister(field.name as Path<FieldValues>, { keepDefaultValue: true });
    }
  }, [visible, field.name, field.type, field.keepValueWhenHidden, unregister]);

  // `hidden` fields are tracked but render nothing — register imperatively so
  // they always submit.
  useEffect(() => {
    if (field.type !== "hidden") return;
    register(field.name as Path<FieldValues>);
  }, [field.type, field.name, register]);

  if (!visible) return null;
  if (field.type === "hidden") return null;

  const labelPosition = field.labelPosition ?? formLabelPosition ?? "top";
  const controlId = fieldIdSlug(ctx.formId, field.name);
  const labelId = `${controlId}-label`;
  const descriptionId = `${controlId}-description`;
  const errorId = `${controlId}-error`;
  const isDisabled = !enabled || !!field.disabled;
  const isReadOnly = !!field.readOnly;

  const wrapperLayout =
    labelPosition === "left"
      ? "grid grid-cols-[10rem_1fr] items-start gap-x-3 gap-y-1"
      : "flex flex-col gap-1.5";

  return (
    <Controller
      control={control}
      name={field.name as Path<FieldValues>}
      render={({ field: controller, fieldState }) => {
        const errorMessage = fieldState.error?.message
          ? String(fieldState.error.message)
          : undefined;

        const describedBy = buildDescribedBy(
          field.description ? descriptionId : undefined,
          errorMessage ? errorId : undefined,
        );

        const ariaProps: FieldAriaProps = {
          id: controlId,
          labelledBy: labelId,
          "aria-required": required ? true : undefined,
          "aria-invalid": errorMessage ? true : undefined,
          "aria-disabled": isDisabled ? true : undefined,
          "aria-describedby": describedBy,
        };

        const rendered = renderer({
          field,
          value: controller.value,
          onChange: (next: unknown) => controller.onChange(next),
          onBlur: () => controller.onBlur(),
          error: errorMessage,
          disabled: isDisabled,
          readOnly: isReadOnly,
          allValues,
          formApi: ctx,
          ariaProps,
        });

        return (
          <div
            data-jsonform-field={field.name}
            data-jsonform-type={field.type}
            data-disabled={isDisabled ? "true" : undefined}
            className={cn(
              "group/field",
              wrapperLayout,
              widthToClass(field.width),
            )}
          >
            {field.label ? (
              <label
                id={labelId}
                htmlFor={controlId}
                className={cn(
                  "text-sm font-medium text-foreground",
                  labelPosition === "left" ? "pt-1.5" : undefined,
                  isDisabled ? "opacity-60" : undefined,
                )}
              >
                {field.label}
                {required ? (
                  <span aria-hidden="true" className="ml-0.5 text-destructive">
                    {ctx.strings.requiredIndicator}
                  </span>
                ) : null}
              </label>
            ) : null}

            <div
              className={cn(
                "flex flex-col gap-1",
                labelPosition === "left" ? "min-w-0" : undefined,
              )}
            >
              <Suspense
                fallback={
                  loadingFallback ?? (
                    <div className="h-9 w-full animate-pulse rounded-md bg-muted/40" />
                  )
                }
              >
                {rendered}
              </Suspense>

              {field.description ? (
                <p id={descriptionId} className="text-xs text-muted-foreground">
                  {field.description}
                </p>
              ) : null}

              {errorMessage ? (
                <p
                  id={errorId}
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {errorMessage}
                </p>
              ) : null}
            </div>
          </div>
        );
      }}
    />
  );
}

function buildDescribedBy(
  descriptionId: string | undefined,
  errorId: string | undefined,
): string | undefined {
  const ids: string[] = [];
  if (descriptionId) ids.push(descriptionId);
  if (errorId) ids.push(errorId);
  return ids.length ? ids.join(" ") : undefined;
}
