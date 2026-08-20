# Plan — zero-config install flip (post-directory-merge)

Status: R1 done — implementing (R2)
Loop: feature-readiness-loop · single-session, no subagents (≤2-package change per config cost default)
Date: 2026-08-20

## Goal (one sentence)

Now that shadcn-ui/ui PR #11493 is merged and `@ilinxa` resolves zero-config from the official
registries index, every install surface must lead with `pnpm dlx shadcn@latest add @ilinxa/<slug>`
and demote the manual `components.json` registries snippet to a fallback.

## Trigger evidence (verified this session, 2026-08-20)

- `https://ui.shadcn.com/r/registries.json` contains the `@ilinxa` entry (name/homepage/url verified).
- `pnpm dlx shadcn@latest view @ilinxa/empty-state` resolved from an EMPTY directory —
  no components.json, no registries config. Zero-config resolution is live.
- This flip is the named post-merge follow-up recorded when the PR was submitted.

## In scope

- The five install surfaces: `installation-block.tsx`, `src/app/page.tsx` (quick start),
  `src/app/docs/page.tsx` (setup section), `README.md` (install prose), `public/llms.txt`
  (hand-written preamble + AI-workflow tail — NOT the generated catalog block).
- Fallback preservation: the registries snippet stays discoverable (older/pinned CLIs, mirrors).
- Decision file + STATUS.md + launch-doc (vault) updates.
- R5 proof: a real zero-config `add` from a consumer with no registries entry.

## Out of scope (parked)

- awesome-shadcn-ui PR (outward-facing; user decision — parked).
- Smoke-harness components.json: KEEPS its explicit registries entry (pinned CLI 4.18.0,
  reproducibility; also required for the local-artifact remap flake workaround).
- docs/component-guide.md §11.5 producer-side smoke instructions (internal, still correct).

## Invariants (R1)

| # | Invariant | Verified by |
|---|---|---|
| I1 | No surface presents namespace registration as a REQUIRED numbered step; primary flow = init → add | Read each surface + production-build check |
| I2 | The registries snippet remains discoverable as fallback on all five surfaces | Read each surface |
| I3 | All five surfaces describe the same flow with the same commands | Cross-read + `validate:doc-drift` |
| I4 | Zero-config `add` (not just `view`) works from a consumer with NO registries entry | R5 live install |
| I5 | Generated catalog blocks untouched; `pnpm build:llms` idempotent after edits | git diff scope + rerun |
| I6 | `registriesSnippet()` stays exported AND used (no dead export) | grep usages post-edit |

## Blast radius

| Surface | Change | Docs-map obligation |
|---|---|---|
| `src/app/components/[slug]/_components/installation-block.tsx` | step 2 → fallback note; renumber | — |
| `src/app/page.tsx` | "three steps" heading + list → two steps | — |
| `src/app/docs/page.tsx` | "One-time setup" → fallback framing; AI-section copy | — |
| `README.md` | "Register the namespace" → fallback framing | doc-drift gate |
| `public/llms.txt` (preamble + tail) | Step 1 removed, renumber; AI-workflow step | doc-drift gate; catalog block untouched |
| `src/lib/registry-constants.ts` | comment only: snippet is now the fallback | — |
| `.claude/decisions/2026-08-20-zero-config-install-flip.md` | new decision file | ADR-equivalent |
| `.claude/STATUS.md` | row + recent-activity pointer | budget 14KB |
| launch tracking doc (private, outside the repo) | phase-2 → phase-3 statuses + log entry | never committed here |

## Slices (R2)

- [x] S1 — site surfaces: installation-block, page.tsx, docs/page.tsx, registry-constants comment
- [x] S2 — README.md + llms.txt preamble/tail; `pnpm build:llms` rerun — diff scope = my 6 files only (I5)
- [x] S3 — decision file + STATUS.md (recent-activity trimmed to 5; stale 126/19 test count → 158/23)

