export default function PeopleGrid01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>PeopleGrid01</code> when you need a section heading +
        responsive grid of person cards (round avatar + name + title) — for
        conference speakers, team / about-us pages, board / committee
        lists, contributors, podcast guests, course instructors, judge
        lineups. Avatar gracefully falls back to initials when{" "}
        <code>image</code> is missing.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Minimal example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { PeopleGrid01 } from "@/components/people-grid-01";

<PeopleGrid01
  heading="Konuşmacılar"
  items={event.speakers.map((s, i) => ({
    id: String(i),
    name: s.name,
    title: s.title,
    image: s.image,
  }))}
  columns={3}
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Public helper kernel — <code>getInitials</code>
      </h3>
      <p className="text-muted-foreground">
        The initials helper is exported as a pure function. Reuse it in
        mention chips, comment headers, contact rows, presence badges:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { getInitials } from "@/components/people-grid-01";

getInitials("Dr. Ahmet Yılmaz")    // → "AY"
getInitials("Prof. Dr. Elif Kaya") // → "EK"
getInitials("Madonna")              // → "M"
getInitials("")                     // → "?"

// Common honorifics skipped: Dr., Prof., Mr., Mrs., Ms., Sr., Jr.`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Columns × avatar size
      </h3>
      <p className="text-muted-foreground">
        All grids start at <code>grid-cols-1</code> on mobile and scale up
        at sm/md/lg breakpoints based on <code>columns</code>:
      </p>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>columns=2</code> — 1 col mobile, 2 col sm:+
        </li>
        <li>
          <code>columns=3</code> — 1 col mobile, 2 col sm:, 3 col md:+
        </li>
        <li>
          <code>columns=4</code> — 1 col mobile, 2 col sm:, 4 col md:+
        </li>
        <li>
          <code>columns=5</code> — 1 col mobile, 2 col sm:, 3 col md:, 5
          col lg:+
        </li>
      </ul>
      <p className="text-muted-foreground mt-2">
        For <code>columns: 4</code> or <code>5</code> in narrow containers,
        pair with <code>avatarSize: &quot;sm&quot;</code> or{" "}
        <code>&quot;md&quot;</code> — large avatars (
        <code>w-24 h-24</code>) at 4-5 columns need ~600px+ to render
        without crowding. Defaults (<code>columns: 3</code>,{" "}
        <code>avatarSize: &quot;lg&quot;</code>) match kasder and work
        everywhere down to mobile.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Avatar fallback</h3>
      <p className="text-muted-foreground">
        Items without <code>image</code> render an initials circle with{" "}
        <code>bg-primary/10 text-primary font-semibold</code>. The
        component handles common honorifics (Dr./Prof./Mr./etc.) by
        skipping them when computing initials:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<PeopleGrid01
  heading="Board of Directors"
  items={[
    { id: "1", name: "Dr. Sara Ahmed",      title: "Chair" },       // → "SA"
    { id: "2", name: "Prof. James O'Neill", title: "Vice-Chair" },   // → "JO"
    { id: "3", name: "Madonna",             title: "Director" },    // → "M"
  ]}
  // no image fields — all render with initials
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Polymorphic <code>linkComponent</code>
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import NextLink from "next/link";

<PeopleGrid01
  heading="Our Team"
  items={team.map((m) => ({ ...m, href: \`/team/\${m.slug}\` }))}
  linkComponent={NextLink}
  columns={4}
/>`}</code>
      </pre>
      <p className="text-muted-foreground">
        When <code>href</code> is supplied, the entire card becomes
        clickable via the overlay-link pattern. The link&apos;s accessible
        name = the person&apos;s name (via <code>aria-labelledby</code>) —
        screen reader announces just the name, not the flattened
        title/image-alt.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Custom renderItem</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<PeopleGrid01
  items={speakers}
  renderItem={(person) => (
    <div className="text-center">
      <Avatar src={person.image} />
      <h4 className="font-semibold">{person.name}</h4>
      <p className="text-sm text-muted-foreground">{person.title}</p>
      <SocialLinks links={person.social} />
    </div>
  )}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Empty state</h3>
      <p className="text-muted-foreground">
        Empty <code>items</code> → renders <code>emptyState</code> if
        provided, else <code>&lt;p role=&quot;status&quot;&gt;</code>{" "}
        with <code>labels.emptyText</code> (default &quot;No people to
        display.&quot;).
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Renders <code>&lt;ul role=&quot;list&quot;&gt;</code>; section{" "}
          <code>aria-labelledby</code> resolves to the heading id (via{" "}
          <code>useId</code>) when heading is supplied.
        </li>
        <li>
          Heading defaults to <code>h2</code> (people grids are top-level
          page sections — Speakers, Team, Contributors). Differs from
          sidebar info cards which default to <code>h3</code>.
        </li>
        <li>
          No <code>framed</code> prop — people grids are typically
          standalone page sections, not nested cards. Wrap externally if
          you need card chrome.
        </li>
        <li>
          Initials fallback is <code>aria-hidden</code>; the name in the
          adjacent <code>&lt;h4&gt;</code> is what screen readers
          announce.
        </li>
        <li>
          Hover-color transition on the name is gated via{" "}
          <code>motion-safe:</code> — reduced-motion users see static text.
        </li>
      </ul>
    </div>
  );
}
