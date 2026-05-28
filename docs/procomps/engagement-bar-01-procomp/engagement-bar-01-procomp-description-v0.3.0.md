# `engagement-bar-01` v0.3.0 — Description Addendum (Stage 1)

> **Stage:** 1 of 3 · **Status:** ✅ Signed off 2026-05-28 — Q-P1=(b), Q-P2=(c), Q-P3=(a)
> **Slug:** `engagement-bar-01` (unchanged) · **Target version:** `0.3.0`
> **Release model:** **additive expansion** — 1 new action kind, 1 new slot, 3 new delta variants, 3 new state fields, 1 new reducer action, 1 new handle method, ~4 new labels. **Zero modifications to existing API surface.** Every v0.2.x consumer keeps working unchanged.
> **Upstream driver:** [`docs/consumer_order/ilinxa-proui-improvement-spec.md`](../../consumer_order/ilinxa-proui-improvement-spec.md) — `social-moduls-python` backend team request after consuming v0.2.1. Two of four asks (ILX-1 HIGH + ILX-2 MEDIUM) land in this procomp's v0.3.0. ILX-3 (post-card-01) + ILX-4 (comment-thread-01) get their own per-procomp description docs (queued).
>
> **Scope.** Add multi-kind reactions (Facebook / LinkedIn style: ❤️ 👍 😂 😢 etc., one per user per content item) as a sibling to the existing binary `like` action. Add a parallel `reactionsPreview` slot. Existing `like` action untouched — consumers pick `like` OR `reaction` per-post.

---

## 1. Problem (delta)

