import type { RichSidebarProps } from "../types";

type Variant = NonNullable<RichSidebarProps["activeVariant"]>;

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
    return "text-foreground hover:bg-muted";
  }

  switch (variant ?? "fill") {
    case "fill":
      return "bg-(--ilinxa-nav-active-bg) text-(--ilinxa-nav-active-fg)";

    case "left-bar":
      return [
        "relative text-(--ilinxa-nav-active-bg)",
        "before:absolute before:left-0 before:top-1.5 before:bottom-1.5",
        "before:w-(--ilinxa-nav-active-bar-w) before:rounded-r-full",
        "before:bg-(--ilinxa-nav-active-bg)",
      ].join(" ");

    case "right-bar":
      return [
        "relative text-(--ilinxa-nav-active-bg)",
        "after:absolute after:right-0 after:top-1.5 after:bottom-1.5",
        "after:w-(--ilinxa-nav-active-bar-w) after:rounded-l-full",
        "after:bg-(--ilinxa-nav-active-bg)",
      ].join(" ");

    case "outline":
      return "ring-2 ring-inset ring-(--ilinxa-nav-active-bg) text-(--ilinxa-nav-active-bg)";

    case "subtle":
      return "bg-accent/30 text-foreground font-semibold";

    default:
      return "bg-(--ilinxa-nav-active-bg) text-(--ilinxa-nav-active-fg)";
  }
}
