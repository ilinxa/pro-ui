import type { ComponentType, Ref } from "react";

export type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "select"
  | "textarea";

export type FieldPermission = "editable" | "read-only" | "hidden";

export type FormMode = "read" | "edit";

export interface FieldOption {
  value: string;
  label: string;
}

export interface PropertiesFormField {
  key: string;
  type: FieldType;
  label: string;
  description?: string;
  required?: boolean;
  options?: ReadonlyArray<FieldOption>;
  placeholder?: string;
  permission?: FieldPermission;
  permissionReason?: string;
  validate?: (
    value: unknown,
    allValues: Record<string, unknown>,
  ) => string | undefined;
  renderer?: ComponentType<FieldRendererProps>;
}

export interface FieldRendererProps<V = unknown> {
  value: V;
  onChange: (value: V) => void;
  field: PropertiesFormField;
  allValues: Record<string, unknown>;
  mode: FormMode;
  error: string | undefined;
  disabled: boolean;
  fieldId: string;
  errorId: string;
}

export interface SubmitResult {
  ok: boolean;
  errors?: Record<string, string>;
}

export interface PropertiesFormProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  schema: ReadonlyArray<PropertiesFormField>;
  values: T;

  mode?: FormMode;
  onModeChange?: (mode: FormMode) => void;

  onChange?: (values: T) => void;
  onSubmit?: (values: T) => Promise<SubmitResult>;
  onCancel?: () => void;

  resolvePermission?: (
    field: PropertiesFormField,
    values: T,
  ) => FieldPermission | undefined;
  validate?: (values: T) => Record<string, string> | undefined;

  showSubmitActions?: boolean;
  submitLabel?: string;
  cancelLabel?: string;

  ariaLabel?: string;
  className?: string;

  ref?: Ref<PropertiesFormHandle>;
}

export interface PropertiesFormHandle {
  isDirty(): boolean;
  markClean(): void;
  reset(): void;
  focusField(key: string): void;
  submit(): Promise<SubmitResult>;
}

export interface FormState {
  errors: Record<string, string>;
  formError: string | undefined;
  pending: boolean;
  showSpinner: boolean;
  version: number;
  cleanVersion: number;
  cleanSnapshot: Record<string, unknown>;
  submitAttempted: boolean;
  blurredWithError: Record<string, true>;
}

export type FormAction =
  | {
      type: "field-changed";
      key: string;
      nextValues: Record<string, unknown>;
      error: string | undefined;
    }
  | {
      type: "field-blurred";
      key: string;
      error: string | undefined;
    }
  | { type: "submit-started" }
  | { type: "submit-spinner-show" }
  | {
      type: "submit-succeeded";
      cleanSnapshot: Record<string, unknown>;
    }
  | {
      type: "submit-failed";
      errors: Record<string, string>;
      formError: string | undefined;
    }
  | { type: "mark-clean"; cleanSnapshot: Record<string, unknown> }
  | { type: "reset"; cleanSnapshot: Record<string, unknown> };
