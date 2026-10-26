interface DefaultEmptyStateProps {
  query: string;
  itemCount: number;
  nothingToPick: string;
  noResults: string;
  /** Server-filtered mode: a non-empty query with no items is "no results", not "nothing to pick". */
  serverFiltered?: boolean;
}

export function DefaultEmptyState({
  query,
  itemCount,
  nothingToPick,
  noResults,
  serverFiltered = false,
}: DefaultEmptyStateProps) {
  const nothing = itemCount === 0 && !(serverFiltered && query.length > 0);
  return (
    <p role="status" className="px-2 text-center text-xs text-muted-foreground">
      {nothing ? nothingToPick : noResults}
    </p>
  );
}
