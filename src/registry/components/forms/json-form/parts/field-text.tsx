"use client";

import { Input } from "@/components/ui/input";
import type { FieldRenderer } from "../types";

const TYPE_TO_INPUT_TYPE: Record<string, string> = {
  text: "text",
  email: "email",
  password: "password",
  url: "url",
  tel: "tel",
  number: "number",
};

export const FieldText: FieldRenderer = ({
  field,
  value,
  onChange,
  onBlur,
  disabled,
  readOnly,
  ariaProps,
}) => {
  const inputType = TYPE_TO_INPUT_TYPE[field.type] ?? "text";
  const isNumberField = field.type === "number";
  return (
    <Input
      id={ariaProps.id}
      type={inputType}
      value={value == null ? "" : String(value)}
      onChange={(e) => {
        const raw = e.target.value;
        // T2.5 — for `number` fields, surface an empty input as `undefined`
        // rather than `""`. `z.coerce.number()` turns `""` into `0`, which
        // produces surprising "value is 0 but the box is empty" UX. With
        // `undefined`, optional fields validate cleanly and required
        // fields surface the right "this field is required" error.
        if (isNumberField && raw === "") {
          onChange(undefined);
          return;
        }
        onChange(raw);
      }}
      onBlur={onBlur}
      placeholder={field.placeholder}
      disabled={disabled}
      readOnly={readOnly}
      autoComplete={field.autoComplete}
      autoFocus={field.autoFocus}
      min={field.min}
      max={field.max}
      step={field.step}
      aria-required={ariaProps["aria-required"]}
      aria-invalid={ariaProps["aria-invalid"]}
      aria-disabled={ariaProps["aria-disabled"]}
      aria-describedby={ariaProps["aria-describedby"]}
    />
  );
};

export default FieldText;
