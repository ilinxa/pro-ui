export type CategoryCloudHeadingLevel = "h2" | "h3" | "h4";

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

  /** Custom count formatter. Default: `(count) => \` (\${count})\``. */
  formatCount?: (count: number) => string;

  /** ARIA group label. Defaults to `title` if provided, else 'Categories'. */
  ariaLabel?: string;

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
}
