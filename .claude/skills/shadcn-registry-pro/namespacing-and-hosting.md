# Namespacing + hosting

## Consumer-side namespace registration

Consumer's `components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "registries": {
    "@ilinxa": "https://ilinxa.com/r/{name}.json"
  }
}
```

Then:
```bash
pnpm dlx shadcn add @ilinxa/properties-form
# resolves to GET https://ilinxa.com/r/properties-form.json
```

**Rules:**
- URL **MUST** include `{name}` placeholder — CLI validation rejects without it (see [issue #9370](https://github.com/shadcn-ui/ui/issues/9370)).
- Optional `{style}` placeholder for multi-theme libraries: `https://ilinxa.com/{style}/r/{name}.json`.
- Multiple namespaces in one project — `@v0`, `@shadcn`, `@ilinxa`, etc. — work in parallel.

## String form (public registry)

```json
{ "registries": { "@ilinxa": "https://ilinxa.com/r/{name}.json" } }
```

For public registries this is all you need. No auth, no headers, no env vars.

## Object form (private / authenticated)

```json
{
  "registries": {
    "@private": {
      "url": "https://api.company.com/registry/{name}.json",
      "headers": {
        "Authorization": "Bearer ${REGISTRY_TOKEN}",
        "X-API-Key": "${API_KEY}"
      },
      "params": {
        "version": "latest"
      }
    }
  }
}
```

`${VAR}` env interpolation:
- Read at fetch time from process env (`.env.local` is auto-loaded).
- Never logged by the CLI.
- Each registry maintains isolated auth context — `@private`'s headers don't leak to `@public` calls.

`params` are passed to the registry endpoint as additional request parameters (likely query-string in GET requests, but exact wire format isn't documented — verify with a request capture if your endpoint is param-sensitive).

## Hosting on Vercel

1. Connect the repo via Vercel dashboard OR `vercel deploy` from CLI. Free tier is sufficient for a public registry.
2. Build emits `public/r/*.json`. Next.js serves `public/` as static assets — no extra config.
3. URL becomes `https://<project>.vercel.app/r/<slug>.json`.
4. Optional: custom domain via Vercel dashboard → DNS records → done.

**No CORS configuration needed** for public registries (CLI is server-side fetch, not browser).

**Cache headers** — static `public/` files get Vercel's default CDN caching. Override via `vercel.json` if you want short revalidation:
```json
{
  "headers": [
    {
      "source": "/r/(.*).json",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=300, must-revalidate" }]
    }
  ]
}
```
5 min revalidate is reasonable; consumers don't expect instant propagation, but a multi-hour cache feels broken when you push a fix.

## Content-negotiation rewrite (branded URL trick)

To enable `pnpm dlx shadcn add https://ilinxa.com` (no `/r/<slug>.json` suffix), use Next's `rewrites` to vary on `Accept`:

```ts
// next.config.ts
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          has: [
            {
              type: "header",
              key: "accept",
              value: "(.*)application/vnd\\.shadcn\\.v1\\+json(.*)",
            },
          ],
          destination: "/r/index.json",
        },
      ],
    };
  },
  async headers() {
    return [
      {
        source: "/",
        headers: [{ key: "Vary", value: "Accept, User-Agent" }],
      },
    ];
  },
};
```

Now:
- Browser visiting `https://ilinxa.com` gets the docs site.
- CLI hitting it (`Accept: application/vnd.shadcn.v1+json`) gets the registry index.

The `Vary` header tells CDNs to cache both responses separately.

This trick is **optional** — only worth it if you want the cleaner `shadcn add https://ilinxa.com` consumer UX. The non-branded `shadcn add @ns/<slug>` and `shadcn add https://ilinxa.com/r/<slug>.json` flows work without it.

Verify with curl:
```bash
curl -H "Accept: application/vnd.shadcn.v1+json" https://ilinxa.com
# should return registry index JSON, not HTML
```

## Hosting alternatives

| Host | OK? | Notes |
|---|---|---|
| Vercel | ✅ Best for Next apps | Zero config |
| Netlify | ✅ | Static `public/` works the same way |
| Cloudflare Pages | ✅ | Static publishing |
| GitHub Pages | ✅ but watch the cache | jsdelivr-fronted Pages can cache aggressively; bust with `?v=<hash>` if you re-publish often |
| S3 + CloudFront | ✅ for enterprise | Set `Content-Type: application/json` on uploads (not auto-detected) |
| ngrok / cloudflared (dev) | ✅ for smoke testing | Tunnel `pnpm dev` → public URL → `pnpm dlx shadcn add` from a tmp consumer app on a different machine |

## Multi-purpose namespace patterns

If you ship distinct categories (UI primitives + hooks + auth helpers), consider a single namespace with subpath routing:
```json
{
  "registries": {
    "@acme": "https://registry.acme.com/{name}.json"
  }
}
```
Then your `registry.json` items can have names like `ui-button`, `hook-use-debounce`, `auth-jwt-helper`. Discoverable via the index, scoped by name prefix.

OR multiple namespaces for clearer separation:
```json
{
  "registries": {
    "@acme-ui": "https://acme.com/ui/{name}.json",
    "@acme-hooks": "https://acme.com/hooks/{name}.json"
  }
}
```
Either works. Pick based on how you want consumers to mentally organize your library.
