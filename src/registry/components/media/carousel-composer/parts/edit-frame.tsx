"use client";

import { useEffect, useRef } from "react";

export interface EditFrameProps {
  /** Accessible name of the region, e.g. `labels.edit`. */
  label: string;
  children: React.ReactNode;
}

/**
 * Wraps the injected edit panel. On mount it takes focus, unless the panel
 * already moved focus inside, so keyboard users land in the editor and not on
 * a button that has just left the page.
 */
export function EditFrame({ label, children }: EditFrameProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || el.contains(document.activeElement)) return;
    el.focus();
  }, []);
  return (
    <div ref={ref} role="group" aria-label={label} tabIndex={-1} className="outline-none">
      {children}
    </div>
  );
}
