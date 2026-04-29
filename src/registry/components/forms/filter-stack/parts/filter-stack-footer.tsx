"use client";

import { ClearButton } from "./clear-button";

interface FilterStackFooterProps {
  onClearAll: () => void;
  disabled: boolean;
  label: string;
}

export function FilterStackFooter({
  onClearAll,
  disabled,
  label,
}: FilterStackFooterProps) {
  return (
    <div role="toolbar" className="flex justify-end pt-1">
      <ClearButton
        onClick={onClearAll}
        ariaLabel="Clear all filters"
        variant="text"
        label={label}
        disabled={disabled}
      />
    </div>
  );
}
