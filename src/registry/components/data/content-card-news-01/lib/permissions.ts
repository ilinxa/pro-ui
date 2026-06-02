import type {
  ContentCardItem,
  ContentCardPermissions,
  ContentCardPermissionAction,
  NewsViewerMode,
} from "../types";

/**
 * Editor-mode baseline — all editor-side `true`, host-policy gates `true`,
 * reader-side `false`. `canModerate` is orthogonal and defaults `false` in
 * both modes (moderator capability must be opted in explicitly by the host).
 */
const EDITOR_DEFAULTS: Required<ContentCardPermissions> = {
  // editor-side (12)
  canEdit: true,
  canDelete: true,
  canPublish: true,
  canUnpublish: true,
  canSchedule: true,
  canFeature: true,
  canPin: true,
  canChangeVisibility: true,
  canChangeCategory: true,
  canMarkSensitive: true,
  canSeeAnalytics: true,
  canPushToTop: true,
  // host-policy gates (2) — editors get both by default
  canShare: true,
  canBookmark: true,
  // reader-side (4) — editors don't see reader-destructive items by default
  canReport: false,
  canBlockAuthor: false,
  canMuteAuthor: false,
  canUnfollowTopic: false,
  // moderator (1) — orthogonal; must be opted in
  canModerate: false,
};

/**
 * Reader-mode baseline — all editor-side `false`, host-policy gates `true`
 * (readers see Share / Bookmark unless host denies), reader-side `true`.
 */
const READER_DEFAULTS: Required<ContentCardPermissions> = {
  // editor-side (12)
  canEdit: false,
  canDelete: false,
  canPublish: false,
  canUnpublish: false,
  canSchedule: false,
  canFeature: false,
  canPin: false,
  canChangeVisibility: false,
  canChangeCategory: false,
  canMarkSensitive: false,
  canSeeAnalytics: false,
  canPushToTop: false,
  // host-policy gates (2)
  canShare: true,
  canBookmark: true,
  // reader-side (4)
  canReport: true,
  canBlockAuthor: true,
  canMuteAuthor: true,
  canUnfollowTopic: true,
  // moderator (1)
  canModerate: false,
};

/**
 * Resolution defaults per viewer mode. Exported for test fixtures + the
 * default kebab helper.
 */
export const PERMISSION_DEFAULTS_BY_MODE = {
  editor: EDITOR_DEFAULTS,
  viewer: READER_DEFAULTS,
} as const;

/**
 * Resolve the effective permissions matrix from `viewerMode` + optional
 * `permissions` overrides.
 *
 * **Resolution order (most → least specific):**
 *  1. `canPerformAction(action, item)` — handled per-call by
 *     {@link canPerformActionInternal}; not part of this resolver.
 *  2. `permissions[canX]` per-field — explicit overrides win.
 *  3. `viewerMode`-derived defaults — `"editor"` → {@link EDITOR_DEFAULTS},
 *     `"viewer"` → {@link READER_DEFAULTS}.
 *  4. Legacy mode — when ALL three role-aware args (`viewerMode`,
 *     `permissions`, `canPerformAction`) are undefined, the kebab itself
 *     isn't rendered; this resolver is not called.
 *
 * **Edge case (Q-P27):** when `viewerMode === undefined` but `permissions`
 * IS set, the matrix promotes to role-aware mode with reader baseline +
 * the explicit overrides. Lets hosts grant editor-side capabilities without
 * declaring a viewer mode (e.g. `permissions={{ canEdit: true, canDelete: true }}`
 * on a power-user account).
 *
 * @param viewerMode  The host-supplied mode (`"editor"` / `"viewer"` / `undefined`)
 * @param permissions Optional per-action overrides; explicit fields win
 * @returns A fully-resolved `Required<ContentCardPermissions>` matrix
 */
