/**
 * Default story kebab items builder. Dual-mode helper mirroring
 * post-card-01 v0.3.0's `defaultPostKebabActions`:
 *
 *   - **Legacy mode (v0.1 compat):** when `viewerMode` / `permissions` /
 *     `canPerformAction` are ALL undefined, returns []. Kebab is not rendered
 *     in legacy mode (v0.1 story viewer had no kebab).
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
 * `kebabActions` full-takeover bypasses this entirely (handled in story-viewer-01.tsx
 * before this is called).
 */

import type { ReactNode } from "react";
import type {
  Story,
  StoryItem,
  StoryKebabMenuItem,
  StoryPermissionAction,
  StoryViewer01Labels,
  StoryViewerMode,
  StoryViewerPermissions,
} from "../types";
import {
  canPerformStoryActionInternal,
  resolveStoryPermissions,
} from "./permissions";

export interface DefaultStoryKebabHandlers {
  /** Owner-side: save story to highlights. */
  onSaveToHighlights?: (storyId: string) => void;
  /** Owner-side: delete story. */
  onDeleteStory?: (storyId: string) => void;
  /** Owner-side: share to feed. */
  onShareToFeed?: (storyId: string) => void;
  /** Viewer-side: report. */
  onReport?: (storyId: string) => void;
  /** Viewer-side: block author. */
  onBlockAuthor?: (authorId: string) => void;
  /** Viewer-side: mute author. */
  onMuteAuthor?: (authorId: string) => void;
  /** Common: copy link to the story. */
  onCopyLink?: (storyId: string) => void;
  /** Whether the story is currently saved to highlights (toggles label). */
  isSavedToHighlights?: boolean;
}

export interface BuildStoryKebabActionsOptions {
  story: Story;
  item: StoryItem;
  handlers: DefaultStoryKebabHandlers;
  labels: Partial<
    Pick<
      Required<StoryViewer01Labels>,
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

export function defaultStoryKebabActions(
  opts: BuildStoryKebabActionsOptions,
): StoryKebabMenuItem[] {
  const roleAwareMode =
    opts.viewerMode !== undefined ||
    opts.permissions !== undefined ||
    opts.canPerformAction !== undefined;

  // Legacy mode — no kebab in v0.1. Return empty.
  if (!roleAwareMode) return [];

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
      onClick: () => opts.handlers.onSaveToHighlights!(opts.story.id),
    });
  }
  if (canDo("shareToFeed") && opts.handlers.onShareToFeed) {
    items.push({
      label: opts.labels.shareToFeed ?? "Share to feed",
      icon: opts.icons?.shareToFeed,
      onClick: () => opts.handlers.onShareToFeed!(opts.story.id),
    });
  }

  // ─── Common items ─────────────────────────────────────────────────────
  if (opts.handlers.onCopyLink) {
    items.push({
      label: opts.labels.copyLink ?? "Copy link",
      icon: opts.icons?.copyLink,
      onClick: () => opts.handlers.onCopyLink!(opts.story.id),
    });
  }

  // ─── Moderator section (additive; gated by canModerate + moderatorActions) ──
  if (canDo("moderate") && opts.moderatorActions) {
    const modItems = opts.moderatorActions(opts.story, opts.item);
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
      onClick: () => opts.handlers.onReport!(opts.story.id),
    });
  }

  // ─── Owner destructive (Delete — always last) ─────────────────────────
  if (canDo("deleteStory") && opts.handlers.onDeleteStory) {
    items.push({
      label: opts.labels.deleteStory ?? "Delete story",
      icon: opts.icons?.deleteStory,
      destructive: true,
      onClick: () => opts.handlers.onDeleteStory!(opts.story.id),
    });
  }

  return items;
}
