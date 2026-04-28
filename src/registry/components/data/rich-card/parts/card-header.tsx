import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FlatFieldValue, MetaRenderer, SearchMatch } from "../types";
import type { RichCardTree } from "../lib/parse";
import type { EditMode } from "../hooks/use-edit-mode";
import { rangesFor } from "../lib/search";
import { ChevronRight } from "lucide-react";
import { MetaInline } from "./meta-inline";
import { MetaPopover } from "./meta-popover";
import { CardTitleEdit } from "./card-title-edit";
import { CardActionsMenu } from "./card-actions";
import { DragHandle } from "./drag-handle";
import { MatchHighlight } from "./match-highlight";
import type { EditDispatchers, EditValidators } from "./card";

export function CardHeader({
  tree,
  title,
  titleId,
  collapsed,
  canCollapse,
  meta,
  metaPresentation,
  metaRenderers,
  onToggleCollapse,
  onSelect,
  editable,
  canEdit,
  canRemove,
  canDuplicate,
  canDrag,
  isLocked,
  isRoot,
  allowRootRemoval,
  hasChildren,
  defaultDeletePolicy,
  editMode,
  setEditMode,
  validators,
  dispatchers,
  tentativeCardId,
  dragHandleListeners,
  dragHandleAttributes,
  searchMatches,
  searchQuery,
  searchCaseSensitive,
  className,
}: {
  tree: RichCardTree;
  title: string | undefined;
  titleId: string;
  collapsed: boolean;
  canCollapse: boolean;
  meta?: Record<string, FlatFieldValue>;
  metaPresentation: "hidden" | "inline" | "popover";
  metaRenderers?: Record<string, MetaRenderer>;
  onToggleCollapse: () => void;
  onSelect: (event: { shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean }) => void;
  editable: boolean;
  canEdit: boolean;
  canRemove: boolean;
  canDuplicate: boolean;
  canDrag: boolean;
  isLocked: boolean;
  isRoot: boolean;
  allowRootRemoval: boolean;
  hasChildren: boolean;
  defaultDeletePolicy: "cascade" | "promote";
  editMode: EditMode | null;
  setEditMode: (m: EditMode | null) => void;
  validators: EditValidators;
  dispatchers: EditDispatchers;
  tentativeCardId: string | null;
  dragHandleListeners?: Record<string, (event: unknown) => void>;
  dragHandleAttributes?: Record<string, unknown>;
  searchMatches: readonly SearchMatch[];
  searchQuery: string;
  searchCaseSensitive: boolean;
  className?: string;
}) {
  const showInlineMeta =
    metaPresentation === "inline" && meta && Object.keys(meta).length > 0;
  const hasMeta = meta && Object.keys(meta).length > 0;
  const isEditingTitle =
    editable &&
    canEdit &&
    editMode?.kind === "card-title" &&
    editMode.cardId === tree.id;

  const canRenameTitle = editable && canEdit && !isRoot;
  const titleRanges = title
    ? rangesFor(searchMatches, title, tree.id, "title", undefined, searchQuery, searchCaseSensitive)
    : [];

  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onSelect({ shiftKey: e.shiftKey, metaKey: e.metaKey, ctrlKey: e.ctrlKey });
        }
      }}
    >
      {/* Drag handle (edit mode only) */}
      {editable && canDrag ? (
        <DragHandle
          listeners={dragHandleListeners}
          attributes={dragHandleAttributes}
          disabled={!canDrag}
        />
      ) : null}

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

      {isLocked ? (
        <Lock
          className="size-3 shrink-0 text-muted-foreground/70"
          aria-label="Locked"
        />
      ) : null}

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
            onSelect({ shiftKey: e.shiftKey, metaKey: e.metaKey, ctrlKey: e.ctrlKey });
            if (canRenameTitle) {
              setEditMode({ kind: "card-title", cardId: tree.id });
            }
          }}
        >
          {title ? (
            <MatchHighlight text={title} ranges={titleRanges} />
          ) : (
            <span className="text-muted-foreground italic font-normal">
              Untitled
            </span>
          )}
        </h3>
      )}

      {showInlineMeta && meta ? (
        <MetaInline meta={meta} metaRenderers={metaRenderers} />
      ) : null}

      {metaPresentation === "popover" && hasMeta && meta ? (
        <MetaPopover
          meta={meta}
          cardId={tree.id}
          editable={editable && canEdit}
          metaRenderers={metaRenderers}
          dispatchers={dispatchers}
          validators={validators}
        />
      ) : null}

      {editable ? (
        <CardActionsMenu
          onRemoveCascade={() => dispatchers.cardRemove(tree.id, "cascade")}
          onRemovePromote={
            defaultDeletePolicy === "promote" || hasChildren
              ? () => dispatchers.cardRemove(tree.id, "promote")
              : undefined
          }
          onDuplicate={
            !isRoot ? () => dispatchers.cardDuplicate(tree.id) : undefined
          }
          canRemove={canRemove}
          canDuplicate={canDuplicate}
          isRoot={isRoot}
          allowRootRemoval={allowRootRemoval}
          hasChildren={hasChildren}
        />
      ) : null}
    </div>
  );
}
