"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseOpenStateArgs {
  controlled: boolean | undefined;
  onOpenChange: ((open: boolean) => void) | undefined;
}

interface UseOpenStateResult {
  open: boolean;
  setOpen: (next: boolean) => void;
}

export function useOpenState({
  controlled,
  onOpenChange,
}: UseOpenStateArgs): UseOpenStateResult {
  const isControlled = controlled !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);

  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  });

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChangeRef.current?.(next);
    },
    [isControlled],
  );

  const open = isControlled ? (controlled as boolean) : internalOpen;
  return { open, setOpen };
}
