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

test('package files allowlist includes only product files without test directory', async () => {
  const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
  assert.ok(Array.isArray(pkg.files));
  assert.ok(!pkg.files.includes('test'), 'test directory must not be in package.json files');
  assert.ok(pkg.files.includes('lib'), 'lib must be in files');
  assert.ok(pkg.files.includes('cordis.patch.yml'), 'cordis.patch.yml must be in files');
  assert.ok(pkg.files.includes('README.md'), 'README.md must be in files');
  assert.ok(pkg.files.includes('LICENSE'), 'LICENSE must be in files');
});

test('client module matches package identity and provides settings slots', async () => {
  const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
  const clientSrc = await readFile(resolve(root, 'lib/client.js'), 'utf8');
  assert.equal(pkg.exports?.['./client'], './lib/client.js');
  assert.match(clientSrc, /id: '@goodandready\/dsh-session-search'/);
  assert.match(clientSrc, /plugins\.row\.config/);
  assert.match(clientSrc, /settings\.plugin\.item/);
  assert.match(clientSrc, /data-dsh-plugin/);
});

test('source has no machine-specific infrastructure references', async () => {
  const [source, client, readme] = await Promise.all([
    readFile(resolve(root, 'lib/index.js'), 'utf8'),
    readFile(resolve(root, 'lib/client.js'), 'utf8'),
    readFile(resolve(root, 'README.md'), 'utf8'),
  ]);
  assert.doesNotMatch(source + '\n' + client + '\n' + readme, /\/home\/|192\.168\.|codex_migrate|MiniAI|MiniPC|vadim@/);
});

