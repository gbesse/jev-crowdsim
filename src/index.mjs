// Purpose: Generate explicit audience grids, sample reproducibly, evaluate typed reactions, and aggregate code-owned effects.
import{readFile,writeFile}from'node:fs/promises';import{estimateCostUsd,estimateTokens}from'./jev-client.mjs';export{createFakeProvider,createJevClient}from'./jev-client.mjs';
const invalid=message=>{throw new TypeError('FR : '+message.fr+' EN: '+message.en+' ES: '+message.es);};
const bounds=()=>invalid({fr:'grille ou budget invalide.',en:'invalid grid or budget.',es:'cuadrícula o presupuesto no válido.'});
export function validateDesign(d){
 if(!d?.axes||typeof d.axes!=='object'||Array.isArray(d.axes)||!Object.keys(d.axes).length||Object.keys(d.axes).length>16)bounds();
 for(const levels of Object.values(d.axes))if(!Array.isArray(levels)||!levels.length||levels.length>1000||new Set(levels).size!==levels.length||Array.from(levels).some(x=>typeof x!=='string'||!x.trim()||x.length>512))bounds();
 if(!Array.isArray(d.objections)||!d.objections.length||d.objections.length>255||new Set(d.objections).size!==d.objections.length||Array.from(d.objections).some(x=>typeof x!=='string'||!x.trim()))bounds();
 return d;
}
function gridInfo(axes){
 validateDesign({axes,objections:['none']});
 const entries=Object.entries(axes);let total=1;const strides=[];
 for(let i=entries.length-1;i>=0;i--){strides[i]=total;total*=entries[i][1].length;if(!Number.isSafeInteger(total))bounds();}
 return {entries,strides,total};
}
const rowAt=(grid,index)=>Object.fromEntries(grid.entries.map(([key,levels],i)=>[key,levels[Math.floor(index/grid.strides[i])%levels.length]]));
export function factorial(axes){const grid=gridInfo(axes);if(grid.total>100000)bounds();return Array.from({length:grid.total},(_,i)=>rowAt(grid,i));}
function rng(seed){let x=seed>>>0;return()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/2**32)}
export function chooseRespondents(design,{maxFull=64,budget=200,seed=42}={}){
 validateDesign(design);
 if(!Number.isSafeInteger(maxFull)||maxFull<0||maxFull>10000||!Number.isSafeInteger(budget)||budget<1||budget>10000||!Number.isSafeInteger(seed)||seed<0||seed>4294967295)bounds();
 const grid=gridInfo(design.axes),target=Math.min(budget,grid.total),used=new Set(),selected=[];
 const add=index=>{if(!used.has(index)&&selected.length<target){used.add(index);selected.push(rowAt(grid,index));}};
 if(grid.total<=Math.min(maxFull,budget))for(let i=0;i<grid.total;i++)add(i);
 else{
  for(let axis=0;axis<grid.entries.length;axis++)for(let level=0;level<grid.entries[axis][1].length&&selected.length<target;level++){
   const stride=grid.strides[axis],levels=grid.entries[axis][1].length;
   for(let ordinal=0;ordinal<Math.min(grid.total/levels,used.size+1);ordinal++){
    const index=level*stride+ordinal%stride+Math.floor(ordinal/stride)*stride*levels;
    if(!used.has(index)){add(index);break;}
   }
  }
  const random=rng(seed),swaps=new Map();let remaining=grid.total;
  while(selected.length<target){const position=Math.floor(random()*remaining),index=swaps.get(position)??position;
   remaining--;swaps.set(position,swaps.get(remaining)??remaining);swaps.delete(remaining);add(index);}
 }
 const coverage=Object.fromEntries(grid.entries.map(([key,levels])=>[key,{observedLevels:levels.filter(level=>selected.some(r=>r[key]===level)),missingLevels:levels.filter(level=>!selected.some(r=>r[key]===level))}]));
 return {mode:grid.total<=Math.min(maxFull,budget)?'full-factorial':'seeded-balanced-sample',respondents:selected,totalCombinations:grid.total,seed,coverage};
}
export function reactionQuestions(design){return{would_engage:{type:'noul',instructions:'Would this explicitly described respondent engage with the message?'},trust:{type:'score',instructions:'How much would this respondent trust the message?',criteria:['No trust','Low','Moderate','High']},would_convert:{type:'noul',instructions:'Would this respondent take the requested conversion action?'},objection:{type:'choice',instructions:'Which declared objection category best matches this respondent reaction?',criteria:Object.fromEntries(design.objections.map(x=>[x,null]))}}}
export function wilson(successes,n,z=1.96){if(!n)return null;const p=successes/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,m=z*Math.sqrt((p*(1-p)+z*z/(4*n))/n)/d;return{low:Math.max(0,c-m),high:Math.min(1,c+m)}}
function metrics(a){return{engage:a.would_engage.noul,trust:a.trust.score/Math.max(1,Object.keys(a.trust.legend).length-1),convert:a.would_convert.noul}}
export function mainEffects(rows,axes){const out=Object.create(null);for(const[axis,levels]of Object.entries(axes)){out[axis]=Object.create(null);for(const level of levels){const selected=rows.filter(r=>r.respondent[axis]===level),m=selected.map(r=>metrics(r.answers));out[axis][level]={n:selected.length,engage:m.length?m.reduce((s,x)=>s+x.engage,0)/m.length:null,trust:m.length?m.reduce((s,x)=>s+x.trust,0)/m.length:null,convert:m.length?m.reduce((s,x)=>s+x.convert,0)/m.length:null,convertWilson:wilson(m.reduce((s,x)=>s+(x.convert>=.5?1:0),0),m.length)}}}return out}
async function parallel(items,limit,fn,signal){
 const controller=new AbortController(),combined=signal?AbortSignal.any([signal,controller.signal]):controller.signal;
 let i=0,failed=false;const out=[];
 await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{
  while(!failed&&i<items.length){combined.throwIfAborted();const n=i++;
   try{out[n]=await fn(items[n],combined);combined.throwIfAborted();}
   catch(error){failed=true;controller.abort(error);throw error;}
  }
  combined.throwIfAborted();
 }));return out;
}
function validateMessage(message){if(typeof message!=='string'||!message.trim()||message.length>50000)invalid({fr:'message vide, invalide ou trop long.',en:'empty, invalid or oversized message.',es:'mensaje vacío, no válido o demasiado largo.'});}

