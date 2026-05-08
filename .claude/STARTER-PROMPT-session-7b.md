# Starter Prompt — Session 7b (sweep continuation)

> **What this is:** copy-pasteable prompt for a fresh Claude Code session that continues the procomp review sweep after the session-7 pause.
>
> **How to use:** copy everything between the `--- COPY BELOW ---` and `--- COPY ABOVE ---` markers and paste as your first message. The new session will read the handoff, summarize state, and wait for direction.
>
> **Last refreshed:** 2026-05-08 — post-session-7-Phase-1+2 close (5 of 10 cross-cutting findings closed; F-cross-10 NEW; Phases 3–6 deferred to 7b/c).
>
> **Predecessor prompts:** [`STARTER-PROMPT.md`](STARTER-PROMPT.md) is the pre-sweep April 30 version (references force-graph v0.1 in flight; force-graph since removed 2026-05-08). Keep for historical reference only — do not use for sweep continuation.

---

## Session 7b starter prompt

```
--- COPY BELOW ---

We're continuing a procomp review sweep that paused at the end of session 7
Phases 1+2 (mid-sweep cross-cutting cleanup checkpoint). Session 7 closed 5 of
10 cross-cutting findings (F-cross-03, F-cross-05, F-cross-06, F-cross-08,
F-cross-09 all CLOSED) and spun out F-cross-10 (smoke-harness hygiene drift).
The remaining open findings are F-cross-01, F-cross-02, F-cross-04, F-cross-07,
F-cross-10. Phases 3–6 (architectural fixes, documentation backlog,
per-component v0.1.1 patches, sign-off) are deferred to this session.

Read the handoff document first — it has everything you need to pick up
where we left off:

  e:/2026/ilinxaDOC/ilinxa-ui-pro/.claude/HANDOFF-sweep-paused-session-7.md

The handoff covers:
- TL;DR + which files to read in what order (master plan §7 first, then
  sweep-tracker.md for live state, then session-7 commits for the actual
  changes)
- Everything done across sessions 1–7 (all 9 Tier 1 components reviewed;
  53 component-level findings; 5 of 10 cross-cutting findings closed in
  session 7; 6 commits pushed: fb23a2b, b807e35, 0be5a57, f319ae8,
  829863f, edecbc3, plus consistency fix c34d8f2)
- Per-component v0.1.1 patch backlog (filtered for what's still open
  after session 7's sweep-wide closures)
- Session 7b plan in 4 remaining phases:
    Phase 3: Architectural fixes — F-cross-10 harness pre-flight FIRST
             (gates downstream smoke-verify), then smoke-verify
             F-cross-03 + F-cross-05 post-Vercel-redeploy, then
             pnpm validate:meta-deps lint script (F-cross-07 sub-shapes),
             then scaffolder audit, then per-component meta drops on
             5 affected Tier 1 components
    Phase 4: Documentation backlog (4 missing guides — markdown-editor,
             properties-form, entity-picker, data-table; ~8 hours focused;
             likely splits into session 7c)
    Phase 5: Per-component v0.1.1 patches (workspace adaptive-flatten F-01
             is the most substantive; rest are doc/meta cleanup)
    Phase 6: Sign-off — close newly-resolved tracker entries, decide on
             STATUS.md (option (b): fix F-cross-02 first, then add s7
             Recent-decisions line is recommended)
- Conventions to respect (severity emojis, F-NN format, STATUS.md size
  workaround, cross-cutting ratio convention, self-review-at-sign-off
  pattern, don't propose force-graph v3, don't offer /schedule, don't
  clear turbopack cache while dev server is running, etc.)
- Recent commits, glossary, files-not-to-touch
- Notable session-7 lessons (in auto-memory):
  - feedback_audit_systematic_scope_before_committing.md — when an
    F-cross says "fix N carriers," programmatically scan for the same
    shape across the entire surface BEFORE committing; expand-in-same-
    commit when additional sites are mechanically identical (s7
    F-cross-05 went 4 → 44 sites this way)
  - feedback_re_validation_pass_catches_real_issues.md — re-confirmed
    in session 7 (caught 5 cross-doc inconsistencies at sign-off,
    fixed in commit c34d8f2)

Read the handoff top to bottom, then read the master plan at
C:\Users\AsiaData\.claude\plans\now-as-we-have-snazzy-raccoon.md
(especially §7 the mid-sweep checkpoint — Phase 3 onward), then read
docs/reviews/sweep-tracker.md to confirm the live state matches the
handoff.

After that, summarize what you understood in 5–7 short bullets so I
can confirm you have the picture before we start session 7b.

Don't author plans, modify code, or run tools until I explicitly say
which phase to start with. The handoff's recommended starting move is
Phase 3 step 1 (F-cross-10 harness pre-flight) since downstream
smoke-verify of session 7's Phase 2 fixes depends on a clean harness.

--- COPY ABOVE ---
```

---

## Notes for the user

- **Don't expect the new session to remember session 7's tool-call sequence** — the handoff + tracker + git log are the only persistent state. Memory entries (auto-loaded via MEMORY.md) carry workflow lessons but not specific session work.
- **Vercel should have redeployed by now** — session 7's 6 commits pushed at 2026-05-08; the production registry should serve the namespaced sibling refs and the `flow-canvas-01` artifacts. Smoke-verify is the first useful Phase 3 step.
- **F-cross-10 harness fixing** may take 30–60 min if the auto-revert behavior of `package.json` is non-trivial to diagnose. Budget accordingly. If intractable, re-scaffold the harness fresh from `pnpm create next-app` + `pnpm dlx shadcn@4.6.0 init` (~20 min) — costs less than fighting the existing state.
- **Phase 4 (4 missing guides) is ~8 hours of focused writing** — strong candidate to split into a dedicated session 7c. The handoff suggests doing Phase 3 + Phase 5 in 7b, then Phase 4 in 7c, then Phase 6 closure in 7d.
