import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');

test('all referenced UI IDs exist in the HTML', async () => {
  const html = await readFile(resolve(root, 'web/index.html'), 'utf8');
  const js = await readFile(resolve(root, 'web/app.js'), 'utf8');
  const ids = [...js.matchAll(/\$\('([^']+)'\)/g)].map(match => match[1]);
  assert.ok(ids.length >= 20);
  for (const id of ids) {
    assert.match(html, new RegExp(`\\bid="${id}"`), `missing DOM element: ${id}`);
  }
});

test('web entrypoint loads a classic offline-compatible bundle and ships CSS', async () => {
  const html = await readFile(resolve(root, 'web/index.html'), 'utf8');
  const js = await readFile(resolve(root, 'web/app.js'), 'utf8');
  const css = await readFile(resolve(root, 'web/styles.css'), 'utf8');
  const machine = await readFile(resolve(root, 'src/bubble-machine.js'), 'utf8');
  assert.match(html, /<script defer src="\.\/app\.bundle\.js"><\/script>/);
  assert.match(js, /import \{ BubbleMachine \} from '\.\.\/src\/bubble-machine\.js'/);
  assert.match(machine, /export class BubbleMachine/);
  assert.match(js, /import \{ BubbleMachine \} from/);
  assert.match(css, /\.bar\.sorted/);
});

test('offline HTML contains embedded CSS and executable JS (not module imports)', async () => {
  const file = await readFile(resolve(root, 'web/standalone.html'), 'utf8');
  const bundle = await readFile(resolve(root, 'web/app.bundle.js'), 'utf8');
  assert.match(file, /<style>[\s\S]*<\/style>/);
  assert.match(file, /<script>[\s\S]*<\/script>/);
  assert.doesNotMatch(file, /type="module"|src="\.\/app\.js"/);
  assert.match(bundle, /class BubbleMachine/);
  assert.match(bundle, /addEventListener\('click', applyCustom\)/);
});
