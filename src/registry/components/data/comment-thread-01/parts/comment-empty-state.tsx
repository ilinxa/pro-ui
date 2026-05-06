import { cn } from "@/lib/utils";

export interface CommentEmptyStateProps {
  message: string;
  className?: string;
}

export function CommentEmptyState({ message, className }: CommentEmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-dashed border-muted-foreground/30 px-4 py-6 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      {message}
    </div>
  );
}
