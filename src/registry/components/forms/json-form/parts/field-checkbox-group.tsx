"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { FieldRenderer } from "../types";
import { useAsyncOptions } from "../hooks/use-async-options";
import { fieldIdSlug } from "./field-wrapper";
import { useJsonFormContext } from "../json-form-context";

export const FieldCheckboxGroup: FieldRenderer = ({
  field,
  value,
  onChange,
  onBlur,
  disabled,
  ariaProps,
}) => {
  const ctx = useJsonFormContext();
  const { options } = useAsyncOptions(field);
  const selected = Array.isArray(value) ? value : [];
  const baseId = fieldIdSlug(ctx.formId, field.name);

  function toggle(optValue: unknown, checked: boolean) {
    if (checked) {
      if (!selected.includes(optValue)) onChange([...selected, optValue]);
    } else {
      onChange(selected.filter((v) => v !== optValue));
    }
  }

  return (
    <div
      role="group"
      aria-labelledby={ariaProps.labelledBy}
      aria-disabled={ariaProps["aria-disabled"]}
      aria-describedby={ariaProps["aria-describedby"]}
      className="flex flex-col gap-1.5"
      onBlur={onBlur}
    >
      {options.map((opt) => {
        const optId = `${baseId}-opt-${String(opt.value).replace(/[^a-z0-9_-]/gi, "_")}`;
        const isChecked = selected.includes(opt.value);
        return (
          <div key={String(opt.value)} className="flex items-start gap-2">
            <Checkbox
              id={optId}
              checked={isChecked}
              onCheckedChange={(c) => toggle(opt.value, c === true)}
              disabled={disabled || opt.disabled}
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
    </div>
  );
};

export default FieldCheckboxGroup;
