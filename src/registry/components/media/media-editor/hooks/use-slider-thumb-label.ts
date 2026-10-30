import * as React from "react";

/**
 * Names the thumb(s) of a shadcn `Slider`. The primitive's `aria-label` lands on
 * the root element, but the focusable `role="slider"` is the thumb, which the
 * shadcn wrapper gives no way to label. Pass the returned ref to `<Slider ref>`;
 * written as an attribute so it holds for Radix and Base UI thumbs alike.
 */
export function useSliderThumbLabel(label: string) {
  const ref = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    const root = ref.current;
    if (!root) return;
    for (const thumb of root.querySelectorAll<HTMLElement>('[role="slider"]')) {
      thumb.setAttribute("aria-label", label);
    }
  }, [label]);
  return ref;
}