export async function simulate({design,message,provider,maxFull=64,budget=200,seed=42,concurrency=8,respondents,signal}){validateMessage(message);signal?.throwIfAborted();design=structuredClone(validateDesign(design));if(!Number.isSafeInteger(concurrency)||concurrency<1||concurrency>64||!Number.isSafeInteger(budget)||budget<1||budget>10000)bounds();if(respondents){if(!Array.isArray(respondents)||!respondents.length||respondents.length>budget||respondents.some(row=>!row||Object.keys(row).length!==Object.keys(design.axes).length||Object.entries(design.axes).some(([key,levels])=>!levels.includes(row[key]))))bounds();respondents=structuredClone(respondents);}const selection=respondents?{mode:'provided',respondents,totalCombinations:gridInfo(design.axes).total}:chooseRespondents(design,{maxFull,budget,seed}),questions=reactionQuestions(design);const rows=await parallel(selection.respondents,concurrency,async (respondent,runSignal)=>{const r=await provider({state:{message,respondent:structuredClone(respondent)},questions:structuredClone(questions),signal:runSignal});runSignal.throwIfAborted();return{respondent,answers:structuredClone(r.answers),usage:structuredClone(r.usage)}},signal);const input=rows.reduce((n,r)=>n+r.usage.input_tokens,0);return{...selection,rows,effects:mainEffects(rows,design.axes),usage:{input_tokens:input,estimated_cost_usd:estimateCostUsd(input)}}}
export async function compare({design,messageA,messageB,provider,...options}){validateMessage(messageA);validateMessage(messageB);design=structuredClone(design);const selected=chooseRespondents(design,options).respondents;const a=await simulate({...options,design,message:messageA,provider,respondents:selected});const b=await simulate({...options,design,message:messageB,provider,respondents:selected});return{respondents:selected,a,b,pairedEffects:pairedEffects(a.rows,b.rows,design.axes)}}
export function estimateSimulation(design,message,options={}){const s=chooseRespondents(design,options),per=estimateTokens({state:{message,respondent:s.respondents[0]},questions:reactionQuestions(design)}),n=s.respondents.length;return{mode:s.mode,respondents:n,requests:n,estimatedInputTokens:n*per,estimatedCostUsd:estimateCostUsd(n*per)}}
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');const REPORT_COPY={
 en:{respondents:'declared synthetic respondents',effects:'Main effects',every:'Every respondent',axis:'Axis',level:'Level',engage:'Engage',convert:'Convert',traits:'Traits',objection:'Objection'},
 fr:{respondents:'répondants synthétiques déclarés',effects:'Effets principaux',every:'Chaque répondant',axis:'Axe',level:'Niveau',engage:'Engagement',convert:'Conversion',traits:'Traits',objection:'Objection'},
 es:{respondents:'participantes sintéticos declarados',effects:'Efectos principales',every:'Cada participante',axis:'Eje',level:'Nivel',engage:'Interés',convert:'Conversión',traits:'Rasgos',objection:'Objeción'},
};
export function renderHtml(report,{lang='en'}={}){if(!Object.hasOwn(REPORT_COPY,lang))bounds();const t=REPORT_COPY[lang];const rows=report.rows.map(r=>`<tr><td>${esc(Object.entries(r.respondent).map(([k,v])=>`${k}: ${v}`).join(', '))}</td><td>${Math.round(r.answers.would_engage.noul*100)}</td><td>${Math.round(r.answers.would_convert.noul*100)}</td><td>${esc(r.answers.objection.choice)}</td></tr>`).join('');const effects=Object.entries(report.effects).flatMap(([a,l])=>Object.entries(l).map(([v,m])=>`<tr><td>${esc(a)}</td><td>${esc(v)}</td><td>${(m.engage===null?'—':Math.round(m.engage*100))}</td><td>${(m.convert===null?'—':Math.round(m.convert*100))}</td></tr>`)).join('');return`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>Jev CrowdSim</title><style>body{font:16px system-ui;max-width:1100px;margin:50px auto;background:#fbf6ed;color:#1f2937}table{border-collapse:collapse;width:100%;margin:20px 0}td,th{padding:10px;border-bottom:1px solid #d6cfc3;text-align:left}h1{font-size:4rem}</style></head><body><h1>CrowdSim</h1><p>${report.mode}; ${report.rows.length} ${t.respondents}.</p><h2>${t.effects}</h2><table><tr><th>${t.axis}</th><th>${t.level}</th><th>${t.engage}</th><th>${t.convert}</th></tr>${effects}</table><h2>${t.every}</h2><table><tr><th>${t.traits}</th><th>${t.engage}</th><th>${t.convert}</th><th>${t.objection}</th></tr>${rows}</table></body></html>`}
export async function writeReport(report,path,options={}){await writeFile(path,renderHtml(report,options),{flag:'wx',mode:0o600});return path}export async function loadDesign(path){return validateDesign(JSON.parse(await readFile(path,'utf8')))}

