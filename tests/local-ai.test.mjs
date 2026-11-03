import test from 'node:test';
import assert from 'node:assert/strict';
import {LocalAIConnection,AI_SETTINGS_KEY,assistantReturn} from '../src/local-ai.js';
import {recommendedDownload,validateHardware} from '../src/hardware.js';
import {setupScreen} from '../src/local-ai-setup.js';

const model={name:'small:local',size:2e9,digest:'sha256:first'};
const info={details:{format:'gguf'},capabilities:['completion']};
function storage(seed={}){const data=new Map(Object.entries(seed));return {getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),data};}
function fake({models=[model],answer='The axial skeleton includes the skull, vertebral column, and thoracic cage.',failure=false,unfinished=false}={}){
 const calls=[];
 return {calls,fetcher:async(url,init)=>{
  calls.push(url);if(failure)throw new TypeError('Failed to fetch');
  const path=new URL(url).pathname;
  if(path==='/api/version')return Response.json({version:'test'});
  if(path==='/api/tags')return Response.json({models});
  if(path==='/api/show')return Response.json(info);
  return new Response(JSON.stringify({message:{content:answer}})+'\n'+(unfinished?'':'{"done":true}\n'));
 }};
}
test('local setup skips installation for existing weights but does not claim readiness before a response',async()=>{
 const f=fake(),ai=new LocalAIConnection({storage:storage(),fetcher:f.fetcher});
 await ai.connect();assert.equal(ai.state.phase,'needs-test');assert.equal(ai.state.ready,false);assert.equal(ai.state.model,model.name);
 assert.equal(ai.wasTested(),false);const reply=await ai.test();assert.ok(reply.text);assert.equal(ai.state.phase,'ready');assert.equal(ai.wasTested(),true);
 assert.ok(f.calls.every(u=>u.startsWith('http://127.0.0.1:11434/')));
});
test('returning users retain one model preference and validate the current weight identity',async()=>{
 const saved=storage({'osteon-tutor-model-v1':model.name}),f=fake();const first=new LocalAIConnection({storage:saved,fetcher:f.fetcher});
 await first.connect();await first.test();assert.equal(JSON.parse(saved.getItem(AI_SETTINGS_KEY)).model,model.name);
 const next=new LocalAIConnection({storage:saved,fetcher:f.fetcher});await next.connect();assert.equal(next.wasTested(),true);assert.equal(next.state.ready,false);
 const changed=new LocalAIConnection({storage:saved,fetcher:fake({models:[{...model,digest:'sha256:replacement'}]}).fetcher});await changed.connect();assert.equal(changed.wasTested(),false);
});
test('unreachable service is not diagnosed as uninstalled, and a canceled check is not ready',async()=>{
 const ai=new LocalAIConnection({storage:storage(),fetcher:fake({failure:true}).fetcher});await assert.rejects(ai.connect());
 assert.equal(ai.state.phase,'unreachable');assert.ok(!/not installed|uninstalled|stopped/i.test(ai.state.error));assert.equal(ai.state.ready,false);
 const controller=new AbortController();controller.abort();await assert.rejects(ai.connect(controller.signal));assert.equal(ai.state.phase,'idle');
});
test('cloud aliases cannot pass setup and empty installations lead directly to model selection',async()=>{
 for(const models of [[],[{...model,name:'large:cloud'}]]){
  const ai=new LocalAIConnection({storage:storage(),fetcher:fake({models}).fetcher});await ai.connect();
  assert.equal(ai.state.phase,'needs-model');assert.equal(ai.state.model,'');assert.equal(ai.state.ready,false);
 }
});
test('unfinished or empty model tests never mark the AI ready',async()=>{
 for(const opts of [{unfinished:true},{answer:''}]){
  const ai=new LocalAIConnection({storage:storage(),fetcher:fake(opts).fetcher});await ai.connect();await assert.rejects(ai.test());assert.equal(ai.state.ready,false);assert.equal(ai.state.phase,'needs-test');
 }
});
test('connection loss during the sample test leads to connection recovery rather than a false ready state',async()=>{
 const f=fake(),ai=new LocalAIConnection({storage:storage(),fetcher:async(url,init)=>{
  if(url.endsWith('/chat'))throw new TypeError('Failed to fetch');return f.fetcher(url,init);
 }});
 await ai.connect();await assert.rejects(ai.test());assert.equal(ai.state.ready,false);assert.equal(ai.state.connected,false);assert.equal(ai.state.phase,'unreachable');
});
test('switching models invalidates ready status and cannot select an unknown model or external address',async()=>{
 const ai=new LocalAIConnection({storage:storage(),fetcher:fake({models:[model,{...model,name:'another:local'}]}).fetcher});await ai.connect();await ai.test();
 ai.select('another:local');assert.equal(ai.state.ready,false);assert.equal(ai.preferences.model,'another:local');
 assert.throws(()=>ai.select('unknown'));assert.throws(()=>ai.setEndpoint('http://192.168.1.1:11434'));
});
test('assistant fragments are bounded untrusted hardware, not permission or readiness evidence',()=>{
 const report={schema:1,os:'windows',ramGB:32,vramGB:16,gpu:'GPU <example>',freeDiskGB:100,ready:true};
 const hash='#local-ai-setup='+Buffer.from(JSON.stringify(report)).toString('base64url');
 const result=validateHardware(assistantReturn(hash));assert.equal(result.vramGB,16);assert.equal(result.ready,undefined);assert.equal(result.freeDiskGB,100);
 assert.equal(assistantReturn('#local-ai-setup=invalid'),null);assert.equal(assistantReturn('#local-ai-setup='+'a'.repeat(6001)),null);
});
test('memory suggestions remain conservative when browser memory is approximate',()=>{
 assert.equal(recommendedDownload({ramGB:8,ramApproximate:true}).name,'qwen3.5:2b');
 assert.equal(recommendedDownload({ramGB:32,vramGB:16}).name,'qwen3.5:9b');
 assert.equal(recommendedDownload({ramGB:32,ramApproximate:false}).name,'qwen3.5:4b');
});
test('setup makes hardware optional and installation/device branches explicit',()=>{
 const state={models:[],connected:false,phase:'unreachable',endpoint:'http://127.0.0.1:11434'};
 const overview=setupScreen({state,os:'windows'});assert.ok(overview.includes('Open Ollama'));assert.ok(!overview.includes('id="hardware-ram"'));
 const install=setupScreen({state,os:'windows',page:'install'});assert.ok(install.includes('OllamaSetup.exe'));assert.ok(install.includes('aria-current="step"'));
 const phone=setupScreen({state,os:'other'});assert.ok(phone.includes('Use a computer for local AI'));assert.ok(!phone.includes('href="ollama://"'));
 const unready=setupScreen({state:{...state,connected:true,model:model.name,models:[model],phase:'needs-test'},os:'windows'});
 assert.ok(unready.includes('Test and finish setup'));assert.ok(!unready.includes('data-ai-action="finish"'));
 const installed=setupScreen({state:{...state,connected:true,model:model.name,models:[model]},os:'windows',page:'model'});
 assert.ok(installed.includes('Use this model'));assert.ok(!installed.includes('id="model-download"'));
 const download=setupScreen({state:{...state,connected:true,model:model.name,models:[model]},os:'windows',page:'download'});
 assert.ok(download.includes('Download 2.7 GB model'));assert.ok(download.includes('current download part'));
});
