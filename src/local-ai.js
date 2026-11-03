import {OllamaClient, endpoints, localModelProblem} from './ollama-client.js';

export const AI_SETTINGS_KEY = 'osteon-local-ai-v2';
const read = (storage, key) => { try { return storage?.getItem(key) || ''; } catch { return ''; } };
const json = value => { try { return JSON.parse(value); } catch { return null; } };
const browserStorage = () => { try { return globalThis.localStorage; } catch { return null; } };
const identity = (model, endpoint) => model ? [endpoint, model.name, model.digest || model.modified_at || model.size].join('|') : '';

// One connection and preference for both learning features. An installed model
// is not called ready until it has returned a complete, nonempty response.
export class LocalAIConnection {
  constructor({storage = browserStorage(), fetcher} = {}) {
    this.storage = storage; this.fetcher = fetcher; this.listeners = new Set(); this.run = 0;
    const saved = json(read(storage, AI_SETTINGS_KEY)) || {};
    const legacy = json(read(storage, 'osteon-answer-review-v1')) || {};
    this.preferences = {
      model: String(saved.model || read(storage, 'osteon-tutor-model-v1') || legacy.model || '').slice(0,160),
      endpoint: [saved.endpoint, read(storage, 'osteon-tutor-address-v1'), legacy.endpoint].find(e => endpoints.includes(e)) || endpoints[0],
      tested: typeof saved.tested === 'string' ? saved.tested.slice(0,500) : ''
    };
    this.client = new OllamaClient(this.preferences.endpoint, fetcher);
    this.state = {phase:'idle', connected:false, ready:false, version:'', models:[], model:this.preferences.model, endpoint:this.client.endpoint, error:'', checkedAt:0};
  }
  snapshot() { return {...this.state, models:[...this.state.models]}; }
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  update(patch) { this.state = {...this.state,...patch}; for(const fn of this.listeners) fn(this.snapshot()); }
  persist() {
    try {
      this.storage?.setItem(AI_SETTINGS_KEY, JSON.stringify(this.preferences));
      // Retain compatibility with older open tabs during a staged deployment.
      this.storage?.setItem('osteon-tutor-model-v1', this.preferences.model);
      this.storage?.setItem('osteon-tutor-address-v1', this.preferences.endpoint);
    } catch {}
  }
  select(name) {
    const model = this.state.models.find(m => m.name === name && !m.problem);
    if(!model) throw new Error('Choose a verified installed local model.');
    const same = name === this.state.model;
    this.preferences.model = name; this.persist();
    this.update({model:name, ready:same && this.state.ready, phase:same && this.state.ready ? 'ready' : 'needs-test', error:''});
  }
  setEndpoint(endpoint) {
    if(!endpoints.includes(endpoint)) throw new Error('Choose an address on this computer.');
    this.run++; this.client = new OllamaClient(endpoint, this.fetcher);
    this.preferences.endpoint = endpoint; this.persist();
    this.update({endpoint, connected:false, ready:false, phase:'idle', error:''});
  }
  async connect(signal) {
    const run = ++this.run;
    this.update({phase:'checking', ready:false, error:''});
    try {
      let client = this.client, result;
      try { result = await client.connect(signal); }
      catch(error) {
        if(signal?.aborted) throw error;
        client = new OllamaClient(endpoints.find(e => e !== client.endpoint), this.fetcher);
        result = await client.connect(signal);
      }
      const source = result.models.slice(0,50), models = new Array(source.length);
      let next = 0;
      await Promise.all(Array.from({length:Math.min(4,source.length)}, async () => {
        while(next < source.length) {
          const i = next++, model = source[i];
          try { const info = await client.show(model.name, signal); models[i] = {...model, info, problem:localModelProblem(model,info)}; }
          catch { models[i] = {...model, problem:'Could not verify this model. Check again to retry.'}; }
          signal?.throwIfAborted();
        }
      }));
      signal?.throwIfAborted();
      if(run !== this.run) throw new DOMException('Connection check superseded.','AbortError');
      this.client = client;
      const valid = models.filter(m => !m.problem);
      const selected = valid.find(m => m.name === this.preferences.model) || valid.find(m => m.name === 'qwen3.5:4b') || valid.slice().sort((a,b) => a.size-b.size)[0];
      this.preferences = {...this.preferences, endpoint:client.endpoint, model:selected?.name || ''}; this.persist();
      this.update({connected:true, ready:false, phase:selected ? 'needs-test' : 'needs-model', version:result.version, models, model:selected?.name || '', endpoint:client.endpoint, checkedAt:Date.now(), error:''});
      return this.snapshot();
    } catch(error) {
      if(run === this.run) this.update({connected:false, ready:false, phase:signal?.aborted ? 'idle' : 'unreachable', error:signal?.aborted ? 'Check canceled. You can try again.' : 'Osteon cannot reach Ollama yet. The app, website access, or browser permission may need attention.'});
      throw error;
    }
  }
  wasTested() { const key=identity(this.state.models.find(m => m.name === this.state.model),this.state.endpoint);return !!key&&this.preferences.tested===key; }
  markResponded(model = this.state.model) {
    const entry = this.state.models.find(m => m.name === model && !m.problem);
    if(!entry || model !== this.state.model || !this.state.connected) return;
    this.preferences.tested = identity(entry,this.state.endpoint); this.persist();
    this.update({phase:'ready', ready:true, error:'', checkedAt:Date.now()});
  }
  unavailable(message = 'Connection lost. Check Ollama again.') { this.update({connected:false, ready:false, phase:'unreachable', error:message}); }
  async test(signal,{timeout=60000}={}) {
    const {model, connected} = this.state, client = this.client;
    if(!connected || !model) throw new Error('Connect Ollama and choose a local model first.');
    this.update({phase:'testing', ready:false, error:''});
    const started = performance.now(); let first = null;
    const deadline=new AbortController(),cancel=()=>deadline.abort(signal?.reason);
    signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)cancel();
    const timer=setTimeout(()=>deadline.abort(new DOMException('No complete reply within '+Math.round(timeout/1000)+' seconds. Try a smaller model, or allow a longer first load.','TimeoutError')),timeout);
    try {
      const entry = this.state.models.find(m => m.name === model);
      const info = await client.show(model,deadline.signal), problem = localModelProblem(entry,info);
      if(problem) throw new Error(problem);
      const reply = await client.chat(model,[{role:'user',content:'In at most 35 words, explain how the axial and appendicular skeleton differ.'}], () => { first ??= performance.now(); }, {signal:deadline.signal,info,numPredict:110});
      signal?.throwIfAborted();
      if(client !== this.client || model !== this.state.model) throw new Error('The selected model changed. Test it again.');
      this.markResponded(model);
      return {...reply, firstSeconds:first == null ? null : (first-started)/1000};
    } catch(error) {
      const lost=error instanceof TypeError&&/fetch/i.test(error.message);
      this.update({connected:lost?false:this.state.connected,phase:lost?'unreachable':this.state.connected ? 'needs-test' : 'unreachable', ready:false, error:signal?.aborted ? 'Test stopped. Your model is still installed.' : error.message || 'The model did not respond. Try a smaller model.'});
      throw error;
    } finally { clearTimeout(timer);signal?.removeEventListener('abort',cancel); }
  }
}

export const localAI = new LocalAIConnection();

// The assistant returns a small hardware report in the URL fragment, which is
// not sent to the web host. It is untrusted input, never evidence of readiness.
export function assistantReturn(hash) {
  const match = /^#local-ai-setup=([A-Za-z0-9_-]{1,6000})$/.exec(hash || '');
  if(!match) return null;
  try {
    const bytes = Uint8Array.from(atob(match[1].replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0));
    const report = JSON.parse(new TextDecoder().decode(bytes));
    if(report.schema !== 1) return null;
    return report;
  } catch { return null; }
}
