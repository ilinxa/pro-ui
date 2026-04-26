# Sampling & Elicitation

Read this when implementing server-initiated LLM completions (sampling) or server-initiated user input requests (elicitation). Both are server→client capabilities that require client support.

## Table of Contents
1. [Overview](#1-overview)
2. [Sampling — Server-Initiated LLM Completions](#2-sampling--server-initiated-llm-completions)
3. [Sampling: TypeScript Pattern](#3-sampling-typescript-pattern)
4. [Sampling: Python Pattern](#4-sampling-python-pattern)
5. [Sampling: Use Cases](#5-sampling-use-cases)
6. [Elicitation — Server-Initiated User Input](#6-elicitation--server-initiated-user-input)
7. [Elicitation: Form Mode](#7-elicitation-form-mode)
8. [Elicitation: URL Mode](#8-elicitation-url-mode)
9. [Elicitation: Security Requirements](#9-elicitation-security-requirements)
10. [Client Capability Checks](#10-client-capability-checks)

---

## 1. Overview

Both sampling and elicitation are **server-initiated** — the server asks the client for something during tool execution. They require the client to declare support during the `initialize` handshake.

| Feature | Server Asks For | Client Provides | Protocol Method |
|---|---|---|---|
| **Sampling** | LLM completion | Model-generated text | `sampling/createMessage` |
| **Elicitation** | User input | User-entered data | `elicitation/create` |

**Neither works if the client doesn't support it.** Always check capabilities before using.

---

## 2. Sampling — Server-Initiated LLM Completions

Sampling lets a tool ask the client's LLM to generate a completion. This is powerful for building tools that use AI within their execution — summarization, classification, extraction, code generation — without the server needing its own LLM access.

### How It Works

```
Client          Server (inside a tool handler)
  │                │
  │◄── sampling/   │  Server sends message(s) to complete
  │    createMessage│
  │                │
  │  [Client shows │  Client may ask user for approval
  │   to user for  │  ("Server wants to use AI for X — allow?")
  │   approval]    │
  │                │
  │── response ───►│  Client returns the LLM's completion
  │                │
```

### Capability Declaration

Client must declare `sampling` during initialize:

```json
{
  "capabilities": {
    "sampling": {}
  }
}
```

**Important:** Not all clients support sampling. Claude Desktop supports it; some others may not. Always check before calling.

---

## 3. Sampling: TypeScript Pattern

```typescript
server.registerTool("summarize_document", {
  title: "Summarize Document",
  description: "Read a document and generate an AI summary",
  inputSchema: {
    path: z.string().describe("Path to the document"),
    max_words: z.number().int().default(200).describe("Maximum summary length in words"),
  },
}, async ({ path, max_words }) => {
  const content = await fs.readFile(path, "utf-8");

  // Use sampling to get an LLM summary
  const result = await server.server.createMessage({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Summarize the following document in ${max_words} words or fewer:\n\n${content}`,
        },
      },
    ],
    maxTokens: 1000,
    // Optional: model preferences
    modelPreferences: {
      hints: [{ name: "claude-sonnet-4-20250514" }],  // Preferred model
      speedPriority: 0.5,
      costPriority: 0.3,
      intelligencePriority: 0.8,
    },
  });

  // result.content contains the LLM's response
  const summary = result.content.type === "text" ? result.content.text : "Unable to summarize";

  return {
    content: [{ type: "text", text: `Summary:\n${summary}` }],
  };
});
```

### createMessage Parameters

```typescript
{
  messages: [                    // Conversation to complete
    { role: "user", content: { type: "text", text: "..." } }
  ],
  maxTokens: 1000,              // Max tokens in response
  systemPrompt?: "...",         // Optional system prompt
  modelPreferences?: {          // Optional model hints
    hints: [{ name: "model-name" }],
    costPriority: number,       // 0-1, weight for cost optimization
    speedPriority: number,      // 0-1, weight for speed
    intelligencePriority: number // 0-1, weight for quality
  },
  includeContext?: "none" | "thisServer" | "allServers",  // Context to include
  temperature?: number,         // Sampling temperature
  stopSequences?: string[],     // Stop sequences
}
```

**Note:** The client controls which model is actually used. `modelPreferences` are hints, not requirements.

---

## 4. Sampling: Python Pattern

```python
@mcp.tool()
async def classify_text(text: str) -> str:
    """Classify text into categories using AI.

    Args:
        text: Text to classify.
    """
    ctx = mcp.get_context()

    result = await ctx.session.create_message(
        messages=[
            {
                "role": "user",
                "content": {
                    "type": "text",
                    "text": f"Classify the following text into one of: [positive, negative, neutral]. "
                            f"Respond with just the category.\n\n{text}",
                },
            }
        ],
        max_tokens=50,
    )

    category = result.content.text.strip().lower() if result.content.type == "text" else "unknown"
    return f"Classification: {category}"
```

---

## 5. Sampling: Use Cases

| Use Case | How |
|---|---|
| **Summarization** | Tool reads a document, asks LLM to summarize it |
| **Classification** | Tool gets data, asks LLM to categorize it |
| **Extraction** | Tool has unstructured text, asks LLM to extract structured data |
| **Code Generation** | Tool needs a code snippet, asks LLM to generate it |
| **Translation** | Tool has text, asks LLM to translate it |
| **Validation** | Tool has output, asks LLM to verify correctness |
| **Multi-Step Reasoning** | Tool orchestrates multiple LLM calls for complex workflows |

**Anti-pattern:** Don't use sampling for tasks the server can do deterministically. If you can parse, compute, or transform data with code, do that instead of asking the LLM.

---

## 6. Elicitation — Server-Initiated User Input

Elicitation lets a tool ask the user for additional information during execution. The server pauses, requests input, and resumes with the user's response.

### Two Modes

| Mode | Purpose | Spec |
|---|---|---|
| **Form** | Structured data input (text fields, dropdowns) | `2025-06-18+` |
| **URL** | Redirect to external URL (OAuth, payments, API keys) | `2025-11-25+` |

### Capability Declaration

Client must declare `elicitation` during initialize:

```json
{
  "capabilities": {
    "elicitation": {}
  }
}
```

---

## 7. Elicitation: Form Mode

Server requests structured input from the user:

### TypeScript

```typescript
server.registerTool("create_account", {
  description: "Create a new user account",
  inputSchema: {
    username: z.string().describe("Desired username"),
  },
}, async ({ username }) => {
  // Ask user for additional details
  const response = await server.server.createElicitation({
    message: "Please provide additional account details:",
    requestedSchema: {
      type: "object",
      properties: {
        email: { type: "string", format: "email", description: "Email address" },
        plan: { type: "string", enum: ["free", "pro", "enterprise"], description: "Account plan" },
        agree_tos: { type: "boolean", description: "Agree to Terms of Service" },
      },
      required: ["email", "plan", "agree_tos"],
    },
  });

  if (response.action === "accept") {
    const { email, plan, agree_tos } = response.content;
    if (!agree_tos) {
      return { isError: true, content: [{ type: "text", text: "You must agree to ToS." }] };
    }
    await createUser(username, email, plan);
    return { content: [{ type: "text", text: `Account created: ${username} (${plan})` }] };
  }

  // User declined
  return { content: [{ type: "text", text: "Account creation cancelled." }] };
});
```

### Response Actions

| Action | Meaning |
|---|---|
| `"accept"` | User submitted the form. Data in `response.content` |
| `"decline"` | User cancelled / closed the form |
| `"error"` | Something went wrong |

---

## 8. Elicitation: URL Mode

Redirect the user to an external URL for sensitive operations (introduced in spec `2025-11-25` via SEP-1036):

```typescript
const response = await server.server.createElicitation({
  message: "Please authenticate with GitHub:",
  url: "https://github.com/login/oauth/authorize?client_id=xxx&scope=repo",
});

// User visits the URL, completes the flow, and returns
if (response.action === "accept") {
  // Process the callback data
}
```

### Use Cases for URL Mode

- OAuth authorization flows
- Payment processing
- API key entry on a trusted external page
- Identity verification

---

## 9. Elicitation: Security Requirements

### Form Mode

- **Never** request sensitive data (passwords, API keys, credit card numbers) via form elicitation
- Form data is sent through the MCP client — it's not end-to-end encrypted
- Use form mode only for non-sensitive structured input

### URL Mode

- URLs must use HTTPS
- Server should validate the URL is from a trusted domain
- Clients should warn users before redirecting to external URLs
- Callback data should be validated server-side

### General

- Always check `response.action` — user may decline
- Handle timeout scenarios gracefully
- Don't block indefinitely waiting for user input — set reasonable timeouts

---

## 10. Client Capability Checks

**Always check before using sampling or elicitation:**

### TypeScript

```typescript
server.registerTool("smart-tool", { ... }, async (args) => {
  // Check sampling support
  const clientCaps = server.server.getClientCapabilities();

  if (clientCaps?.sampling) {
    // Safe to use sampling
    const result = await server.server.createMessage({ ... });
  } else {
    // Fallback: do it without LLM assistance
    // or return an error explaining the limitation
    return {
      isError: true,
      content: [{
        type: "text",
        text: "This tool requires a client that supports sampling (server-initiated LLM completions).",
      }],
    };
  }

  return { content: [{ type: "text", text: "Done" }] };
});
```

### Client Support Matrix (as of Feb 2026)

| Client | Sampling | Elicitation (Form) | Elicitation (URL) |
|---|---|---|---|
| Claude Desktop | ✅ | ✅ | Varies |
| Claude Code | ✅ | ✅ | Varies |
| VS Code (Copilot) | Varies | Varies | — |
| Cursor | Varies | Varies | — |
| Custom clients | Depends on implementation | Depends on implementation | Depends on implementation |

**"Varies"** means support depends on the client version and configuration. Always check capabilities at runtime rather than assuming.
