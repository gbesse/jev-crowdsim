import test from 'node:test';
import assert from 'node:assert/strict';
import { simulate, compare, validateDesign, mainEffects } from '../src/index.mjs';
const gate=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return{resolve,promise};};
const response=()=>({answers:{would_engage:{noul:.5},would_convert:{noul:.5},trust:{score:1,legend:{0:'a',1:'b',2:'c',3:'d'}},objection:{choice:'none'}},usage:{input_tokens:1,output_tokens:0}});
const design={axes:{segment:['a','b','c','d','e','f']},objections:['none']};
test('one failed worker prevents surviving workers from dispatching more respondents',{timeout:3000},async()=>{
 const first=gate(),second=gate(),started=gate();let calls=0;
 const provider=async()=>{const n=++calls;if(calls===2)started.resolve();if(n===1){await first.promise;throw new Error('synthetic failure');}await second.promise;return response();};
 const rejection=assert.rejects(simulate({design,message:'hello',provider,concurrency:2}),/synthetic failure/);
 await started.promise;first.resolve();await rejection;second.resolve();await new Promise(r=>setImmediate(r));assert.equal(calls,2);
});
test('provider cannot rewrite selected traits or following question contracts',async()=>{
 const seen=[];const result=await simulate({design:{axes:{segment:['a','b']},objections:['none']},message:'hello',concurrency:1,provider:async request=>{seen.push(request.questions.would_engage.instructions);request.state.respondent.segment='rewritten';request.questions.would_engage.instructions='rewritten';return response();}});
 assert.deepEqual(result.rows.map(r=>r.respondent.segment),['a','b']);assert.equal(seen[0],seen[1]);assert.equal(result.effects.segment.a.n,1);
});
test('reused provider answers are detached as each response is received',async()=>{
 const shared=response();let calls=0;const result=await simulate({design:{axes:{x:['a','b']},objections:['none']},message:'hello',concurrency:1,provider:async()=>{shared.answers.would_convert.noul=++calls/10;return shared;}});
 assert.deepEqual(result.rows.map(r=>r.answers.would_convert.noul),[.1,.2]);shared.answers.would_convert.noul=.9;assert.equal(result.rows[1].answers.would_convert.noul,.2);
});
test('prototype-like user-authored axes and levels survive effect JSON export',async()=>{
 const axes=Object.fromEntries([['__proto__',['constructor','__proto__']]]);const rows=axes.__proto__.map(level=>({respondent:Object.fromEntries([['__proto__',level]]),answers:response().answers}));
 const exported=JSON.parse(JSON.stringify(mainEffects(rows,axes)));assert.equal(exported.__proto__.constructor.n,1);assert.equal(exported.__proto__.__proto__.n,1);assert.ok(Object.hasOwn(exported,'__proto__'));
});
test('sparse axis and objection arrays fail before execution',()=>{
 for(const value of [{axes:{x:Array(1)},objections:['none']},{axes:{x:['a']},objections:Array(1)}])assert.throws(()=>validateDesign(value),/invalid grid/);
});
test('compare keeps its selected paired grid even if options contain respondents',async()=>{
 const paired=await compare({design:{axes:{segment:['a','b']},objections:['none']},messageA:'A',messageB:'B',provider:async()=>response(),respondents:[{segment:'a'}]});
 assert.deepEqual(paired.a.rows.map(r=>r.respondent),paired.respondents);assert.deepEqual(paired.b.rows.map(r=>r.respondent),paired.respondents);
});
test('both comparison messages are checked before the first call',async()=>{
 let calls=0;await assert.rejects(compare({design,messageA:'A',messageB:'',provider:async()=>{calls++;return response();}}),/invalid or oversized message/);assert.equal(calls,0);
});
test('external cancellation rejects late answers and dispatches no successor',{timeout:3000},async()=>{
 const started=gate(),release=gate(),controller=new AbortController();let calls=0;
 const pending=assert.rejects(simulate({design,message:'hello',concurrency:1,signal:controller.signal,provider:async()=>{calls++;started.resolve();await release.promise;return response();}}),{name:'AbortError'});
 await started.promise;controller.abort();release.resolve();await pending;assert.equal(calls,1);
});
