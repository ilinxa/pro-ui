import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EngagementDelta } from "../../engagement-bar/types";
import type { Post, PostChange } from "../types";

type Slot = "like" | "bookmark" | "vote";
/** An in-flight change, bound to the post it was made on. */
type Overlay = Partial<Record<Slot, { apply: (post: Post) => Post; postId: string | null }>>;

/** Idempotent: setting the state a post already has changes nothing. */
export function applyLike(post: Post, liked: boolean): Post {
  if ((post.isLiked ?? false) === liked) return post;
  return { ...post, isLiked: liked, likes: liked ? post.likes + 1 : Math.max(0, post.likes - 1) };
}

export function applyBookmark(post: Post, bookmarked: boolean): Post {
  if ((post.isBookmarked ?? false) === bookmarked) return post;
  return { ...post, isBookmarked: bookmarked };
}

/** Records the viewer's vote on the poll. A poll the viewer already voted on is left as is. */
export function applyVote(post: Post, optionId: string): Post {
  const poll = post.poll;
  if (!poll || poll.hasVoted || poll.viewerVoteOptionId !== undefined) return post;
  return {
    ...post,
    poll: {
      ...poll,
      hasVoted: true,
      viewerVoteOptionId: optionId,
      totalVotes: poll.totalVotes + 1,
      options: poll.options.map((o) => (o.id === optionId ? { ...o, voteCount: o.voteCount + 1 } : o)),
    },
  };
}

/**
 * Folds a realtime engagement delta into the post. A delta the post has no field for, or one that
 * equals what the post already shows (an echo), returns the post itself.
 */
export function applyDelta(post: Post, delta: EngagementDelta): Post {
  switch (delta.kind) {
    case "like-changed": {
      const liked = delta.liked ?? post.isLiked;
      if (post.likes === delta.count && (post.isLiked ?? false) === (liked ?? false)) return post;
      return { ...post, likes: delta.count, isLiked: liked };
    }
    case "bookmark-changed":
      return (post.isBookmarked ?? false) === delta.bookmarked ? post : { ...post, isBookmarked: delta.bookmarked };
    case "comment-count-changed":
      return post.comments === delta.count ? post : { ...post, comments: delta.count };
    case "share-count-changed":
      return post.shares === delta.count ? post : { ...post, shares: delta.count };
    case "view-count-changed":
      return post.viewCount === delta.count ? post : { ...post, viewCount: delta.count };
    default:
      return post;
  }
}

function isThenable(value: unknown): value is Promise<unknown> {
  return !!value && typeof (value as { then?: unknown }).then === "function";
}

export interface UsePostStateOptions {
  post: Post;
  /** Makes `post` controlled. */
  onPostChange?: (next: Post, change: PostChange) => void;
  /** Show a change while its promise is in flight. Default `true`. */
  optimistic?: boolean;
}

export interface PostState {
  /** The post to render: the prop (controlled) or the local mirror, with in-flight changes over it. */
  shown: Post;
  /** Request a like. `call` runs the host's handler; return its promise (if any). */
  like: (next: boolean, call: () => void | Promise<unknown>) => void;
  bookmark: (next: boolean, call: () => void | Promise<unknown>) => void;
  vote: (optionId: string, call: () => void | Promise<unknown>) => void;
  /** A realtime delta: applied to the mirror (uncontrolled) or reported (controlled). */
  delta: (delta: EngagementDelta) => void;
  /** Drop every in-flight change and (uncontrolled) replace the mirror. */
  reset: (next: Post) => void;
  /** A poll vote is in flight: further votes are ignored until it settles. */
  voting: boolean;
}

/**
 * The card's post state (consumer contract C5).
 * - Uncontrolled (no `onPostChange`): the first `post` seeds a local mirror. A change applies at
 *   once (a handler that returns nothing) or while its promise is in flight (`optimistic`) and
 *   sticks when it resolves; a rejection drops it.
 * - Controlled (`onPostChange`): `post` wins every render. A change is an overlay while its
 *   promise is in flight and is never applied: once accepted it is reported with the next post.
 * Only the latest request per slot decides the overlay; an older request that settles after a
 * newer one was accepted is not reported. Controlled reports build on a synchronous "working"
 * post that every report advances, so two changes accepted before React commits both land. A
 * change that alters nothing is not reported. A new `post.id` drops everything in flight.
 */
