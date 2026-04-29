import { useId } from "react";

export interface FieldIds {
  fieldId: string;
  errorId: string;
  descriptionId: string;
  permissionTooltipId: string;
}

export function useIdFactory(): (key: string) => FieldIds {
  const formId = useId();
  return (key: string): FieldIds => {
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "_");
    return {
      fieldId: `${formId}-field-${safeKey}`,
      errorId: `${formId}-error-${safeKey}`,
      descriptionId: `${formId}-desc-${safeKey}`,
      permissionTooltipId: `${formId}-perm-${safeKey}`,
    };
  };
}
