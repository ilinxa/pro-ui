# Testing & Debugging

Read this when testing MCP servers, debugging connection issues, or writing unit/integration tests. Covers MCP Inspector, mock transports, Jest/Vitest/pytest patterns, and common error scenarios.

## Table of Contents
1. [Testing Strategy](#1-testing-strategy)
2. [MCP Inspector](#2-mcp-inspector)
3. [Mock Transports for Unit Testing](#3-mock-transports-for-unit-testing)
4. [Unit Testing Tools (TypeScript)](#4-unit-testing-tools-typescript)
5. [Unit Testing Tools (Python)](#5-unit-testing-tools-python)
6. [Integration Testing](#6-integration-testing)
7. [Testing Streamable HTTP Servers](#7-testing-streamable-http-servers)
8. [Error Scenario Testing](#8-error-scenario-testing)
9. [Debugging Techniques](#9-debugging-techniques)
10. [CI/CD Integration](#10-cicd-integration)

---

## 1. Testing Strategy

MCP servers should be tested at three levels:

| Level | What | How |
|---|---|---|
| **Unit** | Individual tool handlers, validation, business logic | Mock transport, call handlers directly |
| **Integration** | Full protocol flow (initialize → tool call → response) | In-memory transport, client+server in same process |
| **End-to-End** | Real client → real server | MCP Inspector, Claude Desktop, curl |

**Minimum for production:** Unit tests for all tool handlers + MCP Inspector manual verification.

---

## 2. MCP Inspector

The official interactive debugging tool for MCP servers:

### Installation & Usage

```bash
# Run against a stdio server
npx @modelcontextprotocol/inspector node build/index.js

# Run against a Python server
npx @modelcontextprotocol/inspector uv run server.py

# Run against a Streamable HTTP server
npx @modelcontextprotocol/inspector --url http://localhost:3000/mcp
```

### What Inspector Does

- Connects to your server as an MCP client
- Shows the `initialize` handshake and capabilities
- Lists all tools, resources, and prompts
- Lets you call tools with custom arguments
- Displays raw JSON-RPC messages
- Shows errors and validation failures

### Inspector Workflow

1. Start Inspector with your server command
2. Verify capabilities are declared correctly
3. Test each tool with various inputs (valid + invalid)
4. Check resource reads
5. Verify error responses for edge cases
6. Watch for `console.log` contamination (shows as JSON parse errors)

### When to Use

- After creating a new server (first test)
- After adding/changing tools
- When debugging client connection issues
- Before deploying to production

---

## 3. Mock Transports for Unit Testing

Test server logic without real transport connections:

### TypeScript — InMemoryTransport

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

async function createTestPair() {
  const server = createMyServer();  // Your server factory
  const client = new Client({ name: "test-client", version: "1.0.0" });

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  return { server, client };
}
```

This creates an in-process client-server pair connected via memory — no network, no stdio, fast tests.

---

## 4. Unit Testing Tools (TypeScript)

### Vitest / Jest Pattern

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../src/server.js";

describe("MCP Server", () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const server = createServer();
    client = new Client({ name: "test", version: "1.0.0" });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    cleanup = async () => {
      await client.close();
      await server.close();
    };
  });

  afterAll(async () => {
    await cleanup();
  });

  it("should list tools", async () => {
    const result = await client.listTools();
    expect(result.tools).toHaveLength(3);
    expect(result.tools.map(t => t.name)).toContain("greet");
  });

  it("should call greet tool", async () => {
    const result = await client.callTool({
      name: "greet",
      arguments: { name: "World" },
    });

    expect(result.content).toHaveLength(1);
    expect(result.content[0]).toMatchObject({
      type: "text",
      text: expect.stringContaining("Hello, World"),
    });
  });

  it("should handle missing required args", async () => {
    const result = await client.callTool({
      name: "greet",
      arguments: {},  // Missing 'name'
    });

    // SDK returns error for validation failure
    expect(result.isError).toBe(true);
  });

  it("should list resources", async () => {
    const result = await client.listResources();
    expect(result.resources.length).toBeGreaterThan(0);
  });

  it("should read a resource", async () => {
    const result = await client.readResource({ uri: "info://server" });
    expect(result.contents).toHaveLength(1);
    expect(result.contents[0].text).toBeDefined();
  });
});
```

### Testing Error Responses

```typescript
it("should return isError for not-found", async () => {
  const result = await client.callTool({
    name: "read_file",
    arguments: { path: "/nonexistent/file.txt" },
  });

  expect(result.isError).toBe(true);
  expect(result.content[0].text).toContain("not found");
});
```

### Testing Structured Outputs

```typescript
it("should return structured content", async () => {
  const result = await client.callTool({
    name: "get_weather",
    arguments: { city: "London" },
  });

  expect(result.structuredContent).toBeDefined();
  expect(result.structuredContent.temperature).toBeTypeOf("number");
  expect(result.structuredContent.conditions).toBeTypeOf("string");
});
```

---

## 5. Unit Testing Tools (Python)

### pytest Pattern

```python
import pytest
from mcp.server.fastmcp import FastMCP

# Import your server
from server import mcp


@pytest.mark.asyncio
async def test_greet_tool():
    """Test the greet tool returns a greeting."""
    # Call the tool function directly
    result = await mcp._tool_manager.call_tool("greet", {"name": "World"})
    assert "Hello, World" in result


@pytest.mark.asyncio
async def test_greet_missing_name():
    """Test the greet tool with missing argument."""
    with pytest.raises(Exception):
        await mcp._tool_manager.call_tool("greet", {})
```

### Integration Test with Client

```python
import pytest
from mcp import ClientSession
from mcp.client.stdio import stdio_client

@pytest.mark.asyncio
async def test_server_integration():
    """Full integration test with client-server pair."""
    async with stdio_client(
        command="uv",
        args=["run", "server.py"],
    ) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # List tools
            tools = await session.list_tools()
            assert len(tools.tools) > 0

            # Call a tool
            result = await session.call_tool("greet", {"name": "Test"})
            assert any("Hello" in c.text for c in result.content if c.type == "text")
```

---

## 6. Integration Testing

Full protocol flow with in-memory transport:

### Protocol Lifecycle Test

```typescript
it("should complete full lifecycle", async () => {
  const { client } = await createTestPair();

  // 1. Client is initialized (done in setup)
  // 2. List tools
  const tools = await client.listTools();
  expect(tools.tools.length).toBeGreaterThan(0);

  // 3. Call each tool with valid args
  for (const tool of tools.tools) {
    const args = generateValidArgs(tool.inputSchema);
    const result = await client.callTool({ name: tool.name, arguments: args });
    expect(result.content).toBeDefined();
    expect(result.content.length).toBeGreaterThan(0);
  }

  // 4. List resources
  const resources = await client.listResources();

  // 5. Read each resource
  for (const resource of resources.resources) {
    const content = await client.readResource({ uri: resource.uri });
    expect(content.contents.length).toBeGreaterThan(0);
  }

  // 6. List prompts
  const prompts = await client.listPrompts();

  // 7. Get each prompt
  for (const prompt of prompts.prompts) {
    const args = generateValidArgs(prompt.arguments);
    const result = await client.getPrompt({ name: prompt.name, arguments: args });
    expect(result.messages.length).toBeGreaterThan(0);
  }
});
```

---

## 7. Testing Streamable HTTP Servers

### curl Testing

```bash
# Initialize
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-11-25",
      "capabilities": {},
      "clientInfo": {"name": "curl-test", "version": "1.0.0"}
    }
  }' -v

# Extract session ID from mcp-session-id response header, then:

# List tools
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: SESSION_ID_HERE" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list"
  }'

# Call a tool
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: SESSION_ID_HERE" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "greet",
      "arguments": {"name": "World"}
    }
  }'

# Close session
curl -X DELETE http://localhost:3000/mcp \
  -H "mcp-session-id: SESSION_ID_HERE"
```

### Supertest (Express Integration)

```typescript
import request from "supertest";

it("should initialize via HTTP", async () => {
  const res = await request(app)
    .post("/mcp")
    .send({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "test", version: "1.0.0" },
      },
    })
    .expect(200);

  expect(res.headers["mcp-session-id"]).toBeDefined();
  expect(res.body.result.capabilities).toBeDefined();
});
```

---

## 8. Error Scenario Testing

Always test failure paths:

```typescript
describe("Error handling", () => {
  it("should handle unknown tool", async () => {
    await expect(
      client.callTool({ name: "nonexistent_tool", arguments: {} })
    ).rejects.toThrow();
  });

  it("should handle invalid arg types", async () => {
    const result = await client.callTool({
      name: "search",
      arguments: { query: 123 },  // Should be string
    });
    expect(result.isError).toBe(true);
  });

  it("should handle server-side exceptions gracefully", async () => {
    // Tool that triggers an internal error
    const result = await client.callTool({
      name: "risky_operation",
      arguments: { path: "/root/forbidden" },
    });
    // Should return error message, not crash
    expect(result.content[0].text).toBeDefined();
  });

  it("should handle empty arguments", async () => {
    const result = await client.callTool({
      name: "search",
      arguments: { query: "" },
    });
    // Tool should handle empty input gracefully
    expect(result.content).toBeDefined();
  });
});
```

---

## 9. Debugging Techniques

### Stderr Logging (stdio)

```typescript
// Add debug logging to your server
console.error("[DEBUG] Tool called:", toolName, JSON.stringify(args));
console.error("[DEBUG] Response:", JSON.stringify(result).slice(0, 200));
```

### MCP Inspector

```bash
# Interactive debugging
npx @modelcontextprotocol/inspector node build/index.js

# With environment variables
API_KEY=xxx npx @modelcontextprotocol/inspector node build/index.js
```

### Node.js Debugger

```bash
# Start with debugger
node --inspect build/index.js

# Then connect Chrome DevTools or VS Code debugger
```

### Raw JSON-RPC Debugging

For stdio servers, you can pipe JSON directly:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node build/index.js 2>/dev/null
```

### Common Debug Patterns

| Symptom | Likely Cause | Debug Action |
|---|---|---|
| No response from server | `console.log` on stdio | Check for stdout writes |
| JSON parse error on client | Non-JSON on stdout | Redirect stderr: `2>debug.log` |
| Tool not found | Name mismatch | Check `tools/list` response |
| Validation error | Schema mismatch | Compare args with `inputSchema` |
| Session not found (HTTP) | Missing session header | Check `mcp-session-id` header |
| Server crashes silently | Unhandled rejection | Add global error handler |

---

## 10. CI/CD Integration

### GitHub Actions Example

```yaml
name: MCP Server Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"

      - run: npm ci
      - run: npm run build
      - run: npm test

      # Optional: smoke test with Inspector
      - name: Smoke test
        run: |
          timeout 10 npx @modelcontextprotocol/inspector \
            --test node build/index.js || true
```

### Test Scripts in package.json

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:inspect": "npx @modelcontextprotocol/inspector node build/index.js"
  }
}
```

### pytest Configuration

```toml
# pyproject.toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```
