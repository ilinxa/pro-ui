"use client";

import { ClearButton } from "./clear-button";

interface FilterPanelFooterProps {
  onClearAll: () => void;
  disabled: boolean;
  label: string;
}

export function FilterPanelFooter({
  onClearAll,
  disabled,
  label,
}: FilterPanelFooterProps) {
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
