/** Consumer-contract kit (C11) for EntityPicker — controlled data is the search `query` (plus `value`). */
import { expect, vi } from "vitest";
import { describeContract } from "../../../../../../tests/helpers";
import { AR_ITEMS, ITEMS, Multi, installDomStubs } from "./support";

const keyboardChange = vi.fn();

describeContract("EntityPicker", {
  render: (props) => <Multi {...props} />,
  setup: installDomStubs,
  renders: (s) => {
    const trigger = s.getAllByRole("button")[0]!;
    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(s.getByText("Select…")).toBeInTheDocument();
  },
  labels: {
    props: {
      open: true,
      value: [ITEMS[0]],
      labels: {
        triggerPlaceholder: "Seç…",
        searchPlaceholder: "Ara…",
        searchLabel: "Varlık ara",
        removeChip: (label: string) => `${label} öğesini kaldır`,
      },
    },
    expect: (s) => {
      expect(s.getByPlaceholderText("Ara…")).toBeInTheDocument();
      expect(s.getByRole("combobox", { name: "Varlık ara" })).toBeInTheDocument();
      expect(s.getByRole("button", { name: "Alpha öğesini kaldır" })).toBeInTheDocument();
      expect(document.body.textContent).not.toMatch(/Search…|Search entities|Remove/);
    },
  },
  controlled: {
    initial: { open: true, query: "al" },
    next: { open: true, query: "br" },
    callback: "onQueryChange",
    expectInitial: (s) => {
      expect(s.getByRole("combobox")).toHaveValue("al");
      expect(s.getByRole("option", { name: /Alpha/ })).toBeInTheDocument();
      expect(s.queryByRole("option", { name: /Bravo/ })).toBeNull();
    },
    expectNext: (s) => {
      expect(s.getByRole("combobox")).toHaveValue("br");
      expect(s.getByRole("option", { name: /Bravo/ })).toBeInTheDocument();
      expect(s.queryByRole("option", { name: /Alpha/ })).toBeNull();
    },
    request: (user, s) => user.type(s.getByRole("combobox"), "x"),
  },
  rtl: {
    props: { items: AR_ITEMS, open: true, value: [AR_ITEMS[0]] },
    expect: (s) => {
      expect(s.getAllByRole("option")).toHaveLength(2);
      expect(s.getByRole("button", { name: "Remove القاهرة" })).toBeInTheDocument();
    },
  },
  keyboard: {
    props: { onChange: keyboardChange },
    // Tab to the trigger, ↓ opens, Enter picks the highlighted first row.
    run: async (user) => {
      await user.tab();
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Enter}");
    },
    expect: () => {
      expect(keyboardChange).toHaveBeenCalledWith([ITEMS[0]]);
    },
  },
  axeStates: [{ open: true }, { value: [ITEMS[0]], disabled: true }],
});
