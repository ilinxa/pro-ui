import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FlatFieldValue } from "../types";
import type { RichCardTree } from "../lib/parse";
import type { EditMode } from "../hooks/use-edit-mode";
import { MetaInline } from "./meta-inline";
import { MetaPopover } from "./meta-popover";
import { CardTitleEdit } from "./card-title-edit";
import { CardActionsMenu } from "./card-actions";
import type { EditDispatchers, EditValidators } from "./card";

/**
 * Card header. View mode: chevron + title + meta affordance.
 * Edit mode: title click → inline rename; "..." actions menu visible.
 */
export function CardHeader({
  tree,
  title,
  titleId,
  collapsed,
  canCollapse,
  meta,
  metaPresentation,
  onToggleCollapse,
  onSelect,
  editable,
  editMode,
  setEditMode,
  validators,
  dispatchers,
  tentativeCardId,
  className,
}: {
  tree: RichCardTree;
  title: string | undefined;
  titleId: string;
  collapsed: boolean;
  canCollapse: boolean;
  meta?: Record<string, FlatFieldValue>;
  metaPresentation: "hidden" | "inline" | "popover";
  onToggleCollapse: () => void;
  onSelect: () => void;
  editable: boolean;
  editMode: EditMode | null;
  setEditMode: (m: EditMode | null) => void;
  validators: EditValidators;
  dispatchers: EditDispatchers;
  tentativeCardId: string | null;
  className?: string;
}) {
  const showInlineMeta =
    metaPresentation === "inline" && meta && Object.keys(meta).length > 0;
  const hasMeta = meta && Object.keys(meta).length > 0;
  const isEditingTitle =
    editable &&
    editMode?.kind === "card-title" &&
    editMode.cardId === tree.id;

  // Root card has no parentKey; can't be renamed via card-title edit
  const isRoot = tree.level === 1;
  const canRenameTitle = editable && !isRoot;

  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      onClick={(e) => {
        // Click on header chrome → select; but not when clicking on the chevron
        // (which has its own onClick and stops propagation via the button event)
        if (e.target === e.currentTarget) {
          onSelect();
        }
      }}
    >
      {canCollapse ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          aria-label={collapsed ? "Expand card" : "Collapse card"}
          aria-expanded={!collapsed}
          className="inline-flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronRight
            className={cn(
              "size-3.5 transition-transform duration-150",
              !collapsed && "rotate-90",
            )}
          />
        </button>
      ) : (
        <span aria-hidden="true" className="inline-block size-5 shrink-0" />
      )}

      {isEditingTitle ? (
        <CardTitleEdit
          initialTitle={title ?? ""}
          isTentative={tentativeCardId === tree.id}
          validate={(newKey) => validators.cardRename(tree.id, newKey)}
          onCommit={(newKey) => dispatchers.cardRename(tree.id, newKey)}
          onCancel={() => setEditMode(null)}
          onCancelTentative={() => dispatchers.cardCancelTentative(tree.id)}
        />
      ) : (
        <h3
          id={titleId}
          className={cn(
            "min-w-0 flex-1 truncate text-sm font-semibold tracking-tight",
            canRenameTitle && "cursor-text rounded-sm hover:bg-muted px-1 -mx-1",
          )}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
            if (canRenameTitle) {
              setEditMode({ kind: "card-title", cardId: tree.id });
            }
          }}
        >
          {title ?? (
            <span className="text-muted-foreground italic font-normal">
              Untitled
            </span>
          )}
        </h3>
      )}

      {showInlineMeta && meta ? <MetaInline meta={meta} /> : null}

      {metaPresentation === "popover" && hasMeta && meta ? (
        <MetaPopover meta={meta} />
      ) : null}

      {editable ? (
        <CardActionsMenu
          onRemove={() => dispatchers.cardRemove(tree.id)}
          canRemove={!isRoot}
        />
      ) : null}
    </div>
  );
}