Pre-edit obligation: grep tests/ + e2e for assertions on current install copy ("Register the
namespace", "three steps", section headings) so no test breaks blind.

## Phase gates

- [x] R0 plan doc exists; improvement log scanned (binding: never pre-tick boxes — violated once
  writing this very doc's first draft, caught and corrected before any implementation; assert
  scripted replacements; CRLF discipline on doc files; verify readers by grep not recall)
- [x] R1 invariants + blast radius written; decision file lands in S3
- [x] R2 slices implemented; collision grep: no test/e2e asserts the old copy (3 e2e specs are all card-tree)
- [x] R3 gate battery green with real numbers (gate-8 anomaly characterized, not swept)
- [ ] R4 findings table complete (hat-switch review per config cost default)
- [x] R5 runtime verification incl. negative path (live zero-config install on 2 CLI versions +
  consumer tsc 0 + production-build page copy + anchor integrity)
- [ ] R6 docs synced; doc validators green; base commit landed
- [ ] R7 close-out: history verified, launch doc updated, retro appended

## Findings table (R4)

Fresh-context finder (Sonnet 5, read-only, no shared-tree git commands) reviewed the uncommitted
diff against I1–I6 plus four hunt axes. Verdicts are mine, each re-checked against source.

| # | Finding | Failure scenario | Verdict | Evidence / fix |
|---|---|---|---|---|
| 1 | `README.md` AI/LLM section still called it "the namespace snippet" — the exact sibling sentence that WAS updated in `docs/page.tsx` | A reader skimming the README blurb instead of `llms.txt` concludes namespace registration is a baseline ingredient, undercutting the flip | **CONFIRMED** | README.md:200 (outside every diff hunk — I never touched it). Now "the fallback registry config", matching `docs/page.tsx:224` |
| 2 | README FAQ: "use the shadcn MCP server **with the `@ilinxa` namespace registered**" | Same class as #1 — states registration as a precondition for the MCP path, which the directory listing removed | **CONFIRMED** (promoted by me from the finder's out-of-scope FYI) | README.md:238. Rewritten to say `@ilinxa` is directory-listed and resolves without namespace configuration |
| 3 | I1/I2/I3/I5/I6 all hold | — | **DROPPED** (verified, not a defect) | Finder cited a per-surface line for each: fallback present at README:68-74, llms.txt:36-44, installation-block:212-226, docs/page:70-80, page.tsx:139-146 via `/docs#setup`; `id="setup"` still emitted; catalog blocks outside all hunks; `registriesSnippet()` used at 2 sites |
| 4 | "FALLBACK ONLY since 2026-08-20" in `registry-constants.ts` JSDoc could read as version-pinning | Would violate the no-version-pinned-limitation rule | **DROPPED** | Internal JSDoc, not consumer-facing, and it dates a historical *fact* rather than bounding a limitation. Every consumer-facing fallback is condition-first |
| 5 | Two other `shadcn add` mentions in `src/` (`sandbox/_components/docs-blocks.tsx`, `media-carousel/usage.tsx`) | Missed surface | **DROPPED** | Neither gives registry-registration guidance — one is a dev-only sandbox command builder, one a component demo snippet |

**The finding behind the finding.** Both CONFIRMED items are in `README.md`, which my blast-radius
table listed as a single row ("install prose"). The README actually carries **three** consumer-facing
namespace mentions — install section, AI/LLM blurb, FAQ — and I flipped one. A blast-radius row must
be a *set of occurrences*, not a file; the fix is to grep the file for the concept, not to open it at
the section you already have in mind. The finder found #1 precisely because it did not inherit my
mental map of where the install docs "are".

## R3 numbers (2026-08-20)

| Gate | Result |
|---|---|
| 1 tsc (consumer-strict) | exit 0 |
| 2 lint | 0 errors / **14** warnings — baseline exact |
| 3 meta-deps | exit 0 |
| 4 registry validators (whitelist / registry-json / naming / no-control-chars / barrel `--strict` / inert `--strict`) | exit 0 each |
| 5 doc validators (doc-drift / doc-budget) | exit 0 each |
| 6 registry:build | exit 0 — 66 artifacts audited, 0 high |
| 7 build | exit 0, all routes |
| 8 tests `NODE_ENV=production` | **158 passed / 23 files**, exit 0 |
| — build:llms idempotence | diff scope = the 6 edited files only; no catalog-block churn (I5) |

**Gate 8 anomaly — recorded, not swept.** The FIRST run of the session returned exit 1: 107 passed
with **12 file-level load errors** (≈4 test files failed to import, so 51 tests never ran).
Three subsequent runs were clean 158/158, including a deliberate `pnpm build` →
`pnpm test:run` reproduction attempt of the suspected trigger. Unreproducible; characterized as a
cold-start worker/import flake (that run's aggregate setup 168s / environment 304s vs ~8s/33s when
warm). Per config's one-retry rule this is a flake, **but** it is a new one and a deploy-blocking
gate, so it is logged in the retro + known-flakes rather than forgotten.

**Process defect found in my own method:** I ran gate 8 as `... | tail -6`, so the shell reported
`GATE8_EXIT=0` for a run that actually exited 1 — a pipeline's status is its LAST command's. This
is the exact defect shape recorded on 2026-08-19 for a `for`-loop smoke batch. Re-run redirected to
a file with a bare `$?`. Cost: the first run's 12 error messages were lost to the truncation.

## R5 evidence (2026-08-20)

All against the **production registry** (`ui.ilinxa.com`), from the smoke consumer with its
`registries` entry **removed** — restored afterwards (verified).

| Check | Result |
|---|---|
| I4 zero-config `add`, CLI `latest` | `add @ilinxa/empty-state` → 3 files created at `src/components/empty-state/`, exit 0 |
| Consumer compile bar | `pnpm tsc --noEmit` → exit 0 |
| Zero-config on the **pinned** CLI 4.18.0 (smoke pin) | resolves identically, 3 files, exit 0 — resolution queries the live index at run time |
| **Negative path** — unresolvable namespace | `add @nonexistent-ns-xyz/foo` fails, non-zero, message: *"Add the registry configuration under `registries` in your components.json"* |
| I1/I2/I3 on the production build (`next start`) | homepage renders "in two steps" + directory note (old "Register the namespace in components.json" step **absent**); `/docs` renders "Namespace resolution — zero config" + "Fallback:" (old "One-time setup" absent); detail page renders steps 1/2/3 with the fallback box and the snippet still present |
| Anchor integrity | `/docs` emits `id="setup"`; homepage links `href="/docs#setup"` — renamed section kept its anchor |

**Behavioral discovery (not previously documented):** on a successful zero-config add the CLI
**writes the `registries` entry into the consumer's `components.json` itself**. Confirmed by
`grep -c registries` → `0` before the add, entry present after. So the fallback is needed only for
the resolution failure itself, and a consumer seeing the entry appear is the CLI self-configuring,
not drift. Independently, the CLI's own failure message recommends exactly the snippet this flip
kept — which is direct evidence for keeping it (I2) rather than deleting it.

## Pre-mortem

If this breaks a consumer, it breaks because their environment pins a shadcn CLI old enough to
predate directory resolution AND they skip the fallback note — mitigated by keeping the snippet
on every surface, condition-first ("if your CLI can't resolve @ilinxa"), never version-pinned.

## Parked

- awesome-shadcn-ui submission — owner decision, outward-facing PR.
- shadcn MCP direct verification — the MCP server exposed no tools this session (searched, none
  found), so MCP-side discoverability is inferred from the verified `registries.json` entry rather
  than probed. Spot-check when the server is available.
- Gate-8 cold-start flake (§R3) — logged in `readiness.config.md` known-flakes with the retry rule
  ("compare the passed COUNT, not just the exit code"). Real if it ever reproduces.