`engagement-bar-01` v0.2.x ships a binary heart only (`kind: "like"` with `liked?: boolean` + `count: number` — see [`types.ts:9-24`](../../../src/registry/components/data/engagement-bar-01/types.ts#L9-L24)). The `social-moduls-python` backend has a fully built + tested **multi-kind reaction model** (one reaction per user per content, choose from `{ love, laugh, wow, sad, angry, ... }`, with per-kind tallies + total + viewer's current reaction). The current UI surface cannot express it. Their only workaround is `kind: "custom"` × N buttons, which loses both the picker UX and the aggregate count.

This is also a generally-useful feature beyond that one consumer: any product wanting FB/LinkedIn-style reactions hits the same gap.

### Why this is v0.3.0 (minor), not v0.2.x (patch)

Public-API addition (new union arm in `EngagementAction`, new prop, new delta variants, new state, new handle method) = minor bump per semver + per the project's existing convention (see v0.2.0 ship which was also additive-only). **GATE 3 required** per the readiness-review rule — public-API touch on a minor bump.

### Why not just generalize `like` into `reaction`

Tempting (`like` becomes a degenerate `reaction` with `kinds=[{ key: "like", icon: Heart }]`). But that's a v1.0 breaking change — every existing consumer's `kind: "like"` matcher breaks, every existing `EngagementDelta { kind: "like-changed" }` reducer breaks. Sibling-kind path is additive and zero-churn. Documented constraint: a post uses EITHER `like` OR `reaction`, not both. The constraint stays in docs; not enforced at the type level.

---

## 2. In scope / Out of scope

### 2.1 In scope

1. **New `EngagementAction` variant** — `kind: "reaction"` per ILX-1.
2. **New `EngagementBar01Props.reactionsPreview?: ReactNode` slot** — parallel to `likersPreview`, per ILX-2.
3. **3 new `EngagementDelta` variants** — `reaction-changed` + `reactor-added` + `reactor-removed` (parallel to the existing `like-changed` + `liker-added` + `liker-removed` triple).
4. **3 new `EngagementState` fields** — `reactionCounts` (nullable), `reactionTotalCount` (nullable), `viewerReaction` (nullable).
5. **1 new `EngagementLocalAction` variant** — `{ kind: "reaction-select"; reactionKind: string | null }`.
6. **1 new `EngagementBar01Handle` method** — `triggerReaction: (kind: string | null) => void`. Plus 1 new read: `getCurrentReaction: () => string | null` (parity with `getCurrentState`).
7. **4 new `EngagementBarLabels` keys** — `react` / `removeReaction` / `openReactionsPanel` / `reactionPickerLabel`.
8. **One new picker part** — `parts/reaction-picker.tsx` (horizontal row of kind buttons, opens on tap-when-no-reaction or long-press; closes on selection or outside-click).
9. **One new action part** — `parts/reaction-action.tsx` (the action-row button itself; renders viewer's current kind icon + total count; manages picker open state).
10. **Demo coverage** — extend `demo.tsx` with a "Reactions" tab showing a post with the `reaction` kind wired (FB-style 5 kinds).

### 2.2 Out of scope (deliberately)

- **Reactors-list panel.** ILX-1 specifies `onCountClick` for opening a reactors panel inline — fine, but the actual panel UI is host-owned (via the new `reactionsPreview` slot). Library ships the trigger, not the panel.
- **Built-in default kind set.** Library does not ship `love`/`laugh`/`wow`/`sad`/`angry` icons or labels. Host supplies the kind catalog. (Resolution depends on Q-P1 — see §5.)
- **Reaction picker animation.** v0.3 ships a fade-in only. FB's bouncy hover-burst is out of scope; can be added by host via CSS or via a slot in a later minor.
- **Coexistence enforcement.** Library does not detect "host passed both `like` AND `reaction` actions for the same content" — that's a host bug. Documented but not type-enforced.
- **Generalizing `like` into `reaction`.** No v1.0 breaking change. `like` stays unchanged.
- **`PostCard01` ripple.** Covered in `post-card-01-procomp-description-v0.3.0.md` (queued separately). That ripple adds `Post.reactionCounts` + `Post.viewerReaction` + `onReact` handler + `reactions` branch in `defaultPostEngagementActions`.

---

## 3. Target consumers

- **`social-moduls-python` (Django + Next.js)** — primary driver. Backend reaction model ready; UI gap closes here.
- **Any host wanting FB / LinkedIn-style reactions** — generic; not coupled to one consumer.
- **`post-card-01`** — picks up `reaction` kind via its own v0.3.0 ripple (separate doc).
- **`comment-thread-01`** — future v0.3+ candidate (reactions on comments). Not blocked by this ship.

---

## 4. Rough API sketch

### 4.1 New `EngagementAction` variant (post-lock shape)

```ts
export interface EngagementReactionKind {
  /** Reaction code — stable identifier matching backend payloads (e.g. "love", "laugh"). */
  key: string;
  /** Icon node — host-supplied (lucide / emoji / image). Library does not ship icons. */
  icon: ReactNode;
  /** Localized human label — used in picker tooltip + aria-label. */
  label: string;
  /** Current tally for this kind. Pre-summed by host. */
  count: number;
  /** Optional tint (any CSS color) applied when this is the viewer's current reaction. */
  color?: string;
}

| {
    kind: "reaction";
    /** Ordered kind catalog — single source of truth (no parallel counts/availableKinds maps). */
    kinds: EngagementReactionKind[];
    /** Pre-summed total across all kinds. Drives the action's count label. */
    totalCount: number;
    /** Viewer's currently-selected kind key (must match one of kinds[].key), or null. */
    viewerReaction?: string | null;
    /** Fires when viewer picks a kind, or null to clear. */
    onSelect?: (kind: string | null) => void;
    /** Split tap-target on the count label (mirrors like.onCountClick — opens reactors panel inline). */
    onCountClick?: () => void;
    /** Q-P2 lock: re-tap when viewerReaction is set fires onSelect(null). Default true. */
    clearOnTap?: boolean;
    align?: EngagementActionAlign;
  }
```

**Q-P3 lock implication:** `actions` arrays may freely contain BOTH `kind: "like"` AND `kind: "reaction"` entries. Library renders them in array order; viewer can interact with each independently. Hybrid UIs are blessed.

### 4.2 New `EngagementDelta` variants

```ts
| { kind: "reaction-changed"; counts: Record<string, number>; totalCount: number; viewerReaction?: string | null }
| { kind: "reactor-added"; user: EngagementLikeUser; reactionKind: string }
| { kind: "reactor-removed"; userId: string; reactionKind: string }
```

### 4.3 New `EngagementState` fields

```ts
interface EngagementState {
  // existing
  liked: boolean;
  likeCount: number;
  commentCount: number;
  shareCount: number | null;
  viewCount: number | null;
  bookmarked: boolean;
  // new (all null when no reaction action is present on the post)
  reactionCounts: Record<string, number> | null;
  reactionTotalCount: number | null;
  viewerReaction: string | null;
}
```

### 4.4 New `EngagementBar01Handle` methods

```ts
triggerReaction: (kind: string | null) => void;
getCurrentReaction: () => string | null;
```

### 4.5 New `EngagementBar01Props` slot

```ts
reactionsPreview?: ReactNode;   // parallel to likersPreview; unconditional when provided
```

---

## 5. Decision points (Q-Ps — LOCKED 2026-05-28)

> **Lock summary:** Q-P1=(b) single `kinds` array · Q-P2=(c) configurable `clearOnTap?: boolean = true` · Q-P3=(a) allow `like` + `reaction` to coexist freely (most-dynamic interpretation; hybrid UIs blessed; no enforcement).

### Q-P1 — How does the host supply kind icons + labels? **LOCK: (b)**

**Problem.** The `reaction` variant's `counts: Record<string, number>` uses opaque string keys (`"love"`, `"laugh"`, `"wow"`). The library has no icons for these. It needs a way for the host to map kind → icon + label.

**Options:**

- **(a)** Separate `kindIcons: Record<string, ReactNode>` + `kindLabels?: Record<string, string>` props on the action.
  - Pros: minimal type churn; can grow `kindLabels` independently.
  - Cons: 3 sources of truth that can drift (`counts` keys / `availableKinds` order / `kindIcons` map).

- **(b) [Recommended]** Replace `counts` + `availableKinds` + spec's separate icon source with a single `kinds: Array<{ key: string; icon: ReactNode; label: string; count: number; color?: string }>` field. `totalCount` + `viewerReaction` stay separate.
  - Pros: single source of truth; impossible to drift keys/icons/labels; order is array order.
  - Cons: backend payload has to be shaped at the consumer boundary (host maps DB rows → kinds array). Acceptable.

- **(c)** Library ships a default 5-kind set with built-in lucide icons + English labels; host overrides via the (a)-style `kindIcons` / `kindLabels`.
  - Pros: nicest DX for the FB-default case.
  - Cons: opinionated; iconography in a library = forever. The project explicitly avoids this elsewhere (e.g. `PostVisibility` has no default icons).

**Recommendation: (b).** Highest data integrity; matches the project's "host owns iconography" convention; one shape to learn.

### Q-P2 — Tap-with-current-reaction: clear vs. keep? **LOCK: (c)**

**Problem.** When the viewer already has a reaction set and taps the action again, what happens?

**Options:**

- **(a)** **Tap clears** — `onSelect(null)`. Matches Twitter heart UX. Spec's proposed default.
- **(b) [Recommended for parity with FB Reactions]** **Tap keeps** — re-tapping does nothing visible; viewer must long-press to open picker (which can include a "Remove" option), OR open picker by tap with no current reaction set. This is the actual Facebook behavior.
- **(c)** **Configurable** — `clearOnTap?: boolean` (default true). Host picks.

**Recommendation: (c) with default `true`.** Defaulting to (a) preserves the spec's default; the prop lets hosts that want FB semantics flip the bit without us picking sides. Library stays neutral.

### Q-P3 — Does `reaction` co-exist with `like` on the same post, or is it one-or-the-other? **LOCK: (a)**

**Problem.** A post's engagement bar could in principle have both a `kind: "like"` action AND a `kind: "reaction"` action in the `actions` array. Should the library:

**Options:**

- **(a)** **Allow both** — host renders both; viewer can independently like AND react. Useful for "thumbs-up + reaction" hybrids (Slack-style? LinkedIn?). Likely confusing for users.
- **(b) [Recommended]** **Document as mutually exclusive** — host picks one per post. Library doesn't enforce; passing both produces undefined visual layout (probably just both render). Documented in the guide.
- **(c)** **Type-level enforcement** — make `actions` a TS union that disallows both. Possible via branded types but very ugly.

**Recommendation: (b).** Document the constraint; trust the host. Type-level enforcement is over-engineering for a near-zero risk.

**User lock (more-dynamic interpretation):** **(a) Allow both freely.** The library treats `like + reaction` coexisting as a first-class valid configuration, not a host bug. Hybrid UIs (Slack-style thumbs-up + reaction, LinkedIn-style "like" + reactions menu) are blessed patterns. Documented in the guide as supported. No type-level enforcement; no runtime warning. Library renders whatever actions the host provides, in array order, with the existing `align` semantics.

---

## 6. Cross-procomp ripple

Locked. Lives in a separate description doc, NOT this one:

- `post-card-01-procomp-description-v0.3.0.md` (TBD) — extends `Post` with `reactionCounts` / `viewerReaction` (or the v0.3-locked shape after Q-P1); adds `onReact?: (postId: string, kind: string | null) => void` to `PostMutationHandlers` or a new `PostReactionHandlers`; adds a `reactions` branch to `defaultPostEngagementActions` per the lock in Q-P1.

The engagement-bar v0.3.0 ship does NOT depend on post-card v0.3.0 — it can ship standalone (any consumer wiring `kind: "reaction"` manually works). Post-card v0.3.0 depends on this one.

`comment-thread-01` ripple is NOT in this minor. Reactions-on-comments is v0.4+ candidate.

---

## 7. Effort estimate

- **Description doc** — this file. Done at sign-off.
- **Plan doc** (`-plan-v0.3.0.md`) — ~1–2 hr after Q-P1/2/3 sign-off. Includes commit chain (~C1–C8), defense-3 wiring for the picker (controlled-mode escape), Radix vs Base UI primitive check (F-cross-13) for popover-based picker.
- **Implementation** — ~6–8 commits, ~1.5 days. Picker part + action part + state extension + reducer extension + handle extension + types + meta bump + demo tab.
- **GATE 3 spotcheck** — ~30 min. Rotating dim = composition (picker ↔ action ↔ state).
- **Smoke** — F-cross-11 path-b consumer-tsc + manual reaction-picker interaction.

**Total to ship:** ~2 days from Q-P sign-off → push to `master`.

---

## 8. Sign-off

| Item | Status |
|---|---|
| Problem statement clear | ✅ 2026-05-28 |
| In/out scope agreed | ✅ 2026-05-28 |
| Q-P1 (kind catalog shape) — **LOCK (b)** single `kinds` array | ✅ 2026-05-28 |
| Q-P2 (tap-clears-vs-keeps) — **LOCK (c)** `clearOnTap?: boolean = true` | ✅ 2026-05-28 |
| Q-P3 (coexistence with `like`) — **LOCK (a)** allow both freely (most-dynamic) | ✅ 2026-05-28 |
| Cross-procomp ripple to post-card-01 v0.3.0 acknowledged | ✅ 2026-05-28 |
| Effort estimate accepted | ✅ 2026-05-28 |

**Next step:** GATE 2 plan authored at `engagement-bar-01-procomp-plan-v0.3.0.md`. No code touches before plan sign-off.

---

**Authored:** 2026-05-28 · **Driver:** `docs/consumer_order/ilinxa-proui-improvement-spec.md` (social-moduls-python backend team) · **Procomp tier**
