# Loop state — `app-sidebar` (U-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **breaking** — 0.x minor) |
| **Current stage** | CLOSED — shipped `a5c7324`, deploy verified 2026-10-23 |
| **Sign-off policy** | delegated by user 2026-10-23 ("Sign off, delegate rest" on the story-rail U1 question, which named app-sidebar's U1 too, unless a composed component breaks — none composes app-sidebar in code). Push still needs the user's OK. |
| **Version target** | v0.4.1 → **v0.5.0** |
| **Model roster** | architect: main session · implementers: Sonnet · finders: Sonnet (fresh) |
| **Started / updated** | 2026-10-23 / 2026-10-23 |

Source: ilinxa Social Platform hardening request §4.1 (AS1–AS10) + contract C1–C12, **as amended by**
[`.claude/hardening-request-verification-2026-10-23.md`](../../../.claude/hardening-request-verification-2026-10-23.md) §app-sidebar
(local, untracked). User priorities (2026-10-23): AS1 toggle bug · drawer full labels (AS2) · CSS vars overridable and
reaching the drawer (AS3) · labels incl. badge count (AS4/AS5) · C1–C12 as touched.

## Stage checklist (U-loop)

- [x] U0 Intake — class + blast radius + reproductions (below)
- [x] U1 Change contract — sign-off: delegated (see Status)
- [x] U2 Implement — slices below (contract deviation: `--ilinxa-nav-indent-step` default **0**, not 0.75rem — see slice 2)
- [x] U3 Gate battery — tsc 0 · lint 14 baseline · meta-deps · registry:build (after meta/registry description sync) · doc-drift · build ✓ (100 s) · tests 542/48 serial (after U4); app-sidebar artifact **208.98 KB** (the 180.76 first read was the stale 0.4.1 artifact — that registry:build had failed before regenerating) → budget 210 → **230**
- [x] U4 Adversarial review — 2 fresh finders (33 findings → 22 rows: 18 CONFIRMED + fixed or gated, 4 DROPPED with reasons); 21 regression tests (u4-regressions + lib) incl. one real bug the tests caught (`badge:""` empty pill → fixed); U4-B/C falsified; gates re-run green (542/48 serial)
- [x] U5 Runtime & smoke — browser 14/14 on the production build; installs CLI 4.18 + 3.8.5 (base + fixtures), consumer tsc 0, consumer-owned token preserved; prototype rail measured
- [x] U6 Docs sync & review — spotcheck (broad) [`reviews/2026-10-23-v0.5.0-hardening.md`](reviews/2026-10-23-v0.5.0-hardening.md): **Pass with follow-ups** (5, owned); final gates: lint 14 baseline · doc-drift · `pnpm build` (51 s) · tests 542/48 serial (one worker-start flake on the first run, retried — passed count compared)
- [x] U7 Ship — `a5c7324` pushed on user OK; live `https://ui.ilinxa.com/r/app-sidebar.json` verified on poll 4 (39 files incl. `lib/labels.ts` + `hooks/use-direction.ts`, `lucide-react@^1.11.0`, 5 `cssVars.theme` mappings). Retro: decision `.claude/decisions/2026-10-23-app-sidebar-v0-5-0.md` (local). Report-back to the platform drafted: `.claude/report-back-2026-10-23-story-rail-app-sidebar.md` (local; the user relays)

## U0 — Intake

**Blast radius**

| Surface | Why | Synced (U6) |
|---|---|---|
| `src/registry/components/navigation/app-sidebar/**` | the change | |
| `registry.json` app-sidebar item | `cssVars.theme` (success, warning, brand), pinned deps, new files | |
| `src/app/globals.css` | docs-site `@theme` mappings for new tokens | |
| procomp trio + guide | API + locks; guide `:144` ("reflected in first paint") and `:218` (`--ilinxa-nav-*` "defined in your app's globals.css") are false | |
| account-switcher demo/usage | composes into `topSlot` (docs only) | |
| Dependents (code) | **none** — `rich-sidebar` is a deprecated alias; file-tree/file-manager/account-switcher only mention it in comments | n/a |

**Reproductions (replayed at U5 / encoded as tests)**

| # | Input | Today | Expected |
|---|---|---|---|
| R1 (AS1) | `isCollapsed={false}` + `storageKey` with stored `collapsed:true`; click the toggle | storage `EXTERNAL_SYNC` sets raw `true`; toggle flips raw → `false` → `onCollapsedChange({collapsed:false})` = the current value → no-op first click | first click requests `true`; storage never reads/writes `collapsed` while controlled |
| R2 (AS2) | `isCollapsed` true, viewport < lg, open drawer | icon-only user footer, brand without label, icon-only Create, corner badges | full labels, inline-end badges, `isCollapsed:false` to slot render props |
| R3 (AS3) | ancestor declares `--ilinxa-nav-active-bg` | inline defaults on `<nav>`/wrapper/`SheetContent` win; drawer is portalled (ancestor vars never reach it) | ancestor wins on desktop and in the drawer |
| R4 (AS3) | 4 vars `--ilinxa-sidebar-row-h/-row-gap/-px`, `--ilinxa-nav-indent-step` | set, never read (inert-surface rule) | wired |
| R5 (AS5) | collapsed row with badge 5 | name = plain label (`aria-label` overrides content) | `labels.itemWithBadge(label, 5)` collapsed **and** expanded |

## U1 — Change contract

### API delta (v0.5.0)

- **`labels?: Partial<AppSidebarLabels>`** (+ exported `DEFAULT_APP_SIDEBAR_LABELS`, `AppSidebarLabels`), merged over the
  defaults (undefined keys keep defaults): `navigation` "Main navigation" · `expandSidebar` · `collapseSidebar` ·
  `openNavigation` "Open navigation" · `closeNavigation` "Close navigation" (own drawer close button replaces the
  primitive's sr-only "Close") · `skipToContent` · `loading` · `userMenu(name)` "{name} — open menu" ·
  `itemWithBadge(label, value)` "{label}, {value}" · `itemWithIndicator(label)` "{label}, new" ·
  `emptyState: Record<AppSidebarEmptyReason, {title, body?}>` (today's copy). Existing `aria-label`, `skipLinkLabel`,
  trigger `aria-label` props stay as overrides. Labels travel in context, so parts and `AppSidebarTrigger` (inside the
  subtree) read them.
- **AS1** — controlled `isCollapsed` / `isMobileOpen`: toggles and setters compute the requested value from the
  **rendered** (prop) value and call the callback directly; the raw reducer never diverges. `storageKey` neither reads
  nor writes `collapsed` while `isCollapsed` is defined (section state still persists; the stored `collapsed` is
  preserved untouched).
- **AS2** — the drawer renders its chrome inside a provider with `collapsed:false` and `mode:"mobile"`; render props in
  the drawer receive `isCollapsed:false`. `topSlot` also accepts `(args:{ mode, isCollapsed }) => ReactNode`;
  exported `useAppSidebarMode()` returns `"desktop" | "mobile" | null`.
- **AS3** — CSS variables are set inline **only** for props that were passed; every read carries its default as a
  `var(--x, default)` fallback, so ancestor declarations win. The drawer (portalled) copies the computed `--ilinxa-*`
  values from the in-tree wrapper when it opens. New: `drawerClassName`, `drawerStyle`; vars
  `--ilinxa-sidebar-bg` (`var(--card)`), `--ilinxa-sidebar-border` (`var(--border)`), `--ilinxa-sidebar-drawer-w`
  (`18rem` = today's `w-72`), `--ilinxa-nav-badge-corner-size` (`1rem`), `--ilinxa-nav-badge-halo` (`var(--card)`).
  The 4 inert vars are **wired** at their documented values (`row-h 2.75rem` = the prototype's `py-3` → rows grow
  from 2.5rem to 2.75rem; `row-gap 0.25rem`; `px 0.75rem`; `indent-step` **default `0`, expanded rail only** — changed during U2 from the
  documented 0.75rem, which would have shifted every section item and the collapsed-rail icons).
- **AS5** — a row whose badge is a number/string gets the accessible name `itemWithBadge(label, value)` collapsed and
  expanded; dot/pulse → `itemWithIndicator(label)`; hidden zero / `null` → plain label.
- **AS6/AS7 (C1)** — presence dots `bg-success` / `bg-muted-foreground` / `bg-destructive` / `bg-warning`;
  new badge tone `brand` (`bg-brand text-brand-foreground`) and `activeTone` (applied on the active row); surfaces
  via the vars above (consumers map them to `--sidebar-*`; defaults unchanged — decision 2). Item `cssVars.theme`:
  `color-success`, `color-warning(-foreground)`, `color-brand(-foreground)` with fallbacks (decision 4).
- **AS8 (C4)** — `side` / `mobileDrawerSide` accept `"start" | "end"` (default `"start"`; `"left"`/`"right"` kept);
  `dir` prop or computed direction; logical classes (`text-start`, `ms-auto`, `before:start-0`, `rounded-e`,
  `border-e`); tooltips open toward the content; ←/→ mirror in RTL; collapse icons mirror.
- **AS9** — `useAppSidebarState` forwards `isOwner`, `currentMaxMembers`, `bypassFiltering`, `keepEmptySections`.
- **AS10** — usage rewritten (status, `@/components/app-sidebar` import, module-scope link adapter, controlled/cookie
  example, RTL example).
- **C3** — `formatBadgeCount?: (value: number, max: number) => string` (default today's `"9+"` / `String`).
- **C6** — `badge: null` / `{ value: null }` renders nothing.
- **C9** — keyboard handler ignores editable targets (inputs in `topSlot` etc.).

### Contract matrix (C1–C12)

| Rule | v0.5.0 |
|---|---|
| C1 | presence + brand tokens via `cssVars.theme`; no raw palette |
| C2 | `labels` covers every string; badge-aware accessible names |
| C3 | `formatBadgeCount` |
| C4 | logical classes, start/end sides, mirrored keys/icons/tooltips, RTL demo |
| C5 | controlled collapse/open fixed (AS1); storage respects control |
| C6 | `null` badge renders nothing |
| C7 | existing permission gates; hook now forwards all gates (AS9) |
| C8 | n/a (avatar only) |
| C9 | editable-target guard; reduced motion already gated |
| C10 | deps pinned in item; served version = Part 1 R10 |
| C11 | tests: reducer/controlled (AS1), storage, filtering, active detection, roving keys + RTL keys, accessible names (AS5), drawer (AS2), CSS vars (AS3), labels sentinel walk (AS4), presence tokens (AS6), axe ×3 |
| C12 | prototype `/social/home` rail measured at U5 |

### Invariants

| # | Invariant | U4 | U5 |
|---|---|---|---|
| I1 | uncontrolled collapse/mobile + storage behave as 0.4.1 | | |
| I2 | controlled: toggle requests `!rendered`; rendered width changes only with the prop; no `setItem` writes a `collapsed` ≠ stored | | |
| I3 | drawer: full labels, inline-end badges, `isCollapsed:false` in render props, `mode:"mobile"` | | |
| I4 | ancestor `--ilinxa-*` wins on desktop and in the open drawer; prop-passed values still win over ancestors | | |
| I5 | every rendered string comes from `labels` (sentinel walk across expanded/collapsed/drawer/loading/empty) | | |
| I6 | badge accessible names per AS5 | | |
| I7 | RTL: border/active bar/tooltips/keys/drawer side mirror | | |
| I-neg | `state` (lifted hook) path, `renderItem`/`renderBadge` slots, `navAccessorySlot={null}`, `bypassFiltering` unchanged | | |

## Slice plan

| # | Slice | Owner | Status | Evidence |
|---|---|---|---|---|
| 1 | AS1 reducer/storage · AS9 hook · types (labels, sides, vars, topSlot fn) · context (`labels`, `mode`, `dir`, `formatBadgeCount`) · `app-sidebar.tsx` (drawer provider, var inheritance, close button, sides, toggle/skip labels) | architect | done | `hooks/use-sidebar-reducer.ts` (`stableDispatch` routes controlled collapse/mobile to callbacks), `hooks/use-storage-sync.ts` (`collapsedControlled`), `lib/labels.ts`, `lib/derive-css-vars.ts` (`APP_SIDEBAR_CSS_VARS`, `readInheritedCssVars`), `hooks/use-direction.ts`, `lib/keyboard-handler.ts` (`dir`, `isEditableTarget`), `contexts/sidebar-nav-context.tsx` (`useAppSidebarMode`) |
| 2 | parts: labels consumption, AS5 names, AS6/AS7 tokens + brand/activeTone + corner/halo vars, inert-var wiring, logical/RTL classes + tooltip side, keyboard RTL + editable guard, C3/C6 | implementer (Sonnet) + architect | done | 12 parts files; AS5 logic read (`sidebar-nav-row.tsx` badge-aware name + `aria-hidden` badge). Architect overrides: indent default **0** + expanded-only (wired at 0.75rem it would have shifted every section item and the collapsed-rail icons — decision 2, defaults kept); restored the dropped `all-hidden` empty-state body; stale `bottom-tab-bar-01` claims removed (component does not exist) |
| 3 | tests (C11) | implementer (Sonnet) | done | 7 new files + existing = **159 tests / 8 files**. axe surfaced **2 pre-existing defects** in `parts/sidebar-nav-section.tsx`: `<ul role="group">` orphaned its `<li>` rows (axe `listitem`, every state with sections) and a non-collapsible `<h6>` title broke heading order — **fixed by the architect** (plain `<ul aria-label>`, `aria-hidden` visual title); the `it.fails` markers flipped to hard zero-violation tests. Falsified: AS1 routing + storage reverted → both R1 tests fail; routing alone reverted → the 2nd-click test fails; drawer var copy removed → R3/I4 fails; all files restored byte-identical (`cmp`). Storage-only revert is unobservable once the routing fix exists (defence in depth). |
| 4 | demo + usage (AS10, RTL + controlled/cookie examples) | implementer (Sonnet) | done | `usage.tsx` rewritten (status, `@/components/app-sidebar`, module-scope `AppLink`, cookie, RTL, labels TR, badges, vars table, drawer, hook gates); `demo.tsx` +5 stacked sections (controlled, RTL Arabic, labels/badges TR, theming, drawer); architect fixed the usage indent default + a fallback-less var read in the demo |
| 5 | registry.json, globals.css, meta, trio docs | architect | done | item: +2 files, `lucide-react@^1.11.0`, `cssVars.theme` success/warning/brand(-fg) (validator 0 findings); globals `@theme` success/brand; meta 0.5.0 + features; description/plan v0.5.0 sections; **guide rewritten** (it still said v0.3.0 / CLI 4.6.0 / a tooltip primitive, claimed a non-existent `items` dev warning and used the unexported `TooltipWrapper`) |

## Gate battery (U3)

| Gate | Result |
|---|---|

## Findings table (U4)

| # | Finding | Source | Verdict | Evidence | Fix |
|---|---|---|---|---|---|
| U4-A | ⚠️ `--ilinxa-sidebar-drawer-w` inert on nova/base sheets (`data-[side=*]:w-3/4` outranks a plain width) — 0.4.1's `w-72` had the same defect (those drawers were 75% wide) | f1-F1 · f2-F4 | CONFIRMED | compiled CSS + tailwind-merge output (finders) | width emitted plain + `data-[side=left/right]:` so tailwind-merge drops the primitive's width on every style; 18rem everywhere (capped 24rem) |
| U4-B | 🔸 arrow-key roving does nothing in the drawer (focus effect queried the display:none desktop nav) — pre-existing, AS2 makes it primary | f1-F2 · f2-F9 | CONFIRMED | `app-sidebar.tsx` focus effect | focus root = drawer panel when it holds focus / is open |
| U4-C | 🔸 keys in a portalled menu (footer user menu, topSlot dropdown) bubble through React into the roving handler and steal focus | f1-F3 | CONFIRMED (reasoned) | no stopPropagation; React portal bubbling | `ownsArrowKeys` (menu / aria-haspopup) + ignore targets outside the handler's DOM |
| U4-D | 🔸 `renderBadge` returning null still announces the count; `badge:""` → "Label, " | f1-F4 · f1-F12 | CONFIRMED | `sidebar-nav-row.tsx` | `badgeShown` requires a rendered, non-empty badge |
| U4-E | 🔸 `storageKey` change never re-read (hasReadRef) | f1-F6b | CONFIRMED | `use-storage-sync.ts` | per-key read (`readKeyRef`) |
| U4-F | 🔹 controlled ref refreshed in a passive effect (same-commit handle call races) | f1-F8 | CONFIRMED (narrow) | — | iso layout effect |
| U4-G | ⚠️ `labels` typed `Partial<AppSidebarLabels>` — a partial `emptyState` (guide example) failed tsc | f2-F3 | CONFIRMED | types | `AppSidebarLabelsInput` (exported) |
| U4-H | 🔸 AS7 parity unreachable: row text / hover hard-coded to card tokens | f2-F6 | CONFIRMED | `active-variant-classes.ts`, parts | `--ilinxa-sidebar-fg`, `--ilinxa-nav-hover-bg` wired + guide mapping incl. halo, corner size, `--brand` |
| U4-I | 🔸 RTL chevron "mirror" a no-op (scale-x of a symmetric chevron) | f2-F8 | CONFIRMED | transform order | `-rotate-90 rtl:rotate-90` |
| U4-J | ⚠️ guide's hamburger example (sibling trigger, no `controls`) is dead; outside the subtree the trigger also can't read `labels` (English name) | f2-F1 · f2-F2 | CONFIRMED | `sidebar-nav-trigger.tsx` resolution order | guide/usage/meta: `controls` + own `aria-label`; follow-up FU-1 |
| U4-K | ⚠️ guide claims CLI 4.18 + 3.8.5 install proof before U5 | f2-F5 | CONFIRMED (timing) | loop file | U5 must prove it before ship (gate) |
| U4-L | ⚠️ guide's render-slot claims (all get `defaultRender`; all wrapped in `<li>`) | f2-F7 | CONFIRMED | types.ts, sidebar-nav-list | per-slot list |
| U4-M | 🔸 migration table missed 6 visible changes (section markup, `data-side`, expanded name, close button, `value: null`, drawer width truth) | f1-F7 · f2-F10 | CONFIRMED | — | rows added |
| U4-N | 🔸 older `sheet` without `showCloseButton` → English "Close" + duplicate X | f2-F11 | CONFIRMED | `...props` passthrough | guide: requirement + update command |
| U4-O | 🔸 indent default documented 0.75rem in description/plan/loop U1 vs 0 in code | f2-F12 | CONFIRMED | grep | all aligned to `0` (expanded only) |
| U4-P | 🔹 labels / formatter / linkComponent can't cross an RSC boundary (undocumented) | f2-F13 | CONFIRMED (doc) | — | guide note |
| U4-Q | 🔹 guide snippet nits (imports, shadowed var, undeclared ref), Enter/Space claim, `style` reach, `openMobile` on desktop, undocumented exported types | f2-F14,16–19 | CONFIRMED (doc) | — | guide + usage fixed |
| U4-R | 🔹 avatar initials cut emoji (UTF-16) / Turkish İ | f2-F15 | CONFIRMED | `derive-avatar-fallback.ts` | code points; Turkish via `avatarFallback` (documented in code) |
| U4-S | 🔹 `side="left"/"right"` border still flips in RTL (legacy hook) | f2-F20 | DROPPED (kept, documented) | v0.4 behaviour | guide: use `start`/`end` |
| U4-T | 🔸 name uses the raw value (25) while the pill shows "9+" (2.5.3); name replaces visible shortcut/accessory | f1-F5 | DROPPED (by spec — request: `itemWithBadge(label, value: number)` for pluralization; same name collapsed+expanded) | request AS5 | documented |
| U4-U | 🔸 controlled + nothing stored → the prop value seeds storage | f1-F6a | DROPPED (matches the request's own criterion "no write ≠ prop") | — | — |
| U4-V | 🔹 stale drawer var copy while open; inline `labels` identity churn; `topSlot` fn called for both modes; throwing `formatBadgeCount` | f1-F9,F10,F11,F13 | DROPPED (documented / consumer contract) | — | guide notes |

## Runtime & smoke evidence (U5)

- **Docs site (`next start`, host Playwright, 1440 + 375, light + dark) — 14/14:** controlled rail 256 → requested `true` on the FIRST click while the parent rejects (rail stays 256, R1 replayed) → accepted → 80; TR-labelled sidebar names `"Mesajlar, 1284 yeni"` / `"Bildirimler, yeni"` (R5) with no default English left (I5); RTL rail docked at the right edge, border on the left (content side), none on the right (I7); theming demo: `<nav>` has **no** inline `--ilinxa-*` and the ancestor's active background applies (R3/I4); drawer from a collapsed rail shows brand "Kasder", "Post", "Alex Morgan" and `topSlot mode: mobile` (R2/I3), `drawerStyle` width 320 px, `drawerClassName` applied, close button named "Close navigation" and no primitive sr-only "Close"; ArrowDown moves focus to the next row INSIDE the drawer (U4-B); 375 px drawer default 288 px (18rem — U4-A on a nova sheet); 0 console/page errors. Screenshots (scratchpad): drawer 375, RTL, collapsed rail, dark.
- **Prototype parity (C12, `/social/home` @1440):** rail 80 ↔ 256 px = our defaults; rows 44 px collapsed (our `--ilinxa-sidebar-row-h` 2.75rem default) / 48 px expanded; row radius 12 px → new `--ilinxa-nav-row-radius` (default `var(--radius-lg)` = v0.4 look; guide maps 0.75rem); corner badges 20 px / 12 px text → `--ilinxa-nav-badge-corner-size: 1.25rem` (guide mapping); active row a solid pill = `fill` variant.
- **Install (local `public/r`, consumer `@ilinxa` remapped, restored after):** CLI **4.18.0** base exit 0 (39 files, 129 s cold), fixtures exit 0, `--color-success/-warning/-brand/-brand-foreground` written into `@theme inline`, consumer tsc 0. CLI **3.8.5** base exit 0 (39 files), fixtures exit 0, consumer-owned `--color-brand` preserved on re-add, consumer tsc 0. → closes U4-K.

## Parked

- `useAppSidebarState` has no controlled collapse/mobile options (digest AS9 note) — not requested; next minor on demand.

## Pre-mortem (U7)

If this breaks for a consumer, it breaks because: their `sheet` lacks `showCloseButton` (old primitive → duplicate English close button), their header trigger sits outside the sidebar without `controls` / `aria-label`, or a theme relied on the 0.4 inline variable defaults winning over an ancestor declaration it did not mean to apply.

---

# Run 2 — follow-ups (Part 3 of the social-platform request)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **minor** — additive trigger `labels`, a keyboard fix, a dev warning) |
| **Current stage** | U1 — **awaiting sign-off** (bundled with the Part 3 proposal) |
| **Sign-off policy** | user-interactive. Run 1's delegation does not carry over. Ask before every push. |
| **Version target** | v0.5.1 → **v0.6.0** |
| **Started / updated** | 2026-10-25 / 2026-10-25 |

Source: run 1 review follow-ups (`reviews/2026-10-23-v0.5.0-hardening.md` §Follow-ups F-01…F-05) as listed in the
report-back (`.claude/report-back-2026-10-23-story-rail-app-sidebar.md` §"Not in this ship"). The platform's answer on
F-03 (keep the raw count in `itemWithBadge` so hosts can pluralize) was relayed in-session and recorded in the arc
handoff (`.claude/HANDOFF-2026-10-23-social-platform-hardening.md`, "app-sidebar follow-ups … RAW count … won't-change").

## Stage checklist (U-loop, run 2)

- [x] U0 Intake (architect, below)
- [ ] U1 Change contract — sign-off: pending
- [ ] U2 · [ ] U3 · [ ] U4 · [ ] U5 · [ ] U6 · [ ] U7

## U0 — Intake (run 2)

**Class: minor.** No code dependents (grep `registry.json`: nothing lists `@ilinxa/app-sidebar`). Already in the
contract gate's `closed` list. Built 209.43 KB / budget 230.

| Item | Code today | Verdict |
|---|---|---|
| F-01 outside trigger is English | `parts/sidebar-nav-trigger.tsx`: name = `aria-label` prop ?? context `labels.openNavigation` ?? English default; a sibling trigger has no context. Also: `aria-controls={ctx?.sidebarId}` is **absent** outside the subtree, even with `controls` | confirmed, wider (no `aria-controls` either) |
| F-02 rail arrow-key dead end | `lib/flatten-entries.ts` pushes every collapsible section header; the rail branch of `parts/sidebar-nav-section.tsx:51-80` renders no header (icon/divider is `aria-hidden`), so focus can land on an id with no node | confirmed |
| F-02 (wider) | in the rail, a section collapsed in expanded mode keeps its items hidden (`{!isCollapsed && …}` in the rail branch) and the rail has no control to expand it — its items are unreachable until the rail expands | confirmed. Pre-existing visual behaviour. Parked, see question 2 |
| F-03 formatted "9+" in the name | platform: keep the raw count | **won't change** (platform decision) |
| F-05 `state` silently ignores `isCollapsed` | `app-sidebar.tsx:291` `finalCollapsed = externalState?.collapsed ?? state.collapsed` | confirmed |

## U1 — Change contract (run 2, proposed)

- **F-01:** `AppSidebarTrigger` gets `labels?: Partial<Pick<AppSidebarLabels, "openNavigation">>` (same merge rules as
  the sidebar: `undefined` keeps the default). Name precedence: `aria-label` > trigger `labels` > context labels >
  default. `AppSidebarHandle` exposes `sidebarId` (read-only), so a trigger given `controls` sets `aria-controls`. A
  trigger inside the sidebar is unchanged.
- **F-02:** while the sidebar is collapsed (rail), `flattenEntriesForKeyboard` omits section headers, so the
  sequence matches what the rail renders. Expanded mode is unchanged.
- **F-05:** dev-only warning once when both `state` and `isCollapsed` are passed. No behaviour change.
- **Tests:** trigger outside the subtree (name from `labels`, `aria-controls` with `controls`); rail + collapsible
  section: ↓/↑ never lands on a missing node; dev-warn once; falsify each fix.

### Invariants

| # | Invariant |
|---|---|
| I1 | a trigger inside the sidebar: same name and markup as 0.5.1 |
| I2 | expanded-mode keyboard sequence unchanged (collapsible headers still focusable) |
| I3 | `itemWithBadge(label, value)` still gets the raw value |
| I-neg | no new props → 0.5.1 output |

### Size

+~1 KB → ~210.5 / 230.

### Platform reply (run 2)

Platform reply `E:/tmp/social-ui-v2/PROUI_REPLY_2026-10-25_PART3.md`: scope signed off as proposed, including every breaking change. Release order: (1) story-viewer 0.5.4 → 0.6.0 · (2) media-editor 0.5.0 + story-composer 0.6.0 · (3) filter-bar 0.3.0 + entity-picker 0.2.0 · (4) post-card 0.6.0 + comment-thread 0.4.0 · (5) carousel-composer 0.3.0 (+ content-composer patch) · (6) app-sidebar 0.6.0, whenever convenient.

- Release 6, whenever convenient. Contract unchanged.
