import test from 'node:test';
import assert from 'node:assert/strict';
import * as plugin from '../lib/index.js';

test('plugin identity and cordis inject declarations', () => {
  assert.equal(plugin.name, 'dsh-session-search');
  assert.ok(Array.isArray(plugin.inject));
  assert.ok(plugin.inject.includes('tools'));
  assert.ok(plugin.inject.includes('sessionQuery'));
});

test('Config schema validates default and custom maxResults', () => {
  const defaultConfig = plugin.Config({});
  assert.equal(defaultConfig.maxResults, 20);

  const customConfig = plugin.Config({ maxResults: 50 });
  assert.equal(customConfig.maxResults, 50);
});

test('apply registers session_search tool with proper schema and render', () => {
  let registeredTool = null;
  const mockCtx = {
    tools: {
      register(def) {
        registeredTool = def;
        return () => {};
      },
    },
    sessionQuery: {
      async searchSessions() {
        return { items: [] };
      },
    },
  };

  plugin.apply(mockCtx, { maxResults: 15 });
  assert.ok(registeredTool, 'tool must be registered');
  assert.equal(registeredTool.name, 'session_search');
  assert.ok(registeredTool.description.includes('сессиям DSH'));
  
  // defineTool compiles parameter spec into JSON Schema object
  const props = registeredTool.parameters?.properties ?? registeredTool.parameters;
  assert.equal(props.query.type, 'string');
  assert.equal(props.limit.type, 'integer');
  assert.ok(props.limit.description.includes('15'));

  // Test output render
  const rendered = registeredTool.output.render({}, 'sample output');
  assert.deepEqual(rendered, [{ type: 'text', text: 'sample output' }]);

  const renderedEmpty = registeredTool.output.render({}, null);
  assert.deepEqual(renderedEmpty, [{ type: 'text', text: '' }]);
});

test('execute: successful search formatting and whitespace normalization', async () => {
  let tool = null;
  const mockCtx = {
    tools: { register: (def) => { tool = def; } },
    sessionQuery: {
      async searchSessions(req) {
        assert.equal(req.query, 'database migration');
        assert.equal(req.limit, 20);
        return {
          items: [
            {
              header: { id: 'sess-1', title: 'DB Migration Guide' },
              bestMatch: { snippet: 'Line 1\n  with    extra   spaces \t and content' },
            },
            {
              header: { id: 'sess-2', title: '' },
              bestMatch: { snippet: 'Second session snippet without title' },
            },
          ],
        };
      },
    },
  };

  plugin.apply(mockCtx);
  const result = await tool.execute({ query: 'database migration' });

  assert.ok(result.includes('• DB Migration Guide [sess-1]'));
  assert.ok(result.includes('Line 1 with extra spaces and content'));
  // Fallback to ID when title is empty
  assert.ok(result.includes('• sess-2 [sess-2]'));
  assert.ok(result.includes('Second session snippet without title'));
  // No next cursor indicator when nextCursor is absent
  assert.ok(!result.includes('(есть ещё результаты'));
});

test('execute: pagination indicator when nextCursor is present', async () => {
  let tool = null;
  const mockCtx = {
    tools: { register: (def) => { tool = def; } },
    sessionQuery: {
      async searchSessions() {
        return {
          items: [
            {
              header: { id: 'sess-page', title: 'Paged session' },
              bestMatch: { snippet: 'hit content' },
            },
          ],
          nextCursor: 'cursor_token_xyz',
        };
      },
    },
  };

  plugin.apply(mockCtx);
  const result = await tool.execute({ query: 'test' });
  assert.ok(result.includes('• Paged session [sess-page]'));
  assert.ok(result.includes('(есть ещё результаты — уточни запрос)'));
});

test('execute: limit parameter clamping (1..100) and defaults', async () => {
  let tool = null;
  let receivedLimit = null;
  const mockCtx = {
    tools: { register: (def) => { tool = def; } },
    sessionQuery: {
      async searchSessions(req) {
        receivedLimit = req.limit;
        return { items: [] };
      },
    },
  };

  plugin.apply(mockCtx, { maxResults: 25 });

  // Default limit from config
  await tool.execute({ query: 'test' });
  assert.equal(receivedLimit, 25);

  // Custom valid limit
  await tool.execute({ query: 'test', limit: 10 });
  assert.equal(receivedLimit, 10);

  // Clamped upper bound (> 100 -> 100)
  await tool.execute({ query: 'test', limit: 999 });
  assert.equal(receivedLimit, 100);

  // Clamped lower bound (< 1 -> 1)
  await tool.execute({ query: 'test', limit: -5 });
  assert.equal(receivedLimit, 1);
});

test('execute: empty results notice', async () => {
  let tool = null;
  const mockCtx = {
    tools: { register: (def) => { tool = def; } },
    sessionQuery: {
      async searchSessions() {
        return { items: [] };
      },
    },
  };

  plugin.apply(mockCtx);
  const result = await tool.execute({ query: 'nonexistent keyword' });
  assert.equal(result, 'session_search: совпадений не найдено.');

  // If page.items is undefined
  mockCtx.sessionQuery.searchSessions = async () => ({});
  const resultUndefined = await tool.execute({ query: 'nonexistent keyword' });
  assert.equal(resultUndefined, 'session_search: совпадений не найдено.');
});

test('execute: error handling from sessionQuery engine', async () => {
  let tool = null;
  const mockCtx = {
    tools: { register: (def) => { tool = def; } },
    sessionQuery: {
      async searchSessions() {
        throw new Error('SQLite FTS table corrupted');
      },
    },
  };

  plugin.apply(mockCtx);
  const result = await tool.execute({ query: 'crash test' });
  assert.equal(result, 'session_search: ошибка: SQLite FTS table corrupted');

  // Non-Error exception
  mockCtx.sessionQuery.searchSessions = async () => {
    throw 'raw string error';
  };
  const resultRaw = await tool.execute({ query: 'raw error' });
  assert.equal(resultRaw, 'session_search: ошибка: raw string error');
});

test('execute: AbortSignal forwarding', async () => {
  let tool = null;
  let receivedSignal = null;
  const mockCtx = {
    tools: { register: (def) => { tool = def; } },
    sessionQuery: {
      async searchSessions(_req, opts) {
        receivedSignal = opts?.signal;
        return { items: [] };
      },
    },
  };

  plugin.apply(mockCtx);
  const controller = new AbortController();
  await tool.execute({ query: 'abortable' }, { signal: controller.signal });
  assert.equal(receivedSignal, controller.signal);

  // Without signal
  await tool.execute({ query: 'no signal' }, {});
  assert.equal(receivedSignal, undefined);
});
