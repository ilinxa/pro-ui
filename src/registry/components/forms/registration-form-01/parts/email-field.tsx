"use client";

import { useId } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type {
  RegistrationLabels,
  RegistrationStep2Values,
} from "../types";

export interface EmailFieldProps {
  labels: Pick<RegistrationLabels, "emailLabel" | "emailPlaceholder">;
}

/**
 * Email input + label + inline error. ARIA: `aria-describedby` points
 * to the inline-error region; the region carries `role="alert"` only
 * when populated.
 */
export function EmailField({ labels }: EmailFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const {
    register,
    formState: { errors },
  } = useFormContext<RegistrationStep2Values>();
  const error = errors.email?.message;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{labels.emailLabel}</Label>
      <Input
        id={id}
        type="email"
        autoComplete="email"
        placeholder={labels.emailPlaceholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...register("email")}
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
