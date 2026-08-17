/**
 * T4 — the JSON-textarea fallback edit path (parts/predefined-custom.tsx's
 * `CustomJsonFallbackEdit`), used whenever a registration omits `edit`.
 * Entering edit mode seeds a textarea with the value's pretty-printed JSON;
 * invalid JSON blocks save and shows an inline error; valid JSON commits and
 * returns to the view render.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardTree } from "../card-tree";
import type { CardTreeJsonNode } from "../types";
import { makeNoEditKey } from "./component-fixtures";

// `vitest.config.ts` does not set `test.globals: true`, so
// `@testing-library/react`'s auto-cleanup (which detects a GLOBAL
// `afterEach`) never registers — must be wired explicitly per file.
afterEach(() => cleanup());

describe("PredefinedCustomEdit: JSON-textarea fallback (no `edit` registered)", () => {
  it("entering edit mode seeds the textarea with the value's pretty-printed JSON", async () => {
    const user = userEvent.setup();
    const tree: CardTreeJsonNode = {
      title: "Root",
      freeform: { note: "hello" },
    };
    render(
      <CardTree defaultValue={tree} editable customPredefinedKeys={[makeNoEditKey()]} />,
    );

    await user.click(screen.getByRole("button", { name: "Edit freeform" }));

    const textarea = screen.getByRole("textbox", { name: "Edit freeform (JSON)" });
    expect(textarea).toHaveValue(JSON.stringify({ note: "hello" }, null, 2));
  });

  it("invalid JSON blocks save and shows an inline error", async () => {
    const user = userEvent.setup();
    const tree: CardTreeJsonNode = {
      title: "Root",
      freeform: { note: "hello" },
    };
    render(
      <CardTree defaultValue={tree} editable customPredefinedKeys={[makeNoEditKey()]} />,
    );

    await user.click(screen.getByRole("button", { name: "Edit freeform" }));
    const textarea = screen.getByRole("textbox", { name: "Edit freeform (JSON)" });

    // user-event's `.type()` treats `{`/`}` as special key-sequence markers
    // (needing brittle `{{`/`}}` escaping) — for JSON-heavy input, setting
    // the value directly via `fireEvent.change` is the practical choice
    // (mandate §"Use user-event... where practical"); clicks stay on
    // user-event throughout this file.
    fireEvent.change(textarea, { target: { value: "{ not valid json" } });

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "save" })).toBeDisabled();
  });

  it("valid JSON commits and returns to the view render", async () => {
    const user = userEvent.setup();
    const tree: CardTreeJsonNode = {
      title: "Root",
      freeform: { note: "hello" },
    };
    render(
      <CardTree defaultValue={tree} editable customPredefinedKeys={[makeNoEditKey()]} />,
    );

    await user.click(screen.getByRole("button", { name: "Edit freeform" }));
    const textarea = screen.getByRole("textbox", { name: "Edit freeform (JSON)" });

    fireEvent.change(textarea, {
      target: { value: JSON.stringify({ note: "updated" }) },
    });
    expect(screen.getByRole("button", { name: "save" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "save" }));

    // Edit mode exited — the textarea is gone, replaced by the view render
    // with the committed value.
    expect(
      screen.queryByRole("textbox", { name: "Edit freeform (JSON)" }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("freeform-render")).toHaveTextContent(
      JSON.stringify({ note: "updated" }),
    );
  });
});
