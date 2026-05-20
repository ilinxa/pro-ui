"use client";

import type { MouseEvent } from "react";
import type { TodoItem } from "../../todo-rich-card/types";
import { useTodoTreeRenderContext } from "../hooks/use-todo-tree-context";
import { TodoTreeChevron } from "./todo-tree-chevron";
import { TodoTreeStatusIndicator } from "./todo-tree-status-indicator";
import { TodoTreeCheckbox } from "./todo-tree-checkbox";
import { TodoTreeName } from "./todo-tree-name";
import { TodoTreeDescription } from "./todo-tree-description";
import { TodoTreePersonLabel } from "./todo-tree-person-label";
import { cn } from "@/lib/utils";

export interface TodoTreeRowContentProps {
  item: TodoItem;
  level: number;
  isSelected: boolean;
  isCollapsed: boolean;
  /**
   * Visual dimming flag from the filter-fade path. The container also fades;
   * the inner controls stay full opacity so checkbox / chevron remain
   * affordant. Set by the host based on visibleItems[i].dimmed.
   */
  dimmed?: boolean;
  /** Read-only when both the row-level + item-level toggle gates deny. */
  canToggleActive?: boolean;
  onToggleCollapse?: (event: MouseEvent<HTMLButtonElement>) => void;
  onToggleActive?: (nextActive: boolean) => void;
  className?: string;
}

/**
 * Default `renderRow` paint. Composes the leaf primitives with the consumer's
 * slot overrides (name / description / person / statusIndicator) pulled from
 * the render context. Interactive callbacks pass through from `<TodoTreeRow>`
 * (lands in C6) — keeping the content itself props-only makes it testable
 * without a full DnD host.
 */
export function TodoTreeRowContent({
  item,
  level,
  isSelected,
  isCollapsed,
  dimmed,
  canToggleActive = true,
  onToggleCollapse,
  onToggleActive,
  className,
}: TodoTreeRowContentProps) {
  const {
    statusIndicator,
    statusOptionMap,
    indentSize,
    renderName,
    renderDescription,
    renderPerson,
    renderStatusIndicator,
  } = useTodoTreeRenderContext();

  const statusOption = statusOptionMap.get(item.status);
  const hasChildren = !!item.children && item.children.length > 0;
  const fieldArgs = { item, level } as const;
  const stripIndicator = statusIndicator === "strip";

  return (
    <div
      data-level={level}
      data-selected={isSelected || undefined}
      data-collapsed={isCollapsed || undefined}
      data-dimmed={dimmed || undefined}
      data-active={item.active}
      className={cn(
        "relative flex flex-col justify-center gap-0.5 py-1.5 pr-2",
        dimmed && "opacity-50",
        className,
      )}
      style={{
        // Indent + 8px gutter for chevron alignment.
        paddingInlineStart:
          (stripIndicator ? 12 : 8) + level * indentSize,
      }}
    >
      {stripIndicator && (
        <TodoTreeStatusIndicator variant="strip" statusOption={statusOption} />
      )}

      <div className="flex min-w-0 items-center gap-1.5">
        <TodoTreeChevron
          collapsed={isCollapsed}
          hasChildren={hasChildren}
          onToggle={onToggleCollapse}
        />

        {renderStatusIndicator
          ? renderStatusIndicator({ ...fieldArgs, statusOption })
          : statusIndicator === "dot" && (
              <TodoTreeStatusIndicator
                variant="dot"
                statusOption={statusOption}
              />
            )}

        <TodoTreeCheckbox
          checked={item.active}
          disabled={!canToggleActive}
          onChange={onToggleActive}
          ariaLabel={item.active ? `Mark ${item.name} inactive` : `Mark ${item.name} active`}
        />

        {renderName ? (
          <span className="min-w-0 flex-1 truncate">
            {renderName(fieldArgs)}
          </span>
        ) : (
          <TodoTreeName name={item.name} active={item.active} />
        )}

        {item.targetPerson &&
          (renderPerson ? (
            <span className="shrink-0">{renderPerson(fieldArgs)}</span>
          ) : (
            <TodoTreePersonLabel person={item.targetPerson} />
          ))}
      </div>

      {item.description &&
        (renderDescription ? (
          <div
            className="min-w-0"
            style={{
              paddingInlineStart: 16,
            }}
          >
            {renderDescription(fieldArgs)}
          </div>
        ) : (
          <div
            className="min-w-0"
            style={{
              paddingInlineStart: 16,
            }}
          >
            <TodoTreeDescription description={item.description} />
          </div>
        ))}
    </div>
  );
}
