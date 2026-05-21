"use client";

import { useId } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type {
  OptionalFieldConfig,
  OptionalFieldName,
  RegistrationLabels,
  RegistrationStep2Values,
} from "../types";

const OPTIONAL_FIELDS: ReadonlyArray<OptionalFieldName> = [
  "firstName",
  "lastName",
  "displayName",
  "phone",
  "company",
];

const AUTOCOMPLETE_MAP: Record<OptionalFieldName, string> = {
  firstName: "given-name",
  lastName: "family-name",
  displayName: "nickname",
  phone: "tel",
  company: "organization",
};

const INPUT_TYPE_MAP: Record<OptionalFieldName, string> = {
  firstName: "text",
  lastName: "text",
  displayName: "text",
  phone: "tel",
  company: "text",
};

export interface OptionalFieldsFieldsetProps {
  fields: Partial<Record<OptionalFieldName, OptionalFieldConfig>>;
  labels: Pick<
    RegistrationLabels,
    | "firstNameLabel"
    | "firstNamePlaceholder"
    | "lastNameLabel"
    | "lastNamePlaceholder"
    | "displayNameLabel"
    | "displayNamePlaceholder"
    | "phoneLabel"
    | "phonePlaceholder"
    | "companyLabel"
    | "companyPlaceholder"
  >;
  /** Two-column grid at `sm:` breakpoint under `default`; single-column under `compact`. */
  density: "compact" | "default";
}

/**
 * `<fieldset>` containing each opted-in optional field. Iterates a fixed
 * `OPTIONAL_FIELDS` list so the rendering order is deterministic.
 */
export function OptionalFieldsFieldset({
  fields,
  labels,
  density,
}: OptionalFieldsFieldsetProps) {
  const visible = OPTIONAL_FIELDS.filter((name) => {
    const config = fields[name];
    return config !== undefined && config !== false;
  });
  if (visible.length === 0) return null;
  return (
    <fieldset
      className={cn(
        "grid gap-3",
        density === "compact"
          ? "grid-cols-1"
          : "grid-cols-1 sm:grid-cols-2",
      )}
    >
      {visible.map((name) => (
        <OptionalField
          key={name}
          name={name}
          required={
            fields[name] === true ? false : (fields[name] as { required: boolean }).required
          }
          label={labels[`${name}Label` as keyof typeof labels]}
          placeholder={labels[`${name}Placeholder` as keyof typeof labels]}
        />
      ))}
    </fieldset>
  );
}

interface OptionalFieldProps {
  name: OptionalFieldName;
  required: boolean;
  label: string;
  placeholder: string;
}

function OptionalField({
  name,
  required,
  label,
  placeholder,
}: OptionalFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const {
    register,
    formState: { errors },
  } = useFormContext<RegistrationStep2Values>();
  const error = errors[name]?.message;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true" className="ms-0.5 text-destructive">*</span> : null}
      </Label>
      <Input
        id={id}
        type={INPUT_TYPE_MAP[name]}
        autoComplete={AUTOCOMPLETE_MAP[name]}
        placeholder={placeholder}
        aria-required={required ? true : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...register(name)}
      />
      <p
        id={errorId}
        role={error ? "alert" : undefined}
        className={cn(
          "min-h-5 text-xs",
          error ? "text-destructive" : "text-transparent",
        )}
      >
        {error ?? ""}
      </p>
    </div>
  );
}
