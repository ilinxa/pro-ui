# Structure audit — one-pager template (P3.4)

> Rolling per-component audit established by P3 (2026-08-11). Findings get **fix-on-touch owners**
> (next minor/major touch of that component) — an audit never triggers a big-bang fix wave.
> Output location: `docs/reviews/structure-audits/<YYYY-MM-DD>-<slug>.md`. Run via the P5-L3
> maintenance sweep or before promoting a component alpha→beta.

```markdown
# Structure audit — <slug> v<version> (<date>)

verdict: compliant | findings-logged
artifact: <KB> / budget <KB> (<headroom %>)

## 1. Compound compliance (.claude/rules/compound-component-structure.md)
Headless Root + flat à-la-carte parts + logic-free assembly? Flat exports (never Name.Root)?
Heavy deps React.lazy? — findings with file:line, or "compliant".

## 2. Dead / orphaned public API
Exports reachable neither from the assembly, nor documented in usage.tsx, nor plausibly
à-la-carte (à-la-carte parts are NOT dead — the bar is "abandoned surface", with evidence:
no docs mention + no internal mount + no plausible standalone use).

## 3. Undocumented prop semantics
Public props whose behavior/contract is absent from usage.tsx and the guide doc — list.

## 4. A11y baseline
Primary interactions keyboard-reachable? Focus managed on overlays/popups? Labels/roles on
custom interactive elements? Spot findings with file:line — this is a baseline check, not a full audit.

## 5. Weight & slice candidacy
Top-3 weight contributors (LOC). Is there a coherent opt-in capability axis ≥20% of LOC with
low base-coupling? → note as feature-slice candidate for next MAJOR touch (P3 convention).

## Owners
| Finding | Severity (🚫/⚠️/🔸/🔹) | Owner target |
|---|---|---|
```
