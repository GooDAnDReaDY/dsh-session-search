import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('public package and host bundle identities match', async () => {
  const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
  const patch = await readFile(resolve(root, 'cordis.patch.yml'), 'utf8');
  assert.equal(pkg.name, '@goodandready/dsh-session-search');
  assert.match(patch, /name: '@goodandready\/dsh-session-search'/);
  assert.doesNotMatch(patch, /name: '@goodandready-private\/dsh-session-search'/);
});

test('source has no machine-specific infrastructure references', async () => {
  const [source, readme] = await Promise.all([
    readFile(resolve(root, 'lib/index.js'), 'utf8'),
    readFile(resolve(root, 'README.md'), 'utf8'),
  ]);
  assert.doesNotMatch(source + '\n' + readme, /\/home\/|192\.168\.|codex_migrate|MiniAI|MiniPC|vadim@/);
});
