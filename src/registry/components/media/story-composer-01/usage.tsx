export default function StoryComposer01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        <code>StoryComposer01</code> is the creation surface for Instagram-style
        stories — camera-first capture, on-canvas editing, one-tap publish. It
        composes with <code>StoryRail01</code> (discovery) and{" "}
        <code>StoryViewer01</code> (consumption) to form the full story system.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { StoryComposer01 } from "@/components/story-composer-01"

export function Example() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)}>Create story</button>
      <StoryComposer01
        isOpen={open}
        onClose={() => setOpen(false)}
        uploadUrl="https://api.example.com/stories"
        onPublished={(story) => {
          console.log("uploaded:", story)
          setOpen(false)
        }}
      />
    </>
  )
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Status</h3>
      <p className="text-muted-foreground">
        v0.1.0 alpha — currently at C2 (types + labels). Capture surface, Konva
        editor, edit tools, and publish flow land in C3–C13 per the procomp
        plan.
      </p>
    </div>
  );
}
