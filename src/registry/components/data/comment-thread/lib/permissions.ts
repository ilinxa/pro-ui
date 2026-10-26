import type {
  Comment,
  CommentThreadCurrentUser,
  ResolvedCommentPermissions,
} from "../types";

/**
 * A comment's permissions: its own `permissions` over the thread defaults (each DEFINED key
 * wins). Defaults: delete / edit = the viewer wrote it; reply = signed in; react = true;
 * report = the viewer did not write it; pin / hide = false.
 */
export function resolvePermissions(
  comment: Comment,
  currentUser: CommentThreadCurrentUser | undefined,
): ResolvedCommentPermissions {
  const isOwn = !!currentUser && currentUser.id === comment.author.id;
  const own = comment.permissions;
  return {
    canEdit: own?.canEdit ?? isOwn,
    canDelete: own?.canDelete ?? isOwn,
    canPin: own?.canPin ?? false,
    canHide: own?.canHide ?? false,
    canReply: own?.canReply ?? !!currentUser,
    canReact: own?.canReact ?? true,
    canReport: own?.canReport ?? !isOwn,
  };
}
