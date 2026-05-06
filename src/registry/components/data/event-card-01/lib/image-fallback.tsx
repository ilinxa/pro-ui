import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export function ImageFallback({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-muted",
        className,
      )}
    >
      <Calendar
        aria-hidden="true"
        className="h-8 w-8 text-muted-foreground/40"
      />
    </div>
  );
}
