interface DefaultEmptyStateProps {
  query: string;
  itemCount: number;
}

export function DefaultEmptyState({
  itemCount,
}: DefaultEmptyStateProps) {
  if (itemCount === 0) {
    return (
      <p role="status" className="px-2 text-center text-xs text-muted-foreground">
        Nothing to pick from
      </p>
    );
  }
  return (
    <p role="status" className="px-2 text-center text-xs text-muted-foreground">
      No results
    </p>
  );
}
