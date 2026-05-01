export default function CategoryCloud01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>CategoryCloud01</code> when you have a fixed set of
        categories / tags / segments and want users to filter by clicking
        one. Always-visible flex-wrap of pill chips with optional counts.
        Single-select; re-clicking the active chip clears it (toggleable).
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Minimal example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { CategoryCloud01 } from "@/registry/components/forms/category-cloud-01";

<CategoryCloud01 items={["All", "Tech", "Design", "Engineering"]} />;`}</code>
      </pre>
      <p className="mt-2 text-muted-foreground">
        String-array shorthand is desugared internally to{" "}
        <code>{"[{ value, label }]"}</code>. No counts in this form.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">With counts</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<CategoryCloud01
  items={[
    { value: "tech", label: "Technology", count: 12 },
    { value: "design", label: "Design", count: 8 },
  ]}
  title="Categories"
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Controlled</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const [active, setActive] = useState<string | null>(null);

<CategoryCloud01
  items={categories}
  value={active}
  onChange={setActive}
/>;`}</code>
      </pre>
      <p className="mt-2 text-muted-foreground">
        For URL-state sync, drive <code>value</code> from your router and
        update via <code>onChange</code>. Pass <code>null</code> to clear.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Custom count format</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<CategoryCloud01
  items={items}
  formatCount={(c) => c > 999 ? \` (\${(c/1000).toFixed(1)}k)\` : \` (\${c})\`}
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Disable toggle (always-active)</h3>
      <p className="text-muted-foreground">
        By default, re-clicking the active chip clears the selection. Pass{" "}
        <code>{"toggleable={false}"}</code> to disable this — useful when{" "}
        <code>null</code> isn&apos;t a valid filter state in your app.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Accessibility</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Each chip is a real <code>{"<button>"}</code> with{" "}
          <code>aria-pressed</code>.
        </li>
        <li>
          Container is <code>role=&quot;group&quot;</code>;{" "}
          <code>aria-label</code> defaults to <code>title</code> if provided.
        </li>
        <li>
          Tab moves between chips; Enter / Space activates. Focus-visible
          ring per chip.
        </li>
        <li>
          Heading level configurable via{" "}
          <code>{"headingAs={\"h2\" | \"h3\" | \"h4\"}"}</code>. Default <code>h3</code>.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Stable references</h3>
      <p className="text-muted-foreground">
        The card is <code>React.memo</code>-wrapped. Hoist the{" "}
        <code>items</code> array outside the parent render or memoize it to
        prevent unnecessary re-renders.
      </p>
    </div>
  );
}
