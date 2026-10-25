import type { ElementType } from "react";

export type CategoryCloudHeadingLevel = "h2" | "h3" | "h4";

/** User-facing strings. Every key is optional; an `undefined` key keeps the default. */
export interface CategoryCloudLabels {
  /** Accessible name of the chip group when neither `ariaLabel` nor `title` is given. Default: "Categories". */
  group?: string;
  /**
   * Text appended to a chip label when it has a `count`. Receives the raw number and the
   * `locale`-formatted one. Default: `" (12)"`. `formatCount` overrides this entirely.
   */
  count?: (count: number, formatted: string) => string;
}

/** Default English labels — exported for consumer composition. */
export const defaultCategoryCloudLabels: Required<CategoryCloudLabels> = {
  group: "Categories",
  count: (_count, formatted) => ` (${formatted})`,
};

export interface CategoryCloudItem {
  /** Stable identifier, used as the selection value. */
  value: string;
  /** Display text. Defaults to `value` if not provided. */
  label?: string;
  /** Optional count rendered after the label. */
  count?: number;
}

export interface CategoryCloudProps {
  /** Categories to render. Pass `string[]` as shorthand for `[{value,label}]`. */
  items: CategoryCloudItem[] | string[];

  /** Controlled selection value. Pass null to clear. */
  value?: string | null;
  /** Uncontrolled initial selection. Default: null. */
  defaultValue?: string | null;
  /** Selection change callback. Fires with null when re-clicking active (if toggleable). */
  onChange?: (value: string | null) => void;

  /** Whether re-clicking the active chip clears the selection. Default: true. */
  toggleable?: boolean;

  /** Optional title rendered above the cloud. */
  title?: string;
  /** Heading semantic level. Default: 'h3'. */
  headingAs?: CategoryCloudHeadingLevel;

  /**
   * Full override of the count text (including the leading space / parentheses). Wins over
   * `labels.count` and receives the raw number, so format it yourself.
   */
  formatCount?: (count: number) => string;

  /** ARIA group label. Precedence: `ariaLabel` > `title` > `labels.group`. */
  ariaLabel?: string;

  /** User-facing strings (group name, count text). Partial; `undefined` keys keep the defaults. */
  labels?: CategoryCloudLabels;
  /** BCP 47 locale used to format counts (`Intl.NumberFormat`). Default `"en"`; an invalid tag falls back to `"en"`. */
  locale?: string;

  /**
   * Link mode: return a URL for an item and its chip renders as a link (`linkComponent`) instead of a
   * button — no `aria-pressed`, `aria-current="page"` on the chip matching `value`. `onChange` still fires
   * on click (default is not prevented) so a router can react. An item for which this returns
   * `undefined` stays a button. `toggleable` has no meaning for link chips.
   */
  getHref?: (item: CategoryCloudItem) => string | undefined;
  /** Element type rendered for link chips (e.g. a router's `Link`). Default `"a"`. Rendered as an element type, never `asChild`. */
  linkComponent?: ElementType;

  /** Override classes for the root container. */
  className?: string;
  /** Override classes for the title heading. */
  titleClassName?: string;
}

/** Internal normalized item shape — both `string[]` and `CategoryCloudItem[]` flatten to this. */
export interface NormalizedItem {
  value: string;
  label: string;
  count: number | undefined;
  /** React key — `value`, suffixed only for a repeated `value` so duplicates do not collide. */
  key: string;
}
