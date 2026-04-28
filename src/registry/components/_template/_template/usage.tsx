export default function TemplateUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Describe when to reach for <code>Template</code> and what problem it
        solves. Replace this paragraph with real guidance.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { Template } from "@/registry/components/<category>/_template"

export function Example() {
  return <Template title="Hello" description="World" />
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>Replace this list with real implementation notes.</li>
        <li>Document props that aren&apos;t obvious from the type signature.</li>
      </ul>
    </div>
  );
}
