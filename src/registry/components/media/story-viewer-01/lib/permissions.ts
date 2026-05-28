/**
 * Pure permission resolver for story-viewer-01 v0.2.0.
 *
 * Mirrors post-card-01 v0.3.0's `lib/permissions.ts` shape verbatim per
 * Q-V10 lock. Resolution order (most → least specific):
 *   1. `canPerformAction(action, story, item)` returning `true | false` — wins
 *   2. `permissions[canX]` per-field — `false` denies, `true` allows
 *   3. `viewerMode`-derived defaults from `PERMISSION_DEFAULTS_BY_MODE`
 *   4. Library-baseline default (legacy v0.1 mode — caller short-circuits before
 *      calling this resolver; see `lib/kebab.ts` dual-mode branch)
 *
 * Truth table (same shape as post-card-01):
 * | viewerMode  | permissions  | resolved matrix                                    |
 * |-------------|--------------|----------------------------------------------------|
 * | `undefined` | `undefined`  | (resolver NOT called — legacy v0.1 path)           |
 * | `undefined` | `{ ... }`    | viewer baseline + permissions override per-field   |
 * | `"owner"`   | `undefined`  | owner defaults                                     |
 * | `"owner"`   | `{ ... }`    | owner defaults + permissions override per-field    |
 * | `"viewer"`  | `undefined`  | viewer defaults                                    |
 * | `"viewer"`  | `{ ... }`    | viewer defaults + permissions override per-field   |
 */

import type {
  Story,
  StoryItem,
  StoryPermissionAction,
  StoryViewerMode,
  StoryViewerPermissions,
} from "../types";

/**
 * Library-baseline permission matrix by viewer mode. `Required<StoryViewerPermissions>`
 * ensures every field is resolved (no `undefined` leaks downstream).
 *
 * `canShare` defaults to `true` in BOTH modes (owners share their own; viewers
 * share other people's). `canModerate` defaults to `false` in BOTH — orthogonal
 * capability, never auto-derived from `viewerMode` (per Q-V11 lock — host opts
 * in explicitly via `permissions.canModerate: true` or `canPerformAction`).
 */
export const PERMISSION_DEFAULTS_BY_MODE: Record<
  StoryViewerMode,
  Required<StoryViewerPermissions>
> = {
  owner: {
    // owner-side affordances
    canSaveToHighlights: true,
    canDeleteStory: true,
    canShareToFeed: true,
    canSeeViewers: true,
    // viewer-side off for owners (they don't react to their own story)
    canReact: false,
    canReply: false,
    canShare: true,
    canDM: false,
    canReport: false,
    canBlockAuthor: false,
    canMuteAuthor: false,
    // moderation is orthogonal to viewerMode — never auto-derived
    canModerate: false,
  },
  viewer: {
    // owner-side off for viewers
    canSaveToHighlights: false,
    canDeleteStory: false,
    canShareToFeed: false,
    canSeeViewers: false,
    // viewer-side full
    canReact: true,
    canReply: true,
    canShare: true,
    canDM: true,
    canReport: true,
    canBlockAuthor: true,
    canMuteAuthor: true,
    canModerate: false,
  },
};

/**
 * Special-case map for action discriminator keys that don't auto-capitalize
 * cleanly. `dm` → `canDM` (DM as an acronym; not `canDm`). All other actions
 * use the generic `can${cap(action)}` pattern.
 */
const SPECIAL_KEYS: Partial<Record<StoryPermissionAction, keyof StoryViewerPermissions>> = {
  dm: "canDM",
};

/**
 * Map a `StoryPermissionAction` string to its `StoryViewerPermissions` matrix key.
 *
 * `"saveToHighlights"` → `"canSaveToHighlights"`, `"react"` → `"canReact"`, etc.
 * `"dm"` → `"canDM"` via SPECIAL_KEYS (preserves acronym casing).
 * Pure, no side effects.
 */
function actionToPermissionKey(
  action: StoryPermissionAction,
): keyof StoryViewerPermissions {
  if (action in SPECIAL_KEYS) return SPECIAL_KEYS[action]!;
  return `can${action.charAt(0).toUpperCase()}${action.slice(1)}` as keyof StoryViewerPermissions;
}

/**
 * Pure resolver — returns the fully-resolved permission matrix for the
 * rendering pass. Does NOT consult `canPerformAction` (that's evaluated
 * per-action by `canPerformStoryActionInternal`).
 *
 * Caller's contract: only invoke when role-aware mode is active (at least one
 * of `viewerMode` / `permissions` / `canPerformAction` is set). Legacy mode
 * short-circuits in the calling helper before this is reached.
 */
export function resolveStoryPermissions(
  viewerMode: StoryViewerMode | undefined,
  permissions: StoryViewerPermissions | undefined,
): Required<StoryViewerPermissions> {
  const base = viewerMode
    ? PERMISSION_DEFAULTS_BY_MODE[viewerMode]
    : PERMISSION_DEFAULTS_BY_MODE.viewer; // viewer baseline when viewerMode undefined but permissions set
  if (!permissions) return { ...base };
  // Skip undefined fields during merge: `permissions={{ canReact: undefined }}`
  // should fall through to the mode default, not override it with undefined.
  const result: Required<StoryViewerPermissions> = { ...base };
  for (const key of Object.keys(permissions) as (keyof StoryViewerPermissions)[]) {
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
 * Resolution:
 *   1. `canPerformAction(action, story, item)` returning `true | false` wins
 *   2. Matrix value from `resolvedMatrix` (already includes mode defaults +
 *      permissions overrides)
 *
 * `canPerformAction` returning `undefined` falls through to step 2.
 */
export function canPerformStoryActionInternal(
  action: StoryPermissionAction,
  story: Story,
  item: StoryItem,
  resolvedMatrix: Required<StoryViewerPermissions>,
  canPerformAction:
    | ((action: StoryPermissionAction, story: Story, item: StoryItem) => boolean | undefined)
    | undefined,
): boolean {
  if (canPerformAction) {
    const result = canPerformAction(action, story, item);
    if (result !== undefined) return result;
  }
  return resolvedMatrix[actionToPermissionKey(action)] !== false;
}
