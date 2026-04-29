import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldErrorProps {
  id: string;
  message: string;
  className?: string;
}

export function FieldError({ id, message, className }: FieldErrorProps) {
  return (
    <p
      id={id}
      role="alert"
      className={cn(
        "mt-1 flex items-start gap-1.5 text-xs text-destructive",
        className,
      )}
    >
      <AlertCircle aria-hidden="true" className="mt-0.5 size-3 shrink-0" />
      <span>{message}</span>
    </p>
  );
}
