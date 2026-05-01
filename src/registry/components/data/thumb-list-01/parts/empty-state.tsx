import type { ReactNode } from "react";

interface ThumbListEmptyProps {
  custom?: ReactNode;
  message: string;
}

export function ThumbListEmpty({ custom, message }: ThumbListEmptyProps) {
  if (custom !== undefined && custom !== null) {
    return <>{custom}</>;
  }
  return (
    <p
      className="text-sm text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      {message}
    </p>
  );
}
