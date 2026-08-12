# Brand palette — pro-ui

Single source for diagram/banner colors. Derived from the site design tokens in `src/app/globals.css` (OKLCH is authoritative there; these are the sRGB equivalents used in flat assets).

| Role | Hex | Token origin | Use |
|---|---|---|---|
| Signal lime (accent) | `#a3e635` | `--primary` (dark) ≈ oklch(0.86 0.18 132) | accents, wordmark highlight, badges |
| Graphite canvas | `#15171c` | dark `--background` ≈ oklch(0.13 0.006 250) | banner/asset backgrounds |
| Ink on dark | `#e7e9ec` | dark `--foreground` | headings on graphite |
| Muted on dark | `#99a1ac` | dark `--muted-foreground` | taglines, captions |
| Neutral shape | `#5b6270` | mid-neutral of the cool ramp | secondary marks, separators |

Rules: lime always pairs with near-black or graphite (never white-on-lime); no pure-white backgrounds; keep lime chroma at or below the token value — don't "brighten" it. Assets must stay legible on both GitHub themes; the graphite canvas guarantees that.

Kit: `banner.svg` (1280×320, README hero) · `logo.svg` (48×48 square — same mark as the shadcn registry-directory entry, which uses a single-color `var(--foreground)` variant) · social preview lives at `public/og-image.png` (uploaded to GitHub Settings 2026-08-12).
