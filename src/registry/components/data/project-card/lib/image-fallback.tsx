import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ImageFallback({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-muted",
        className,
      )}
    >
      <Building2
        aria-hidden="true"
        className="h-8 w-8 text-muted-foreground/40"
      />
    </div>
  );
}
