/** Consumer-contract kit (C11) for PeopleGrid. `controlled` is not applicable: `items` are read every render. */
import { expect } from "vitest";
import { PeopleGrid } from "../people-grid";
import type { PeopleGridItem } from "../types";
import { describeContract } from "../../../../../../tests/helpers";

const ITEMS: PeopleGridItem[] = [
  { id: "1", name: "Ayşe Demir", title: "Editör", href: "/u/1" },
  { id: "2", name: "Mehmet Kaya", title: "Yazar", href: "/u/2" },
];
const AR_ITEMS: PeopleGridItem[] = [{ id: "a1", name: "أحمد الخطيب", title: "مهندس" }];

describeContract("PeopleGrid", {
  render: (props) => (
    <PeopleGrid
      heading="Ekip"
      items={ITEMS}
      renderActions={(item) => <button type="button">{`Takip et ${item.name}`}</button>}
      {...props}
    />
  ),
  renders: (s) => {
    expect(s.getByRole("heading", { level: 2, name: "Ekip" })).toBeInTheDocument();
    expect(s.getByRole("heading", { level: 3, name: "Ayşe Demir" })).toBeInTheDocument();
    expect(s.getAllByRole("listitem")).toHaveLength(2);
  },
  labels: {
    props: { items: [], labels: { emptyText: "Kimse yok." } },
    expect: (s) => expect(s.getByRole("status")).toHaveTextContent("Kimse yok."),
  },
  controlled: { notApplicable: "no controlled state: `items` are read on every render" },
  rtl: {
    props: { items: AR_ITEMS, alignment: "start", renderActions: undefined },
    expect: (s) => {
      expect(s.getByRole("heading", { name: "أحمد الخطيب" })).toBeInTheDocument();
      // logical alignment: text-start follows the writing direction, never a physical text-left / margin-left
      const li = s.getByRole("listitem");
      expect(li.className).toContain("text-start");
      expect(li.className).not.toMatch(/text-left|text-right|\b(ml|mr|pl|pr)-/);
    },
  },
  keyboard: {
    run: async (user) => {
      await user.tab();
      await user.tab();
    },
    // Tab order per card: slot button, then the card link
    expect: (s) => {
      expect(s.getByRole("button", { name: "Takip et Ayşe Demir" })).not.toHaveFocus();
      expect(s.getByRole("link", { name: "Ayşe Demir" })).toHaveFocus();
    },
  },
  axeStates: [{ cardHeadingAs: "h5", headingAs: "h4" }, { headingAs: "h3", locale: "tr" }],
});