// Paired synthetic score differences, never a human conversion-lift estimate.
export function pairedEffects(rowsA,rowsB,axes){
 if(!Array.isArray(rowsA)||!Array.isArray(rowsB)||rowsA.length!==rowsB.length)bounds();
 const pairs=rowsA.map((a,i)=>{const b=rowsB[i];if(!a?.respondent||!b?.respondent||Object.keys(a.respondent).length!==Object.keys(b.respondent).length||Object.entries(a.respondent).some(([k,v])=>b.respondent[k]!==v))bounds();const A=metrics(a.answers),B=metrics(b.answers);if(Object.values(A).some(v=>!Number.isFinite(v)||v<0||v>1)||Object.values(B).some(v=>!Number.isFinite(v)||v<0||v>1))bounds();return{respondent:a.respondent,A,B};});
 const summarize=selected=>({n:selected.length,metrics:Object.fromEntries(['engage','trust','convert'].map(key=>{const differences=selected.map(p=>p.B[key]-p.A[key]);return[key,{meanA:selected.length?selected.reduce((s,p)=>s+p.A[key],0)/selected.length:null,meanB:selected.length?selected.reduce((s,p)=>s+p.B[key],0)/selected.length:null,meanDelta:differences.length?differences.reduce((s,d)=>s+d,0)/differences.length:null,increased:differences.filter(d=>d>0).length,decreased:differences.filter(d=>d<0).length,unchanged:differences.filter(d=>d===0).length}];}))});
 return{kind:'paired-synthetic-score-differences',overall:summarize(pairs),axes:Object.fromEntries(Object.entries(axes).map(([axis,levels])=>[axis,Object.fromEntries(levels.map(level=>[level,summarize(pairs.filter(p=>p.respondent[axis]===level))]))]))};
}
