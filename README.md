# 🔍 @goodandready/dsh-session-search

<div align="center">

<h3>Model-Facing Session Full-Text Search Tool for DeepSeek Harness Agents</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/@goodandready/dsh-session-search"><img src="https://img.shields.io/npm/v/@goodandready/dsh-session-search.svg?style=for-the-badge&color=6366f1&labelColor=1e1b4b" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-10b981.svg?style=for-the-badge&color=10b981&labelColor=064e3b" alt="license"></a>
  <a href="https://github.com/topics/dsh-plugin"><img src="https://img.shields.io/badge/DSH-Plugin-8b5cf6.svg?style=for-the-badge&labelColor=2e1065" alt="DSH Plugin"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node-20%2B-f59e0b.svg?style=for-the-badge&labelColor=451a03" alt="Node version"></a>
</p>

<!-- Showcase Button -->
<p align="center">
  <a href="https://goodandready.app/"><img src="https://img.shields.io/badge/All_Author_Projects-goodandready.app-ff4500.svg?style=for-the-badge&logo=rocket&logoColor=white&labelColor=1a1a2e" alt="All Author Projects"></a>
</p>

<p align="center">
  <b>🇬🇧 English</b> •
  <a href="README.zh.md"><b>🇨🇳 中文说明</b></a> •
  <a href="README.ru.md"><b>🇷🇺 Русский</b></a>
</p>

<!-- Project Support Table -->
<table align="center">
  <tr>
    <td align="center">
      ⭐ <strong>If you like this plugin, please star it on GitHub</strong> — it shows me that the plugin is useful to you and motivates me to keep developing it.
      <br><br>
      🐛 <strong>If you find a bug or would like to request a feature</strong>, open a GitHub issue in any language — I will review your proposal and implement useful suggestions in a future plugin version.
    </td>
  </tr>
</table>

</div>

---

## Overview

In stock **DeepSeek Harness**, historical conversation logs are indexed by the core full-text search backend (`@deepseek-ai/dsh-session-query-sqlite`), but this capability is exposed only to the human user via the sidebar search bar. The autonomous model/agent (Dee / Ди) is **not provided with any tool** to query historical conversations.

`@goodandready/dsh-session-search` provides the agent with a dedicated, hardened `session_search` tool. This allows the model to look up past lessons, solutions, code snippets, decisions, and conversational context without decompressing or replaying full `.jsonl.zstd` session archives into memory.

---

## Architecture & Data Flow

The plugin is strictly **host-only** with zero browser runtime overhead. It delegates directly to the core search service:

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
    Tool-->>Agent: Formatted text (Title, Session ID, Date, Best snippet)
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
| **Temporal Metadata** | Shown in UI | Compact session date: `(YYYY-MM-DD)` |
| **Pagination Notice** | UI infinite scroll / cursor | Model hint: `(more results available — refine your query)` |
| **Execution Guard** | Core only | 30s deadline (`timeoutMs`), `isConcurrencySafe: true` |
| **Lifecycle** | Standard | Managed via Cordis `ctx.effect` |
| **Cancellation** | AbortSignal in API | Propagated via `execCtx.signal` |

---

## Installation

Install via the `dsh` CLI for your web profile:

```bash
dsh plugin --profile web add @goodandready/dsh-session-search
```

Or install using `pnpm`:

```bash
pnpm add @goodandready/dsh-session-search
```

Restart the DeepSeek Harness web profile to activate the bundle patch (`cordis.patch.yml`).

---

## Configuration

Configure options in your profile configuration:

```yaml
# dsh configuration
plugins:
  dsh-session-search:
    maxResults: 20
    snippetLength: 200
    timeoutMs: 30000
```

| Option | Type | Default | Description |
|---|---|---|---|
| `maxResults` | `number` | `20` | Default upper bound on returned search matches per call. |
| `snippetLength` | `number` | `200` | Maximum character length of snippet around best match. |
| `timeoutMs` | `number` | `30000` | Search execution timeout in milliseconds. |

---

## Tool Specification: `session_search`

### Parameters
* `query` (`string`, required): Search query text (search terms and keywords, must be non-empty).
* `limit` (`integer`, optional): Maximum number of matching sessions to return (automatically clamped between `1` and `100`, defaults to configured `maxResults`).

### Output Format
The tool returns a clean, plain-text representation:
```text
• Session Title [session-id-12345] (2026-09-17)
  Context snippet with matching keywords highlighted around occurrence...
• Second Session [session-id-67890] (2026-09-15)
  Another snippet from past conversation...
(more results available — refine your query)
```

If no conversations match:
```text
session_search: no matches found.
```

If input validation fails:
```text
session_search: error: query must be a non-empty string.
```

If backend execution fails:
```text
session_search: error: <error message>
```

---

## License

MIT © 2026 GoodAndReady
