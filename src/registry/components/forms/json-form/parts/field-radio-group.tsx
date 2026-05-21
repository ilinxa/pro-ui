"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { FieldOption, FieldRenderer } from "../types";
import { useAsyncOptions } from "../hooks/use-async-options";
import { fieldIdSlug } from "./field-wrapper";
import { useJsonFormContext } from "../json-form-context";

export const FieldRadioGroup: FieldRenderer = ({
  field,
  value,
  onChange,
  onBlur,
  disabled,
  ariaProps,
}) => {
  const ctx = useJsonFormContext();
  const { options } = useAsyncOptions(field);
  const baseId = fieldIdSlug(ctx.formId, field.name);

  return (
    <RadioGroup
      value={value == null ? "" : String(value)}
      onValueChange={(v) => onChange(coerceOptionValue(v, options))}
      disabled={disabled}
      onBlur={onBlur}
      aria-labelledby={ariaProps.labelledBy}
      aria-required={ariaProps["aria-required"]}
      aria-invalid={ariaProps["aria-invalid"]}
      aria-disabled={ariaProps["aria-disabled"]}
      aria-describedby={ariaProps["aria-describedby"]}
      className="gap-1.5"
    >
      {options.map((opt) => {
        const optId = `${baseId}-opt-${String(opt.value).replace(/[^a-z0-9_-]/gi, "_")}`;
        return (
          <div key={String(opt.value)} className="flex items-start gap-2">
            <RadioGroupItem
              id={optId}
              value={String(opt.value)}
              disabled={opt.disabled}
            />
            <div className="flex flex-col">
              <Label htmlFor={optId} className="font-normal">
                {opt.label}
              </Label>
              {opt.description ? (
                <span className="text-xs text-muted-foreground">
                  {opt.description}
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </RadioGroup>
  );
};

function coerceOptionValue(raw: string, options: FieldOption[]): unknown {
  // Preserve non-string option.value types by looking up the original.
  const match = options.find((o) => String(o.value) === raw);
  return match ? match.value : raw;
}

export default FieldRadioGroup;
