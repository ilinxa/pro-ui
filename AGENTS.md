<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Consumer contract

Registry components follow the consumer contract (C1–C12): semantic tokens, typed `labels`, locale-aware formatting, logical (RTL-safe) utilities, controlled data, guarded keyboard listeners, tests and packaging. Read [docs/component-guide.md §19](docs/component-guide.md#19-consumer-contract-c1c12) before writing or changing a component. `pnpm registry:build` and `pnpm lint` enforce it through `scripts/validate-contract.mjs`.
