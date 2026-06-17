export default function Blackboard01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>Blackboard01</code> when a team needs a shared, low-ceremony{" "}
        <em>wall</em> — a dark chalkboard you drop into a dashboard or panel where members jot
        short handwritten notes. Each writer picks an ink color, chalk width, and handwriting
        font; notes auto-save, the stream lazy-loads older notes on scroll-up, hovering reveals
        the author, and a handwritten red number marks unread notes. It is{" "}
        <strong>not</strong> a threaded comment list (<code>comment-thread-01</code>), a chat
        panel, or a freeform whiteboard.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { Blackboard01 } from "@/components/blackboard-01"

export function TeamBoard({ notes, me, team }) {
  return (
    <div className="h-[520px]">
      <Blackboard01
        notes={notes}                 // controlled, oldest → newest
        currentUser={me}
        members={team}                 // drives the @-mention picker
        canWrite
        onPostNote={(draft) => api.post(draft)}      // auto-saves; no Save button
        onLoadOlder={(beforeId, n) => api.older(beforeId, n)}  // 10 on scroll-up
        hasMoreOlder
        onPinNote={(id) => api.pin(id)}
        onMention={(noteId, ids) => api.notify(noteId, ids)}
        lastSeenNoteId={me.lastSeen}
        onSeen={(id) => api.markSeen(id)}
        editableBackground
      />
    </div>
  )
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Lighter (à la carte)</h3>
      <p className="text-muted-foreground">
        It ships as a compound. Compose the flat parts directly and drop what you don&apos;t
        need — omitting <code>BlackboardComposer</code> yields a read-only wall and never pulls
        the writing / mention code:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import {
  BlackboardRoot, BlackboardSurface, BlackboardNoteStream,
} from "@/components/blackboard-01"

<BlackboardRoot notes={notes} currentUser={me}>
  <BlackboardSurface>
    <BlackboardNoteStream />
  </BlackboardSurface>
</BlackboardRoot>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <strong>Portable by design.</strong> The library does no network I/O — persistence,
          real-time transport, and notifications are yours via callbacks. Push inbound notes
          with the imperative handle&apos;s <code>appendNote()</code>.
        </li>
        <li>
          <strong>Pin</strong> is controlled via <code>pinnedNoteIds</code> (or the uncontrolled{" "}
          <code>note.pinned</code> flag); pinned notes lift into a sticky row.
        </li>
        <li>
          <strong>Fonts</strong> are bundled (Kalam / Caveat / Patrick Hand / Shadows Into Light)
          and overridable via the <code>fonts</code> prop. &ldquo;Chalk width&rdquo; uses real
          font-weight where the face supports it, a faux stroke otherwise.
        </li>
        <li>
          The board is intentionally dark in both light and dark app themes (chalkboard
          identity). Type <code>@</code> in the composer to mention a teammate.
        </li>
      </ul>
    </div>
  );
}
