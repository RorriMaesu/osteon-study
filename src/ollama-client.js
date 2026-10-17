export const endpoints=['http://127.0.0.1:11434','http://localhost:11434'];
export function localModelProblem(model,info){
 if(!info||typeof info!=='object')return'Could not verify model metadata.';
 if(/(?:^|[/:_-])cloud(?:$|[/:_-])/i.test(model.name)||info.remote_model||info.remote_host||model.remote_model||model.remote_host)return'Cloud-backed model; choose a local model.';
 if(!info.capabilities?.includes('completion'))return'This model does not report text generation support. Update Ollama or choose a chat model.';
 if(!info.details?.format||!model.size)return'Local model weights could not be verified.';
 return null;
}
export async function readNDJSON(response,onObject){
 if(!response.body)throw new Error('This browser cannot read streamed responses.');
 const reader=response.body.getReader(),decoder=new TextDecoder();let pending='';
 function parse(line){if(!line.trim())return;let obj;try{obj=JSON.parse(line);}catch{throw new Error('Ollama sent an unreadable response. Try again.');}if(obj.error)throw new Error(String(obj.error));onObject(obj);}
 try{while(true){const {done,value}=await reader.read();if(done)break;pending+=decoder.decode(value,{stream:true});if(pending.length>2e6)throw new Error('Response exceeded the tutor limit.');let newline;while((newline=pending.indexOf('\n'))>=0){parse(pending.slice(0,newline));pending=pending.slice(newline+1);}}pending+=decoder.decode();parse(pending);}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
export class OllamaClient{
 constructor(endpoint=endpoints[0],fetcher=(...args)=>globalThis.fetch(...args)){if(!endpoints.includes(endpoint))throw new Error('Choose a loopback Ollama address.');this.endpoint=endpoint;this.fetcher=fetcher;}
 async request(path,{body,signal,timeout=10000,stream=false}={}){
  const controller=new AbortController(),cancel=()=>controller.abort(signal?.reason);signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)cancel();const timer=setTimeout(()=>controller.abort(new DOMException('Ollama took too long. Retry or choose a smaller model.','TimeoutError')),timeout);
  const cleanup=()=>{clearTimeout(timer);signal?.removeEventListener('abort',cancel);};
  try{const response=await this.fetcher(this.endpoint+'/api/'+path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,signal:controller.signal,credentials:'omit',redirect:'error'});if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.error||`Ollama returned ${response.status}. Check setup and retry.`);}if(stream)return{response,cleanup};const data=await response.json();cleanup();return data;}catch(err){cleanup();if(controller.signal.aborted)throw controller.signal.reason||err;throw err;}
 }
 async connect(signal){const v=await this.request('version',{signal,timeout:5000});if(typeof v.version!=='string')throw new Error('No compatible Ollama API found.');const tags=await this.request('tags',{signal});if(!Array.isArray(tags.models))throw new Error('Could not read installed models.');return{version:v.version,models:tags.models};}
 show(model,signal){return this.request('show',{body:{model},signal});}
 running(){return this.request('ps');}
 async stream(path,body,onObject,signal){const {response,cleanup}=await this.request(path,{body,signal,stream:true,timeout:path==='pull'?1800000:180000});try{await readNDJSON(response,onObject);}finally{cleanup();}}
 async chat(model,messages,onText,{signal,info,numPredict=500}={}){let text='',last=null;const body={model,messages,stream:true,keep_alive:'5m',options:{temperature:.25,num_ctx:8192,num_predict:numPredict}};if(info?.capabilities?.includes('thinking'))body.think=false;await this.stream('chat',body,obj=>{if(obj.message?.content){text+=obj.message.content;if(text.length>24000)throw new Error('Tutor response exceeded the length limit.');onText(text);}if(obj.done)last=obj;},signal);if(!last)throw new Error('Ollama stopped before finishing. Please retry.');if(!text.trim())throw new Error('No answer received. Try another chat model.');return{text,stats:last};}
 async pull(model,onProgress,signal){if(!/^qwen3\.5:(2b|4b|9b)$/.test(model))throw new Error('Choose a listed local model.');let complete=false;await this.stream('pull',{model,stream:true},obj=>{if(obj.status==='success')complete=true;onProgress(obj);},signal);if(!complete)throw new Error('The download ended before completion. Retry to resume.');}
}
