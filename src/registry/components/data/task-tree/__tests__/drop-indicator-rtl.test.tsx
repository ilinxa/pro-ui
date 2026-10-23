/**
 * R6 codemod regression: the top/bottom drop line is `end-0` (logical), so its indent must be
 * logical too. A physical inline `left` next to `end-0` collapses the line to zero width under
 * dir="rtl" (both insets resolve to the left edge).
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TaskTreeDropIndicator } from "../parts/task-tree-drop-indicator";

describe("TaskTreeDropIndicator (RTL)", () => {
  it("indents with a logical inset, not a physical left", () => {
    const { container } = render(<TaskTreeDropIndicator zone="top" indentPx={24} />);
    const line = container.querySelector("span")!;
    expect(line.className).toContain("end-0");
    expect(line.style.insetInlineStart).toBe("24px");
    expect(line.style.left).toBe("");
  });
});
