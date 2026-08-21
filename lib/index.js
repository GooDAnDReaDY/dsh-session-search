// dsh-session-search — тул session_search для Ди.
//
// Обычная (полнотекстовый поиск) по сессиям DSH через встроенный движок
// @deepseek-ai/dsh-session-query (SQLite FTS). Никакой своей FTS и без
// загрузки .jsonl.zstd в RAM — работает сам движок.
import Schema from '@deepseek-ai/schemastery';
import { defineTool } from '@deepseek-ai/dsh-tools';

export const name = 'dsh-session-search';
export const inject = ['tools', 'sessionQuery'];

export const Config = Schema.object({
  /** Максимум результатов за вызов. */
  maxResults: Schema.number().default(20),
});

export function apply(ctx, config = {}) {
  const cfg = Config(config) ?? {};
  const maxResults = cfg.maxResults ?? 20;

  ctx.tools.register(defineTool({
    name: 'session_search',
    description: 'Полнотекстовый поиск по сессиям DSH (история разговоров с агентом). Использовать для восстановления прошлых уроков/решений, поиска как решался похожий вопрос, контекста из старых сессий.',
    parameters: {
      query: { type: 'string', required: true, description: 'Текст запроса (поисковые термы).' },
      limit: { type: 'integer', description: `Максимум совпадений (default ${maxResults}).` },
    },
    output: {
      schema: { type: 'string' },
      render: (_a, v) => [{ type: 'text', text: String(v ?? '') }],
    },
    async execute(args, execCtx) {
      const signal = execCtx?.signal;
      const limit = Math.min(Math.max(args.limit ?? maxResults, 1), 100);
      let page;
      try {
        page = await ctx.sessionQuery.searchSessions(
          { query: String(args.query), limit },
          signal ? { signal } : undefined,
        );
      } catch (error) {
        return `session_search: ошибка: ${error instanceof Error ? error.message : String(error)}`;
      }
      const items = Array.isArray(page?.items) ? page.items : [];
      if (items.length === 0) return `session_search: совпадений не найдено.`;
      const lines = items.map((hit) => {
        const snippet = (hit.bestMatch?.snippet ?? '').replace(/\s+/g, ' ').slice(0, 200);
        const header = hit.header ?? {};
        const id = header.id ?? '';
        const title = (typeof header.title === 'string' && header.title) ? header.title : id;
        return `• ${title} [${id}]\n  ${snippet}`;
      });
      const more = page?.nextCursor ? '\n(есть ещё результаты — уточни запрос)' : '';
      return lines.join('\n') + more;
    },
  }));
}
