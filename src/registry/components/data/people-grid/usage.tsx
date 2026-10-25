export default function PeopleGridUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>PeopleGrid</code> when you need a section heading +
        responsive grid of person cards (round avatar + name + title) — for
        conference speakers, team / about-us pages, board / committee
        lists, contributors, podcast guests, course instructors, judge
        lineups. Avatar gracefully falls back to initials when{" "}
        <code>image</code> is missing.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Upgrading to 0.3.0</h3>
      <ul className="ms-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Card names are now one heading level below the section (
          <code>h2</code> section → <code>h3</code> cards; 0.2.0 always
          rendered <code>h4</code>). Pass <code>cardHeadingAs=&quot;h4&quot;</code>{" "}
          to keep the old output.
        </li>
        <li>
          The avatar <code>alt</code> now defaults to <code>&quot;&quot;</code>{" "}
          (decorative — the name is the heading right beside it). Set{" "}
          <code>imageAlt</code> per item to restore a text alternative (0.2.0
          used the name).
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Minimal example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { PeopleGrid } from "@/components/people-grid";

<PeopleGrid
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
        <code>{`import { getInitials } from "@/components/people-grid";

getInitials("Dr. Ahmet Yılmaz")    // → "AY"
getInitials("Prof. Dr. Elif Kaya") // → "EK"
getInitials("Madonna")              // → "M"
getInitials("")                     // → "?"

// Locale-aware casing (string shorthand or options object)
getInitials("ilker yılmaz", "tr")   // → "İY"
getInitials("Sayın Ali Veli", { honorifics: ["sayın"] }) // → "AV"
getInitials("", { fallback: "·" })  // → "·"

// Default honorifics skipped: Dr., Prof., Mr., Mrs., Ms., Sr., Jr.
// (a custom list or RegExp replaces them). First grapheme, not first UTF-16 unit.`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Columns × avatar size
      </h3>
      <p className="text-muted-foreground">
        All grids start at <code>grid-cols-1</code> on mobile and scale up
        at sm/md/lg breakpoints based on <code>columns</code>:
      </p>
      <ul className="ms-5 list-disc space-y-1 text-muted-foreground">
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
        <code>{`<PeopleGrid
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

<PeopleGrid
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

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Action + badge slots
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<PeopleGrid
  heading="Ekip"
  locale="tr"
  items={people}
  renderBadge={(p) => (p.verified ? <VerifiedMark /> : null)}
  renderActions={(p) => <Button onClick={() => follow(p.id)}>Takip et</Button>}
/>`}</code>
      </pre>
      <p className="text-muted-foreground">
        Slots sit above the card link, so clicking them never navigates.
        Tab order per card: badge, actions, then the card link. They apply
        to the default card only — <code>renderItem</code> replaces the whole
        card.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Custom renderItem</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<PeopleGrid
  items={speakers}
  renderItem={(person) => (
    <div className="text-center">
      <Avatar src={person.image} />
      <p className="font-semibold">{person.name}</p>
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
      <ul className="ms-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Renders <code>&lt;ul role=&quot;list&quot;&gt;</code>; section{" "}
          <code>aria-labelledby</code> resolves to the heading id (via{" "}
          <code>useId</code>) when heading is supplied.
        </li>
        <li>
          Heading defaults to <code>h2</code> (people grids are top-level
          page sections — Speakers, Team, Contributors); card names default
          to one level below it (<code>cardHeadingAs</code> overrides).
        </li>
        <li>
          No <code>framed</code> prop — people grids are typically
          standalone page sections, not nested cards. Wrap externally if
          you need card chrome.
        </li>
        <li>
          Initials fallback is <code>aria-hidden</code>; the name in the
          adjacent card heading is what screen readers
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
