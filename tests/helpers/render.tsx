import { render, type RenderOptions } from "@testing-library/react";
import axe from "axe-core";
import type { ReactElement } from "react";

/**
 * Render inside a `dir` / `lang` wrapper, the way a host sets direction and locale
 * (consumer contract C3 / C4 / C11). Components must read direction from the nearest
 * `[dir]` (or their `dir` prop), so this is how an RTL render is tested.
 */
export function renderWithContext(
  ui: ReactElement,
  { dir = "ltr", locale = "en", ...options }: { dir?: "ltr" | "rtl"; locale?: string } & RenderOptions = {},
) {
  // A `wrapper`, not a wrapping element, so `rerender` keeps the direction and locale.
  function Context({ children }: { children: React.ReactNode }) {
    return (
      <div dir={dir} lang={locale} data-testid="context-root">
        {children}
      </div>
    );
  }
  return render(ui, { wrapper: Context, ...options });
}

/**
 * Fail with a readable list when axe finds violations in `container`. `color-contrast` is
 * off by default: jsdom computes no colours, so that rule cannot be evaluated there.
 */
export async function expectNoAxeViolations(
  container: Element,
  { disable = ["color-contrast"] }: { disable?: string[] } = {},
): Promise<void> {
  const result = await axe.run(container, {
    rules: Object.fromEntries(disable.map((id) => [id, { enabled: false }])),
  });
  if (result.violations.length === 0) return;
  const lines = result.violations.map(
    (v) => `  - ${v.id} (${v.impact}): ${v.help}\n${v.nodes.map((n) => `      ${n.html}`).join("\n")}`,
  );
  throw new Error(`axe found ${result.violations.length} violation(s):\n${lines.join("\n")}`);
}
