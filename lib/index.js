// dsh-session-search — session_search tool for DeepSeek Harness agents.
//
// Full-text search across historical DSH sessions using the built-in
// @deepseek-ai/dsh-session-query engine (SQLite FTS5). Operates directly on the
// indexed database without loading compressed .jsonl.zstd files into RAM.
import Schema from '@deepseek-ai/schemastery';
import { defineTool } from '@deepseek-ai/dsh-tools';

export const name = 'dsh-session-search';
export const inject = ['tools', 'sessionQuery'];

export function isVolatileRef(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && typeof value.get === 'function';
}

// Unwrap Volatile boxes before any caller reads a value. A volatile field holds a box
// rather than its value, and the Loader mutates those boxes in place.
export function plainConfig(value) {
  while (typeof value === 'function') {
    value = value();
  }
  if (isVolatileRef(value)) return plainConfig(value.get());
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(plainConfig);
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, plainConfig(v)]));
}

export const Config = Schema.object({
  /** Maximum matching sessions returned per search invocation. */
  maxResults: Schema.number().default(20),
  /** Maximum character length of the snippet extracted around best match. */
  snippetLength: Schema.number().default(200),
  /** Query timeout in milliseconds (cooperative deadline). */
  timeoutMs: Schema.number().default(30_000),
});

export function resolveConfig(raw) {
  const unwrapped = plainConfig(raw);
  return plainConfig(Config(unwrapped));
}

export function apply(ctx, config = {}) {
  let getConfig = () => resolveConfig(ctx.fiber?.config ?? config) ?? {};

  // Support live updates via DSH loader event (DSH 0.1.7+ & 0.2.0+)
  if (typeof ctx.on === 'function') {
    try {
      ctx.on('loader/volatile-update', () => {
        getConfig = () => resolveConfig(ctx.fiber?.config ?? config) ?? {};
      });
      ctx.on('internal/update', () => {
        getConfig = () => resolveConfig(ctx.fiber?.config ?? config) ?? {};
      });
    } catch {
      // Standalone or test mock context without event bus
    }
  }

  if (typeof ctx.inject === 'function') {
    try {
      ctx.inject(['settings'], (sctx) => {
        if (!sctx?.settings) return;

        let disposeConfigure;
        try {
          if (typeof sctx.settings.configure === 'function') {
            disposeConfigure = sctx.settings.configure({ auto: false }, ctx.fiber);
          }
        } catch (error) {
          ctx.logger?.warn?.(`[dsh-session-search] settings.configure failed: ${error?.message || error}`);
        }

        const readLiveSettings = () => {
          try {
            if (typeof sctx.settings.describe === 'function') {
              const desc = sctx.settings.describe().find((row) => row.ns === name);
              if (desc && desc.value && typeof desc.value === 'object') {
                return resolveConfig(desc.value);
              }
            }
          } catch (error) {
            ctx.logger?.warn?.(`[dsh-session-search] settings.describe failed: ${error?.message || error}`);
          }
          return null;
        };

        getConfig = () => readLiveSettings() ?? resolveConfig(ctx.fiber?.config ?? config) ?? {};

        const disposeDocUpdated = typeof sctx.on === 'function'
          ? sctx.on('settings/document-updated', (updatedNs) => {
              if (updatedNs === name) {
                getConfig = () => readLiveSettings() ?? resolveConfig(ctx.fiber?.config ?? config) ?? {};
              }
            })
          : null;

        const cleanup = () => {
          if (typeof disposeConfigure === 'function') {
            try {
              disposeConfigure();
            } catch (error) {
              ctx.logger?.debug?.(`[dsh-session-search] disposeConfigure error: ${error?.message || error}`);
            }
          }
          if (typeof disposeDocUpdated === 'function') {
            try {
              disposeDocUpdated();
            } catch (error) {
              ctx.logger?.debug?.(`[dsh-session-search] disposeDocUpdated error: ${error?.message || error}`);
            }
          }
        };

        if (typeof sctx.effect === 'function') {
          sctx.effect(() => cleanup, 'dsh-session-search: settings');
        }
      });
    } catch (injectErr) {
      // Standalone or test mock context without inject support
    }
  }

  const initialCfg = getConfig() ?? {};
  const defaultTimeoutMs = initialCfg.timeoutMs ?? 30_000;

  return ctx.effect(() => ctx.tools.register(defineTool({
    name: 'session_search',
    description: 'Full-text search across historical DSH sessions (conversation history with the agent). Use to recall past solutions, lessons learned, decisions made, or context from previous sessions.',
    timeoutMs: defaultTimeoutMs,
    isConcurrencySafe: () => true,
    parameters: {
      query: { type: 'string', required: true, description: 'Search query text (search terms and keywords).' },
      limit: { type: 'integer', description: `Maximum matching sessions to return (default ${initialCfg.maxResults ?? 20}).` },
    },
    output: {
      schema: { type: 'string' },
      render: (_a, v) => [{ type: 'text', text: String(v ?? '') }],
    },
    async execute(args, execCtx) {
      const liveCfg = getConfig() ?? {};
      const maxResults = liveCfg.maxResults ?? 20;
      const snippetLength = liveCfg.snippetLength ?? 200;
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
