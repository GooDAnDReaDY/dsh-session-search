// dsh-session-search — session_search tool for DeepSeek Harness agents.
//
// Full-text search across historical DSH sessions using the built-in
// @deepseek-ai/dsh-session-query engine (SQLite FTS5). Operates directly on the
// indexed database without loading compressed .jsonl.zstd files into RAM.
import Schema from '@deepseek-ai/schemastery';
import { defineTool } from '@deepseek-ai/dsh-tools';

export const name = 'dsh-session-search';
export const inject = ['tools', 'sessionQuery'];

export const Config = Schema.object({
  /** Maximum matching sessions returned per search invocation. */
  maxResults: Schema.number().default(20),
  /** Maximum character length of the snippet extracted around best match. */
  snippetLength: Schema.number().default(200),
  /** Query timeout in milliseconds (cooperative deadline). */
  timeoutMs: Schema.number().default(30_000),
});

export function apply(ctx, config = {}) {
  const cfg = Config(config) ?? {};
  const maxResults = cfg.maxResults ?? 20;
  const snippetLength = cfg.snippetLength ?? 200;
  const timeoutMs = cfg.timeoutMs ?? 30_000;

  return ctx.effect(() => ctx.tools.register(defineTool({
    name: 'session_search',
    description: 'Full-text search across historical DSH sessions (conversation history with the agent). Use to recall past solutions, lessons learned, decisions made, or context from previous sessions.',
    timeoutMs,
    isConcurrencySafe: () => true,
    parameters: {
      query: { type: 'string', required: true, description: 'Search query text (search terms and keywords).' },
      limit: { type: 'integer', description: `Maximum matching sessions to return (default ${maxResults}).` },
    },
    output: {
      schema: { type: 'string' },
      render: (_a, v) => [{ type: 'text', text: String(v ?? '') }],
    },
    async execute(args, execCtx) {
      const signal = execCtx?.signal;
      const rawQuery = typeof args?.query === 'string' ? args.query.trim() : '';
      if (!rawQuery) {
        return 'session_search: error: query must be a non-empty string.';
      }
      const limit = Math.min(Math.max(args.limit ?? maxResults, 1), 100);
      let page;
      try {
        page = await ctx.sessionQuery.searchSessions(
          { query: rawQuery, limit },
          signal ? { signal } : undefined,
        );
      } catch (error) {
        return `session_search: error: ${error instanceof Error ? error.message : String(error)}`;
      }
      const items = Array.isArray(page?.items) ? page.items : [];
      if (items.length === 0) return 'session_search: no matches found.';
      const lines = items.map((hit) => {
        const rawSnippet = hit.bestMatch?.snippet ?? '';
        const snippet = rawSnippet.replace(/\s+/g, ' ').trim().slice(0, snippetLength);
        const header = hit.header ?? {};
        const id = header.id ?? '';
        const title = (typeof header.title === 'string' && header.title) ? header.title : id;
        const rawDate = header.updated_at || header.created_at || hit.bestMatch?.time;
        let dateStr = '';
        if (rawDate) {
          const d = new Date(rawDate);
          if (!Number.isNaN(d.getTime())) {
            dateStr = d.toISOString().slice(0, 10);
          }
        }
        const headerLine = `• ${title} [${id}]${dateStr ? ` (${dateStr})` : ''}`;
        return snippet ? `${headerLine}\n  ${snippet}` : headerLine;
      });
      const more = page?.nextCursor ? '\n(more results available — refine your query)' : '';
      return lines.join('\n') + more;
    },
  })));
}
