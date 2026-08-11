"use client";

import type { MouseEvent } from "react";
import type { TaskItem } from "../../task-card/types";
import { useTaskTreeRenderContext } from "../hooks/use-task-tree-context";
import { TaskTreeChevron } from "./task-tree-chevron";
import { TaskTreeStatusIndicator } from "./task-tree-status-indicator";
import { TaskTreeCheckbox } from "./task-tree-checkbox";
import { TaskTreeName } from "./task-tree-name";
import { TaskTreeDescription } from "./task-tree-description";
import { TaskTreePersonLabel } from "./task-tree-person-label";
import { cn } from "@/lib/utils";

export interface TaskTreeRowContentProps {
  item: TaskItem;
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
 * the render context. Interactive callbacks pass through from `<TaskTreeRow>`
 * (lands in C6) — keeping the content itself props-only makes it testable
 * without a full DnD host.
 */
export function TaskTreeRowContent({
  item,
  level,
  isSelected,
  isCollapsed,
  dimmed,
  canToggleActive = true,
  onToggleCollapse,
  onToggleActive,
  className,
}: TaskTreeRowContentProps) {
  const {
    statusIndicator,
    statusOptionMap,
    indentSize,
    renderName,
    renderDescription,
    renderPerson,
    renderStatusIndicator,
  } = useTaskTreeRenderContext();

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
        <TaskTreeStatusIndicator variant="strip" statusOption={statusOption} />
      )}

      <div className="flex min-w-0 items-center gap-1.5">
        <TaskTreeChevron
          collapsed={isCollapsed}
          hasChildren={hasChildren}
          onToggle={onToggleCollapse}
        />

        {renderStatusIndicator
          ? renderStatusIndicator({ ...fieldArgs, statusOption })
          : statusIndicator === "dot" && (
              <TaskTreeStatusIndicator
                variant="dot"
                statusOption={statusOption}
              />
            )}

        <TaskTreeCheckbox
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
          <TaskTreeName name={item.name} active={item.active} />
        )}

        {item.targetPerson &&
          (renderPerson ? (
            <span className="shrink-0">{renderPerson(fieldArgs)}</span>
          ) : (
            <TaskTreePersonLabel person={item.targetPerson} />
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
            <TaskTreeDescription description={item.description} />
          </div>
        ))}
    </div>
  );
}
