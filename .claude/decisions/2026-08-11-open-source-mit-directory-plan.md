---
date: 2026-08-11
session: production-readiness-p1-5
phase: between P1.5 and P2
type: strategic decision + plan doc
commits: this date (LICENSE + README + package.json + docs/registry-directory-plan.md)
components: none (repo-level)
findings: external readiness guide audited — 4 stale/false premises corrected; all machine-checked directory requirements already pass
status: decided + shipped; directory PR gated on P2
---

# Open-source MIT + shadcn registry directory plan

**User decision 2026-08-11: the library is fully public open source, MIT.** LICENSE (MIT, "Copyright (c) 2026 Ilinxa") at repo root; README License section flipped from "Private. Contact the team." to MIT; `package.json` gains `"license": "MIT"` (`"private": true` stays — it only guards accidental npm publish of the app package, unrelated to source licensing).

**Trigger:** user-supplied "Registry Directory Readiness Guide" reviewed claim-by-claim against the repo, live shadcn docs, live `registries.json`, and the actual `validate-registries.mts` Zod schema. Verdict: ~80% of its checklist was already satisfied by P0/P1/P1.5; its central "KNOWN BLOCKER" (content in the index) was false; its "8 components" premise was ~3 months stale. Verified plan now lives at [`docs/registry-directory-plan.md`](../../docs/registry-directory-plan.md) — read THAT, not the external guide.

**Key sequencing lock:** the directory PR ships only **after P2** — the rename changes every item name; listing before it would churn the public catalog immediately after review. Remaining pre-PR work (entry SVG logo + one-line description + clean-project `list`/`view`/`search` audit + `registry.json` homepage → site) rides P2 close-out.

**Confirmed externally (2026-08-11):** `@ilinxa` available; entry schema requires name/homepage/url/description/**logo** (logo IS required in source despite being stripped from the served registries.json); submission = one-entry PR to `apps/v4/registry/directory.json` + `pnpm validate:registries`.
