"use client";

import { useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import type {
  Blackboard01Handle,
  BlackboardNote,
  BlackboardRootProps,
  BoardBackground,
  NoteDraft,
  NoteStyle,
} from "../types";
import {
  DEFAULT_NOTE_STYLE,
  DEFAULT_PALETTE,
  DEFAULT_WIDTHS,
} from "../lib/palette";
import { DEFAULT_FONTS } from "../blackboard-fonts";
import { dedupeMemberIds, extractMentions } from "../lib/mentions";
import { deriveUnread, latestNoteId } from "../lib/unread";
import { useControllableState } from "./use-controllable-state";
import { useAutosave } from "./use-autosave";
import { useLazyOlder } from "./use-lazy-older";
import {
  BlackboardContext,
  DEFAULT_BACKGROUND,
  DEFAULT_BLACKBOARD_LABELS,
  type BlackboardContextValue,
} from "./use-blackboard";

function genTempId(): string {
  // Event-handler-only (post/retry) — never called during SSR render.
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${performance.now()}`;
  return `bb-temp-${rnd}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * The headless controller — builds the full `BlackboardContextValue` from
 * `BlackboardRootProps`. Owns optimistic posting + reconcile, lazy-load cursor,
 * draft + autosave, pin (controlled or uncontrolled), unread derivation, board
 * theming, and the imperative handle.
 */
export function useBlackboardController(props: BlackboardRootProps): BlackboardContextValue {
  const {
    notes,
    currentUser,
    members = [],
    canWrite = true,
    onLoadOlder,
    hasMoreOlder = false,
    loadOlderPageSize = 10,
    onPostNote,
    onDeleteNote,
    onDraftChange,
    autoSaveDelayMs = 600,
    pinnedNoteIds,
    onPinNote,
    onUnpinNote,
    onMention,
    unreadCount,
    lastSeenNoteId,
    onSeen,
    background,
    defaultBackground,
    onBackgroundChange,
    editableBackground = false,
    palette = DEFAULT_PALETTE,
    fonts = DEFAULT_FONTS,
    widths = DEFAULT_WIDTHS,
    allowFreeColor = false,
    defaultStyle,
    newestFirst = false,
    showAuthorOnHover = true,
    composerMode = "double-click",
    renderWriteDenied,
    renderEmpty,
    labels: labelOverrides,
    ref,
  } = props;

  const labels = useMemo(
    () => ({ ...DEFAULT_BLACKBOARD_LABELS, ...labelOverrides }),
    [labelOverrides],
  );

  // refs
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // ── optimistic / appended notes (local) ──────────────────
  const [extras, setExtras] = useState<BlackboardNote[]>([]);
  const [posting, setPosting] = useState(false);

  // ── composer reveal ──────────────────────────────────────
  const [composerOpenState, setComposerOpenState] = useState(false);
  const composerOpen = composerMode === "always" ? true : composerOpenState;
  const openComposer = useCallback(() => {
    setComposerOpenState(true);
    requestAnimationFrame(() => composerRef.current?.focus());
  }, []);
  const closeComposer = useCallback(() => setComposerOpenState(false), []);

  // Display = controlled `notes` ∪ local extras (optimistic posts, real-time
  // appends, loaded-older pages), deduped by id with `notes` winning. Extras whose
  // id is now in `notes` are filtered out here (no prune effect needed — that would
  // be a set-state-in-effect cascade). Reconciled extras linger harmlessly; growth
  // is bounded in `setExtras` callers. (v0.1.1: opportunistic prune of absorbed extras.)
  const merged = useMemo(() => {
    const propIds = new Set(notes.map((n) => n.id));
    const extraOnly = extras.filter((e) => !propIds.has(e.id));
    const all = [...notes, ...extraOnly];
    all.sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));
    return all;
  }, [notes, extras]);

  // ── pin (controlled `pinnedNoteIds` XOR uncontrolled `note.pinned`) ──
  const pinControlled = pinnedNoteIds !== undefined;
  const [localPinned, setLocalPinned] = useState<Set<string>>(
    () => new Set(notes.filter((n) => n.pinned).map((n) => n.id)),
  );
  const pinnedSet = useMemo(
    () => (pinControlled ? new Set(pinnedNoteIds) : localPinned),
    [pinControlled, pinnedNoteIds, localPinned],
  );
  const isPinned = useCallback((id: string) => pinnedSet.has(id), [pinnedSet]);

  const streamNotes = useMemo(() => merged.filter((n) => !pinnedSet.has(n.id)), [merged, pinnedSet]);
  const pinnedNotes = useMemo(() => merged.filter((n) => pinnedSet.has(n.id)), [merged, pinnedSet]);

  const canPin = !!onPinNote;
  const togglePin = useCallback(
    (note: BlackboardNote) => {
      const willPin = !pinnedSet.has(note.id);
      if (willPin) onPinNote?.(note.id);
      else onUnpinNote?.(note.id);
      if (!pinControlled) {
        setLocalPinned((prev) => {
          const next = new Set(prev);
          if (willPin) next.add(note.id);
          else next.delete(note.id);
          return next;
        });
      }
    },
    [pinnedSet, onPinNote, onUnpinNote, pinControlled],
  );

  // ── background (controlled / uncontrolled) ───────────────
  const [bg, setBg] = useControllableState<BoardBackground>({
    value: background,
    defaultValue: defaultBackground ?? DEFAULT_BACKGROUND,
    onChange: onBackgroundChange,
    componentName: "Blackboard01",
    valuePropName: "background",
  });

  // ── draft + autosave ─────────────────────────────────────
  const [draft, setDraft] = useState<NoteDraft>(() => ({
    text: "",
    style: { ...DEFAULT_NOTE_STYLE, ...defaultStyle },
    mentions: [],
  }));
  const setDraftText = useCallback(
    (text: string) => setDraft((d) => ({ ...d, text })),
    [],
  );
  const setDraftStyle = useCallback(
    (patch: Partial<NoteStyle>) => setDraft((d) => ({ ...d, style: { ...d.style, ...patch } })),
    [],
  );
  useAutosave(draft, onDraftChange, autoSaveDelayMs);

  // ── scroll helpers ───────────────────────────────────────
  const scrollToLatest = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTop = newestFirst ? 0 : el.scrollHeight;
    });
  }, [newestFirst]);

  // ── unread ───────────────────────────────────────────────
  const seenControlled = lastSeenNoteId !== undefined;
  const [localSeenId, setLocalSeenId] = useState<string | null>(null);
  const effectiveSeen = seenControlled ? lastSeenNoteId ?? null : localSeenId;
  const derivedUnread = deriveUnread(merged, effectiveSeen);
  const effectiveUnread = unreadCount ?? derivedUnread;

  const markAllSeen = useCallback(() => {
    const latest = latestNoteId(merged);
    if (latest) onSeen?.(latest);
    if (!seenControlled) setLocalSeenId(latest);
  }, [merged, onSeen, seenControlled]);

  const onReachedBottom = useCallback(() => {
    if (!newestFirst) markAllSeen();
  }, [newestFirst, markAllSeen]);

  // ── posting (optimistic + reconcile) ─────────────────────
  const submit = useCallback(
    (optimistic: BlackboardNote) => {
      const mentions = optimistic.mentions ?? [];
      const memberIds = dedupeMemberIds(mentions);
      const result = onPostNote?.({ text: optimistic.text, style: optimistic.style, mentions });
      if (result instanceof Promise) {
        setPosting(true);
        result
          .then((real) => {
            setExtras((prev) => prev.map((e) => (e.id === optimistic.id ? { ...real } : e)));
            if (memberIds.length) onMention?.(real.id, memberIds);
          })
          .catch(() => {
            setExtras((prev) =>
              prev.map((e) =>
                e.id === optimistic.id ? { ...e, pending: false, failed: true } : e,
              ),
            );
          })
          .finally(() => setPosting(false));
      } else {
        // sync / void: drop the pending flag; fire mention with the optimistic id
        setExtras((prev) =>
          prev.map((e) => (e.id === optimistic.id ? { ...e, pending: false } : e)),
        );
        if (memberIds.length) onMention?.(optimistic.id, memberIds);
      }
    },
    [onPostNote, onMention],
  );

  const post = useCallback(() => {
    const text = draft.text.trim();
    if (!canWrite || !onPostNote || !text) return;
    const mentions = extractMentions(text, members);
    const optimistic: BlackboardNote = {
      id: genTempId(),
      text,
      author: currentUser,
      createdAt: nowIso(),
      style: draft.style,
      mentions,
      pending: true,
    };
    setExtras((prev) => [...prev, optimistic]);
    setDraft((d) => ({ ...d, text: "", mentions: [] }));
    submit(optimistic);
    scrollToLatest();
  }, [draft.text, draft.style, canWrite, onPostNote, members, currentUser, submit, scrollToLatest]);

  const retryPost = useCallback(
    (id: string) => {
      setExtras((prev) => {
        const note = prev.find((e) => e.id === id);
        if (note) submit({ ...note, pending: true, failed: false });
        return prev.map((e) => (e.id === id ? { ...e, pending: true, failed: false } : e));
      });
    },
    [submit],
  );

  // ── delete ───────────────────────────────────────────────
  const canDelete = !!onDeleteNote;
  const deleteNote = useCallback(
    (note: BlackboardNote) => {
      if (note.failed) {
        // dismiss a failed optimistic note locally
        setExtras((prev) => prev.filter((e) => e.id !== note.id));
        return;
      }
      onDeleteNote?.(note.id);
      setExtras((prev) => prev.filter((e) => e.id !== note.id));
    },
    [onDeleteNote],
  );

  // ── lazy load older ──────────────────────────────────────
  const loadOlder = useCallback(async () => {
    if (!onLoadOlder) return;
    const oldest = merged.find((n) => !n.pending && !n.failed);
    const older = await onLoadOlder(oldest ? oldest.id : null, loadOlderPageSize);
    if (older.length === 0) return;
    // Prepend any that aren't already present (consumer owns `notes`, but we
    // surface them immediately via extras; the prune effect reconciles).
    setExtras((prev) => {
      const known = new Set([...notes.map((n) => n.id), ...prev.map((e) => e.id)]);
      const fresh = older.filter((o) => !known.has(o.id));
      return fresh.length ? [...fresh, ...prev] : prev;
    });
  }, [onLoadOlder, merged, loadOlderPageSize, notes]);

  const { loadingOlder } = useLazyOlder({
    scrollRef,
    sentinelRef,
    load: loadOlder,
    hasMore: hasMoreOlder,
    enabled: !!onLoadOlder,
    topId: streamNotes.length > 0 ? streamNotes[0].id : null,
    anchor: !newestFirst,
  });

  // ── mention emphasis ─────────────────────────────────────
  const mentionsCurrentUser = useCallback(
    (note: BlackboardNote) => !!note.mentions?.some((m) => m.memberId === currentUser.id),
    [currentUser.id],
  );

  // ── imperative handle ────────────────────────────────────
  useImperativeHandle(
    ref,
    (): Blackboard01Handle => ({
      scrollToLatest,
      appendNote: (note) => {
        setExtras((prev) => {
          if (prev.some((e) => e.id === note.id)) return prev;
          // Cap the local buffer so a long-lived real-time stream can't grow unbounded.
          const next = [...prev, note];
          return next.length > 300 ? next.slice(next.length - 300) : next;
        });
        scrollToLatest();
      },
      focusComposer: () => composerRef.current?.focus(),
      markAllSeen,
    }),
    [scrollToLatest, markAllSeen],
  );

  return {
    labels,
    currentUser,
    members,
    canWrite,
    streamNotes,
    pinnedNotes,
    newestFirst,
    isPinned,
    showAuthorOnHover,
    mentionsCurrentUser,
    palette,
    fonts,
    widths,
    allowFreeColor,
    composerRef,
    draft,
    setDraftText,
    setDraftStyle,
    post,
    posting,
    composerMode,
    composerOpen,
    openComposer,
    closeComposer,
    scrollRef,
    sentinelRef,
    hasMoreOlder,
    loadingOlder,
    loadOlderEnabled: !!onLoadOlder,
    loadOlder,
    onReachedBottom,
    scrollToLatest,
    unreadCount: effectiveUnread,
    markAllSeen,
    canPin,
    togglePin,
    canDelete,
    deleteNote,
    retryPost,
    background: bg,
    setBackground: setBg,
    editableBackground,
    renderWriteDenied,
    renderEmpty,
  } satisfies BlackboardContextValue;
}

export { BlackboardContext };
