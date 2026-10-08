import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {resolve} from 'node:path';
const read=p=>readFile(resolve(import.meta.dirname,'..',p),'utf8');
test('interface hooks exist in the HTML',async()=>{const html=await read('web/index.html'),app=await read('web/app.js');const ids=[...app.matchAll(/\$\('([^']+)'\)/g)].map(m=>m[1]);assert.ok(ids.length>35);for(const id of ids)assert.match(html,new RegExp('\\bid="'+id+'"'),'Missing element: '+id);});
test('ten algorithm UI, theme toggle, and custom-array events are wired',async()=>{const html=await read('web/index.html'),app=await read('web/app.js');assert.match(html,/id="algorithmGrid"/);assert.match(html,/id="themeBtn"/);assert.match(app,/addEventListener\('click',applyCustom\)/);assert.match(app,/selectAlgorithm/);assert.match(app,/generateTrace\(initial,algorithm\)/);assert.match(app,/applyTheme/);});
test('generated standalone embeds styling and app logic',async()=>{const html=await read('web/standalone.html'),bundle=await read('web/app.bundle.js');assert.match(html,/<style>[\s\S]*<\/style>/);assert.match(html,/<script>[\s\S]*<\/script>/);assert.doesNotMatch(html,/src="\.\/app\.bundle\.js"|href="\.\/styles\.css"/);assert.match(bundle,/function generateTrace\(/);assert.match(bundle,/addEventListener\('click',applyCustom\)/);assert.match(html,/data-theme="light"/);});

test('every ui.* property exists in the controller handle map',async()=>{
 const app=await read('web/app.js');
 const init=app.slice(app.indexOf('const ui='),app.indexOf(';\nlet algorithm'));
 const names=new Set([...init.matchAll(/\b([A-Za-z_$][\w$]*):\$\('/g)].map(m=>m[1]));
 const used=[...app.matchAll(/\bui\.([A-Za-z_$][\w$]*)/g)].map(m=>m[1]);
 for(const name of used)assert.ok(names.has(name),'Undefined UI binding: ui.'+name);
});

test('timeline, inspector, comparison and signed axis are present in both builds',async()=>{
 const html=await read('web/index.html'),app=await read('web/app.js'),css=await read('web/styles.css');
 for(const id of ['timelineRange','zeroLine','inspectorVisual','compareSelect','compareBtn','panelCompare'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(app,/function renderInspector/);
 assert.match(app,/function compareAlgorithms/);
 assert.match(app,/function renderBars/);
 assert.match(css,/--on-primary:#132e28/);
});

test('v2.2: real connected heap SVG and algorithm-specific animations are wired',async()=>{
 const app=await read('web/app.js'),css=await read('web/styles.css'),engine=await read('src/trace-engine.js');
 for(const token of ['function renderHeapTree','heap-edge','heapCoordinates','counting-list','quick-lane','radix-buckets','range-buckets','renderInspector(f,previous)','localSorted'])assert.ok(app.includes(token),'Missing UI behavior '+token);
 assert.match(css,/\.heap-edge/);assert.match(css,/\.heap-value/);assert.match(css,/\.bar\.local-sorted/);
 assert.match(engine,/bucket-write/);assert.match(engine,/sparse-fallback/);
});
