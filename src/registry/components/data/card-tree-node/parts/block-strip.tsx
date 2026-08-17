"use client";

import { memo, type ReactNode } from "react";
import { cn } from "@/lib/utils";
// F-S1 lock — RELATIVE imports for cross-procomp types. Same-category alias
// imports get the slug name substituted by shadcn's rewriter; relative paths
// bypass that and translate verbatim.
import type { CustomKeyContext, CustomPredefinedKey } from "../../card-tree/types";
import type { NodeBlock } from "../types";
import { HostBlockBoundary } from "./host-block-boundary";

/**
 * Paints the card-tree blocks on a node (FU-2, v0.4.0). Through v0.3 these
 * rendered as nothing at all.
 *
 * Default presentation is a chip per block — the key, then a one-line summary
 * of the payload (`table  2 x 3`, `body  2 items`). A canvas node is a summary
 * surface, so this matches the flat-field strip's density rather than trying
 * to paint a table or a code listing at node zoom.
 *
 * With `renderCustomBlocks`, a host-registered block whose registration
 * supplies `render()` gets painted by the host instead, inside
 * `HostBlockBoundary` — a throwing renderer degrades to its summary chip, it
 * never blanks the canvas. Built-in blocks always use the chip: card-tree owns
 * their presentation and the edit dialog is where consumers see it full-size.
 *
 * Consumers can target a specific block with `[data-block-kind="table"]` or
 * `[data-block-key="body"]`.
 */
function BlockStripImpl({
  blocks,
  cardId,
  registrations,
  renderCustomBlocks = false,
  totalBlocks,
}: {
  blocks: NodeBlock[];
  cardId: string;
  registrations?: readonly CustomPredefinedKey[];
  renderCustomBlocks?: boolean;
  /** Blocks on the card before the display cap; drives the "+N" chip. */
  totalBlocks?: number;
}) {
  if (blocks.length === 0) return null;
  const hidden = Math.max(0, (totalBlocks ?? blocks.length) - blocks.length);

  return (
    <ul
      className="flex flex-wrap gap-1 border-t border-border/60 px-3 py-2"
      aria-label="Blocks"
    >
      {blocks.map((block) => (
        <li
          key={block.key}
          data-block-key={block.key}
          data-block-kind={block.kind}
          className={cn(
            "inline-flex max-w-full items-center gap-1.5 rounded-sm",
            "border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[11px] leading-tight",
          )}
        >
          {renderHostBlock(block, cardId, registrations, renderCustomBlocks) ?? (
            <Chip block={block} />
          )}
        </li>
      ))}
      {hidden > 0 && (
        <li
          data-block-overflow={hidden}
          title={`${hidden} more block${hidden === 1 ? "" : "s"} on this card`}
          className="inline-flex items-center rounded-sm border border-dashed border-border/60 px-1.5 py-0.5 text-[11px] leading-tight text-muted-foreground"
        >
          +{hidden}
        </li>
      )}
    </ul>
  );
}

/** The default presentation: key + one-line payload summary. */
function Chip({ block }: { block: NodeBlock }) {
  return (
    <>
      <span className="shrink-0 font-medium text-foreground/80">{block.key}</span>
      <span className="truncate text-muted-foreground">{block.summary}</span>
    </>
  );
}

/**
 * The host-render path. Returns `null` — meaning "use the chip" — whenever
 * full render is off, the block is a built-in, no registration matches, or the
 * registration has no `render`. A `render()` that throws *synchronously* is
 * caught here; one that throws during its own render is caught by the
 * boundary. Both degrade to the chip.
 */
function renderHostBlock(
  block: NodeBlock,
  cardId: string,
  registrations: readonly CustomPredefinedKey[] | undefined,
  renderCustomBlocks: boolean,
): ReactNode | null {
  if (!renderCustomBlocks || block.kind !== "custom") return null;

  const registration = registrations?.find((r) => r.key === block.key);
  if (!registration?.render) return null;

  const ctx: CustomKeyContext = { cardId, level: 0, isEditing: false };
  let node: ReactNode;
  try {
    node = registration.render(block.value, ctx);
  } catch {
    return <Chip block={block} />;
  }

  return <HostBlockBoundary fallback={<Chip block={block} />}>{node}</HostBlockBoundary>;
}

export const BlockStrip = memo(BlockStripImpl);
