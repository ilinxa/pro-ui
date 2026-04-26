# Prompts

Read this when building MCP prompts — user-controlled templates that structure LLM interactions. Covers registration in TS and Python, arguments, multi-turn prompts, embedded resources, completions, and use cases.

## Table of Contents
1. [What Prompts Are](#1-what-prompts-are)
2. [Prompt Registration (TypeScript)](#2-prompt-registration-typescript)
3. [Prompt Registration (Python)](#3-prompt-registration-python)
4. [Prompt Arguments](#4-prompt-arguments)
5. [Multi-Turn Prompts](#5-multi-turn-prompts)
6. [Embedded Resources in Prompts](#6-embedded-resources-in-prompts)
7. [Argument Completion](#7-argument-completion)
8. [Prompts vs Tools vs Resources](#8-prompts-vs-tools-vs-resources)
9. [Real-World Use Cases](#9-real-world-use-cases)

---

## 1. What Prompts Are

Prompts are **user-controlled** templates. Unlike tools (model decides) or resources (application decides), prompts are explicitly selected by the user through the client UI — typically via slash commands or menus.

**Protocol methods:**
- `prompts/list` — client discovers available prompts
- `prompts/get` — client retrieves a prompt with filled arguments
- `notifications/prompts/list_changed` — server signals prompt list changed

**Output:** Prompts return a `messages` array (like a conversation) that the client feeds to the LLM. This means prompts can set up system context, inject data, and guide the model's behavior.

---

## 2. Prompt Registration (TypeScript)

```typescript
server.registerPrompt("code-review", {
  title: "Code Review",
  description: "Review code for quality, bugs, and best practices",
  argsSchema: {
    code: z.string().describe("Code to review"),
    language: z.string().default("typescript").describe("Programming language"),
    focus: z.enum(["bugs", "performance", "security", "style", "all"]).default("all")
      .describe("Area to focus the review on"),
  },
}, async ({ code, language, focus }) => ({
  messages: [
    {
      role: "user",
      content: {
        type: "text",
        text: `Please review the following ${language} code. Focus on: ${focus}.\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide specific, actionable feedback with line references where applicable.`,
      },
    },
  ],
}));
```

---

## 3. Prompt Registration (Python)

```python
@mcp.prompt()
async def code_review(
    code: str,
    language: str = "python",
    focus: str = "all",
) -> str:
    """Review code for quality, bugs, and best practices.

    Args:
        code: Code to review.
        language: Programming language.
        focus: Focus area — bugs, performance, security, style, or all.
    """
    return f"""Please review the following {language} code. Focus on: {focus}.

```{language}
{code}
```

Provide specific, actionable feedback with line references where applicable."""
```

FastMCP wraps the string return as a single user message automatically.

---

## 4. Prompt Arguments

Arguments are validated against schemas (Zod in TS, type hints in Python):

### TypeScript

```typescript
argsSchema: {
  topic: z.string().min(1).describe("Topic to analyze"),
  depth: z.enum(["brief", "detailed", "comprehensive"]).default("detailed")
    .describe("Level of analysis depth"),
  audience: z.string().optional().describe("Target audience for the analysis"),
}
```

### Python

```python
@mcp.prompt()
async def analyze_topic(
    topic: str,
    depth: str = "detailed",
    audience: str = "general",
) -> str:
    """Analyze a topic at the requested depth."""
    # ...
```

---

## 5. Multi-Turn Prompts

Prompts can return multiple messages to set up a conversation:

### TypeScript

```typescript
server.registerPrompt("debug-assistant", {
  title: "Debug Assistant",
  description: "Help debug an error with guided analysis",
  argsSchema: {
    error: z.string().describe("Error message"),
    stack_trace: z.string().optional().describe("Stack trace if available"),
    context: z.string().optional().describe("What you were doing when the error occurred"),
  },
}, async ({ error, stack_trace, context }) => {
  const messages = [
    {
      role: "system" as const,
      content: {
        type: "text" as const,
        text: "You are an expert debugger. Analyze errors systematically: identify the root cause, explain why it happened, and provide a fix.",
      },
    },
    {
      role: "user" as const,
      content: {
        type: "text" as const,
        text: `I'm getting this error:\n\n${error}`,
      },
    },
  ];

  if (stack_trace) {
    messages.push({
      role: "user" as const,
      content: {
        type: "text" as const,
        text: `Stack trace:\n\`\`\`\n${stack_trace}\n\`\`\``,
      },
    });
  }

  if (context) {
    messages.push({
      role: "user" as const,
      content: {
        type: "text" as const,
        text: `Context: ${context}`,
      },
    });
  }

  return { messages };
});
```

### Python Multi-Turn

```python
@mcp.prompt()
async def debug_assistant(
    error: str,
    stack_trace: str = "",
) -> list[dict]:
    """Help debug an error with guided analysis.

    Args:
        error: The error message.
        stack_trace: Optional stack trace.
    """
    messages = [
        {"role": "user", "content": {"type": "text", "text": f"I'm getting this error: {error}"}},
    ]
    if stack_trace:
        messages.append({
            "role": "user",
            "content": {"type": "text", "text": f"Stack trace:\n```\n{stack_trace}\n```"},
        })
    return messages
```

---

## 6. Embedded Resources in Prompts

Prompts can include resource content:

```typescript
server.registerPrompt("analyze-config", {
  title: "Analyze Configuration",
  description: "Analyze the current application configuration for issues",
}, async () => ({
  messages: [
    {
      role: "user",
      content: {
        type: "resource",
        resource: {
          uri: "config://app",
          text: JSON.stringify(await loadConfig()),
          mimeType: "application/json",
        },
      },
    },
    {
      role: "user",
      content: {
        type: "text",
        text: "Analyze this configuration for potential issues, security concerns, and optimization opportunities.",
      },
    },
  ],
}));
```

This automatically loads the resource data into the prompt context.

---

## 7. Argument Completion

Help clients suggest valid argument values:

```typescript
server.registerPrompt("query-template", {
  title: "Query Template",
  argsSchema: {
    table: z.string().describe("Database table to query"),
  },
  completions: {
    table: async (partial) => {
      const tables = await db.listTables();
      return tables.filter(t => t.startsWith(partial));
    },
  },
}, async ({ table }) => ({
  messages: [{
    role: "user",
    content: { type: "text", text: `Write a SQL query to analyze the ${table} table.` },
  }],
}));
```

---

## 8. Prompts vs Tools vs Resources

| Scenario | Use |
|---|---|
| User picks "code review" from a menu | **Prompt** |
| LLM decides to search a database | **Tool** |
| Client loads server config as context | **Resource** |
| User picks "generate report" template | **Prompt** |
| LLM decides to create a file | **Tool** |
| Client shows available documentation | **Resource** |

**Rule:** If the user initiates it via UI → prompt. If the LLM decides → tool. If the app decides → resource.

---

## 9. Real-World Use Cases

### Code Review Template

Standard review prompts that users select when they want code reviewed.

### Analysis Workflows

Multi-step analysis prompts that inject relevant resources (data, config, docs) and instruct the model on methodology.

### Onboarding Flows

New-user prompts that guide the model to explain system architecture, available tools, and common workflows.

### Report Generation

Prompts that combine data resources with formatting instructions to generate structured reports.

### SQL Query Builder

Prompts with table completion that help users build queries against known database schemas.
