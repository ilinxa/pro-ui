<!-- wl:security.report -->
# Security policy

## Reporting a vulnerability

Please don't open a public issue for security problems. Report privately via either channel:

- **GitHub:** [Report a vulnerability](https://github.com/ilinxa/pro-ui/security/advisories/new) (private advisory)
- **Email:** hessamhezaveh@gmail.com with `[pro-ui security]` in the subject

You'll get an acknowledgment within 7 days. If the report is valid, the fix ships as a patch bump to the affected component and the advisory is credited to you unless you prefer otherwise.
<!-- /wl -->

<!-- wl:security.versions -->
## Supported versions

pro-ui distributes source code that is copied into your project via the shadcn CLI — there is no runtime package to patch centrally. Only the **latest registry snapshot** (what `pnpm dlx shadcn@latest add @ilinxa/<slug>` installs today) receives fixes. If a vulnerability is found in a component, the fix lands in the registry and the changelog; already-installed copies must be re-pulled with `--overwrite`.

Per-component versions: [docs/component-versions.md](docs/component-versions.md).
<!-- /wl -->
