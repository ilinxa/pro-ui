"use client";

import { useId, useState, type ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type {
  RegistrationLabels,
  RegistrationStep2Values,
} from "../types";

export interface PasswordFieldProps {
  labels: Pick<
    RegistrationLabels,
    | "passwordLabel"
    | "passwordPlaceholder"
    | "passwordToggleShow"
    | "passwordToggleHide"
  >;
  /** Optional strength meter slot — passed in from the root component. */
  strengthMeter?: ReactNode;
}

/**
 * Password input + label + inline error + show/hide eye toggle.
 *
 * The toggle is local state (uncontrolled — irrelevant to the form
 * values). `aria-pressed` + `aria-label` are surfaced for SR users so
 * the button state is announced. The strength meter is passed in as a
 * slot from the root component so the password value sub doesn't have
 * to thread the calculator + labels here.
 */
export function PasswordField({
  labels,
  strengthMeter,
}: PasswordFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const [shown, setShown] = useState(false);
  const {
    register,
    formState: { errors },
  } = useFormContext<RegistrationStep2Values>();
  const error = errors.password?.message;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{labels.passwordLabel}</Label>
      <div className="relative">
        <Input
          id={id}
          type={shown ? "text" : "password"}
          autoComplete="new-password"
          placeholder={labels.passwordPlaceholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="pe-10"
          {...register("password")}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute inset-e-1 top-1/2 -translate-y-1/2 size-7"
          aria-pressed={shown}
          aria-label={shown ? labels.passwordToggleHide : labels.passwordToggleShow}
          onClick={() => setShown((v) => !v)}
        >
          {shown ? <EyeOff /> : <Eye />}
        </Button>
      </div>
      {strengthMeter}
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
