/**
 * Default story kebab items builder. Dual-mode helper mirroring
 * post-card v0.3.0's `defaultPostKebabActions`:
 *
 *   - **Legacy mode (v0.1 compat):** when `viewerMode` / `permissions` /
 *     `canPerformAction` are ALL undefined, returns only the host's
 *     `extraKebabActions` (0.7.0; `[]` without them). The kebab renders whenever
 *     the final list has a visible item.
 *
 *   - **Role-aware mode (v0.2.0):** when ANY of the three role-aware args is
 *     set, the helper calls `resolveStoryPermissions` +
 *     `canPerformStoryActionInternal` to produce role-appropriate items per
 *     the resolution order in `lib/permissions.ts`.
 *
 * Owner mode: Save to highlights / Delete story / Share to feed / Copy link.
 * Viewer mode: Copy link / Mute author / Block author / Report (destructive
 * at end).
 * Moderator section: only when `canModerate` resolves true + `moderatorActions`
 * supplied. First moderator item carries `separatorBefore: true`.
 *
 * `kebabActions` full-takeover bypasses this entirely (handled in story-viewer.tsx
 * before this is called).
 */

import type { ReactNode } from "react";
import type {
  Story,
  StoryItem,
  StoryItemTarget,
  StoryKebabMenuItem,
  StoryPermissionAction,
  StoryViewerLabels,
  StoryViewerMode,
  StoryViewerPermissions,
} from "../types";
import {
  canPerformStoryActionInternal,
  resolveStoryPermissions,
} from "./permissions";

export interface DefaultStoryKebabHandlers {
  /** Owner-side: save the current item to highlights. Receives `{ story, item }`. */
  onSaveToHighlights?: (target: StoryItemTarget) => void;
  /** Owner-side: delete the current item. Receives `{ story, item }`. */
  onDeleteStory?: (target: StoryItemTarget) => void;
  /** Owner-side: share the current item to the feed. Receives `{ story, item }`. */
  onShareToFeed?: (target: StoryItemTarget) => void;
  /** Viewer-side: report the current item. Receives `{ story, item }`. */
  onReport?: (target: StoryItemTarget) => void;
  /** Viewer-side: block author. */
  onBlockAuthor?: (authorId: string) => void;
  /** Viewer-side: mute author. */
  onMuteAuthor?: (authorId: string) => void;
  /** Common: copy a link to the current item. Receives `{ story, item }`. */
  onCopyLink?: (target: StoryItemTarget) => void;
  /** Whether the story is currently saved to highlights (toggles label). */
  isSavedToHighlights?: boolean;
}

export interface BuildStoryKebabActionsOptions {
  story: Story;
  item: StoryItem;
  handlers: DefaultStoryKebabHandlers;
  labels: Partial<
    Pick<
      Required<StoryViewerLabels>,
      | "saveToHighlights"
      | "unsaveFromHighlights"
      | "deleteStory"
      | "shareToFeed"
      | "report"
      | "blockAuthor"
      | "muteAuthor"
      | "copyLink"
    >
  >;
  viewerMode?: StoryViewerMode;
  permissions?: StoryViewerPermissions;
  canPerformAction?: (
    action: StoryPermissionAction,
    story: Story,
    item: StoryItem,
  ) => boolean | undefined;
  /** Optional moderator section supplier (additive — does NOT replace defaults). */
  moderatorActions?: (story: Story, item: StoryItem) => StoryKebabMenuItem[];
  /**
   * 0.7.0 - items appended after the defaults and the moderator section; not permission-gated.
   * They are the whole menu when no role-aware arg is set (the kebab has no defaults then).
   */
  extraActions?: (story: Story, item: StoryItem) => StoryKebabMenuItem[];
  /** Optional icons for each canonical action (host can override). */
  icons?: Partial<Record<
    | "saveToHighlights"
    | "deleteStory"
    | "shareToFeed"
    | "copyLink"
    | "muteAuthor"
    | "blockAuthor"
    | "report",
    ReactNode
  >>;
}

