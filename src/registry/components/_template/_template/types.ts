/**
 * Every user-facing string comes from `labels` (consumer contract C2): visible
 * text, aria-label, title, placeholder, default alt, toast and error text. A
 * string that carries a value is a function — plurals are decided inside it;
 * never a `{placeholder}` template, never a sentence built from fragments.
 */
export interface TemplateLabels {
  /** Accessible name of the count badge, e.g. `(n) => \`${n} items\``. */
  itemCount: (count: number) => string;
}

/** What consumers pass: any subset, merged over `defaultTemplateLabels`. */
export type TemplateLabelsInput = Partial<TemplateLabels>;

export type TemplateProps = {
  title: string;
  description?: string;
  /**
   * A count from the host. `null` means withheld (C6): nothing renders — no
   * number, and no count in any accessible name.
   */
  count?: number | null;
  labels?: TemplateLabelsInput;
  /** BCP 47 locale for every formatter (C3). Default `"en"`. */
  locale?: string;
  className?: string;
};