export function usePostState({ post, onPostChange, optimistic = true }: UsePostStateOptions): PostState {
  const controlled = onPostChange !== undefined;
  const [mirror, setMirror] = useState<Post>(post);
  const [overlay, setOverlay] = useState<Overlay>({});
  const [voting, setVoting] = useState(false);
  const base = controlled ? post : mirror;

  // A different post in controlled mode: whatever was in flight belonged to the old one.
  const [seenId, setSeenId] = useState(post.id);
  if (controlled && seenId !== post.id) {
    setSeenId(post.id);
    setOverlay({});
    setVoting(false);
  }

  const shown = useMemo(() => {
    let out = base;
    for (const slot of ["like", "bookmark", "vote"] as const) {
      const entry = overlay[slot];
      if (entry && (entry.postId === null || entry.postId === base.id)) out = entry.apply(out);
    }
    return out;
  }, [base, overlay]);

  const propRef = useRef(post);
  /** The post controlled reports build on: the prop, advanced by every report since it last changed. */
  const workingRef = useRef(post);
  const controlledRef = useRef(controlled);
  const onPostChangeRef = useRef(onPostChange);
  const optimisticRef = useRef(optimistic);
  const voteInFlight = useRef(false);
  const seq = useRef<Record<Slot, number>>({ like: 0, bookmark: 0, vote: 0 });
  const accepted = useRef<Record<Slot, number>>({ like: 0, bookmark: 0, vote: 0 });
  const epoch = useRef(0);
  useEffect(() => {
    controlledRef.current = controlled;
    onPostChangeRef.current = onPostChange;
    optimisticRef.current = optimistic;
  });
  useEffect(() => {
    propRef.current = post;
    workingRef.current = post;
  }, [post]);
  const resyncTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(resyncTimer.current), []);
  /**
   * Advance the working post after a report. A host that does not adopt the change leaves the prop
   * as it was, so the working post falls back to the prop once the task is over (otherwise a
   * second request for the same change would be swallowed as a no-op).
   */
  const advance = useCallback((next: Post) => {
    workingRef.current = next;
    clearTimeout(resyncTimer.current);
    resyncTimer.current = setTimeout(() => {
      workingRef.current = propRef.current;
    }, 0);
  }, []);
  const lastId = useRef(post.id);
  useEffect(() => {
    if (!controlled || lastId.current === post.id) return;
    lastId.current = post.id;
    epoch.current += 1;
    voteInFlight.current = false;
  }, [controlled, post.id]);

  const clearSlot = useCallback((slot: Slot) => {
    setOverlay((o) => {
      if (!o[slot]) return o;
      const next = { ...o };
      delete next[slot];
      return next;
    });
  }, []);

  const run = useCallback(
    (slot: Slot, apply: (post: Post) => Post, change: PostChange, call: () => void | Promise<unknown>) => {
      if (slot === "vote" && voteInFlight.current) return;
      const id = ++seq.current[slot];
      const startEpoch = epoch.current;
      const wasControlled = controlledRef.current;
      const startPostId = wasControlled ? workingRef.current.id : "";
      const result = call();

      const accept = () => {
        if (startEpoch !== epoch.current || id <= accepted.current[slot]) return;
        accepted.current[slot] = id;
        if (wasControlled) {
          const current = workingRef.current;
          if (current.id !== startPostId) return;
          const next = apply(current);
          if (next === current) return;
          advance(next);
          onPostChangeRef.current?.(next, change);
        } else {
          setMirror((m) => apply(m));
        }
      };

      if (!isThenable(result)) {
        accept();
        clearSlot(slot);
        return;
      }
      if (slot === "vote") {
        voteInFlight.current = true;
        setVoting(true);
      }
      if (optimisticRef.current) {
        setOverlay((o) => ({ ...o, [slot]: { apply, postId: wasControlled ? startPostId : null } }));
      }
      const settle = () => {
        if (startEpoch !== epoch.current) return;
        if (slot === "vote") {
          voteInFlight.current = false;
          setVoting(false);
        }
        if (id === seq.current[slot]) clearSlot(slot);
      };
      result.then(
        () => {
          accept();
          settle();
        },
        settle,
      );
    },
    [clearSlot, advance],
  );

  const like = useCallback(
    (next: boolean, call: () => void | Promise<unknown>) =>
      run("like", (p) => applyLike(p, next), { kind: "like", liked: next }, call),
    [run],
  );
  const bookmark = useCallback(
    (next: boolean, call: () => void | Promise<unknown>) =>
      run("bookmark", (p) => applyBookmark(p, next), { kind: "bookmark", bookmarked: next }, call),
    [run],
  );
  const vote = useCallback(
    (optionId: string, call: () => void | Promise<unknown>) =>
      run("vote", (p) => applyVote(p, optionId), { kind: "poll-vote", optionId }, call),
    [run],
  );

  const delta = useCallback((d: EngagementDelta) => {
    if (controlledRef.current) {
      const current = workingRef.current;
      const next = applyDelta(current, d);
      if (next === current) return;
      advance(next);
      onPostChangeRef.current?.(next, { kind: "delta", delta: d });
    } else {
      setMirror((m) => applyDelta(m, d));
    }
  }, [advance]);

  const reset = useCallback((next: Post) => {
    epoch.current += 1;
    voteInFlight.current = false;
    workingRef.current = propRef.current;
    setVoting(false);
    setMirror(next);
    setOverlay({});
  }, []);

  return { shown, like, bookmark, vote, delta, reset, voting };
}
