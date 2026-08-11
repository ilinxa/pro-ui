# Readiness-loop improvement log

<!-- Appended at each R7 retro. Prior entries are binding input to R0 scoping of the next loop. -->

## 2026-08-11 — P3 feature-slicing (first loop on this repo)

**Scope:** whole P3 phase (spike + 2 pilots + kit + validators + audits), one loop, ~1 session,
9 subagents + coordinator. GATE 3: Pass with follow-ups. Base commit fe72f47.

**Keep:**
- Wave-ordering with a coordinator merge step (infra alone first → parallel implementers → central
  registry.json merge → central battery). Zero merge conflicts across 4 concurrent implementers.
- Empirical spike BEFORE architecture verdict — the CLI-behavior evidence (phantom-abort,
  `--overwrite` clobber) killed strategy (a) decisively; no amount of reasoning would have.
- Independent adversarial finders + architect refute-checks: caught an implementer's false claim
  ("base never imports Button" — 5 files did) and 2 blocker-class gaps the writers couldn't see.
- R5 with REAL installs on both backends: found 3 registry bugs all prior layers missed
  (slider regDep, pinned-URL clobber, editing button) — green gates ≠ verification, again.
- Validator-first responses to repeated bug classes (4th primitive gap → build the scan, don't
  spot-fix; found exactly 2 catalog-wide).

**Change:**
1. Agent briefs must forbid git state-changing commands in shared trees (2× `git stash` incidents;
   one created a real clobber window). → readiness.config §agent-orchestration (done).
2. The "lockstep filter scripts" list must be derived by grepping registry.json READERS, not
   recalled — R1 evidence said 3 scripts, reality was 5 (doc-drift + meta-deps regex both bit).
3. Size bars from source-byte estimates: model the ~13% JSON-wrap overhead (both pilot bars missed
   by exactly that class of error). → config rule (done).
4. Windows agents writing consumer configs: BOM discipline (config known-flake, done).
5. Memory staleness bit twice (container name, pilot slugs' "already file-separated" premise) —
   re-verify environment facts from memory before building plans on them.

**Config lied?** No lies; config was BORN this loop. Gaps found+filled: BOM flake, primitive-dep
flake, browser-instrument fallback, orchestration rules.

**Pre-mortem carried into the ship:** if P3 breaks in prod, it breaks because a consumer hits the
non-interactive upgrade phantom-no-op (documented, not solved — upstream CLI) or because a
feature-item install path diverges on a newer shadcn CLI major (re-test owner: P4.2).
