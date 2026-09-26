// @goodandready/dsh-session-search — client settings surface.
// Self-registering browser module for DeepSeek Harness Web UI.
// Canonical languages: English (en) and Chinese (zh).
// Matches DSH design tokens and native UI component conventions.

window.__ModuleLoader__.load({
  id: '@goodandready/dsh-session-search',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    const React = require('react');
    const h = React.createElement;
    const useState = React.useState;
    const useEffect = React.useEffect;
    const useCallback = React.useCallback;

    const PKG = '@goodandready/dsh-session-search';
    const ROW_ID = 'dsh-session-search';
    const ROW_CONFIG_KEY = PKG + '#' + ROW_ID;
    const NS = '@goodandready/dsh-session-search';

    // Primitives lookup (Chevron icon)
    let PrimitivesChevron = null;
    try {
      const prim = require('@deepseek-ai/dsh-client-ui-primitives');
      if (prim && (prim.IconChevronDownOutline14 || prim.IconChevronDown || prim.IconChevronDown16)) {
        PrimitivesChevron = prim.IconChevronDownOutline14 || prim.IconChevronDown || prim.IconChevronDown16;
      }
    } catch (primErr) {
      // Non-fatal fallback to SVG chevron
      PrimitivesChevron = null;
    }

    const en = {
      title: 'Session Search',
      subtitle: 'Core SQLite FTS5 agent memory query engine',
      'desc.header': 'Configure search limits, snippet sizes, and query deadlines for the autonomous agent session_search tool.',
      'field.maxResults': 'Default Max Results',
      'field.maxResults.desc': 'Maximum matching sessions returned per query (1–100, default: 20).',
      'field.snippetLength': 'Context Snippet Length',
      'field.snippetLength.desc': 'Character length of context excerpt sliced around best match (50–1000, default: 200).',
      'field.timeoutMs': 'Execution Timeout (ms)',
      'field.timeoutMs.desc': 'Cooperative search deadline in milliseconds (1000–120000, default: 30000).',
      'badge.engine': 'Engine: SQLite FTS5 (core)',
      'badge.tool': 'Tool: session_search',
      'badge.version': 'Version: v0.1.6',
      'badge.concurrency': 'Concurrency-Safe: True',
      'updater.title': 'Updater & Maintenance',
      'updater.desc': 'Session Search uses the host core SQLite FTS engine. Plugin updates are applied via the DSH CLI: dsh plugin --profile web add @goodandready/dsh-session-search@latest',
      'btn.save': 'Save Settings',
      'btn.saving': 'Saving…',
      'status.saved': 'Settings saved successfully.',
      'status.error': 'Validation failed: ',
      'error.maxResults': 'Max results must be an integer between 1 and 100.',
      'error.snippetLength': 'Snippet length must be an integer between 50 and 1000.',
      'error.timeoutMs': 'Timeout must be an integer between 1000 and 120000 ms.',
    };

    const zh = {
      title: '会话全文检索',
      subtitle: '基于核心 SQLite FTS5 引擎的 Agent 记忆检索工具',
      'desc.header': '为 Agent 的 session_search 工具配置检索匹配上限、上下文摘要长度及超时时间。',
      'field.maxResults': '默认最大结果数',
      'field.maxResults.desc': '单次检索返回的最大匹配会话条数 (1–100，默认值：20)。',
      'field.snippetLength': '匹配摘要截取长度',
      'field.snippetLength.desc': '最佳匹配词周围提取的文本片段字符长度 (50–1000，默认值：200)。',
      'field.timeoutMs': '执行超时时间 (毫秒)',
      'field.timeoutMs.desc': '底层会话检索引擎的协同超时时间 (1000–120000 毫秒，默认值：30000)。',
      'badge.engine': '检索引擎: SQLite FTS5 (内核服务)',
      'badge.tool': '注册工具: session_search',
      'badge.version': '版本: v0.1.6',
      'badge.concurrency': '并发安全: 支持',
      'updater.title': '插件升级与维护',
      'updater.desc': '本插件基于核心 sessionQuery 架构。插件升级请通过 DSH CLI 执行: dsh plugin --profile web add @goodandready/dsh-session-search@latest',
      'btn.save': '保存配置',
      'btn.saving': '正在保存…',
      'status.saved': '配置已成功保存。',
      'status.error': '参数校验失败: ',
      'error.maxResults': '最大结果数必须为 1 到 100 之间的整数。',
      'error.snippetLength': '摘要长度必须为 50 到 1000 之间的整数。',
      'error.timeoutMs': '超时时间必须为 1000 到 120000 毫秒之间的整数。',
    };

    const CSS_STYLES = `
.dss-card {
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-3);
  border-radius: 12px;
  list-style: none;
  margin-bottom: 12px;
  overflow: hidden;
  transition: border-color 0.15s ease;
  font-family: inherit;
}
.dss-card:hover {
  border-color: var(--dsw-alias-border-l1, var(--dsw-alias-border-l2));
}
.dss-header-btn {
  appearance: none;
  width: 100%;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  transition: background 0.15s ease;
}
.dss-header-btn:hover {
  background: var(--dsw-alias-bg-hover, var(--dsw-alias-bg-layer-hover));
}
.dss-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.dss-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.dss-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.dss-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary);
}
.dss-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary);
  border: 1px solid var(--dsw-alias-border-l2);
}
.dss-subtitle {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dss-chevron {
  margin-left: auto;
  color: var(--dsw-alias-label-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}
.dss-chevron-open {
  transform: rotate(180deg);
}
.dss-body {
  padding: 16px 20px 20px;
  border-top: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-2);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.dss-desc-box {
  font-size: 13px;
  line-height: 1.5;
  color: var(--dsw-alias-label-secondary);
  padding: 10px 14px;
  background: var(--dsw-alias-bg-layer-3);
  border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l2);
}
.dss-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}
.dss-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.dss-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--dsw-alias-label-primary);
}
.dss-hint {
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary);
  line-height: 1.4;
}
.dss-input {
  font: inherit;
  font-size: 13px;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-3);
  color: var(--dsw-alias-label-primary);
  outline: none;
  transition: border-color 0.15s ease;
}
.dss-input:focus {
  border-color: var(--dsw-alias-primary, var(--dsw-alias-border-l1));
}
.dss-action-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 4px;
  flex-wrap: wrap;
}
.dss-btn-primary {
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  padding: 8px 18px;
  border-radius: 6px;
  border: 0;
  cursor: pointer;
  background: var(--dsw-alias-primary, var(--dsw-alias-label-primary));
  color: var(--dsw-alias-bg-layer-1, var(--dsw-alias-bg-base));
  transition: opacity 0.15s ease;
}
.dss-btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}
.dss-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.dss-msg-success {
  font-size: 12px;
  color: var(--dsw-alias-label-primary);
  display: flex;
  align-items: center;
  gap: 4px;
}
.dss-msg-error {
  font-size: 12px;
  color: var(--dsw-alias-label-primary);
  display: flex;
  align-items: center;
  gap: 4px;
}
.dss-footer-note {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary);
  border-top: 1px solid var(--dsw-alias-border-l2);
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dss-footer-code {
  font-family: monospace;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--dsw-alias-bg-layer-3);
  border: 1px solid var(--dsw-alias-border-l2);
  word-break: break-all;
}
`;

    function ensureStyles() {
      if (typeof document === 'undefined') return;
      const id = 'dsh-session-search-styles';
      if (document.getElementById(id)) return;
      const el = document.createElement('style');
      el.id = id;
      el.setAttribute('data-dsh-plugin', '@goodandready/dsh-session-search');
      el.textContent = CSS_STYLES;
      document.head.appendChild(el);
    }

    function RenderChevron(props) {
      if (PrimitivesChevron) {
        return h(PrimitivesChevron, { className: 'dss-chevron-icon' });
      }
      return h(
        'svg',
        {
          width: 14,
          height: 14,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        },
        h('polyline', { points: '6 9 12 15 18 9' })
      );
    }

    function SessionSearchSettingsCard(props) {
      ensureStyles();
      const ctx = props.ctx;
      const t = props.t || ((k) => en[k] || k);

      const [open, setOpen] = useState(false);
      const [maxResults, setMaxResults] = useState('20');
      const [snippetLength, setSnippetLength] = useState('200');
      const [timeoutMs, setTimeoutMs] = useState('30000');
      const [saving, setSaving] = useState(false);
      const [statusMsg, setStatusMsg] = useState(null);
      const [isError, setIsError] = useState(false);

      const scope = ctx?.settingsScope ? ctx.settingsScope.bind({ namespace: NS }) : null;

      // Load initial settings
      useEffect(() => {
        if (!scope || typeof scope.get !== 'function') return;
        try {
          const cfg = scope.get();
          if (cfg && typeof cfg === 'object') {
            if (cfg.maxResults !== undefined) setMaxResults(String(cfg.maxResults));
            if (cfg.snippetLength !== undefined) setSnippetLength(String(cfg.snippetLength));
            if (cfg.timeoutMs !== undefined) setTimeoutMs(String(cfg.timeoutMs));
          }
        } catch (readErr) {
          // Scope not ready or unavailable yet
        }
      }, [scope]);

      const handleSave = useCallback(async () => {
        const mr = parseInt(maxResults, 10);
        if (Number.isNaN(mr) || mr < 1 || mr > 100) {
          setStatusMsg(t('error.maxResults'));
          setIsError(true);
          return;
        }
        const sl = parseInt(snippetLength, 10);
        if (Number.isNaN(sl) || sl < 50 || sl > 1000) {
          setStatusMsg(t('error.snippetLength'));
          setIsError(true);
          return;
        }
        const to = parseInt(timeoutMs, 10);
        if (Number.isNaN(to) || to < 1000 || to > 120000) {
          setStatusMsg(t('error.timeoutMs'));
          setIsError(true);
          return;
        }

        setSaving(true);
        setStatusMsg(null);
        setIsError(false);

        try {
          if (scope && typeof scope.set === 'function') {
            await scope.set('maxResults', mr);
            await scope.set('snippetLength', sl);
            await scope.set('timeoutMs', to);
          }
          setStatusMsg(t('status.saved'));
          setIsError(false);
        } catch (saveErr) {
          setStatusMsg(t('status.error') + (saveErr?.message || String(saveErr)));
          setIsError(true);
        } finally {
          setSaving(false);
        }
      }, [maxResults, snippetLength, timeoutMs, scope, t]);

      return h(
        'li',
        { className: 'dss-card' },
        h(
          'button',
          {
            type: 'button',
            className: 'dss-header-btn',
            onClick: () => setOpen(!open),
            'aria-expanded': open,
          },
          h('div', { className: 'dss-icon-box' }, '🔍'),
          h(
            'div',
            { className: 'dss-title-group' },
            h(
              'div',
              { className: 'dss-title-row' },
              h('span', { className: 'dss-title' }, t('title')),
              h('span', { className: 'dss-badge' }, t('badge.version')),
              h('span', { className: 'dss-badge' }, t('badge.tool')),
              h('span', { className: 'dss-badge' }, t('badge.concurrency'))
            ),
            h('span', { className: 'dss-subtitle' }, t('subtitle'))
          ),
          h(
            'div',
            { className: 'dss-chevron' + (open ? ' dss-chevron-open' : '') },
            h(RenderChevron)
          )
        ),
        open &&
          h(
            'div',
            { className: 'dss-body' },
            h('div', { className: 'dss-desc-box' }, t('desc.header')),
            h(
              'div',
              { className: 'dss-form-grid' },
              h(
                'div',
                { className: 'dss-field' },
                h('label', { className: 'dss-label', htmlFor: 'dss-max-results' }, t('field.maxResults')),
                h('input', {
                  id: 'dss-max-results',
                  className: 'dss-input',
                  type: 'number',
                  min: 1,
                  max: 100,
                  value: maxResults,
                  onChange: (e) => setMaxResults(e.target.value),
                }),
                h('span', { className: 'dss-hint' }, t('field.maxResults.desc'))
              ),
              h(
                'div',
                { className: 'dss-field' },
                h('label', { className: 'dss-label', htmlFor: 'dss-snippet-len' }, t('field.snippetLength')),
                h('input', {
                  id: 'dss-snippet-len',
                  className: 'dss-input',
                  type: 'number',
                  min: 50,
                  max: 1000,
                  value: snippetLength,
                  onChange: (e) => setSnippetLength(e.target.value),
                }),
                h('span', { className: 'dss-hint' }, t('field.snippetLength.desc'))
              ),
              h(
                'div',
                { className: 'dss-field' },
                h('label', { className: 'dss-label', htmlFor: 'dss-timeout-ms' }, t('field.timeoutMs')),
                h('input', {
                  id: 'dss-timeout-ms',
                  className: 'dss-input',
                  type: 'number',
                  min: 1000,
                  max: 120000,
                  step: 1000,
                  value: timeoutMs,
                  onChange: (e) => setTimeoutMs(e.target.value),
                }),
                h('span', { className: 'dss-hint' }, t('field.timeoutMs.desc'))
              )
            ),
            h(
              'div',
              { className: 'dss-action-row' },
              h(
                'button',
                {
                  type: 'button',
                  className: 'dss-btn-primary',
                  disabled: saving,
                  onClick: handleSave,
                },
                saving ? t('btn.saving') : t('btn.save')
              ),
              statusMsg &&
                h(
                  'span',
                  { className: isError ? 'dss-msg-error' : 'dss-msg-success' },
                  statusMsg
                )
            ),
            h(
              'div',
              { className: 'dss-footer-note' },
              h('strong', null, t('updater.title')),
              h('span', null, t('updater.desc')),
              h('code', { className: 'dss-footer-code' }, 'dsh plugin --profile web add @goodandready/dsh-session-search@latest')
            )
          )
      );
    }

    exports.apply = function apply(ctx) {
      ctx.effect(() => {
        if (ctx.locale && typeof ctx.locale.register === 'function') {
          try {
            ctx.locale.register(NS, { en, zh });
          } catch (localeErr) {
            // Locale already registered
          }
        }
      }, 'dsh-session-search: locales');

      ctx.effect(() => {
        const slotsToRegister = [
          { name: 'plugins.row.config', key: ROW_CONFIG_KEY, order: 25, locale: NS, inject: () => ({ ctx }) },
          { name: 'settings.plugin.item', key: NS, order: 25, locale: NS, inject: () => ({ ctx }) },
          { name: 'plugins.item', id: ROW_ID, order: 25, label: () => 'Session Search', locale: NS, inject: () => ({ ctx }) },
        ];

        const unregisterFns = [];
        if (ctx.slots && typeof ctx.slots.register === 'function') {
          for (const item of slotsToRegister) {
            try {
              const unreg = ctx.slots.register(item, SessionSearchSettingsCard);
              if (typeof unreg === 'function') unregisterFns.push(unreg);
            } catch (slotErr) {
              // Slot unavailable in this build
            }
          }
        }

        return () => {
          for (const fn of unregisterFns) {
            try {
              fn();
            } catch (cleanupErr) {
              // Best-effort slot cleanup
            }
          }
        };
      }, 'dsh-session-search: settings-slot');
    };

    return module.exports;
  },
});
