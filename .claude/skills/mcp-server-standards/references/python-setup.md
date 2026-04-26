# Python Server Setup

Read this when creating a new Python MCP server. Covers project scaffolding with `uv`, FastMCP (official high-level API), both transports, lifespan management, the low-level Server class, and complete starter templates.

## Table of Contents
1. [Project Scaffolding](#1-project-scaffolding)
2. [FastMCP — The Official High-Level API](#2-fastmcp--the-official-high-level-api)
3. [Tool Registration](#3-tool-registration)
4. [Resource Registration](#4-resource-registration)
5. [Prompt Registration](#5-prompt-registration)
6. [Transport Options](#6-transport-options)
7. [Lifespan Management](#7-lifespan-management)
8. [Logging](#8-logging)
9. [Structured Outputs](#9-structured-outputs)
10. [Dependencies Declaration](#10-dependencies-declaration)
11. [Low-Level Server Class](#11-low-level-server-class)
12. [Complete Starter: Stdio Server](#12-complete-starter-stdio-server)
13. [Complete Starter: Streamable HTTP Server](#13-complete-starter-streamable-http-server)
14. [Common Errors](#14-common-errors)

---

## 1. Project Scaffolding

```bash
# Install uv (recommended package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create project
uv init my-mcp-server
cd my-mcp-server

# Create virtual environment
uv venv
source .venv/bin/activate  # macOS/Linux
# .venv\Scripts\activate   # Windows

# Install MCP SDK
uv add "mcp[cli]"

# Pin for stability (v2 in development)
# In pyproject.toml: mcp = ">=1.25,<2"

# Create server file
touch server.py
```

### pyproject.toml — Key Settings

```toml
[project]
name = "my-mcp-server"
version = "1.0.0"
requires-python = ">=3.10"
dependencies = [
    "mcp[cli]>=1.25,<2",
]

[project.scripts]
my-mcp-server = "my_mcp_server.server:main"
```

**Minimum Python:** 3.10 (required by the SDK for type hint features).

---

## 2. FastMCP — The Official High-Level API

FastMCP is built into the official `mcp` package. It uses decorators and type hints to automatically generate tool/resource/prompt definitions:

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("my-server")
```

**CRITICAL:** Do not confuse with the standalone `fastmcp` package (by Jlowin). They are different projects with different APIs:

```python
# ✅ CORRECT — official SDK
from mcp.server.fastmcp import FastMCP

# ❌ WRONG — different community package
from fastmcp import FastMCP
```

---

## 3. Tool Registration

Tools are functions the LLM can call. Use the `@mcp.tool()` decorator:

```python
@mcp.tool()
async def calculate_sum(a: float, b: float) -> str:
    """Calculate the sum of two numbers.

    Args:
        a: First number to add.
        b: Second number to add.
    """
    return str(a + b)
```

**How it works:**
- Function name → tool name
- Docstring first line → tool description (shown to LLM)
- `Args:` section → parameter descriptions
- Type hints → JSON Schema types (str→string, int→integer, float→number, bool→boolean)
- Return value is automatically wrapped in a text content response

### Complex Parameters

```python
from typing import Optional, Literal

@mcp.tool()
async def search_database(
    query: str,
    limit: int = 10,
    sort_by: Literal["date", "relevance", "name"] = "relevance",
    include_archived: bool = False,
    tags: Optional[list[str]] = None,
) -> str:
    """Search the database with filters.

    Args:
        query: Search query string.
        limit: Maximum results to return (default 10).
        sort_by: Sort order — date, relevance, or name.
        include_archived: Whether to include archived items.
        tags: Optional list of tags to filter by.
    """
    # Implementation...
    return f"Found {limit} results for '{query}'"
```

### Error Handling

```python
@mcp.tool()
async def risky_operation(path: str) -> str:
    """Perform an operation that might fail.

    Args:
        path: File path to process.
    """
    try:
        result = process_file(path)
        return f"Success: {result}"
    except FileNotFoundError:
        # Return error as text — the LLM will see this
        return f"Error: File not found at {path}"
    except PermissionError:
        return f"Error: Permission denied for {path}"
```

---

## 4. Resource Registration

Resources expose read-only data. Use the `@mcp.resource()` decorator with a URI:

```python
@mcp.resource("config://app/settings", description="Application settings")
async def get_settings() -> str:
    """Return current application settings."""
    import json
    settings = {"theme": "dark", "language": "en", "debug": False}
    return json.dumps(settings, indent=2)
```

### Dynamic Resources with URI Templates

```python
@mcp.resource("users://{user_id}/profile", description="User profile data")
async def get_user_profile(user_id: str) -> str:
    """Get profile for a specific user.

    Args:
        user_id: The user's unique identifier.
    """
    # user_id is extracted from the URI template
    return f'{{"user_id": "{user_id}", "name": "User {user_id}"}}'
```

**Always provide `description` explicitly** in the decorator — FastMCP's docstring parsing is not always reliable for resources.

---

## 5. Prompt Registration

Prompts are templates that users select through the UI:

```python
@mcp.prompt()
async def code_review(code: str, language: str = "python") -> str:
    """Review code for quality and suggest improvements.

    Args:
        code: The code to review.
        language: Programming language of the code.
    """
    return f"""Please review the following {language} code for:
- Code quality and best practices
- Potential bugs or edge cases
- Performance considerations
- Security concerns

```{language}
{code}
```

Provide specific, actionable feedback."""
```

### Multi-Message Prompts

```python
from mcp.server.fastmcp import FastMCP
from mcp.types import TextContent

@mcp.prompt()
async def debug_assistant(error_message: str, stack_trace: str = "") -> list[dict]:
    """Help debug an error with context.

    Args:
        error_message: The error message to debug.
        stack_trace: Optional stack trace.
    """
    messages = [
        {
            "role": "user",
            "content": {
                "type": "text",
                "text": f"I'm getting this error: {error_message}"
            }
        }
    ]
    if stack_trace:
        messages.append({
            "role": "user",
            "content": {
                "type": "text",
                "text": f"Stack trace:\n```\n{stack_trace}\n```"
            }
        })
    return messages
```

---

## 6. Transport Options

### Stdio (Local)

```python
if __name__ == "__main__":
    mcp.run(transport="stdio")
```

### Streamable HTTP (Remote)

```python
if __name__ == "__main__":
    mcp.run(transport="streamable-http", host="0.0.0.0", port=3000)
```

### Running with `uv`

```bash
# Stdio
uv run server.py

# Or with mcp CLI
uv run mcp run server.py

# Streamable HTTP
uv run server.py  # if transport="streamable-http" is set in code
```

---

## 7. Lifespan Management

For resources that need setup/teardown (database connections, API clients):

```python
from contextlib import asynccontextmanager
from dataclasses import dataclass
from mcp.server.fastmcp import FastMCP

@dataclass
class AppContext:
    db: object  # Your database connection
    http_client: object  # Your HTTP client

@asynccontextmanager
async def app_lifespan(server: FastMCP):
    """Manage application lifecycle resources."""
    # Startup
    import httpx
    db = await create_db_connection()
    http_client = httpx.AsyncClient()

    try:
        yield AppContext(db=db, http_client=http_client)
    finally:
        # Shutdown
        await http_client.aclose()
        await db.close()

mcp = FastMCP("my-server", lifespan=app_lifespan)

@mcp.tool()
async def query_data(sql: str) -> str:
    """Run a read-only database query.

    Args:
        sql: SQL query to execute (SELECT only).
    """
    ctx = mcp.get_context()
    result = await ctx.db.execute(sql)
    return str(result)
```

The `lifespan` context manager runs once when the server starts, and cleanup runs when it shuts down. Access shared resources via `mcp.get_context()`.

---

## 8. Logging

### Stdio Servers — Never print() to stdout

```python
import sys

# ❌ NEVER — corrupts JSON-RPC on stdout
print("Processing request")

# ✅ SAFE — stderr doesn't interfere
print("Processing request", file=sys.stderr)

# ✅ BETTER — use logging module (writes to stderr by default)
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.info("Processing request")
```

### MCP Logging Capability

FastMCP provides context helpers for structured logging:

```python
@mcp.tool()
async def process_file(path: str) -> str:
    """Process a file with progress logging.

    Args:
        path: File path to process.
    """
    ctx = mcp.get_context()

    await ctx.info(f"Starting to process {path}")
    # ... do work ...
    await ctx.warning("Large file detected, processing may be slow")
    # ... more work ...
    await ctx.error("Section 3 had invalid data, skipping")

    return "Processing complete"
```

Available context log methods: `ctx.debug()`, `ctx.info()`, `ctx.warning()`, `ctx.error()`

---

## 9. Structured Outputs

Return JSON-serializable dicts instead of strings:

```python
@mcp.tool(json_response=True)
async def get_weather(city: str) -> dict:
    """Get weather data for a city.

    Args:
        city: City name to get weather for.
    """
    return {
        "city": city,
        "temperature": 22,
        "unit": "celsius",
        "conditions": "sunny",
    }
```

With `json_response=True`, the return value is serialized to JSON and returned as structured content. This works with `outputSchema` validation in clients that support spec `2025-06-18+`.

---

## 10. Dependencies Declaration

Declare runtime dependencies that the server needs:

```python
mcp = FastMCP(
    "data-processor",
    dependencies=["pandas", "numpy", "httpx"],
)
```

This metadata helps package managers and deployment tools know what to install. It's informational — the SDK doesn't auto-install them.

---

## 11. Low-Level Server Class

For advanced use cases where FastMCP's decorator pattern isn't sufficient:

```python
from mcp.server import Server
from mcp.types import (
    Tool,
    TextContent,
    CallToolResult,
    ListToolsResult,
)
import mcp.server.stdio

server = Server("my-low-level-server")

@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="calculate",
            description="Perform a calculation",
            inputSchema={
                "type": "object",
                "properties": {
                    "expression": {"type": "string", "description": "Math expression"}
                },
                "required": ["expression"],
            },
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name == "calculate":
        result = eval(arguments["expression"])  # In production, use a safe evaluator
        return [TextContent(type="text", text=str(result))]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with mcp.server.stdio.stdio_server() as (read, write):
        await server.run(read, write, server.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

**When to use low-level Server:**
- Dynamic tool registration/removal at runtime
- Custom protocol handling
- Fine-grained control over capabilities
- Migrating from an older codebase

**When to use FastMCP (preferred):**
- All new projects
- Standard tool/resource/prompt patterns
- Automatic schema generation from type hints

---

## 12. Complete Starter: Stdio Server

```python
#!/usr/bin/env python3
"""Example MCP stdio server with tools, resources, and prompts."""

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("example-server")


# --- Tools ---

@mcp.tool()
async def greet(name: str) -> str:
    """Greet a user by name.

    Args:
        name: The person's name.
    """
    return f"Hello, {name}! Welcome to MCP."


@mcp.tool()
async def add(a: float, b: float) -> str:
    """Add two numbers together.

    Args:
        a: First number.
        b: Second number.
    """
    return str(a + b)


# --- Resources ---

@mcp.resource("info://server", description="Server information and status")
async def server_info() -> str:
    """Return server metadata."""
    import json
    return json.dumps({
        "name": "example-server",
        "version": "1.0.0",
        "status": "running",
    })


# --- Prompts ---

@mcp.prompt()
async def analyze(topic: str) -> str:
    """Generate an analysis prompt for a topic.

    Args:
        topic: Subject to analyze.
    """
    return f"Please provide a thorough analysis of: {topic}"


# --- Entry Point ---

def main():
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
```

**Run:**
```bash
uv run server.py
# Or: python server.py
```

---

## 13. Complete Starter: Streamable HTTP Server

```python
#!/usr/bin/env python3
"""Example MCP Streamable HTTP server."""

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("example-http-server")


@mcp.tool()
async def greet(name: str) -> str:
    """Greet a user by name.

    Args:
        name: The person's name.
    """
    return f"Hello, {name}!"


@mcp.tool(json_response=True)
async def get_status() -> dict:
    """Get server status as structured data."""
    return {
        "status": "healthy",
        "uptime_seconds": 42,
        "tools_registered": 2,
    }


def main():
    mcp.run(transport="streamable-http", host="0.0.0.0", port=3000)


if __name__ == "__main__":
    main()
```

**Run:**
```bash
uv run server.py
# Server listens on http://0.0.0.0:3000
```

---

## 14. Common Errors

| Error | Cause | Fix |
|---|---|---|
| `ModuleNotFoundError: mcp` | SDK not installed | `uv add "mcp[cli]"` or `pip install "mcp[cli]"` |
| `ImportError: fastmcp` | Wrong import path | Use `from mcp.server.fastmcp import FastMCP` |
| Server hangs silently | `print()` corrupting stdout | Use `print(..., file=sys.stderr)` |
| `Python >=3.10 required` | Old Python version | Upgrade Python to 3.10+ |
| `TypeError: async generator` | Missing `await` on async call | Ensure all async functions are awaited |
| Tool not appearing | Missing docstring | Add docstring — FastMCP uses it for description |
| Resource description empty | Relying on docstring for resource | Use explicit `description=` in decorator |
| `Address already in use` | Port conflict | Change port or kill existing process |

### Pre-Flight Checklist

- [ ] Python ≥ 3.10
- [ ] `mcp` package installed (pin `>=1.25,<2`)
- [ ] Import from `mcp.server.fastmcp` (not standalone `fastmcp`)
- [ ] All tools have docstrings with `Args:` section
- [ ] No `print()` in stdio server (use `file=sys.stderr`)
- [ ] Resources use explicit `description=` parameter
