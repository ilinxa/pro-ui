export default function AuthorCard01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        A small &quot;person identity&quot; block — avatar, name, role, optional
        bio — to surface authorship context next to a piece of content. Reach
        for it on news article sidebars, blog post bylines, doc page authors,
        team listings, comment headers, contributor cards.
      </p>
      <p className="mt-2 text-muted-foreground">
        It&apos;s a single card, not a list. Sized for sidebars (works at ~280px
        and up). Optionally clickable as a whole — pass <code>href</code> + your
        router&apos;s link component to make the entire surface navigate.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { AuthorCard01 } from "@/registry/components/marketing/author-card-01"

export function Example() {
  return (
    <AuthorCard01
      name="Maya Chen"
      role="Senior Editor"
      bio="Specializes in sustainable urbanism and environmental journalism."
      imageSrc="/authors/maya.jpg"
      imageAlt="Maya Chen"
    />
  )
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Clickable card</h3>
      <p className="text-muted-foreground">
        Pass <code>href</code> to make the whole surface navigate. By default
        the root renders as a native <code>&lt;a&gt;</code>; pass{" "}
        <code>linkComponent</code> for router-aware links.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import Link from "next/link"
import { AuthorCard01 } from "@/registry/components/marketing/author-card-01"

<AuthorCard01
  name="Daniel Park"
  role="Product Designer"
  bio="Currently designing onboarding flows."
  imageSrc="/team/daniel.jpg"
  href="/team/daniel-park"
  linkComponent={Link}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">No image — fallback icon</h3>
      <p className="text-muted-foreground">
        When <code>imageSrc</code> is omitted, a tinted circle with a Lucide{" "}
        <code>User</code> icon renders. Override the icon via{" "}
        <code>fallbackIcon</code> for non-person bylines (e.g. <code>Users</code>{" "}
        for collectives).
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { Users } from "lucide-react"

<AuthorCard01
  name="The Editorial Team"
  role="Collective"
  bio="Reporting from across the newsroom."
  fallbackIcon={Users}
  tone="muted"
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">i18n</h3>
      <p className="text-muted-foreground">
        All visible chrome strings live in <code>labels</code>; English defaults
        ship in <code>AUTHOR_CARD_DEFAULT_LABELS</code>. The card text content
        (<code>name</code>, <code>role</code>, <code>bio</code>) is consumer
        data — pass localized strings directly.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<AuthorCard01
  name="Aylin Demir"
  role="Kıdemli Editör"
  bio="Sürdürülebilir şehircilik ve çevre konularında uzmanlaşmış."
  labels={{ heading: "Yazar Hakkında" }}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          The component is exported as <code>React.memo</code>. For
          memoization to hold, pass stable references for{" "}
          <code>linkComponent</code> / <code>fallbackIcon</code> (don&apos;t
          create them inline on every render).
        </li>
        <li>
          The avatar image uses <code>loading=&quot;lazy&quot;</code>. Broken{" "}
          <code>src</code> shows the browser&apos;s default broken-image icon —
          ensure URLs are valid (consumer responsibility).
        </li>
        <li>
          When the card is clickable, the accessible name is the author&apos;s
          name (via <code>aria-labelledby</code>). The heading text reads as a
          decorative label.
        </li>
        <li>
          Use <code>headingAs</code> to fit the card under your page&apos;s
          landmark structure — most sidebars want <code>h3</code> (the default).
        </li>
      </ul>
    </div>
  );
}
