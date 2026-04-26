# OAuth Authorization

Read this when adding authentication and authorization to MCP servers. Covers OAuth 2.1 for MCP, Protected Resource Metadata, CIMD, DCR, PKCE, Resource Indicators, and token handling.

## Table of Contents
1. [MCP Auth Model Overview](#1-mcp-auth-model-overview)
2. [MCP Server as OAuth Resource Server](#2-mcp-server-as-oauth-resource-server)
3. [Protected Resource Metadata (RFC 9728)](#3-protected-resource-metadata-rfc-9728)
4. [Authorization Server Discovery](#4-authorization-server-discovery)
5. [CIMD — Client ID Metadata Documents](#5-cimd--client-id-metadata-documents)
6. [Dynamic Client Registration (DCR)](#6-dynamic-client-registration-dcr)
7. [PKCE (Proof Key for Code Exchange)](#7-pkce-proof-key-for-code-exchange)
8. [Resource Indicators (RFC 8707)](#8-resource-indicators-rfc-8707)
9. [Incremental Scope Consent](#9-incremental-scope-consent)
10. [Token Handling in Streamable HTTP](#10-token-handling-in-streamable-http)
11. [TS SDK OAuth Helpers](#11-ts-sdk-oauth-helpers)
12. [Authorization Extensions](#12-authorization-extensions)
13. [Implementation Checklist](#13-implementation-checklist)

---

## 1. MCP Auth Model Overview

MCP uses standard **OAuth 2.1** for authorization. The model maps cleanly:

| OAuth Role | MCP Component |
|---|---|
| Resource Server | MCP Server (protects tools/resources/prompts) |
| Client | MCP Client (requests access on behalf of user) |
| Authorization Server | External IdP (Auth0, Okta, Keycloak, custom) |
| Resource Owner | End user |

**Key principle:** MCP servers don't handle user credentials directly. They delegate authentication to an Authorization Server and validate access tokens.

### Auth Only Applies to Streamable HTTP

- **stdio** servers don't need OAuth — they run as local child processes with the same user permissions
- **Streamable HTTP** servers exposed over the network need auth to prevent unauthorized access

---

## 2. MCP Server as OAuth Resource Server

Your MCP server validates access tokens on incoming requests:

```typescript
import { verifyAccessToken } from "./auth.js";

app.use("/mcp", async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      error: "unauthorized",
      error_description: "Bearer token required",
    });
    // Include WWW-Authenticate header for auth discovery
    res.setHeader("WWW-Authenticate", 'Bearer resource_metadata="https://my-server.example.com/.well-known/oauth-protected-resource"');
    return;
  }

  const token = authHeader.slice(7);
  try {
    const claims = await verifyAccessToken(token);
    req.user = claims;
    next();
  } catch {
    res.status(401).json({ error: "invalid_token" });
    return;
  }
});
```

**The server's job:**
1. Check for `Authorization: Bearer <token>` header
2. Validate the token (verify signature, check expiration, check scopes)
3. Return `401` with `WWW-Authenticate` header if invalid/missing
4. Proceed with the request if valid

---

## 3. Protected Resource Metadata (RFC 9728)

MCP servers advertise their auth requirements via a well-known endpoint. This is how clients discover what authorization server to use.

### Server publishes metadata

```http
GET /.well-known/oauth-protected-resource HTTP/1.1
Host: my-server.example.com
```

```json
{
  "resource": "https://my-server.example.com",
  "authorization_servers": [
    "https://auth.example.com"
  ],
  "scopes_supported": ["tools:read", "tools:write", "resources:read"],
  "bearer_methods_supported": ["header"]
}
```

### How clients discover auth

1. Client sends a request to the MCP server without a token
2. Server returns `401` with `WWW-Authenticate: Bearer resource_metadata="https://.../.well-known/oauth-protected-resource"`
3. Client fetches the protected resource metadata
4. Client discovers the authorization server URL
5. Client follows standard OAuth 2.1 flow to get a token

---

## 4. Authorization Server Discovery

After getting the authorization server URL from Protected Resource Metadata, clients discover its configuration:

### OpenID Connect Discovery

```http
GET /.well-known/openid-configuration HTTP/1.1
Host: auth.example.com
```

Returns endpoints for authorization, token exchange, etc.

### OAuth Authorization Server Metadata (RFC 8414)

```http
GET /.well-known/oauth-authorization-server HTTP/1.1
Host: auth.example.com
```

### WWW-Authenticate Header

The initial 401 response includes discovery information:

```http
WWW-Authenticate: Bearer resource_metadata="https://my-server.example.com/.well-known/oauth-protected-resource"
```

**Discovery chain:** 401 response → Protected Resource Metadata → Authorization Server URL → AS Metadata → OAuth flow

---

## 5. CIMD — Client ID Metadata Documents

CIMD is the **new default** for client registration in MCP (replaces DCR as primary method in spec `2025-11-25`).

### How CIMD Works

Instead of registering with the authorization server dynamically, the MCP client publishes a metadata document at a URL, and provides that URL as its `client_id`:

```json
// Client publishes at: https://my-client.example.com/.well-known/oauth-client
{
  "client_id": "https://my-client.example.com",
  "client_name": "My MCP Client",
  "redirect_uris": ["https://my-client.example.com/callback"],
  "grant_types": ["authorization_code"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none"
}
```

### Why CIMD Over DCR

| Aspect | CIMD | DCR |
|---|---|---|
| Registration | No registration needed — publish metadata | Must register with each auth server |
| Client ID | URL where metadata is hosted | Server-assigned string |
| Scalability | Works with any auth server that supports it | Must register per-server |
| Default in MCP | Yes (2025-11-25+) | Backwards compat only |

### Authorization Server Validates CIMD

1. Client sends `client_id=https://my-client.example.com` in auth request
2. Auth server fetches `https://my-client.example.com/.well-known/oauth-client`
3. Auth server validates the metadata
4. Auth flow proceeds normally

---

## 6. Dynamic Client Registration (DCR)

Legacy method — still supported for backwards compatibility:

```http
POST /register HTTP/1.1
Host: auth.example.com
Content-Type: application/json

{
  "client_name": "My MCP Client",
  "redirect_uris": ["http://localhost:8080/callback"],
  "grant_types": ["authorization_code"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none"
}
```

Response:

```json
{
  "client_id": "assigned-client-id-123",
  "client_secret": "optional-secret",
  "registration_access_token": "...",
  "registration_client_uri": "..."
}
```

**Use DCR only when:**
- Connecting to auth servers that don't support CIMD
- Working with legacy MCP infrastructure
- Client can't host a public metadata document

---

## 7. PKCE (Proof Key for Code Exchange)

PKCE is **mandatory** in MCP OAuth 2.1 — all authorization code flows must use it.

### How PKCE Works

```
Client                            Auth Server
  │                                  │
  │  1. Generate random code_verifier│
  │  2. Hash it → code_challenge     │
  │                                  │
  │── Authorization Request ────────►│  Includes code_challenge + method
  │◄── Authorization Code ────────── │
  │                                  │
  │── Token Request ────────────────►│  Includes code_verifier
  │   (auth server verifies hash)    │
  │◄── Access Token ────────────── │
```

### Implementation

```typescript
import crypto from "crypto";

// Step 1: Generate code verifier (43-128 chars, URL-safe)
const codeVerifier = crypto.randomBytes(32).toString("base64url");

// Step 2: Create code challenge (S256 = SHA-256 hash, base64url encoded)
const codeChallenge = crypto
  .createHash("sha256")
  .update(codeVerifier)
  .digest("base64url");

// Step 3: Include in authorization request
const authUrl = new URL("https://auth.example.com/authorize");
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("client_id", clientId);
authUrl.searchParams.set("redirect_uri", redirectUri);
authUrl.searchParams.set("code_challenge", codeChallenge);
authUrl.searchParams.set("code_challenge_method", "S256");

// Step 4: Include verifier in token exchange
const tokenResponse = await fetch("https://auth.example.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "authorization_code",
    code: authorizationCode,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,  // Auth server hashes this and compares
  }),
});
```

**MCP requires S256** — the `plain` method is not allowed.

---

## 8. Resource Indicators (RFC 8707)

Prevent token mis-redemption — a token issued for Server A shouldn't work on Server B:

### Client includes resource indicator in auth request

```
GET /authorize?
  response_type=code&
  client_id=my-client&
  resource=https://mcp-server-a.example.com&  ← Specific server
  code_challenge=...&
  code_challenge_method=S256
```

### Token is audience-restricted

The resulting token has `aud: "https://mcp-server-a.example.com"` and only works on that server.

### Server validates audience

```typescript
const claims = await verifyToken(token);
if (claims.aud !== "https://mcp-server-a.example.com") {
  throw new Error("Token not intended for this server");
}
```

---

## 9. Incremental Scope Consent

MCP supports requesting additional permissions as needed, rather than all upfront:

### How It Works

1. Client initially gets token with basic scopes: `tools:read resources:read`
2. User invokes a write tool
3. Server returns `403` with `WWW-Authenticate`:

```http
HTTP/1.1 403 Forbidden
WWW-Authenticate: Bearer scope="tools:write", error="insufficient_scope"
```

4. Client requests additional scope from the auth server
5. User grants the new permission
6. Client retries with upgraded token

**Benefits:** Users only grant permissions when needed (principle of least privilege).

---

## 10. Token Handling in Streamable HTTP

### Client sends token on every request

```http
POST /mcp HTTP/1.1
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
mcp-session-id: abc-123

{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{...}}
```

### Token refresh

Clients should handle token expiration:
1. Server returns `401` when token expires
2. Client refreshes the token using the refresh token
3. Client retries the request with the new access token

### No token in stdio

Stdio servers don't use OAuth — they inherit the user's local permissions. Don't add auth middleware to stdio servers.

---

## 11. TS SDK OAuth Helpers

The SDK provides OAuth client helpers for building MCP clients that connect to auth-protected servers:

```typescript
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const transport = new StreamableHTTPClientTransport(
  new URL("https://mcp-server.example.com/mcp"),
  {
    authProvider: {
      // Called when server returns 401
      authenticate: async (serverUrl, resourceMetadata) => {
        // Implement OAuth flow here
        return accessToken;
      },
      // Called to get current token
      getToken: async () => currentToken,
      // Called when token is rejected
      refreshToken: async () => {
        // Refresh token logic
        return newToken;
      },
    },
  }
);
```

---

## 12. Authorization Extensions

Spec `2025-11-25` introduced Authorization Extensions via the Extensions framework:

### M2M (Machine-to-Machine) — SEP-1046

OAuth client-credentials flow for server-to-server auth without a human user:

```http
POST /token HTTP/1.1
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&
client_id=my-mcp-agent&
client_secret=secret&
scope=tools:read
```

Use for: Automated agents, background workers, system integrations.

### Cross App Access — SEP-990

Enterprise SSO integration. Users sign in once to the MCP client and get access to all authorized MCP servers without additional prompts:

- Uses enterprise IdP (Okta, Azure AD, etc.)
- Policy-controlled access per MCP server
- Single sign-on across the MCP ecosystem

---

## 13. Implementation Checklist

### For Streamable HTTP Servers Requiring Auth

- [ ] Publish Protected Resource Metadata at `/.well-known/oauth-protected-resource`
- [ ] Return `401` with `WWW-Authenticate` header for unauthenticated requests
- [ ] Validate Bearer tokens on every request (signature, expiration, audience)
- [ ] Check scopes before allowing tool/resource access
- [ ] Support incremental scope consent (return 403 with required scope)
- [ ] Validate Resource Indicators (`aud` claim in token)
- [ ] Handle token refresh gracefully (don't break sessions on expiry)
- [ ] HTTPS only — never accept tokens over HTTP
- [ ] Log auth events for audit trail

### For MCP Clients Connecting to Auth-Protected Servers

- [ ] Detect `401` responses and initiate OAuth flow
- [ ] Fetch Protected Resource Metadata from `WWW-Authenticate` header
- [ ] Use PKCE with S256 for all authorization code flows
- [ ] Use CIMD for client registration (preferred) or DCR (fallback)
- [ ] Include Resource Indicators in authorization requests
- [ ] Handle incremental scope requests
- [ ] Manage token lifecycle (storage, refresh, expiration)
