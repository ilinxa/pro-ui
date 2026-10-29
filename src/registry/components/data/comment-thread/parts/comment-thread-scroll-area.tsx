"use client";

import { createContext, useCallback, useContext, useMemo, useState, type Ref } from "react";
import { cn } from "@/lib/utils";
import { defaultCommentThreadLabels, type CommentThreadScrollAreaProps } from "../types";
import { useThreadRootOptional } from "./thread-root-context";

/** The enclosing scroll area's element, for auto-mode load-more parts. `null` outside one. */
const ScrollAreaElementContext = createContext<{ el: HTMLDivElement | null } | null>(null);

export function useScrollAreaElement() {
  return useContext(ScrollAreaElementContext);
}

/** A vertically scrolling, keyboard-focusable named region. Works inside or outside a thread. */
export function CommentThreadScrollArea({
  className,
  ref,
  "aria-label": ariaLabel,
  children,
  ...rest
}: CommentThreadScrollAreaProps & { ref?: Ref<HTMLDivElement> }) {
  const root = useThreadRootOptional();
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  // Stable identity: a fresh callback ref would detach/re-attach (and re-render) on every render.
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      setEl(node);
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
    },
    [ref],
  );
  const value = useMemo(() => ({ el }), [el]);
  return (
    <ScrollAreaElementContext.Provider value={value}>
      <div
        {...rest}
        ref={setRef}
        role="region"
        tabIndex={0}
        aria-label={ariaLabel ?? root?.state.labels.commentsRegion ?? defaultCommentThreadLabels.commentsRegion}
        className={cn("overflow-y-auto", className)}
      >
        {children}
      </div>
    </ScrollAreaElementContext.Provider>
  );
}
