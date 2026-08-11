import { cn } from "@/lib/utils";

export interface EditedSuffixProps {
  /** Visible label text (e.g. "(edited)"). */
  label: string;
  /** Exact edit timestamp — rendered as the `title` attribute for a hover tooltip. */
  editedAt: Date | string | number;
  className?: string;
}

function toExactDateString(input: Date | string | number): string {
  const d = input instanceof Date ? input : new Date(input);
  return d.toLocaleString();
}

/**
 * Sealed RSC-compatible "(edited)" suffix rendered inline with the post
 * timestamp when `post.editedAt` is set. The `title` attribute exposes the
 * exact edit timestamp on hover (browser-native tooltip; no JS).
 */
export function EditedSuffix({ label, editedAt, className }: EditedSuffixProps) {
  return (
    <span
      className={cn("shrink-0 text-muted-foreground", className)}
      title={toExactDateString(editedAt)}
    >
      {label}
    </span>
  );
}

EditedSuffix.displayName = "EditedSuffix";
