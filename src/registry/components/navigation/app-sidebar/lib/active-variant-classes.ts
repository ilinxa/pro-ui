import type { AppSidebarProps } from "../types";

type Variant = NonNullable<AppSidebarProps["activeVariant"]>;

/**
 * Per-variant Tailwind class composition (L12 + L17).
 *
 * Returns the class string for the link element based on:
 *  - the chosen `activeVariant`
 *  - whether the row is active or not
 *
 * renderItem slot (L13) bypasses this helper entirely — the slot decides
 * how to paint active state.
 */
export function getActiveVariantClasses(
  variant: Variant | undefined,
  isActive: boolean,
): string {
  if (!isActive) {
    return "text-(--ilinxa-sidebar-fg,var(--foreground)) hover:bg-(--ilinxa-nav-hover-bg,var(--muted))";
  }

  switch (variant ?? "fill") {
    case "fill":
      return "bg-(--ilinxa-nav-active-bg,var(--primary)) text-(--ilinxa-nav-active-fg,var(--primary-foreground))";

    case "left-bar":
      return [
        "relative text-(--ilinxa-nav-active-bg,var(--primary))",
        // v0.5.0 (C4) — inline-start bar: flips to the right edge in RTL.
        "before:absolute before:start-0 before:top-1.5 before:bottom-1.5",
        "before:w-(--ilinxa-nav-active-bar-w,3px) before:rounded-e-full",
        "before:bg-(--ilinxa-nav-active-bg,var(--primary))",
      ].join(" ");

    case "right-bar":
      return [
        "relative text-(--ilinxa-nav-active-bg,var(--primary))",
        // v0.5.0 (C4) — inline-end bar.
        "after:absolute after:end-0 after:top-1.5 after:bottom-1.5",
        "after:w-(--ilinxa-nav-active-bar-w,3px) after:rounded-s-full",
        "after:bg-(--ilinxa-nav-active-bg,var(--primary))",
      ].join(" ");

    case "outline":
      return "ring-2 ring-inset ring-(--ilinxa-nav-active-bg,var(--primary)) text-(--ilinxa-nav-active-bg,var(--primary))";

    case "subtle":
      return "bg-accent/30 text-foreground font-semibold";

    default:
      return "bg-(--ilinxa-nav-active-bg,var(--primary)) text-(--ilinxa-nav-active-fg,var(--primary-foreground))";
  }
}
