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

test('v2.2: each finished trace contains a fully confirmed sorted state',()=>{
 for(const key of keys)for(const sample of [[4,2,1,3],[-8,0,3,-8,1],[7,7,7,7]]){
  const frames=generateTrace(sample,key),last=frames.at(-1);
  assert.equal(last.kind,'complete');
  assert.deepEqual(last.sorted,[...sample.keys()],key+' final nodes should be confirmed');
  assert.ok(frames.every(f=>Array.isArray(f.sorted)&&Array.isArray(f.localSorted)&&f.meta),'every frame needs teaching metadata');
 }
});
test('v2.2: only permanently confirmed indices persist across frames',()=>{
 for(const key of ['bubble','selection','heap']){
  const frames=generateTrace([8,7,5,6,4,1,3,2],key);
  for(let i=1;i<frames.length;i++)for(const index of frames[i-1].sorted)
   assert.ok(frames[i].sorted.includes(index),key+' settled item should not revert at frame '+i);
 }
 const early=generateTrace([1,2,3,4,5],'bubble');
 assert.equal(early.at(-2).sorted.length,5,'already sorted array should confirm all elements');
 const insertion=generateTrace([3,1,2],'insertion');
 assert.ok(insertion.some(f=>f.kind==='pass'&&f.localSorted.length>=2),'insertion should show a local ordered prefix');
 assert.ok(insertion.slice(1,-1).every(f=>f.sorted.length===0),'ordered prefix is not a permanently settled global segment');
});
test('v2.2: heap has child/parent context and swap metadata',()=>{
 const frames=generateTrace([5,9,1,8,2,7],'heap');
 assert.ok(frames.some(f=>f.meta.type==='heap'&&Array.isArray(f.meta.selected)&&f.meta.phase==='sift'));
 assert.ok(frames.some(f=>f.kind==='swap'&&f.meta.phase==='extract'));
 assert.ok(frames.some(f=>f.kind==='swap'&&f.meta.phase==='swap'));
});
test('v2.2: pivot pointers, merge read/write cursors and stable digit buckets',()=>{
 const quick=generateTrace([7,3,8,1,6,2],'quick');
 assert.ok(quick.some(f=>f.meta.type==='quick'&&Number.isInteger(f.meta.i)&&Number.isInteger(f.meta.j)));
 const merge=generateTrace([7,3,8,1,6,2],'merge');
 assert.ok(merge.some(f=>f.meta.type==='merge'&&Array.isArray(f.meta.left)&&Array.isArray(f.meta.right)&&Number.isInteger(f.meta.writeIndex)));
 const radix=generateTrace([-45,31,12,-9,4,0],'radix');
 assert.ok(radix.some(f=>f.kind==='bucket'&&f.meta.type==='radix'&&f.meta.phase==='distribute'&&Number.isInteger(f.meta.activeBucket)));
 assert.ok(radix.some(f=>f.kind==='write'&&f.meta.type==='radix'&&f.meta.phase==='collect'));
});
test('v2.2: counting has a dense frequency histogram and sparse fallback',()=>{
 const sample=[-5,8,-5,2,0,8,8],frames=generateTrace(sample,'counting');
 assert.ok(frames.some(f=>f.kind==='count'&&f.meta.mode==='dense'));
 assert.ok(frames.some(f=>f.kind==='write'&&f.meta.phase==='write'&&f.meta.activeKey!==undefined));
 assert.deepEqual(frames.at(-1).values,[...sample].sort((a,b)=>a-b));
 const huge=generateTrace([Number.MAX_SAFE_INTEGER,-1,0,Number.MIN_SAFE_INTEGER],'counting');
 assert.ok(huge.some(f=>f.meta.mode==='sparse-fallback'));
 assert.deepEqual(huge.at(-1).values,[Number.MIN_SAFE_INTEGER,-1,0,Number.MAX_SAFE_INTEGER]);
});
test('v2.2: bucket local insertion sort emits genuine writes and updated buckets',()=>{
 const frames=generateTrace([20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1],'bucket');
 const internal=frames.filter(f=>f.kind==='bucket-write');
 assert.ok(internal.length>1,'missing internal bucket movements');
 assert.ok(internal.every(f=>f.meta.phase==='shift'||f.meta.phase==='insert'));
 assert.ok(frames.some(f=>f.meta.type==='bucket'&&f.meta.phase==='collect'));
 const same=generateTrace([5,5,5,5],'bucket');
 assert.ok(same.some(f=>f.meta.type==='bucket'&&f.meta.phase==='constant'));
});
