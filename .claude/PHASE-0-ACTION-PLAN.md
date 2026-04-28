# Phase 0 Risk Spike — Your Action Plan

> **Audience:** you (Hessam, the project lead).
> **Purpose:** plain-language action plan you can come back to weeks from now and immediately know what to do.
> **NOT this doc:** the technical brief at [docs/procomps/force-graph-procomp/force-graph-phase-0-spike-brief.md](../docs/procomps/force-graph-procomp/force-graph-phase-0-spike-brief.md). That's for the developer who actually runs the benchmark. This doc is for *you*, deciding how to make that happen.

---

## 30-second summary

- **What's needed:** ~2 days of WebGL/GLSL dev work on a laptop with an integrated GPU. Build a custom Sigma edge program, render 100k edges, measure fps.
- **Why:** until somebody runs this benchmark, `force-graph` v0.1 is blocked. The whole graph-system architecture assumes the custom WebGL pipeline can hit ≥30 fps on integrated GPU. Right now that's an unverified assumption.
- **Why Claude can't do it:** it's a fps measurement on real graphics hardware. Claude has no GPU and no browser. It's manual human work.

---

## Step 1: Decide who runs it

Three options. Pick one:

### Option A — You do it yourself

**Pick this if all three are true:**
- You've written GLSL shaders before, OR you're comfortable picking it up in 1–2 days. ([Sigma's program API](https://sigmajs.org) + the `@sigma/edge-arrow` source as starting point — not from-scratch GLSL.)
- You have a laptop with integrated GPU access (Intel Iris Xe, Apple M-series integrated, or AMD integrated). The benchmark MUST run on integrated, because that's the gate.
- You have ~2 free workdays in the next 1–2 weeks.

**If yes:** open the brief, follow it. Day 1 = build the program. Day 2 = run the benchmark + write up the result in STATUS.md.

### Option B — A developer on your team does it

**Pick this if:**
- You have a teammate who knows WebGL/GLSL.
- You'd rather delegate this to keep your own hours focused on planning + design decisions.

**How to brief them:**
1. Send them the link to the technical brief: [docs/procomps/force-graph-procomp/force-graph-phase-0-spike-brief.md](../docs/procomps/force-graph-procomp/force-graph-phase-0-spike-brief.md).
2. Tell them the 2-day budget and the gate (≥30 fps integrated GPU at 100k edges idle).
3. Tell them where to log the result (STATUS.md "Recent decisions" entry per the brief §10).
4. Confirm they have integrated-GPU hardware to test on.

**Deliverables you should expect from them:**
- The fps numbers on integrated AND discrete GPU.
- A pass/fail verdict against the gate.
- If fail: which contingency tier (B / C / D from the brief §9) they recommend.
- The spike code (sandbox repo or branch) — keep it for reference even after the spike.

### Option C — Hire a contractor for 2 days

**Pick this if neither A nor B fits.**

**What you're hiring for:**
- 2 days of WebGL/GLSL work.
- Required skills: Sigma.js or comparable WebGL graph rendering experience; comfortable writing custom shaders in GLSL.
- Required hardware: laptop with integrated GPU.

**Where to find someone:**
- Upwork / Toptal / Arc.dev under "WebGL developer" or "graphics engineer."
- Sigma.js GitHub contributors — many have done custom edge programs.
- Three.js / WebGL developer communities.

**What to send them:**
- The technical brief: [docs/procomps/force-graph-procomp/force-graph-phase-0-spike-brief.md](../docs/procomps/force-graph-procomp/force-graph-phase-0-spike-brief.md).
- A brief statement of work pointing at the brief's §1 (the gate) and §8 (what "pass" looks like).
- 2-day timebox.

**Realistic price range:** $800–$2,000 for 2 days of senior WebGL work, depending on their hourly rate. Cheaper than 14+ weeks of force-graph implementation built on a wrong assumption.

---

## Step 2: While the spike is in flight (or before it runs)

You don't have to wait for the spike to do everything. Some work is independent:

**Can author in parallel** (independent of spike outcome per [decision #35](../docs/systems/graph-system/graph-system-description.md)):
- Any of the 5 Tier 1 plans — `properties-form` (recommended; deepest in the cascade), `detail-panel`, `filter-stack`, `entity-picker`, `markdown-editor`.
- `force-graph` v0.6 plan — independent of Tier 1 + spike.

**Cannot start until spike completes:**
- `force-graph` v0.1 implementation (`pnpm new:component data/force-graph`).
- `force-graph` v0.3 / v0.4 / v0.5 plans (those are gated on Tier 1 plans, AND v0.1 implementation, AND spike result).

So if you want to keep moving while the spike runs, the highest-leverage parallel path is: start a Tier 1 plan in a fresh Claude session.

---

## Step 3: After the spike completes

Whoever ran it (you, teammate, contractor) gives you the numbers. Then:

1. **Update [.claude/STATUS.md](STATUS.md):**
   - Add a "Recent decisions" entry dated `2026-MM-DD — Phase 0 risk spike: <pass | tier-B | tier-C | tier-D>` with the fps numbers, GPU models, branch/commit SHA.
   - Flip the "Phase 0 risk spike PENDING" item under "Open decisions / TODOs" to `✓ done`.
2. **Decide next move based on result:**
   - **Pass:** open a fresh Claude session, say "the spike passed, ready to start `force-graph` v0.1 implementation." Claude will scaffold via `pnpm new:component data/force-graph` and start coding against [v0.1 plan](../docs/procomps/force-graph-procomp/force-graph-v0.1-plan.md) §12.
   - **Fail (any tier):** open a fresh Claude session, say "the spike picked tier-B/C/D, need a v0.1 + v0.2 plan amendment pass." Claude will rewrite the affected plan sections.

---

## Quick links

| What | Where |
|---|---|
| Technical brief (for the spike author) | [docs/procomps/force-graph-procomp/force-graph-phase-0-spike-brief.md](../docs/procomps/force-graph-procomp/force-graph-phase-0-spike-brief.md) |
| The gate (≥30 fps integrated GPU at 100k edges) | [graph-system §10.1](../docs/systems/graph-system/graph-system-description.md#101-phase-0--risk-spike-2-days) |
| Where to log the result | [.claude/STATUS.md](STATUS.md) "Recent decisions" + "Open decisions / TODOs" |
| Project state right now | [.claude/STATUS.md](STATUS.md) |
| Session continuation context | [.claude/HANDOFF.md](HANDOFF.md) |
| Fresh-session boot prompt | [.claude/STARTER-PROMPT.md](STARTER-PROMPT.md) |
| `force-graph` v0.1 plan (what implementation looks like after the spike passes) | [docs/procomps/force-graph-procomp/force-graph-v0.1-plan.md](../docs/procomps/force-graph-procomp/force-graph-v0.1-plan.md) |
| `force-graph` v0.2 plan | [docs/procomps/force-graph-procomp/force-graph-v0.2-plan.md](../docs/procomps/force-graph-procomp/force-graph-v0.2-plan.md) |

---

## If you forget where you left off

Open a fresh Claude session and paste the contents of [.claude/STARTER-PROMPT.md](STARTER-PROMPT.md). Claude will read the project state and tell you where things stand. Mention this action plan if it doesn't surface.
