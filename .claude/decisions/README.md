# `.claude/decisions/` — versioned per-decision log (b3 hybrid)

> **Created:** 2026-05-09 as part of Phase 6 (F-cross-02 resolution).
>
> **Why this directory exists:** `.claude/STATUS.md` was growing as an append-only log (88K tokens at peak — exceeded Claude's single-Read limit). F-cross-02 flagged it as "stopped being a current snapshot, started being a changelog". The fix is option (b3) hybrid:
>
> - **`.claude/STATUS.md`** — lean current snapshot (Components / Roadmap / Open decisions / pointers). Always small enough to single-Read.
> - **`.claude/STATUS-archive.md`** — one-time bulk archive of pre-2026-05-08 Recent-decisions entries + the verbose Components-table Notes cells from before the slim-down.
> - **`.claude/decisions/<YYYY-MM-DD>-<slug>.md`** *(this directory)* — per-decision files going forward. Each file is the new "Recent decisions" entry, individually addressable, queryable by frontmatter, git-trackable as its own unit.

---

## When to add a new file here

Author a decision file when:

- A component ships (new version, status change, removal)
- A sweep phase closes (e.g. session 7c Phase 4 close)
- A non-obvious project-wide decision is made (e.g. registry distribution wired, new substrate adopted)
- A cross-cutting finding closes
- A planning artifact lands (e.g. master plan, handoff doc, phase plan)

**Do NOT** add a decision file for:

- Per-commit changes (git history covers that)
- Trivial doc fixes (typos, broken links)
- Internal refactors with no behavior change
- Tracker updates that just bookkeep already-recorded decisions

If unsure, lean toward NOT adding — the index in `STATUS.md`'s "Recent activity" section can always link directly to a tracker row or commit instead.

---

## File naming convention

`<YYYY-MM-DD>-<descriptive-slug>.md`

Examples:
- `2026-05-08-session-7-phases-1-2.md`
- `2026-05-09-session-7c-phase-4-docs.md`
- `2026-05-09-rich-card-v0.4.1.md`

The date is the date the decision *landed* (not when authoring started). The slug describes the decision.

If multiple decisions land same-day, append a counter:
- `2026-05-09-session-7c-phase-4-docs.md`
- `2026-05-09-session-7c-phase-4-docs-2.md`

---

## File structure

Each decision file follows this shape:

```markdown
---
date: 2026-05-09           # ISO date the decision landed
session: 7c                # session label per sweep-tracker (omit if non-sweep)
phase: 4                   # phase number per HANDOFF Phase decomposition (omit if non-phase work)
type: docs                 # docs / fix / feature / decision / removal / infra
commits: [abc1234, def5678]
components: [data-table, properties-form, entity-picker, markdown-editor]
findings: [F-cross-01]     # tracker IDs closed/touched (omit if none)
status: shipped            # shipped / in-progress / deferred / reverted
---

# <Title — one-line summary>

## Summary

One paragraph, what the decision is and why.

## Context

What necessitated this; what was true before; what would have been broken if we didn't act.

## Outcome

What landed, in bullet form. Include verification result (tsc clean, lint clean, smoke pass, etc.).

## Cross-references

- Tracker rows: …
- Plan/handoff docs: …
- Related decision files: …
```

Frontmatter is YAML; everything else is markdown. The frontmatter makes the file queryable:

```bash
# All decisions touching markdown-editor:
grep -l "markdown-editor" .claude/decisions/*.md

# All in-progress / deferred decisions:
grep -A1 "^status:" .claude/decisions/*.md | grep -B1 "in-progress\|deferred"

# All decisions in session 7:
ls .claude/decisions/ | grep "session-7"
```

---

## Index discipline

- `STATUS.md` "Recent activity" section lists the last 5-10 decision files (most-recent-first)
- Older files are NOT removed from this directory — they stay forever as the canonical record
- `STATUS-archive.md` is the one-time bulk archive of pre-2026-05-09 entries; it is NOT extended going forward (new entries always go here)

## Why some old session entries are in archive but session 7+ entries are here

A subtle nuance worth recording: the cutoff between `STATUS-archive.md` and this directory is **not strictly chronological**. It's about **where the entry lived when the b3 split happened in session 7d**.

- Sessions **1-6** (sweep entries that landed BEFORE Phase 6) had their "Recent decisions" entries authored directly into `.claude/STATUS.md` at session sign-off — per the (now-superseded) convention. Those entries lived in STATUS.md until 2026-05-09 when Phase 6 split them out into `STATUS-archive.md`. They are NOT in this directory.

- Sessions **7 / 7b / 7c** had their Recent-decisions entries DEFERRED from STATUS.md per F-cross-02 (the file was already too large; sessions 7+ deliberately stopped extending it). When Phase 6 ran, those deferred entries were authored as catch-up decision files HERE rather than appending to the archive.

- Session **7d** (Phase 6 itself) is here because it's the first session under the new convention.

- All sessions **8 onward** land here per the convention.

If you need to find a session 1-6 sign-off, look in `STATUS-archive.md`'s "Recent decisions log" section. Search by date or session number — the entries are ordered most-recent-first within the archive.

---

## Why frontmatter / not a database

These files are read by humans (and Claude) more often than queried programmatically. Plain markdown + YAML frontmatter:

- Works with grep
- Diffs cleanly in git
- Renders fine in any editor
- Doesn't require tooling to read or write
- Can be migrated to a real CMS / DB later if needed (low cost)

If this directory grows to 200+ files, consider sub-folders by year (`.claude/decisions/2026/`). Below that scale, a flat directory is the right answer.

---

## Migration notes

This directory was created during Phase 6 of the procomp review sweep (session 7d, 2026-05-09). Phase 6's commits landed:

- 4 catch-up decision files for the previously-deferred sessions 7 / 7b-Phase-3 / 7b-Phase-5 / 7c-Phase-4 entries
- This README (the file you're reading) documenting the convention
- The `.claude/STATUS.md` slim-down (Components table reduced to slug + category + status + version; Recent decisions log moved out; new "Recent activity" pointer surfaces the 5 most-recent decision files)
- The `.claude/STATUS-archive.md` one-time bulk archive (verbose Components Notes + entire pre-2026-05-09 Recent decisions log)
- A self-review pass that surfaced 5 issues (Procomp-docs column inaccurate; CLAUDE.md "Recent decisions" instruction stale; Phase 6 missing its own decision file; this nuance doc; sweep-tracker tier-2 mis-categorization for media-carousel-01) — all fixed
- The Phase 6 decision file itself (`2026-05-09-session-7d-phase-6.md`)

Future sessions: read STATUS.md → if context needed, jump to specific decisions/ files (don't read the whole archive).
