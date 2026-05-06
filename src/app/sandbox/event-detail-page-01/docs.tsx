import {
  CodeOverview,
  ComponentsUsedList,
  DeveloperGuide,
  DocsContainer,
  InstallBlock,
} from "../_components/docs-blocks";
import { getSandbox } from "../_lib/manifest";

const meta = getSandbox("event-detail-page-01")!;

export default function EventDetailPage01Docs() {
  return (
    <DocsContainer>
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Tier-3 sandbox · {meta.domain}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {meta.title}
        </h1>
        <p className="text-sm text-muted-foreground">{meta.description}</p>
      </div>

      <InstallBlock slugs={meta.componentsUsed} />

      <ComponentsUsedList slugs={meta.componentsUsed} />

      <CodeOverview
        files={[
          {
            path: "page.tsx",
            description: "Server entry — wires the demo + docs into SandboxShell.",
          },
          {
            path: "event-detail-page-01.tsx",
            description: 'The page assembly ("use client") with hero + main column + sidebar.',
          },
          {
            path: "event-fixture.ts",
            description: "Demo event data including the Plate-JSON body.",
          },
          {
            path: "docs.tsx",
            description: "This Code tab content.",
          },
        ]}
      />

      <DeveloperGuide>
        <ul>
          <li>
            <strong>This page is host code, not a registry component.</strong>{" "}
            Tier-3 lives at <code>src/app/sandbox/&lt;slug&gt;/</code> and never
            ships through the <code>@ilinxa</code> registry. Copy the assembly
            file as a starting point and adapt it to your data model.
          </li>
          <li>
            <strong>The hero is inline (~50 lines), not productized.</strong>{" "}
            <code>page-hero-news-01</code> is gradient-only — no image-background
            slot, no dark-overlay slot, no bottom alignment. Building a sealed{" "}
            <code>page-hero-event-01</code> is deferred until a second consumer
            appears.
          </li>
          <li>
            <strong>Status badge composes the helper kernel without the card.</strong>{" "}
            <code>getEventStatus(event, now)</code> +{" "}
            <code>EVENT_STATUS_CONFIG</code> are exported from{" "}
            <code>event-card-01</code> as pure JS — render the badge anywhere
            (hero, table cells, calendar dots) without needing the full card.
          </li>
          <li>
            <strong>
              All time-derived components receive an explicit <code>now</code>{" "}
              prop.
            </strong>{" "}
            Fixed at <code>2026-06-01T12:00:00Z</code> here so SSR + every CI
            run see the same status. In production, hosts pass{" "}
            <code>now=&#123;new Date()&#125;</code> or a clock from a context.
          </li>
          <li>
            <strong>
              <code>ArticleBodyViewer</code> is server-component compatible.
            </strong>{" "}
            Built on <code>platejs/static</code> — no client JS for the read
            view. The <code>className=&quot;prose-lg&quot;</code> override here
            replaces the default <code>prose-sm</code> via tailwind-merge.
          </li>
          <li>
            <strong>Sticky sidebar uses <code>top-20</code>.</strong> The site
            header is sticky at <code>top-0</code> with <code>h-14</code> (56px);
            the sandbox tab strip stacks below it; <code>top-20</code> (80px)
            keeps the sidebar clear of both with breathing room.
          </li>
          <li>
            <strong>
              The Requirements card uses <code>info-list-01</code> with a
              className override.
            </strong>{" "}
            Passing <code>className=&quot;bg-muted/50 border-transparent&quot;</code>{" "}
            swaps the default <code>bg-card</code> chrome via tailwind-merge —
            no new variant needed.
          </li>
          <li>
            <strong>Registration card is independent of event-card-01&apos;s state machine.</strong>{" "}
            <code>registration-card-01</code> has its own 4-state machine
            (open / lastSpots / full / closed). The host owns event-timing
            context and passes <code>closed</code> when registration ends —
            here we set{" "}
            <code>closed=&#123;status === &quot;expired&quot; || status === &quot;ongoing&quot;&#125;</code>.
          </li>
        </ul>
      </DeveloperGuide>
    </DocsContainer>
  );
}
