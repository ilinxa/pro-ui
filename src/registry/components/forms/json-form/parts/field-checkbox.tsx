"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { FieldRenderer } from "../types";

export const FieldCheckbox: FieldRenderer = ({
  value,
  onChange,
  onBlur,
  disabled,
  ariaProps,
}) => {
  return (
    <Checkbox
      id={ariaProps.id}
      checked={value === true}
      onCheckedChange={(c) => onChange(c === true)}
      onBlur={onBlur}
      disabled={disabled}
      aria-required={ariaProps["aria-required"]}
      aria-invalid={ariaProps["aria-invalid"]}
      aria-disabled={ariaProps["aria-disabled"]}
      aria-describedby={ariaProps["aria-describedby"]}
    />
  );
};

export default FieldCheckbox;
