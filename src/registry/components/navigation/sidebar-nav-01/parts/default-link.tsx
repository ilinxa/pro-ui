import { forwardRef } from "react";
import type { NavLinkProps } from "../types";

/**
 * Default linkComponent — vanilla `<a href>` wrapper.
 *
 * Consumers using Next.js / React Router / TanStack Router pass their own
 * linkComponent. See usage.tsx for one-liner adapters.
 */
export const DefaultLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  function DefaultLink({ href, children, ...rest }, ref) {
    return (
      <a ref={ref} href={href} {...rest}>
        {children}
      </a>
    );
  },
);
