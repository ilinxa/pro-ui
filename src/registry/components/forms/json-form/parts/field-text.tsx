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
  return (
    <Input
      id={ariaProps.id}
      type={inputType}
      value={value == null ? "" : String(value)}
      onChange={(e) => onChange(e.target.value)}
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
