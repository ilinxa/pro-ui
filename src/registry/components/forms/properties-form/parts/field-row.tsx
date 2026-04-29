"use client";

import {
  Component,
  useCallback,
  useMemo,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from "react";
import type {
  FieldPermission,
  FieldRendererProps,
  FormMode,
  PropertiesFormField,
} from "../types";
import { resolveFieldPermission } from "../lib/resolve-permission";
import { runRequiredCheck, safeValidateField } from "../lib/validate";
import { formatFieldValue } from "../lib/format-value";
import type { FieldIds } from "../hooks/use-id-factory";
import { FieldError } from "./field-error";
import { PermissionTooltip } from "./permission-tooltip";
import { FieldString } from "./field-string";
import { FieldNumber } from "./field-number";
import { FieldBoolean } from "./field-boolean";
import { FieldDate } from "./field-date";
import { FieldSelect } from "./field-select";
import { FieldTextarea } from "./field-textarea";
import { cn } from "@/lib/utils";

interface FieldRowProps {
  field: PropertiesFormField;
  values: Record<string, unknown>;
  mode: FormMode;
  error: string | undefined;
  errorVisible: boolean;
  pending: boolean;
  hostResolver?: (
    field: PropertiesFormField,
    values: Record<string, unknown>,
  ) => FieldPermission | undefined;
  ids: FieldIds;
  onFieldChange: (
    key: string,
    nextValues: Record<string, unknown>,
    error: string | undefined,
  ) => void;
  onFieldBlur: (key: string, error: string | undefined) => void;
  registerFocusTarget: (key: string, target: FocusTarget | null) => void;
}

export interface FocusTarget {
  permission: FieldPermission;
  focus: () => void;
}

interface BuiltInComponentProps extends FieldRendererProps {
  onBlur: () => void;
  required: boolean;
}

const BUILT_IN_RENDERERS: Record<
  PropertiesFormField["type"],
  ComponentType<BuiltInComponentProps>
> = {
  string: FieldString,
  number: FieldNumber,
  boolean: FieldBoolean,
  date: FieldDate,
  select: FieldSelect,
  textarea: FieldTextarea,
};

const AUTO_COMMIT_TYPES: ReadonlySet<PropertiesFormField["type"]> = new Set([
  "select",
  "boolean",
]);

class RendererErrorBoundary extends Component<
  { fieldKey: string; errorId: string; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        `[properties-form] renderer crashed for field "${this.props.fieldKey}":`,
        error,
        info,
      );
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <FieldError
          id={this.props.errorId}
          message="Custom renderer crashed — see console"
        />
      );
    }
    return this.props.children;
  }
}

function FieldRowImpl({
  field,
  values,
  mode,
  error,
  errorVisible,
  pending,
  hostResolver,
  ids,
  onFieldChange,
  onFieldBlur,
  registerFocusTarget,
}: FieldRowProps) {
  const permission = useMemo(
    () => resolveFieldPermission(field, values, hostResolver),
    [field, values, hostResolver],
  );

  const value = values[field.key];
  const computeError = useCallback(
    (next: unknown, nextValues: Record<string, unknown>) => {
      const requiredError = runRequiredCheck(field, next);
      if (requiredError) return requiredError;
      return safeValidateField(field, next, nextValues);
    },
    [field],
  );

  const handleChange = useCallback(
    (nextValue: unknown) => {
      const nextValues = { ...values, [field.key]: nextValue };
      const nextError = computeError(nextValue, nextValues);
      onFieldChange(field.key, nextValues, nextError);
      if (AUTO_COMMIT_TYPES.has(field.type)) {
        onFieldBlur(field.key, nextError);
      }
    },
    [values, field.key, field.type, computeError, onFieldChange, onFieldBlur],
  );

  const handleBlur = useCallback(() => {
    const blurError = computeError(values[field.key], values);
    onFieldBlur(field.key, blurError);
  }, [values, field.key, computeError, onFieldBlur]);

  const dev = process.env.NODE_ENV !== "production";
  if (field.type === "select" && (!field.options || field.options.length === 0)) {
    if (dev) {
      console.error(
        `[properties-form] select field "${field.key}" is missing \`options\`.`,
      );
    }
  }

  if (permission === "hidden") return null;

  const showError = errorVisible && !!error;
  const ariaDescribedBy =
    [
      field.description ? ids.descriptionId : undefined,
      showError ? ids.errorId : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  const rendererProps: FieldRendererProps = {
    value,
    onChange: handleChange,
    field,
    allValues: values,
    mode,
    error: showError ? error : undefined,
    disabled: permission === "read-only" || pending,
    fieldId: ids.fieldId,
    errorId: ids.errorId,
  };

  let content: ReactNode;

  if (mode === "edit" && permission === "read-only") {
    const display = formatFieldValue(field, value);
    content = (
      <PermissionTooltip
        reason={field.permissionReason ?? "This field is read-only."}
        tooltipId={ids.permissionTooltipId}
      >
        <span
          ref={(el) =>
            registerFocusTarget(field.key, el ? { permission, focus: () => el.focus() } : null)
          }
          aria-readonly="true"
          aria-describedby={ariaDescribedBy}
          className="block min-h-8 truncate rounded-md bg-muted/30 px-2 py-1 text-sm text-muted-foreground"
        >
          {display}
        </span>
      </PermissionTooltip>
    );
  } else if (field.renderer) {
    const CustomRenderer = field.renderer;
    content = (
      <RendererErrorBoundary fieldKey={field.key} errorId={ids.errorId}>
        <div
          ref={(el) =>
            registerFocusTarget(
              field.key,
              el
                ? {
                    permission,
                    focus: () => {
                      const focusable = el.querySelector<HTMLElement>(
                        "input, textarea, select, button, [tabindex]:not([tabindex=\"-1\"])",
                      );
                      (focusable ?? el).focus();
                    },
                  }
                : null,
            )
          }
        >
          <CustomRenderer {...rendererProps} />
        </div>
      </RendererErrorBoundary>
    );
  } else if (mode === "read") {
    const display = formatFieldValue(field, value);
    content = <span className="block truncate text-sm">{display}</span>;
  } else {
    const Renderer = BUILT_IN_RENDERERS[field.type];
    content = (
      <div
        ref={(el) =>
          registerFocusTarget(
            field.key,
            el
              ? {
                  permission,
                  focus: () => {
                    const focusable = el.querySelector<HTMLElement>(
                      `#${CSS.escape(ids.fieldId)}, input, textarea, button, [role="combobox"]`,
                    );
                    (focusable ?? el).focus();
                  },
                }
              : null,
          )
        }
      >
        <Renderer
          {...rendererProps}
          onBlur={handleBlur}
          required={!!field.required}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5")}>
      <label
        htmlFor={ids.fieldId}
        className="flex items-center gap-1 text-sm font-medium text-foreground"
      >
        <span>{field.label}</span>
        {field.required ? (
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        ) : null}
      </label>
      {field.description ? (
        <p
          id={ids.descriptionId}
          className="text-xs text-muted-foreground"
        >
          {field.description}
        </p>
      ) : null}
      {content}
      {showError && error ? (
        <FieldError id={ids.errorId} message={error} />
      ) : null}
    </div>
  );
}

export const FieldRow = FieldRowImpl;
