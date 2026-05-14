# flow-canvas-01 — perf measurement protocol

> **Status:** authoritative procedure for every FPS measurement that informs v0.2.x / v0.3.0 tier decisions.
> **Date:** 2026-05-14
> **Locked by:** [v0.2.0 perf description](../flow-canvas-01-v0.2.0-perf-description.md) Q27 (multi-machine recording) + §3.2 pre-work.
> **Companion docs:** [2026-05-14-perf-tier-validation.md](2026-05-14-perf-tier-validation.md) (the research backing the tier ladder).

Every measurement that gets cited in a tier review file MUST be recorded against this protocol. The protocol exists so that *"Tier 1 gave us 45 FPS on my M2"* vs *"Tier 2 gave us 50 FPS on the Windows laptop"* can be distinguished from measurement noise. Subsequent measurement files (`2026-05-DD-baseline.md`, `2026-05-DD-tier1.md`, etc.) reference this doc verbatim.

---

## 1. Hardware

**Multi-machine recording.** Run the full measurement matrix on every developer machine available. The success-criterion benchmark for a (tier, fixture, N) cell is the **minimum FPS across all machines** at that cell.

Each measurement file MUST list, per machine, the following fields:

```
Machine: <short label, e.g. "Hessam-Win11">
CPU:    <model + base/boost GHz>
RAM:    <GB + speed if known>
GPU:    <integrated vs discrete; model>
OS:     <name + version, e.g. "Windows 11 Pro 23H2">
Browser: <Chrome version, channel = stable>
Power:  <plugged in / on battery / battery %>
```

Power state matters — laptop throttling on battery can drop FPS measurements by 20–40% with no code change. **Always measure plugged in.**

---

## 2. Browser state

