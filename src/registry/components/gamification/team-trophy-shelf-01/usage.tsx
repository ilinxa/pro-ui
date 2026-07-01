export default function TeamTrophyShelf01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>TeamTrophyShelf01</code> when a team board needs a durable
        gallery of <strong>this team&apos;s earned milestone badges</strong> — the
        artifacts of progress, alongside honest locked slots for what&apos;s ahead.
        It complements the progress bar (the live rate) with recognition + shared
        pride. Badges belong to the <strong>team, not individuals</strong>, and the
        shelf renders only on the team board — never a public or inter-team surface,
        never a ranking.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Data</h3>
      <p className="text-muted-foreground">
        <code>awardedAt</code> is the single discriminator: present → earned (drives
        the awarded date + the diff-based reveal); absent → a locked slot.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`interface Badge {
  id: string
  label: string
  awardedAt?: string   // ISO 8601; undefined → not yet earned (locked)
  milestoneId?: string // the milestone that earned it (optional link)
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { TeamTrophyShelf01 } from "@/components/team-trophy-shelf-01"

<TeamTrophyShelf01
  team={{ id: team.id, name: team.name }}
  badges={badges}              // earned + not-yet-earned slots
  showLocked                    // show the journey, not just the wins
  onEvent={track}               // { type: "badges.viewed", teamId, badgeId? }
  onBadgeOpen={(b) => openMilestone(b.milestoneId)}
/>`}</code>
      </pre>
      <p className="text-muted-foreground">
        When the host flips a badge&apos;s <code>awardedAt</code> from{" "}
        <code>undefined</code> to a timestamp, that badge plays a brief (&lt; 1s),
        skippable, non-blocking reveal in place — no toast, no modal, no blocked
        input.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">The bare token + lighter builds</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { TeamMilestoneBadge } from "@/components/team-trophy-shelf-01"

// Inline next to a milestone — no shelf chrome, no award chunk.
<TeamMilestoneBadge badge={badge} size="sm" />`}</code>
      </pre>
      <p className="text-muted-foreground">
        It ships as a shadcn-style compound: <code>TeamTrophyShelfRoot</code> +{" "}
        <code>TeamTrophyShelfGrid</code> / <code>TeamTrophyShelfHeader</code> /{" "}
        <code>TeamTrophyShelfEmpty</code> + the Tier-C <code>TeamMilestoneBadge</code>.
        The award burst (<code>BadgeAwardOverlay</code>) is <code>React.lazy</code>,
        so the bare-token path and <code>animateAward=&#123;false&#125;</code> never
        pull its chunk.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <strong>D-16 (celebration ownership):</strong> if you also route badge
          events to a <code>team-feedback-loop-01</code> overlay, set{" "}
          <code>animateAward=&#123;false&#125;</code> here so the moment
          isn&apos;t celebrated twice. Neither component triggers the other.
        </li>
        <li>
          <strong>Always visible + honest:</strong> <code>showLocked</code>{" "}
          (default true) renders the journey ahead; empty renders an encouraging
          state, not a dead panel.
        </li>
        <li>
          <strong>SSR-safe:</strong> no badge animates on load; the reveal only
          plays after a controlled <code>badges</code> update. Respects{" "}
          <code>prefers-reduced-motion</code>.
        </li>
        <li>
          <strong>Portable + team-scoped:</strong> no <code>next/*</code>, no
          per-member or inter-team affordance; only the shadcn <code>tooltip</code>
          / <code>badge</code> / <code>separator</code> primitives + lucide glyphs.
        </li>
      </ul>
    </div>
  );
}
