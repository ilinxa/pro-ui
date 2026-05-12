"use client";

import { Switch } from "@/components/ui/switch";
import type { FieldRenderer } from "../types";

export const FieldSwitch: FieldRenderer = ({
  value,
  onChange,
  onBlur,
  disabled,
  ariaProps,
}) => {
  return (
    <Switch
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

export default FieldSwitch;
