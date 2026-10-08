import test from 'node:test';
import assert from 'node:assert/strict';
import {catalog,generateTrace} from '../src/trace-engine.js';
import {algorithms} from '../src/sorts.js';
const keys=Object.keys(catalog);
test('exactly ten authentic algorithm traces are available',()=>{assert.equal(keys.length,10);assert.deepEqual(keys,Object.keys(algorithms));for(const key of keys){assert.ok(catalog[key].name);assert.ok(catalog[key].code.length);}});
let seed=20261008;function rand(){seed=(Math.imul(seed,1664525)+1013904223)|0;return seed>>>0}
const cases=[[],[1],[2,1],[3,2,1],[1,2,3,4,5],[2,2,2,2],[5,0,-3,5,-9,1],[-999,999,0,-1,100,50],[-10,-20,-10,1,2,11]];
for(let t=0;t<50;t++)cases.push(Array.from({length:rand()%40+2},()=>rand()%200-100));
for(const key of keys)test(key+' trace matches sorted result, retains input, and records genuine operations',()=>{
 for(const values of cases){
  const src=Object.freeze([...values]),frames=generateTrace(src,key);
  assert.ok(frames.length>=2);assert.deepEqual(frames[0].values,values);
  const final=frames.at(-1);assert.equal(final.kind,'complete');
  assert.deepEqual(final.values,algorithms[key].sort(values),key+' with '+JSON.stringify(values));
  assert.deepEqual(final.values,[...values].sort((a,b)=>a-b));
  assert.deepEqual(src,values);
  for(let i=1;i<frames.length;i++){
   assert.ok(frames[i].comparisons>=frames[i-1].comparisons);
   assert.ok(frames[i].swaps>=frames[i-1].swaps);
   assert.ok(frames[i].writes>=frames[i-1].writes);
   assert.equal(frames[i].values.length,values.length);
  }
 }
});
test('visual input validation and metadata',()=>{
 assert.throws(()=>generateTrace([2,NaN],'bubble'),TypeError);
 assert.throws(()=>generateTrace([1,2],'missing'),RangeError);
 assert.throws(()=>generateTrace(Array(97).fill(2),'heap'),RangeError);
 assert.equal(catalog.merge.stable,true);assert.equal(catalog.quick.stable,false);
});

test('algorithm-specific inspector metadata and persistent confirmed segments',()=>{
 const original=[5,2,4,1,3];
 for(const [key,type] of [['quick','quick'],['merge','merge'],['heap','heap'],['counting','counting'],['radix','radix'],['bucket','bucket']]){
  const frames=generateTrace(original,key);
  assert.ok(frames.some(f=>f.meta?.type===type),key+' lacks inspector trace metadata');
 }
 const bubble=generateTrace([4,3,2,1],'bubble');
 const first=bubble.findIndex(f=>f.kind==='pass');
 assert.ok(first>0);
 assert.ok(bubble[first].sorted.includes(3));
 assert.ok(bubble[first+1].sorted.includes(3),'confirmed sorted region must persist after the round');
 const radix=generateTrace([-93,-4,12,3,0],'radix');
 assert.ok(radix.some(f=>f.kind==='bucket'&&f.meta?.type==='radix'));
});
