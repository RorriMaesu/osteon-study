import test from 'node:test';
import assert from 'node:assert/strict';
import {OllamaClient,localModelProblem,readNDJSON} from '../src/ollama-client.js';
import {detectOS,validateHardware,modelFit} from '../src/hardware.js';
import {retrieveSources,buildTutorMessages} from '../src/tutor-context.js';
import {checkTutorReply} from '../src/tutor-checks.js';
const local={name:'example:4b',size:3e9},info={details:{format:'gguf'},capabilities:['completion']};
test('model verification rejects remote aliases, embeddings and unverifiable entries',()=>{
 assert.equal(localModelProblem(local,info),null);
 assert.ok(localModelProblem({...local,name:'example:cloud'},info));
 assert.ok(localModelProblem(local,{...info,remote_host:'https://ollama.com',remote_model:'example'}));
 assert.ok(localModelProblem(local,{...info,capabilities:['embedding']}));
 assert.ok(localModelProblem(local,{}));
 assert.throws(()=>new OllamaClient('https://some-server.example'));
});
test('stream parser handles split JSON, Unicode, multiple objects and final newline omission',async()=>{
 const bytes=new TextEncoder().encode('{"message":{"content":"骨"}}\n{"done":true}'),parts=[bytes.slice(0,24),bytes.slice(24,25),bytes.slice(25)];
 const response=new Response(new ReadableStream({start(c){parts.forEach(p=>c.enqueue(p));c.close();}}));const got=[];await readNDJSON(response,o=>got.push(o));assert.equal(got[0].message.content,'骨');assert.equal(got[1].done,true);
 await assert.rejects(readNDJSON(new Response('{"error":"out of memory"}\n'),()=>{}),/out of memory/);
 await assert.rejects(readNDJSON(new Response('{broken'),()=>{}),/unreadable/);
});
test('chat requires a completed stream and sends bounded context without tools or cloud fallback',async()=>{
 let request;const client=new OllamaClient(undefined,async(url,opts)=>{request={url,...opts};return new Response('{"message":{"content":"A cue"}}\n{"done":true,"eval_count":3}\n');});let text='';await client.chat(local.name,[{role:'user',content:'Ask one question'}],t=>text=t,{info});assert.equal(text,'A cue');const body=JSON.parse(request.body);assert.equal(body.options.num_ctx,8192);assert.equal(body.tools,undefined);assert.equal(request.credentials,'omit');assert.ok(request.url.startsWith('http://127.0.0.1:11434'));
 const broken=new OllamaClient(undefined,async()=>new Response('{"message":{"content":"partial"}}\n'));await assert.rejects(broken.chat('a',[],()=>{}),/before finishing/);
});
test('connection validates API and exposes failures rather than claiming Ollama is stopped',async()=>{
 const client=new OllamaClient(undefined,async url=>new Response(JSON.stringify(url.endsWith('version')?{version:'0.40.5'}:{models:[local]})));
 assert.equal((await client.connect()).models[0].name,local.name);
 const invalid=new OllamaClient(undefined,async()=>new Response('{}'));await assert.rejects(invalid.connect(),/compatible/);
 const failed=new OllamaClient(undefined,async()=>{throw new TypeError('Failed to fetch');});await assert.rejects(failed.connect(),/fetch/);
 const http=new OllamaClient(undefined,async()=>new Response('{"error":"model missing"}',{status:404}));await assert.rejects(http.show('a'),/model missing/);
});
test('cancel and timeout abort the API request',async()=>{
 const fetcher=async(_,opts)=>new Promise((resolve,reject)=>{if(opts.signal.aborted)return reject(opts.signal.reason);opts.signal.addEventListener('abort',()=>reject(opts.signal.reason));});
 const client=new OllamaClient(undefined,fetcher);const c=new AbortController();c.abort();await assert.rejects(client.connect(c.signal));await assert.rejects(client.request('version',{timeout:5}),/too long/);
});
test('model downloads require success and accept only the explicit local choices',async()=>{
 const incomplete=new OllamaClient(undefined,async()=>new Response('{"status":"downloading","total":100,"completed":50}\n'));
 await assert.rejects(incomplete.pull('qwen3.5:2b',()=>{}),/before completion/);
 await assert.rejects(incomplete.pull('anything:cloud',()=>{}),/listed local/);
 const complete=new OllamaClient(undefined,async()=>new Response('{"status":"success"}\n'));await complete.pull('qwen3.5:2b',()=>{});
});
test('hardware import validates limited values and never treats approximate RAM as exact VRAM',()=>{
 assert.equal(detectOS({platform:'Win32'}),'windows');assert.equal(detectOS({platform:'MacIntel',maxTouchPoints:5}),'other');
 assert.throws(()=>validateHardware({}),/report/);assert.equal(validateHardware({schema:1,vramGB:'24'}).vramGB,null);
 assert.equal(modelFit(4e9,{ramGB:32,ramApproximate:true}).rank,1);
 assert.equal(modelFit(4e9,{vramGB:16}).rank,3);assert.equal(modelFit(20e9,{ramGB:8}).rank,0);
});
test('known misleading model statements fall back to course notes without claiming general verification',()=>{
 assert.ok(checkTutorReply('PTH directly stimulates osteoclasts.','Explain PTH').text.includes('indirectly'));
 assert.equal(checkTutorReply('PTH promotes resorption indirectly through osteoblast-lineage cells.','PTH'),null);
 assert.ok(checkTutorReply('PTH stimulates osteoclasts to resorb bone. It indirectly increases intestinal calcium absorption.','PTH'));
 assert.equal(checkTutorReply('PTH indirectly stimulates osteoclast activity.','PTH'),null);
 assert.ok(checkTutorReply('All skull bones are fully fused together in adults.','fontanelles'));
 assert.equal(checkTutorReply('Not all skull bones fuse when fontanelles close.','fontanelles'),null);
 assert.ok(checkTutorReply('Which bone has a distal styloid process?','radius and ulna'));
 assert.ok(checkTutorReply('The radius and ulna have styloid processes at different ends.','their styloid processes').text.includes('Both bones have a distal'));
 assert.ok(checkTutorReply('The radius has a proximal styloid-like radial tuberosity.','forearm').text.includes('separate proximal feature'));
});
test('retrieval returns actual source excerpts for core confusions and development',()=>{
 for(const query of ['radius ulna','atlas axis dens','condyle epicondyle','osteoblast osteoclast osteocyte','PTH calcium','fontanelles infant skull']){
  const sources=retrieveSources(query);assert.ok(sources.length>0,query);assert.equal(new Set(sources.map(s=>s.pdf)).size,sources.length);assert.ok(sources.every(s=>s.text.length>0&&s.pdf>=213&&s.pdf<=369));
 }
 const sources=retrieveSources('radius ulna');assert.ok(sources.some(s=>/radius/i.test(s.text)&&/ulna/i.test(s.text)));
 const {messages}=buildTutorMessages('Explain fontanelles',[],{label:'Fontanelles'},'explain');assert.equal(messages[0].role,'system');assert.ok(messages[0].content.includes('infant fontanelles'));assert.equal(messages.length,2);
});
