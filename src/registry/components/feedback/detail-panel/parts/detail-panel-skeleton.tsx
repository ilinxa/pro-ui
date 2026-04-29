import { Skeleton } from "@/components/ui/skeleton";

export function DetailPanelSkeleton() {
  return (
    <div aria-hidden="true" className="flex h-full flex-col">
      <div className="border-b border-border p-4">
        <Skeleton className="h-6 w-3/5" />
        <Skeleton className="mt-2 h-4 w-2/5" />
      </div>
      <div className="flex-1 space-y-4 p-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="flex justify-end gap-2 border-t border-border p-4">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  );
}
