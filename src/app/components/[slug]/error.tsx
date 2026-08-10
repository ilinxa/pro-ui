"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Route-level boundary: 63 live demos render on these pages — one throwing
 * demo must not take the whole detail page down to Next's default crash screen.
 */
export default function ComponentDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-start gap-4 px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        Component demo
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        This demo hit a runtime error.
      </h1>
      <p className="max-w-prose text-base leading-relaxed text-muted-foreground">
        The rest of the catalog is unaffected. Retry the render, or go back to
        the component list.
      </p>
      {error.digest ? (
        <p className="font-mono text-xs text-muted-foreground">
          digest: {error.digest}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-3">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/components">Back to components</Link>
        </Button>
      </div>
    </div>
  );
}
