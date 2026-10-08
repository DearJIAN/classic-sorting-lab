import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('offline entrypoints contain ten selectable algorithms and theme controls',async()=>{
 const html=await readFile(new URL('../web/standalone.html',import.meta.url),'utf8');
 const index=await readFile(new URL('../web/index.html',import.meta.url),'utf8');
 assert.equal(html,index);
 for(const name of ['bubble','selection','insertion','shell','merge','quick','heap','counting','radix','bucket'])assert.match(html,new RegExp("'"+name+"'"));
 for(const id of ['algoList','themeBtn','bars','apply','play','step','back','reset'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/localStorage/);assert.match(html,/function build\(key,arr\)/);
});