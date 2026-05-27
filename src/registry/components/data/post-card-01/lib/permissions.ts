/**
 * Pure permission resolver for post-card-01 v0.2.0.
 *
 * Resolution order (most → least specific) per plan §3:
 *   1. `canPerformAction(action, post)` returning `true | false` — wins everything for that action
 *   2. `permissions[canX]` per-field — `false` denies, `true` allows
 *   3. `viewerMode`-derived defaults from `PERMISSION_DEFAULTS_BY_MODE`
 *   4. Library-baseline default (legacy mode — caller must short-circuit before
 *      calling this resolver; see `defaultPostKebabActions` dual-mode branch)
 *
 * Truth table:
 * | viewerMode  | permissions  | resolved matrix                                    |
 * |-------------|--------------|----------------------------------------------------|
 * | `undefined` | `undefined`  | (resolver NOT called — legacy v0.1 path)           |
 * | `undefined` | `{ ... }`    | viewer baseline + permissions override per-field   |
 * | `"owner"`   | `undefined`  | owner defaults (all owner-side true)               |
 * | `"owner"`   | `{ ... }`    | owner defaults + permissions override per-field    |
 * | `"viewer"`  | `undefined`  | viewer defaults (viewer-side true, owner-side false) |
 * | `"viewer"`  | `{ ... }`    | viewer defaults + permissions override per-field   |
 */

import type {
  Post,
  PostPermissionAction,
  PostPermissions,
  PostViewerMode,
} from "../types";

/**
 * Library-baseline permission matrix by viewer mode. `Required<PostPermissions>`
 * ensures every field is resolved (no `undefined` leaks downstream).
 *
 * `canShare` + `canBookmark` default to `true` in both modes — host-policy gates
 * (the host can deny by setting `permissions={{ canShare: false }}` for visibility-restricted posts).
 */
export const PERMISSION_DEFAULTS_BY_MODE: Record<
  PostViewerMode,
  Required<PostPermissions>
> = {
  owner: {
    canEdit: true,
    canDelete: true,
    canPin: true,
    canChangeVisibility: true,
    canMarkSensitive: true,
    canSeeAnalytics: true,
    canShare: true,
    canBookmark: true,
    canReport: false,
    canBlockAuthor: false,
    canMuteAuthor: false,
  },
  viewer: {
    canEdit: false,
    canDelete: false,
    canPin: false,
    canChangeVisibility: false,
    canMarkSensitive: false,
    canSeeAnalytics: false,
    canShare: true,
    canBookmark: true,
    canReport: true,
    canBlockAuthor: true,
    canMuteAuthor: true,
  },
};

/**
 * Map a `PostPermissionAction` string to its `PostPermissions` matrix key.
 *
 * `"edit"` → `"canEdit"`, `"changeVisibility"` → `"canChangeVisibility"`, etc.
 * Pure, no side effects. Used by `canPerformActionInternal` to look up the
 * matrix value for a given action.
 */
function actionToPermissionKey(
  action: PostPermissionAction,
): keyof PostPermissions {
  return `can${action.charAt(0).toUpperCase()}${action.slice(1)}` as keyof PostPermissions;
}

/**
 * Pure resolver — returns the fully-resolved permission matrix for the
 * rendering pass. Does NOT consult `canPerformAction` (that's evaluated
 * per-action by `canPerformActionInternal`).
 *
 * Caller's contract: only invoke when role-aware mode is active (at least one
 * of `viewerMode` / `permissions` / `canPerformAction` is set). Legacy mode
 * short-circuits in the calling helper before this is reached.
 */
export function resolvePostPermissions(
  viewerMode: PostViewerMode | undefined,
  permissions: PostPermissions | undefined,
): Required<PostPermissions> {
  const base = viewerMode
    ? PERMISSION_DEFAULTS_BY_MODE[viewerMode]
    : PERMISSION_DEFAULTS_BY_MODE.viewer; // viewer baseline when viewerMode undefined but permissions set
  if (!permissions) return { ...base };
  // Skip undefined fields during merge: `permissions={{ canEdit: undefined }}`
  // should fall through to the mode default, not override it with undefined.
  // Required<PostPermissions> contract: every returned field is a definite boolean.
  const result: Required<PostPermissions> = { ...base };
  for (const key of Object.keys(permissions) as (keyof PostPermissions)[]) {
    const value = permissions[key];
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Per-action resolution. Returns `true` to allow the action / `false` to deny.
 *
 * Resolution per plan §3:
 *   1. `canPerformAction(action, post)` returning `true | false` wins
 *   2. Matrix value from `resolvedMatrix` (already includes mode defaults + permissions overrides)
 *
 * `canPerformAction` returning `undefined` falls through to step 2.
 */
export function canPerformActionInternal(
  action: PostPermissionAction,
  post: Post,
  resolvedMatrix: Required<PostPermissions>,
  canPerformAction:
    | ((action: PostPermissionAction, post: Post) => boolean | undefined)
    | undefined,
): boolean {
  if (canPerformAction) {
    const result = canPerformAction(action, post);
    if (result !== undefined) return result;
  }
  return resolvedMatrix[actionToPermissionKey(action)] !== false;
}
