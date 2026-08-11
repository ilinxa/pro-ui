import type { ReactNode } from "react";

interface ThumbnailListEmptyProps {
  custom?: ReactNode;
  message: string;
}

export function ThumbnailListEmpty({ custom, message }: ThumbnailListEmptyProps) {
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
