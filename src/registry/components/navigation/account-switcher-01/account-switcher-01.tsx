import { cn } from "@/lib/utils";
import type { AccountSwitcher01Props } from "./types";

/**
 * Account Switcher.
 *
 * @internal C1 stub — full implementation lands at C4. See plan §3.
 */
export function AccountSwitcher01(_props: AccountSwitcher01Props) {
  return (
    <button
      type="button"
      disabled
      className={cn(
        "inline-flex items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm text-muted-foreground",
        _props.className,
      )}
    >
      AccountSwitcher01 (C1 stub)
    </button>
  );
}
