# 🔍 @goodandready-private/dsh-session-search

<div align="center">

<h3>Model-Facing Session Full-Text Search Tool for DeepSeek Harness Agents</h3>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.4-6366f1.svg?style=for-the-badge&labelColor=1e1b4b" alt="version">
  <img src="https://img.shields.io/badge/License-MIT-10b981.svg?style=for-the-badge&labelColor=064e3b" alt="license">
  <img src="https://img.shields.io/badge/DSH-Plugin-8b5cf6.svg?style=for-the-badge&labelColor=2e1065" alt="DSH Plugin">
  <img src="https://img.shields.io/badge/Node-20%2B-f59e0b.svg?style=for-the-badge&labelColor=451a03" alt="Node version">
  <img src="https://img.shields.io/badge/Route-Private-e11d48.svg?style=for-the-badge&labelColor=4c0519" alt="Private Route">
</p>

<!-- Showcase Button -->
<p align="center">
  <a href="https://goodandready.app/"><img src="https://img.shields.io/badge/All_Author_Projects-goodandready.app-ff4500.svg?style=for-the-badge&logo=rocket&logoColor=white&labelColor=1a1a2e" alt="All Author Projects"></a>
</p>

<p align="center">
  <b>🇬🇧 English</b> •
  <a href="README.ru.md"><b>🇷🇺 Русский</b></a>
</p>

</div>

---

## Overview

In stock **DeepSeek Harness**, previous session content is indexed by the core full-text search backend (`@deepseek-ai/dsh-session-query-sqlite`), but this search capability is solely wired to the human user interface (the sidebar search bar). The autonomous model/agent (Dee / Ди) is **not given any tool** to query historical conversations.

`@goodandready-private/dsh-session-search` resolves this asymmetry: it provides the agent with a dedicated `session_search` tool, allowing the model to independently look up past lessons, solutions, code snippets, and conversational context without reading or replaying full session archives into RAM.

---

## Architecture & Data Flow

The plugin is strictly **host-only** with zero client-side payload. It does not spawn a secondary database, parse compressed `.jsonl.zstd` logs, or duplicate search structures:

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant Agent as Agent (Dee / LLM)
    participant Tool as session_search Tool (dsh-session-search)
    participant Core as ctx.sessionQuery (@deepseek-ai/dsh-session-query)
    participant DB as SQLite FTS5 Index (search_state / persisted_docs)

    User->>Agent: "Remember how we configured Nginx SSL in our previous project?"
    Agent->>Tool: execute({ query: "Nginx SSL configuration", limit: 5 })
    Tool->>Core: searchSessions({ query, limit }, { signal })
    Core->>DB: MATCH query in FTS5 index
    DB-->>Core: Matched sessions with snippet & score
    Core-->>Tool: Return SessionSearchPage
    Tool-->>Agent: Formatted text (Title, Session ID, Best snippet)
    Agent-->>User: Answers with exact historical configuration details
```

---

## Comparison: Stock DSH vs With `dsh-session-search`

| Capability | Stock DSH Core | With `dsh-session-search` |
|---|---|---|
| **Human UI Session Search** | ✅ Available in sidebar (`WorkspaceBrowser`) | ✅ Unchanged (fully available) |
| **Agent Tool for Session Search** | ❌ None (no tool registered) | ✅ Native `session_search` tool registered |
| **Search Engine** | SQLite FTS5 (`ctx.sessionQuery`) | Reuses core SQLite FTS5 engine directly |
| **Memory Footprint** | Low | Zero additional memory (delegates to core) |
| **Result Snippets** | Rendered in UI | Normalized and formatted as text for LLM |
| **Pagination Notice** | UI infinite scroll / cursor | Model hint: `(есть ещё результаты — уточни запрос)` |
| **Cancellation** | AbortSignal in API | Propagated via `execCtx.signal` |

---

## Installation

This package is distributed via GitHub Packages private registry:

```bash
# Add package to your DSH web profile
pnpm add @goodandready-private/dsh-session-search
```

Restart your DeepSeek Harness instance to mount the host bundle patch (`cordis.patch.yml`).

---

## Configuration

Configure `maxResults` in your profile configuration:

```yaml
# dsh configuration
plugins:
  dsh-session-search:
    maxResults: 20
```

| Option | Type | Default | Description |
|---|---|---|---|
| `maxResults` | `number` | `20` | Default upper bound on returned search matches per call. |

---

## Tool Specification: `session_search`

### Parameters
* `query` (`string`, required): Search terms and keywords.
* `limit` (`integer`, optional): Maximum number of matching sessions to return (automatically clamped between `1` and `100`, defaults to configured `maxResults`).

### Output Format
The tool returns a plain-text markdown-friendly representation:
```text
• Session Title [session-id-12345]
  Context snippet with matching keywords highlighted around occurrence...
• Second Session [session-id-67890]
  Another snippet from past conversation...
(есть ещё результаты — уточни запрос)
```

If no conversations match:
```text
session_search: совпадений не найдено.
```

If backend execution fails:
```text
session_search: ошибка: <error message>
```

---

## Language & Localization (ADR-001)

As documented in `docs/design/DESIGN.md`, the strings of `session_search` (tool description, argument descriptions, and status notices) are purposefully set in Russian:
1. The tool is designed for agent Dee (Ди), whose primary system prompt and operational interaction context are in Russian.
2. Because this is a **host-only** plugin without browser UI components, client-side localization registration (`ctx.locale.register`) is deliberately omitted.
3. Language packs like `@goodandready/dsh-russian-lang` do not modify server-side agent tool schemas.

---

## License

MIT © 2026 GoodAndReady