export function resolveContentCardPermissions(
  viewerMode: NewsViewerMode | undefined,
  permissions: ContentCardPermissions | undefined,
): Required<ContentCardPermissions> {
  // Pick the baseline: explicit mode wins; absent mode falls to reader baseline
  // (least-privileged default — explicit grants required to elevate).
  const baseline: Required<ContentCardPermissions> =
    viewerMode === "editor" ? EDITOR_DEFAULTS : READER_DEFAULTS;

  // No overrides → return baseline directly. Cheap.
  if (!permissions) {
    return baseline;
  }

  // Merge — explicit fields in `permissions` win over the baseline.
  return {
    canEdit: permissions.canEdit ?? baseline.canEdit,
    canDelete: permissions.canDelete ?? baseline.canDelete,
    canPublish: permissions.canPublish ?? baseline.canPublish,
    canUnpublish: permissions.canUnpublish ?? baseline.canUnpublish,
    canSchedule: permissions.canSchedule ?? baseline.canSchedule,
    canFeature: permissions.canFeature ?? baseline.canFeature,
    canPin: permissions.canPin ?? baseline.canPin,
    canChangeVisibility:
      permissions.canChangeVisibility ?? baseline.canChangeVisibility,
    canChangeCategory:
      permissions.canChangeCategory ?? baseline.canChangeCategory,
    canMarkSensitive:
      permissions.canMarkSensitive ?? baseline.canMarkSensitive,
    canSeeAnalytics: permissions.canSeeAnalytics ?? baseline.canSeeAnalytics,
    canPushToTop: permissions.canPushToTop ?? baseline.canPushToTop,
    canShare: permissions.canShare ?? baseline.canShare,
    canBookmark: permissions.canBookmark ?? baseline.canBookmark,
    canReport: permissions.canReport ?? baseline.canReport,
    canBlockAuthor: permissions.canBlockAuthor ?? baseline.canBlockAuthor,
    canMuteAuthor: permissions.canMuteAuthor ?? baseline.canMuteAuthor,
    canUnfollowTopic:
      permissions.canUnfollowTopic ?? baseline.canUnfollowTopic,
    canModerate: permissions.canModerate ?? baseline.canModerate,
  };
}

/**
 * Map `ContentCardPermissionAction` discriminator → corresponding
 * `ContentCardPermissions` field name. Pure lookup.
 */
const ACTION_TO_FIELD: Record<
  ContentCardPermissionAction,
  keyof ContentCardPermissions
> = {
  edit: "canEdit",
  delete: "canDelete",
  publish: "canPublish",
  unpublish: "canUnpublish",
  schedule: "canSchedule",
  feature: "canFeature",
  pin: "canPin",
  changeVisibility: "canChangeVisibility",
  changeCategory: "canChangeCategory",
  markSensitive: "canMarkSensitive",
  seeAnalytics: "canSeeAnalytics",
  pushToTop: "canPushToTop",
  share: "canShare",
  bookmark: "canBookmark",
  report: "canReport",
  blockAuthor: "canBlockAuthor",
  muteAuthor: "canMuteAuthor",
  unfollowTopic: "canUnfollowTopic",
  moderate: "canModerate",
};

/**
 * Internal helper — resolves a single action against the full resolution
 * chain (predicate → matrix → mode → legacy).
 *
 * **Use case:** the default kebab helper calls this once per candidate item
 * to decide whether to include it. The pure {@link resolveContentCardPermissions}
 * matrix can be memoized per `(viewerMode, permissions)` identity tuple
 * inside the host; this helper layers the predicate on top.
 *
 * @param action          The action discriminator (e.g. `"edit"`).
 * @param item            The article being rendered.
 * @param resolved        The pre-resolved matrix (cache outside).
 * @param canPerformAction Optional predicate; wins over the matrix.
 * @returns `true` if the action is allowed; `false` otherwise.
 */
export function canPerformActionInternal(
  action: ContentCardPermissionAction,
  item: ContentCardItem,
  resolved: Required<ContentCardPermissions>,
  canPerformAction?: (
    action: ContentCardPermissionAction,
    item: ContentCardItem,
  ) => boolean | undefined,
): boolean {
  // Layer 1 — predicate wins; `undefined` falls through.
  if (canPerformAction) {
    const predicateResult = canPerformAction(action, item);
    if (predicateResult === true) return true;
    if (predicateResult === false) return false;
  }
  // Layer 2/3 — the matrix carries the merge of explicit overrides + mode defaults.
  return resolved[ACTION_TO_FIELD[action]];
}
