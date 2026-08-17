import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Force the test build of React, whatever the ambient environment says.
 *
 * Vitest only defaults `NODE_ENV` to `test` when it is UNSET. Vercel exports
 * `NODE_ENV=production` for the entire build, so `pnpm vercel-build` ran the
 * suite against `react-dom.production.js` — which does not ship `act` — and
 * every `@testing-library/react` render died with
 * "TypeError: React.act is not a function" (24/24 component tests, deploy
 * blocked). This assignment lands before Vite resolves the config and before
 * any worker forks, so React/react-dom load their development entry.
 */
// (`NODE_ENV` is typed read-only by @types/node; the cast is the assignment,
// not a behavior change.)
(process.env as { NODE_ENV?: string }).NODE_ENV = "test";

/**
 * Two projects, split by environment:
 *
 *   - `lib`        — pure-logic tests (parsers, reducers, validators). No DOM,
 *                    node environment, fast. `*.test.ts` only.
 *   - `components`  — React component tests. jsdom environment,
 *                    @vitejs/plugin-react for JSX/Fast Refresh-free transform,
 *                    Testing Library + jest-dom matchers. `*.test.tsx` only.
 *
 * Kept separate so the lib tier (the highest-value, cheapest-to-run tier —
 * see docs/plans/test-infrastructure-plan.md §R1) never pays jsdom's boot
 * cost, and so a lib-only change can run `pnpm test:lib` for fast feedback.
 */
export default defineConfig({
  test: {
    projects: [
      {
        plugins: [tsconfigPaths()],
        test: {
          name: "lib",
          environment: "node",
          include: ["src/registry/**/__tests__/**/*.test.ts"],
        },
      },
      {
        plugins: [tsconfigPaths(), react()],
        test: {
          name: "components",
          environment: "jsdom",
          include: ["src/registry/**/__tests__/**/*.test.tsx"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
      {
        // `repo` — guards on repo-level configuration rather than library code
        // (e.g. the consumer-strict tsconfig flags). Deliberately OUTSIDE
        // `src/` so the registry's folder-walking validators never see it: a
        // new file class under src/registry once broke every one of them.
        plugins: [tsconfigPaths()],
        test: {
          name: "repo",
          environment: "node",
          include: ["tests/**/*.test.ts"],
        },
      },
    ],
  },
});
