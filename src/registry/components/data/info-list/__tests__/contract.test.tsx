/**
 * Consumer-contract kit (C11) for InfoList. `controlled` is not applicable: `items` is read on
 * every render and nothing is held in state. Keyboard = Tab to the row link.
 */
import { expect } from "vitest";
import { Mail, Phone } from "lucide-react";
import { InfoList } from "../info-list";
import { describeContract } from "../../../../../../tests/helpers";
import type { InfoListItem } from "../types";

const items: InfoListItem[] = [
  { id: "phone", icon: Phone, primary: "هاتف المكتب", href: "tel:+902125550123" },
  { id: "mail", icon: Mail, primary: "info@example.com" },
];

describeContract("InfoList", {
  render: (props) => <InfoList heading="Contact" variant="compact" items={items} {...props} />,
  renders: (s) => {
    expect(s.getByRole("heading", { name: "Contact" })).toBeInTheDocument();
    expect(s.getByRole("link", { name: "هاتف المكتب" })).toHaveAttribute("href", "tel:+902125550123");
    expect(s.getByText("info@example.com")).toBeInTheDocument();
  },
  labels: {
    props: { items: [], labels: { emptyText: "لا توجد معلومات." } },
    expect: (s) => expect(s.getByRole("status")).toHaveTextContent("لا توجد معلومات."),
  },
  controlled: { notApplicable: "`items` is read on every render; the component keeps no state of its own" },
  rtl: {
    props: { wrap: true },
    expect: (s, root) => {
      expect(root.closest("[dir='rtl']")).not.toBeNull();
      expect(s.getByRole("link", { name: "هاتف المكتب" })).toBeInTheDocument();
      expect(root.querySelector(".truncate")).toBeNull();
      expect(root.querySelector(".wrap-break-word")).not.toBeNull();
    },
  },
  keyboard: {
    run: async (user) => {
      await user.tab();
    },
    expect: (s) => expect(s.getByRole("link", { name: "هاتف المكتب" })).toHaveFocus(),
  },
  axeStates: [{ variant: "comfortable" }, { items: [] }, { wrap: true }],
});
