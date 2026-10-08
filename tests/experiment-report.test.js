import test from 'node:test';
import assert from 'node:assert/strict';
import {createExperimentReport,experimentReportToCsv,catalog} from '../src/trace-engine.js';

test('V3 report compares two different algorithms using exactly the same unsullied input',()=>{
 const data=Object.freeze([8,-3,5,-3,7,0]);
 const report=createExperimentReport(data,'bubble','quick');
 assert.deepEqual(report.input,data);
 assert.equal(report.schemaVersion,'sorting-lab-v3.0');
 assert.equal(report.synchronization,'normalized-progress');
 assert.equal(report.results.length,2);
 assert.deepEqual(report.results.map(x=>x.algorithm),['bubble','quick']);
 for(const result of report.results){
  assert.equal(result.name,catalog[result.algorithm].name);
  assert.deepEqual(result.frames[0].values,data);
  assert.deepEqual(result.finalValues,[-3,-3,0,5,7,8]);
  assert.equal(result.frameCount,result.frames.length);
  assert.equal(result.frames.at(-1).progress,1);
  assert.equal(result.frames[0].progress,0);
  assert.ok(result.frames.every((frame,i)=>frame.step===i));
  for(const k of ['comparisons','swaps','writes','pass'])
   assert.equal(result.totals[k],result.frames.at(-1)[k]);
 }
 assert.deepEqual(data,[8,-3,5,-3,7,0]);
});
test('V3 export CSV contains exactly one row per native event of both algorithms',()=>{
 const r=createExperimentReport([3,1,2,2],'merge','insertion');
 const csv=experimentReportToCsv(r);
 assert.ok(csv.startsWith('\uFEFFalgorithm,name,step,progress,kind,detail,values,active,sorted,'));
 assert.equal(csv.match(/\r\n/g).length,1+r.results.reduce((s,x)=>s+x.frameCount,0));
 assert.match(csv,/"merge"/);
 assert.match(csv,/"insertion"/);
 assert.match(csv,/"\[3,1,2,2\]"/);
 assert.match(csv,/^.+\r\n.+\r\n/s);
 const json=JSON.parse(JSON.stringify(r));
 assert.deepEqual(json.input,[3,1,2,2]);
 assert.ok(json.results.every(x=>x.frames.some(f=>typeof f.meta==='object')));
});
test('V3 report rejects mismatched algorithms, invalid inputs and stale trace data',()=>{
 assert.throws(()=>createExperimentReport([4],'bubble','quick'),RangeError);
 assert.throws(()=>createExperimentReport([1,NaN],'bubble','quick'),TypeError);
 assert.throws(()=>createExperimentReport([1,2],'bubble','bubble'),RangeError);
 assert.throws(()=>createExperimentReport([1,2],'missing','quick'),RangeError);
 assert.throws(()=>createExperimentReport([1,2],'bubble','quick',[[{values:[99],kind:'init'}],[]]),TypeError);
});
test('V3 report supports every pairing of the ten algorithms',()=>{
 const keys=Object.keys(catalog);
 for(let i=0;i<keys.length;i++){
  const a=keys[i],b=keys[(i+1)%keys.length];
  const r=createExperimentReport([-31,0,12,12,-5,6,7,4],a,b);
  assert.deepEqual(r.results[0].finalValues,r.results[1].finalValues);
 }
});
