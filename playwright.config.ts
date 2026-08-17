import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config — the docs site on a PRODUCTION build, never the dev server.
 *
 * The dev server is banned here for two reasons learned the hard way in this
 * repo: Turbopack's compile-worker farm (~17 node procs / ~2.3GB) alongside a
 * browser run has previously come close to taking the machine down, and dev
 * output is not what ships. Run `pnpm build` first; this config starts
 * `next start` and reuses an already-running server if you have one.
 *
 * Deliberately OUT of `vercel-build`: E2E needs browser binaries and a live
 * server, which is the wrong cost to put on every deploy. The unit + component
 * tiers gate the deploy instead (see .claude/decisions/2026-08-17-test-tier.md).
 */

const PORT = Number(process.env.E2E_PORT ?? 4311);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // Full parallelism is pointless against one server and makes flake diagnosis
  // harder; these specs are few and fast.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  /**
   * `reuseExistingServer` is deliberately FALSE.
   *
   * The obvious setting is `true` — but this repo's own known-flakes list
   * records that killing a backgrounded `next start` on Windows leaves the node
   * child holding the port, so "something is listening on 4311" is NOT evidence
   * that it is serving the build you just made. Reusing it would let all five
   * specs pass green against a STALE build, which is precisely the
   * false-assurance failure this whole test tier exists to eliminate — it would
   * just have moved from the assertion layer to the infrastructure layer.
   *
   * With `false`, an occupied port makes Playwright fail loudly instead. Free it
   * first (`Get-NetTCPConnection -LocalPort 4311` → stop the PID), or set
   * `E2E_NO_SERVER=1` and point `E2E_BASE_URL` at a server you manage.
   */
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        command: `npx next start -p ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
