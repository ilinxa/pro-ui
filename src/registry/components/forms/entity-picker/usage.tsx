export default function EntityPickerUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>EntityPicker</code> whenever a host has a list of typed
        entities (graph nodes, users, files, organizations, …) and a user
        needs to pick one or many. Generic over the entity type via{" "}
        <code>{`<EntityPicker<T extends EntityLike>>`}</code>; supports single
        or multi mode with mode-aware <code>value</code> typing via TypeScript
        function overloads. Built on shadcn <code>Command</code> (cmdk) for
        search and <code>Popover</code> for the dropdown.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic single</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { EntityPicker } from "@/registry/components/forms/entity-picker";

interface Node {
  id: string;
  label: string;
  kind: "person" | "project";
}

const NODES: Node[] = [/* ... */];

export function NodePicker() {
  const [value, setValue] = useState<Node | null>(null);
  return (
    <EntityPicker<Node>
      items={NODES}
      value={value}
      onChange={setValue}
      triggerLabel="Pick a node"
    />
  );
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Multi</h3>
      <p className="text-muted-foreground">
        Set <code>{`mode="multi"`}</code>. <code>value</code> becomes{" "}
        <code>T[]</code>; chips render in the trigger; Backspace on empty
        search removes the last chip; chip-X buttons remove individual chips.
        Selection order is the order picked (no drag-to-reorder in v0.1).
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<EntityPicker<Node>
  mode="multi"
  items={NODES}
  value={selected}
  onChange={setSelected}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Kinds + badges</h3>
      <p className="text-muted-foreground">
        When items carry a <code>kind</code>, supply a{" "}
        <code>kinds: Record&lt;string, KindMeta&gt;</code> map keyed by kind
        value. Each <code>KindMeta</code> has a <code>label</code> and an
        optional <code>color</code> (CSS variable name or OKLCH literal).
        Badges render in result rows + chips; toggle with{" "}
        <code>showKindBadges</code> (defaults to true iff any item has a
        kind).
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Custom match</h3>
      <p className="text-muted-foreground">
        Default match is case-insensitive substring on{" "}
        <code>item.label</code> via <code>String.toLowerCase()</code>. Pass{" "}
        <code>{`match: (item, query) => boolean`}</code> for richer search
        (e.g., search across <code>description</code>, fuzzy-rank via
        Fuse.js, or <code>Intl.Collator</code> for accent-insensitive
        matching). Filter cost runs on every keystroke; keep predicates
        cheap.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Custom slots</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>renderItem(item, ctx)</code> — replace the result row body.
          ctx has <code>{`{ selected, query }`}</code>. The CommandItem
          chrome (highlight, click handler) is preserved.
        </li>
        <li>
          <code>renderTrigger(ctx)</code> — replace the trigger entirely. ctx
          has <code>{`{ value, open, triggerRef }`}</code>. Attach{" "}
          <code>triggerRef</code> to your root focusable element so{" "}
          <code>focus()</code> ref method works.
        </li>
        <li>
          <code>renderEmpty(ctx)</code> — replace the empty-state copy. ctx
          has <code>{`{ query, itemCount }`}</code>; default is &quot;No
          results&quot; or &quot;Nothing to pick from&quot;.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        properties-form integration
      </h3>
      <p className="text-muted-foreground">
        When composing entity-picker inside properties-form&apos;s{" "}
        <code>custom</code> field renderer, pass{" "}
        <code>{`id={fieldId}`}</code> from <code>FieldRendererProps</code> so{" "}
        <code>{`<label htmlFor={fieldId}>`}</code> associates correctly.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`{
  key: "owner",
  type: "string",  // type ignored when renderer is set
  label: "Owner",
  renderer: ({ value, onChange, fieldId, error, errorId }) => (
    <EntityPicker<User>
      id={fieldId}
      items={users}
      value={value as User | null}
      onChange={onChange}
      triggerLabel="Pick owner"
    />
  ),
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Imperative handle</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const ref = useRef<EntityPickerHandle>(null);
// ...
ref.current?.focus();
ref.current?.open();
ref.current?.close();
ref.current?.clear();`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Items reference stability
      </h3>
      <p className="text-muted-foreground">
        Inline <code>{`items={[...]}`}</code> rebuilds entity references each
        render and re-derives cmdk&apos;s filter index. In-repo, the React
        Compiler memoizes inline literals at the call site. For NPM
        consumers without the Compiler, hoist to module scope or wrap with{" "}
        <code>useMemo</code>. A dev-only warning fires after &gt;5 successive
        unstable renders.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Selection equality
      </h3>
      <p className="text-muted-foreground">
        <code>onChange</code> fires only when the id-set of the selection
        changes. Same-id new-reference values do not fire (avoids spurious
        re-renders when the host re-derives entity objects upstream). v0.2
        will upgrade to ordered-array equality when drag-to-reorder lands —
        non-breaking.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Keyboard
      </h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>Tab / Shift+Tab — focus trigger and chip-X buttons.</li>
        <li>Enter / Space / ↓ on trigger — open dropdown.</li>
        <li>↑ / ↓ inside search — navigate results (cmdk).</li>
        <li>Enter on highlighted result — toggle selection.</li>
        <li>Esc — close dropdown.</li>
        <li>Backspace on empty search (multi mode) — remove last chip.</li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">What ships in v0.2+</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>Async <code>loadItems(query, page)</code> for paginated remote search.</li>
        <li>Virtualization for &gt;500-item lists.</li>
        <li>&quot;Create new&quot; affordance via <code>onCreate(query)</code>.</li>
        <li>Multi-section grouping via <code>groups</code>.</li>
        <li>Drag-to-reorder chips (multi mode).</li>
        <li>Fuzzy-rank via <code>{`rank: (item, query) => number`}</code>.</li>
        <li>Ordered-array selection equality (non-breaking).</li>
      </ul>
    </div>
  );
}
