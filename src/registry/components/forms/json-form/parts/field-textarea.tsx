"use client";

import { Textarea } from "@/components/ui/textarea";
import type { FieldRenderer } from "../types";

export const FieldTextarea: FieldRenderer = ({
  field,
  value,
  onChange,
  onBlur,
  disabled,
  readOnly,
  ariaProps,
}) => {
  return (
    <Textarea
      id={ariaProps.id}
      value={value == null ? "" : String(value)}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={field.placeholder}
      disabled={disabled}
      readOnly={readOnly}
      rows={field.rows ?? 4}
      autoComplete={field.autoComplete}
      autoFocus={field.autoFocus}
      aria-required={ariaProps["aria-required"]}
      aria-invalid={ariaProps["aria-invalid"]}
      aria-disabled={ariaProps["aria-disabled"]}
      aria-describedby={ariaProps["aria-describedby"]}
    />
  );
};

export default FieldTextarea;