| Setting | Required value |
|---|---|
| Browser | Google Chrome (stable channel) |
| Profile | A clean profile with NO extensions enabled (use Chrome's guest mode or a dedicated `chrome --user-data-dir=...` profile) |
| Hardware acceleration | ON (Chrome default; verify in `chrome://gpu/`) |
| DevTools Performance tab — CPU throttling | OFF |
| DevTools Performance tab — Network throttling | OFF |
| Other tabs | Close all other tabs in the same window |
| Browser zoom level | 100% (`Ctrl/Cmd + 0` to reset) |
| Viewport size | DevTools open → set viewport to 1440×900 via the device toolbar (`Ctrl/Cmd + Shift + M` → "Responsive" → enter 1440×900) for consistent layout |
| Page reload | Hard reload (`Ctrl/Cmd + Shift + R`) before each run to clear any in-memory state |

---

## 3. Measurement window

For each (N, fixture, lever-state) cell:

1. Navigate to the sandbox page with the target N (e.g. `/sandbox/flow-stress?n=500&fixture=light`).
2. Wait for the canvas to render and idle for **3 seconds**.
3. Open DevTools → Performance tab → start recording.
4. Click + hold on a node near the viewport center, **drag continuously across the viewport for 5 seconds** following a roughly Z-shape path (down-right, across-left, down-right).
5. Stop the drag.
6. Stop the Performance recording.
7. In the recorded Frames track, read the **minimum FPS during the 5-second drag window** (Chrome shows per-frame timing; the minimum FPS is `1000 / longest frame in ms`).
8. Record the number.
9. Repeat the (1)–(8) sequence ONCE more (second run). If the two runs differ by > 15 FPS, run a third and use the median.

**The recorded value for the cell is the worst (lowest) min-FPS across runs.** This is intentionally conservative — we benchmark against the floor, not the average.

---

## 4. The N matrix

Each measurement file fills this matrix. Empty cells before a tier ships; populated as part of the tier's review.

|  | N=100 | N=200 | N=500 | N=1000 | N=2000 |
|---|---|---|---|---|---|
| Light fixture (`makeStressData`) | FPS | FPS | FPS | FPS | FPS |
| Heavy fixture (`makeHeavyStressData`) | FPS | FPS | FPS | FPS | FPS |

For tier-specific measurements (e.g. Tier 3 with `edgeRenderer="canvas"`), the matrix may be extended with rows per lever state. The light+heavy rows always remain.

**N=2000 is allowed to fail** (record "FAIL — <symptom>" if the browser hangs / dies). It's the upper-bound stress test; not all tiers are expected to clear it.

---

## 5. Per-fixture configuration

| Fixture | Built from | Renderer type | Default ports per node | Edges per N |
|---|---|---|---|---|
| Light (`makeStressData`) | [dummy-data.ts:125-178](../../../../src/registry/components/data/flow-canvas-01/dummy-data.ts) | `custom-json` (built-in fallback) | 2 (`in`, `out`) | ~2 per node (next-but-one + next-row) |
| Heavy (`makeHeavyStressData`) | new in v0.2 pre-work | synthetic richish renderer (~3 visible fields, 1 nested visual block, 4 ports) | 4 (left-in, right-out, top-doc-in, bottom-doc-out) | same wiring as light |

Heavy fixture intentionally avoids `ProjectCard01` and `rich-card` (per Q28 — cross-component coupling distorts measurements).

---

## 6. Lever toggles per tier

Each tier's measurement records the result with each lever in its tier's expected state:

| Tier | `onlyRenderVisibleElements` | `useShallow` in DefaultEdge | `edgeRenderer` | `lodHints` |
|---|---|---|---|---|
| Pre-tier baseline (current v0.1.3 defaults) | `false` (current default) | not applied | n/a (SVG only) | n/a |
| Pre-tier with consumer opt-in | `true` (matches what a tuned consumer would set) | not applied | n/a | n/a |
| Tier 1 (= v0.2.0 partial) | `true` (new default) + batched `fireOnChange` | not applied | n/a | n/a |
| Tier 2 (= v0.2.0 full) | `true` | applied | n/a | n/a |
| Tier 3 default (`v0.3.0` opt-out) | `true` | applied | `"svg"` (default) | undefined |
| Tier 3 canvas mode | `true` | applied | `"canvas"` | undefined |
| Tier 3 canvas + LOD | `true` | applied | `"canvas"` | `{ dotZoom: 0.4, cardZoom: 0.8 }` |

The sandbox stress page exposes these as URL params or toggle UI so a tester can switch between lever states without rebuilding.

---

## 7. Where measurements get filed

Each measurement run produces ONE file under `docs/procomps/flow-canvas-01-procomp/research/`:

```
research/
├── 2026-05-14-perf-tier-validation.md             # the research that drove the tier ladder
├── 2026-05-14-measurement-protocol.md             # THIS doc
├── 2026-05-DD-baseline.md                         # pre-Tier-1 baseline (v0.1.3 state)
├── 2026-05-DD-tier1-postship.md                   # after Tier 1 lands
├── 2026-05-DD-tier2-postship.md                   # after Tier 2 lands (== v0.2.0 final)
├── 2026-??-??-tier3-postship-svg.md               # after Tier 3 lands, SVG mode
└── 2026-??-??-tier3-postship-canvas.md            # after Tier 3 lands, canvas mode + LOD
```

Each post-tier file MUST include:
- The full N matrix (light + heavy)
- Per-machine breakdown
- The lever-toggle column for that tier
- A delta column showing FPS lift vs the prior tier (or baseline for Tier 1)
- A pass/fail call against the tier's success criteria from the v0.2 perf description

---

## 8. Reproducibility self-check

Before promoting a tier based on numbers, the reviewer asks:
1. Was the protocol followed exactly? (Browser flags, viewport size, drag motion, run count.)
2. Are the two runs within 15 FPS of each other for every cell? (If not, was a third run done?)
3. Is every machine listed with full hardware + browser fields?
4. Is the delta vs prior tier ≥ 5 FPS at any N in the matrix? (If not, the tier didn't move the needle measurably — reconsider whether it's worth shipping.)
5. Does the worst-case (lowest min-FPS) clear the success criterion? (Not the average — the worst.)

If any answer is "no," the measurement is not ratified and the tier is not shippable on its current evidence.

---

## 9. Tooling notes

- Chrome DevTools Performance tab is the primary instrument. No third-party FPS overlays — they drift from Chrome's own frame timing.
- The sandbox stress page will render a small **on-screen FPS overlay** (rolling 1-second average) for quick eyeballing during exploration. **Do NOT cite the overlay for review numbers** — it's a smell test, not a measurement. The DevTools Performance trace is authoritative.
- **Subjective "does it feel smooth" beats the overlay number.** Verified empirically 2026-05-14 — a 1-second rolling FPS average can show 50 FPS while individual frames stutter at 100-200ms, which feels terrible. If the overlay says fine but it doesn't feel smooth, trust your eyes and take a Performance trace.
- **Long dev sessions degrade browser/HMR state** — verified 2026-05-14 when heavy at N=5000 went from 60-70 FPS smooth to 30-49 FPS laggy with no code changes. Recipe to restore: stop dev server → kill the underlying node process if it survives → restart dev server → open in incognito window. Incognito bypasses browser HMR module cache and extensions that accumulate cost over a long session.
- `requestAnimationFrame` ticks are the unit. Anything below ~16.7 ms per frame is 60 FPS-able; anything above ~20 ms is visibly choppy.
- If a measurement shows GC pauses (yellow bars in the Performance trace) that distort the min-FPS, note it in the measurement file. GC-induced floor is a real symptom — don't filter it out.

---

## 10. Don'ts

- Don't measure with the React DevTools panel open. It distorts component-render timing.
- Don't measure with browser extensions enabled (especially ad-blockers, password managers, dev extensions).
- Don't measure on battery. Plug the laptop in.
- Don't measure in fullscreen or with the OS in a low-power state.
- Don't average FPS across multiple cells before reporting — each cell stands alone.
- Don't cite older measurements as "still valid" after any code change — re-measure for each tier ship.

---

## 11. Forward compatibility

If xyflow ships a substantial perf improvement during v0.2/v0.3 (e.g. a breaking 13.x release), the protocol stays the same — only the version-under-test changes. Re-run the baseline on the new xyflow version, treat the prior tier numbers as historical, and proceed.
