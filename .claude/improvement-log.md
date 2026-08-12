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

## 2026-08-12 — procomp-loop system + dual pilots (first C-loop + first U-loop)

**Scope:** author the component creation/upgrade loop system (skill + config + CLAUDE.md), then
prove it: C-loop pilot `empty-state` v0.1.0 (1 implementer + 1 finder + coordinator) and U-loop
pilot `blackboard` v0.2.1 (architect-only patch path). Both shipped same session.

**Keep:**
- Plan-level self-adversarial passes caught the highest-leverage bug BEFORE code existed
  (app-level `reveal-up` keyframe never reaches consumers — P-F5) by verifying both in-registry
  precedents instead of trusting either.
- Coordinator spot-check of subagent output caught a schema omission (fixtures item missing
  `"type"`) by diffing against the real `page-hero-fixtures` reference — reference-diffing beats
  trusting a well-formatted report.
- The rigor ladder worked as designed: the patch-class U-loop ran WITHOUT agents/review-file
  overhead and still caught its own risks via the invariants-delta self-check.
- Architect-tier verdict pass refuted 1 of 3 finder findings into doc-drift (code was right,
  plan was wrong) — the CONFIRMED/DROPPED split keeps fixes honest in both directions.
- Live browser assertion of a11y invariants (role=status count, heading levels, 0-interactive
  read-only) — cheap to script, caught the I2 scope bug in the TEST itself (docs page has
  page-level tabpanels; scope demo assertions to the panel containing known demo text).

**Change:**
1. tw-animate-css `animate-in` + `animationDelay` stagger REQUIRES `animationFillMode:"both"`
   (fill-mode defaults to none → flash). Any staggered entrance in registry code: set it inline.
2. Fixtures/dependent items with `@ilinxa/...` regDeps cannot smoke pre-deploy against the
   deployed namespace — remap `@ilinxa` to the local artifact server in the consumer's
   components.json (restore after), and re-verify post-deploy. → candidate for readiness.config
   env-prep on next touch.
3. Windows: killing a backgrounded `next start` wrapper leaves the node child holding the port —
   free by `Get-NetTCPConnection` PID before re-serving, or the re-run silently tests a STALE build.
4. `pnpm start -- -p X` passes `--` literally to next → "Invalid project directory". Use
   `npx next start -p X`.

**Config lied?** No. procomp-loop.config + readiness.config both held; two new mechanics learned
(items 2–4) belong in configs on next touch.

**Pre-mortem carried into the ship:** consumer without tw-animate-css gets no entrance (accepted
degradation, no flash thanks to inline fill-mode); fixtures regDep resolves only post-deploy
(re-check owned).

## 2026-08-12 — P4 polish & 1.0 bar (second loop on this repo)

**Scope:** whole P4 phase (ADR + install-matrix evidence + site baseline + generated versions
doc), one loop, ~1 session. 5 subagents (1 scout, 3 implementers, 2 R4 finders) + coordinator.
GATE 3: Pass with follow-ups. Base commit 5ed0281 (45 files).

**Keep:**
- R5 against the PRODUCTION build (next start + Playwright/fetch): caught the app-dir
  opengraph-image non-cascade on Next 16.2.4 — directly contradicting an R4 finder's
  docs-based claim that inheritance would apply. Runtime evidence > docs reasoning, again.
- Dual-axis fresh-context finders (site-code / docs+tooling): 14 findings, 12 confirmed —
  incl. a bug CLASS caught twice in one diff (CRLF handling: fixed in validator, missed in
  generator — the second finder caught the miss).
- Empirical re-test of environment folklore on version bumps: CLI 4.6.0→4.17.0 invalidated
  BOTH standing flakes (package.json corruption gone, phantom no-op softened) and refuted
  llms.txt's own install-path explanation. Docs corrected to evidence with hedges intact.
- Coordinator spot-check of implementer claims (read the actual files) before marking slices done.
- Production-build-based design audit (12 screenshots) instead of dev server.

**Change:**
1. Windows Edit-tool sometimes rewrites whole files with CRLF → broke the ↳-strip regex in
   validate-doc-drift (misleading failure) and would have caused generator thrash. Rule: any
   script comparing/regex-scanning doc files must \r\n-normalize on read. → config known-flakes (done).
2. Subagents repeatedly BACKGROUNDED long commands (installs, gates) and stopped "waiting" —
   3 stalls across 2 agents, plus a process restart orphaned their work. Rule: agent briefs
   must say "foreground-only; never background or monitor; long timeouts instead".
   → config agent-orchestration (done).
3. Dev-server compile-worker farm (~17 node procs, ~2.3GB) + Playwright over 6 cold routes +
   3 parallel consumer installs nearly crashed the machine (user intervened). Rule: R5/design
   audits run against `pnpm build` + `next start`, never dev; don't overlap heavy audits with
   install agents. → config env-prep (done).
4. Plan-doc Status header must advance at every phase transition — own finder flagged the
   header frozen at R0 while the body was at R4 (F-8). The state machine is only trustworthy
   if updated as-you-go.

**Config lied?** No lies. Two flakes became version-scoped (annotated, not deleted); three new
rules added from this loop's incidents.

**Pre-mortem carried into the ship:** if P4 breaks in prod, it breaks because the deployed
Vercel environment renders metadata differently than local `next start` (mitigation: one
post-deploy spot-check of og:image + robots + a detail page), or because a scraper needs the
legacy multi-res favicon.ico (accepted risk, icon.svg covers modern).
