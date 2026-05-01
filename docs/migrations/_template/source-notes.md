# {{Title}} — migration source notes

> Intake doc for [`docs/migrations/{{slug}}/`](./). You fill this. The companion `analysis.md` is filled by the assistant after reading both this and the contents of `original/`.
>
> See [`docs/migrations/README.md`](../README.md) for the full pipeline.

## Source

- **App:** <!-- e.g. socialmedia_adv_app v1, gconsole, node_base v0 -->
- **Path in source:** <!-- e.g. frontend/src/components/PostCard.tsx -->
- **Used in:** <!-- list pages / contexts where this is rendered today -->
- **Related code:** <!-- other files this collaborates with — adapters, hooks, types, parent components -->

## Role

<!-- What does this component do for the user in the source app? 1–2 paragraphs.
     Focus on user value, not code structure (the assistant will read the code). -->

## What I like (preserve)

<!-- Specific visual / UX / behavior decisions worth keeping. Be concrete:
     • "the avatar → author → timestamp left-to-right rhythm"
     • "the hover-reveal action menu"
     • "the exact teal accent on the comment count"
     • "the 200ms slide-in on mount"
     Generic answers ("looks clean", "modern feel") block a useful analysis. -->

-

## What bothers me (rewrite)

<!-- Structural debt, hardcoded values, prop gaps, perf issues, a11y gaps.
     Examples:
     • "data is hardcoded — should be a prop"
     • "no loading state"
     • "menu items aren't keyboard-navigable"
     • "re-renders on every parent update" -->

-

## Constraints / non-goals

<!-- Explicit boundaries — what this migration is NOT.
     Examples:
     • "do not turn this into a feed"
     • "single-card only — no list mode"
     • "stay framework-agnostic — no next/image" -->

-

## Screenshots / links

<!-- Paste images, design files (Figma URLs OK), screen recordings, anything visual. -->
