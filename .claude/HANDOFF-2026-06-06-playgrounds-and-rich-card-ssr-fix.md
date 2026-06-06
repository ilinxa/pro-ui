# HANDOFF — live JSON playgrounds + rich-card v0.4.3 SSR fix

**Date:** 2026-06-06
**Status:** 🔒 LOCKED — COMMITTED, NOT PUSHED. All gates green incl production build.

---

## STATE LOCKED

- **Everything from `fc8e469` onward is UNPUSHED** (origin/master is at `92d5eec`). Run `git log --oneline origin/master..HEAD` to see them. **`git push origin master` ships the lot.** Working tree CLEAN; full `pnpm build` ✓.
  - `fc8e469` — fix(rich-card): v0.4.3 SSR-stable auto-ids
  - `f8a734b` — feat(docs): live JSON playgrounds on config-driven detail pages
  - `6bf1be6` — fix(docs): flow-canvas starter — explicit data.ports so edges/handles render
  - `76a5fc5` / `f3d6725` (+ this reconcile) — docs(session-close) lock
- **Both newly-built playgrounds are USER-CONFIRMED working** (rich-card hydration gone + renders; flow-canvas ports + edges + fan-out render after the starter fix). content-composer-01 + json-form were confirmed earlier.
- Gates: **tsc 0 · lint 81-22 baseline (no new) · meta-deps 53/53 · registry:build ✓ · full `pnpm build` ✓** · all 4 playground pages SSR 200; validators accept their starters; rich-card deterministic ids confirmed across requests.
- Dev server was **stopped** for the final build — restart with `pnpm dev` on resume.

## NEXT ACTION (resume here)

All 4 playgrounds are USER-CONFIRMED working — the only pending step is the push.

1. **`git push origin master`** (ships rich-card v0.4.3 + the playgrounds + the flow-canvas starter fix; Vercel auto-deploys). No post-deploy smoke needed (docs-site feature + a parse-only rich-card patch; not a new registry surface).
2. `pnpm dev` if you want to re-look first (dev was stopped for the final build). All 4: `/components/{content-composer-01,json-form,rich-card,flow-canvas-01}` → Live playground → Submit.
3. Optional: add more playgrounds — the reusable `<JsonPlayground>` makes the data-driven tier (media-carousel-01, pricing-table-01, kanban-board-01, tree/list family) ~10-line wrappers each. **Gotcha for any node-graph/data playground: list ports/items EXPLICITLY in the starter — `defaultData` doesn't inflate a renderer's `defaultPorts` (that only runs in the drop pipeline).**

## What shipped this session (committed, not pushed)

### 1. Live JSON playgrounds — docs-site feature
Reusable **`<JsonPlayground<T>>`** at `src/app/components/[slug]/_components/json-playground.tsx`: split-pane (left = mono `<textarea>` JSON editor + live zod validation + status line + Submit/Format; right = live render via an error boundary + a generic result strip + empty state). Four thin wrappers + per-type validators in `src/app/components/[slug]/_lib/`:
- `composer-playground.tsx` + `composer-config-schema.ts` — `ComposerConfig`; registers a generic `playground` adapter (mutates the exported `ADAPTER_REGISTRY`) + fake uploader so Publish/Save assemble a visible item.
- `json-form-playground.tsx` + `form-schema-schema.ts` — `FormSchema`; onSubmit shows values.
- `rich-card-playground.tsx` + `rich-card-schema.ts` — `RichCardJsonNode`, rendered `editable`.
- `flow-canvas-playground.tsx` + `flow-canvas-schema.ts` — `CanvasData`; **module-scope** `card` renderer + built-in custom-JSON fallback; fixed-height frame. Starter lists **explicit `data.ports`** (defaultData doesn't inflate `defaultPorts`) + is rich (multi out-port fan-out, chain, terminal nodes, fallback node, 3 edges).
- `page.tsx` routes per slug via a `PLAYGROUNDS` map. **Docs-site only — shipped components unchanged.**

**Impl lesson:** validators run zod for ERROR MESSAGES but return the ORIGINAL `JSON.parse` result (zod strips unmodelled keys; the components need them).

### 2. rich-card v0.4.3 — SSR-stable auto-ids
`lib/parse.ts`: auto-ids for id-less cards now `rc-auto-<tree-path>` (deterministic) instead of `crypto.randomUUID()` at parse — fixes a pre-existing hydration mismatch (surfaced by the rich-card playground page; affected any SSR'd RichCard with id-less cards). Runtime edits still mint random ids (client-only, safe). meta → 0.4.3, artifact regenerated.

## Already LIVE (pushed earlier, tip `92d5eec`)

The 2026-06-05 manual-test **bug sweep** + v0.2.0 carousel-into-post integration are on `master`:
- **carousel v0.1.2** — browse FileList bug (snapshot before `value=""` reset).
- **content-composer v0.2.1** — FSM `start`-on-mount (Next/Save/Publish were dead — latent since v0.1.x); Publish last-step-only + Save-every-step; visible lifecycle errors.
- **media-editor v0.1.3** — crop controls in-flow so bottom handles reach.
- Doc/usage/meta/registry alignment.
- **Post-deploy F-01 re-smoke CONFIRMED CLEAN** (composer + carousel 0 consumer-tsc errors). The 21 errors seen were **pre-existing, unrelated** base-nova-Slider / Radix primitive-divergence in media-editor/json-form/story-composer/ui/code-block — NOT regressions (worth a future F-cross ticket).

## Pointers

- Decision: [`.claude/decisions/2026-06-06-config-playgrounds-and-rich-card-ssr-fix.md`](decisions/2026-06-06-config-playgrounds-and-rich-card-ssr-fix.md)
- Prior (base context, all PUSHED): [`HANDOFF-2026-06-05-carousel-v0.1.1-and-content-composer-v0.2.0.md`](HANDOFF-2026-06-05-carousel-v0.1.1-and-content-composer-v0.2.0.md)
- Concurrent in-flight (unchanged): [`HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md`](HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md)
- Open → v0.3 post backend: multi-blob upload + `post-content-item` adapter + durable local persistence.
