import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DetailPanelError as DetailPanelErrorShape } from "../types";

interface DetailPanelErrorProps {
  error: DetailPanelErrorShape;
}

export function DetailPanelError({ error }: DetailPanelErrorProps) {
  return (
    <div
      role="alert"
      className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <AlertCircle aria-hidden="true" className="h-8 w-8 text-destructive" />
      <p className="text-sm font-medium text-foreground">{error.message}</p>
      {error.retry ? (
        <Button variant="outline" size="sm" onClick={error.retry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
