import { useEffect, useRef } from "react";

const SPINNER_DELAY_MS = 200;

export function useSubmitSpinner(
  pending: boolean,
  onShow: () => void,
): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!pending) {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onShow();
    }, SPINNER_DELAY_MS);
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [pending, onShow]);
}
