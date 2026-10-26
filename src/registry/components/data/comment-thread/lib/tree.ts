import type { Comment } from "../types";

/** Is a comment with this id anywhere in the tree? */
export function containsId(tree: Comment[], id: string): boolean {
  for (const c of tree) {
    if (c.id === id) return true;
    if (c.replies && c.replies.length > 0 && containsId(c.replies, id)) return true;
  }
  return false;
}

/** The comment with this id, wherever it sits in the tree. */
export function findComment(tree: Comment[], id: string): Comment | undefined {
  for (const c of tree) {
    if (c.id === id) return c;
    if (c.replies && c.replies.length > 0) {
      const hit = findComment(c.replies, id);
      if (hit) return hit;
    }
  }
  return undefined;
}

/** Does any comment in the tree carry this client id? */
export function hasClientId(tree: Comment[], clientId: string): boolean {
  for (const c of tree) {
    if (c.clientId === clientId) return true;
    if (c.replies && c.replies.length > 0 && hasClientId(c.replies, clientId)) return true;
  }
  return false;
}

/** `true` for a comment that renders normally (no `state`, or `"visible"`). */
export function isVisibleState(comment: Comment): boolean {
  return comment.state === undefined || comment.state === "visible";
}

/** Does the tree hold a comment whose state is not `"visible"`? */
export function hasNonVisible(tree: Comment[]): boolean {
  for (const c of tree) {
    if (!isVisibleState(c)) return true;
    if (c.replies && c.replies.length > 0 && hasNonVisible(c.replies)) return true;
  }
  return false;
}
