import type {
  Comment,
  CommentActionHelpers,
  CommentMenuItem,
  ResolvedCommentThreadLabels,
} from "../types";

export interface BuildMenuItemsArgs {
  comment: Comment;
  helpers: CommentActionHelpers;
  labels: ResolvedCommentThreadLabels;
  /** `onReportComment` is wired. */
  hasReport: boolean;
  /** `onEditComment` is wired AND the moderation add-on is installed. */
  canEditAtAll: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
  commentActions?: (comment: Comment, helpers: CommentActionHelpers) => CommentMenuItem[];
  extraActions?: (comment: Comment, helpers: CommentActionHelpers) => CommentMenuItem[];
}

/**
 * The kebab's items: `commentActions` takes over entirely; otherwise the permitted defaults
 * (Edit, Report, Delete) followed by `extraActions`. Items of a pending comment are off.
 */
export function buildMenuItems(a: BuildMenuItemsArgs): CommentMenuItem[] {
  if (a.commentActions) return a.commentActions(a.comment, a.helpers);
  const { permissions, isPending } = a.helpers;
  const items: CommentMenuItem[] = [];
  if (a.canEditAtAll && permissions.canEdit && !isPending) {
    items.push({ label: a.labels.edit, onClick: a.onEdit });
  }
  if (a.hasReport && permissions.canReport) {
    items.push({ label: a.labels.report, onClick: a.onReport, disabled: isPending });
  }
  if (permissions.canDelete) {
    items.push({
      label: a.labels.delete,
      destructive: true,
      onClick: a.onDelete,
      disabled: isPending,
    });
  }
  if (a.extraActions) items.push(...a.extraActions(a.comment, a.helpers));
  return items;
}
