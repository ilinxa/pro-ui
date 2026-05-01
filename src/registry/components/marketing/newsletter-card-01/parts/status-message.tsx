import type { NewsletterCardStatus, NewsletterCardLabels } from "../types";

/**
 * Status message renderer. Lives below the action area in both variants.
 *
 * - `success` renders in muted text inside an aria-live="polite" region.
 * - `error` renders in destructive text inside a role="alert" region.
 * - `idle` and `pending` render an empty live-region (so the assistive
 *   technology has a stable announcement target when status changes).
 */
export function StatusMessage({
  status,
  labels,
}: {
  status: NewsletterCardStatus;
  labels: Required<NewsletterCardLabels>;
}) {
  if (status === "error") {
    return (
      <div role="alert" className="mt-3 text-sm text-destructive">
        {labels.errorMessage}
      </div>
    );
  }

  return (
    <div aria-live="polite" className="mt-3 min-h-[1.25rem] text-sm text-muted-foreground">
      {status === "success" ? labels.successMessage : null}
    </div>
  );
}