/** 0.7.0 - drops `hidden` items (every kebab list goes through this). */
export function visibleKebabItems(items: StoryKebabMenuItem[]): StoryKebabMenuItem[] {
  return items.some((i) => i.hidden) ? items.filter((i) => !i.hidden) : items;
}

export function defaultStoryKebabActions(
  opts: BuildStoryKebabActionsOptions,
): StoryKebabMenuItem[] {
  const extras = visibleKebabItems(opts.extraActions?.(opts.story, opts.item) ?? []);
  const roleAwareMode =
    opts.viewerMode !== undefined ||
    opts.permissions !== undefined ||
    opts.canPerformAction !== undefined;

  // Legacy mode — no default items; only the host's extras (0.7.0).
  if (!roleAwareMode) return extras;

  const matrix = resolveStoryPermissions(opts.viewerMode, opts.permissions);
  const canDo = (action: StoryPermissionAction) =>
    canPerformStoryActionInternal(action, opts.story, opts.item, matrix, opts.canPerformAction);

  const items: StoryKebabMenuItem[] = [];

  // ─── Owner-side items ─────────────────────────────────────────────────
  if (canDo("saveToHighlights") && opts.handlers.onSaveToHighlights) {
    items.push({
      label: opts.handlers.isSavedToHighlights
        ? (opts.labels.unsaveFromHighlights ?? "Remove from highlights")
        : (opts.labels.saveToHighlights ?? "Save to highlights"),
      icon: opts.icons?.saveToHighlights,
      onClick: () => opts.handlers.onSaveToHighlights!({ story: opts.story, item: opts.item }),
    });
  }
  if (canDo("shareToFeed") && opts.handlers.onShareToFeed) {
    items.push({
      label: opts.labels.shareToFeed ?? "Share to feed",
      icon: opts.icons?.shareToFeed,
      onClick: () => opts.handlers.onShareToFeed!({ story: opts.story, item: opts.item }),
    });
  }

  // ─── Common items ─────────────────────────────────────────────────────
  if (opts.handlers.onCopyLink) {
    items.push({
      label: opts.labels.copyLink ?? "Copy link",
      icon: opts.icons?.copyLink,
      onClick: () => opts.handlers.onCopyLink!({ story: opts.story, item: opts.item }),
    });
  }

  // ─── Moderator section (additive; gated by canModerate + moderatorActions) ──
  if (canDo("moderate") && opts.moderatorActions) {
    const modItems = visibleKebabItems(opts.moderatorActions(opts.story, opts.item));
    if (modItems.length > 0) {
      // First moderator item carries `separatorBefore: true` (visual section break).
      items.push({ ...modItems[0], separatorBefore: true });
      for (let i = 1; i < modItems.length; i++) {
        items.push(modItems[i]);
      }
    }
  }

  // ─── Viewer-side items (destructive at the bottom) ───────────────────
  if (canDo("muteAuthor") && opts.handlers.onMuteAuthor) {
    items.push({
      label: opts.labels.muteAuthor ?? "Mute author",
      icon: opts.icons?.muteAuthor,
      onClick: () => opts.handlers.onMuteAuthor!(opts.story.userId),
    });
  }
  if (canDo("blockAuthor") && opts.handlers.onBlockAuthor) {
    items.push({
      label: opts.labels.blockAuthor ?? "Block author",
      icon: opts.icons?.blockAuthor,
      destructive: true,
      onClick: () => opts.handlers.onBlockAuthor!(opts.story.userId),
    });
  }
  if (canDo("report") && opts.handlers.onReport) {
    items.push({
      label: opts.labels.report ?? "Report",
      icon: opts.icons?.report,
      destructive: true,
      onClick: () => opts.handlers.onReport!({ story: opts.story, item: opts.item }),
    });
  }

  // ─── Owner destructive (Delete — always last) ─────────────────────────
  if (canDo("deleteStory") && opts.handlers.onDeleteStory) {
    items.push({
      label: opts.labels.deleteStory ?? "Delete story",
      icon: opts.icons?.deleteStory,
      destructive: true,
      onClick: () => opts.handlers.onDeleteStory!({ story: opts.story, item: opts.item }),
    });
  }

  return [...items, ...extras];
}
