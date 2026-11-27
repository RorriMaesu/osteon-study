import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Scene,Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mountVisceralMotion,visceralOrgans} from '../src/organ-motion-visceral.js';
import {mountRegulationMotion,regulationOrgans} from '../src/organ-motion-regulation.js';
import {cardiacValves} from '../src/ap2-valve-surfaces.js';
import paths from '../src/organ-motion-visceral-paths.json' with {type:'json'};

test('the named bile phases, visible route and reservoir share a clock',()=>{
  const entry=visceralOrgans.find(row=>row.id==='gallbladder');
  const routes=entry.effects.filter(effect=>effect.mode==='trace');
  assert.deepEqual(entry.phases.slice(1).map(phase=>phase.at),routes.map(route=>route.span[0]));
  assert.equal(entry.effects.find(effect=>effect.mode==='empty').span[0],routes[0].span[0]);
  assert.ok(['gallbladder','cystic_duct','bile_duct'].every(name=>entry.targets.includes(name)));
});

async function load(entry){
  const data=readFileSync(new URL('../'+entry.asset,import.meta.url));
  const {scene:model}=await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'');
  const scene=new Scene();scene.add(model);
  const byName=new Map([...entry.targets,...entry.context].map(name=>[name,[model.getObjectByName(name)]]));
  return {instance:{model,scene,invalidate(){}},byName};
}

test('each propelled bolus stays downstream of the contracting ring on the loaded surface',async()=>{
  const entries=visceralOrgans.filter(e=>e.effects.some(f=>f.mode==='wave'&&f.marker));
  assert.equal(entries.length,9);
  for(const entry of entries){
    const {instance,byName}=await load(entry);
    const originals=new Map(entry.targets.map(n=>[n,byName.get(n)[0].geometry.getAttribute('position')]));
    const motion=mountVisceralMotion(entry,instance,byName);
    for(const [k,fx] of entry.effects.entries()){
      const [a,b]=fx.span||[0,1],track=paths[fx.path].map(p=>new Vector3(...p));
      const segments=track.slice(1).map((to,i)=>({start:track[i],d:to.clone().sub(track[i])}));
      const length=segments.reduce((sum,s)=>{s.at=sum;s.length=s.d.length();return sum+s.length;},0);
      function project(point){
        let distance=Infinity,f=0;
        for(const s of segments){
          const v=point.clone().sub(s.start),u=Math.max(0,Math.min(1,v.dot(s.d)/s.length**2));
          const r=v.addScaledVector(s.d,-u).length();
          if(r<distance){distance=r;f=(s.at+u*s.length)/length;}
        }
        return {f,distance};
      }
      const source=originals.get(fx.mesh),now=byName.get(fx.mesh)[0].geometry.getAttribute('position');
      const projection=Array.from({length:source.count},(_,i)=>project(new Vector3().fromBufferAttribute(source,i)));
      const token=instance.model.getObjectByName('Visceral process indicators').children.filter(c=>c.isGroup)[k];
      for(const progress of [.25,.55,.87]){
        motion.set(a+(b-a)*progress);
        let peak=-1,location;
        for(let i=0;i<source.count;i++){
          const radius=projection[i].distance;
          if(radius<1e-6)continue;
          const change=new Vector3().fromBufferAttribute(source,i).distanceTo(new Vector3().fromBufferAttribute(now,i))/radius;
          if(change>peak){peak=change;location=projection[i].f;}
        }
        const bolus=project(token.position).f;
        assert(peak>.06&&location<bolus,entry.id+' / '+fx.mesh+' ring '+location+' bead '+bolus);
        assert(Math.abs(bolus-(fx.range[0]+progress*(fx.range[1]-fx.range[0])))<.001);
      }
    }
    motion.dispose();
  }
  const stomach=visceralOrgans.find(e=>e.id==='stomach');
  assert(stomach.effects.some(e=>e.mode==='trace'&&e.range[1]<e.range[0]));
});

test('all four atlas leaflets change aperture separately and close during both isovolumetric windows',async()=>{
  const heart=regulationOrgans.find(e=>e.id==='heart'),{instance,byName}=await load(heart);
  const mounts=cardiacValves.map(v=>byName.get('VH_M_'+v.key+'_valve')[0]);
  const vertexColors=mounts.map(m=>m.material.vertexColors);
  const original=mounts.map(mesh=>mesh.geometry),motion=mountRegulationMotion(heart,instance,byName);
  for(const mesh of mounts)assert.equal(mesh.material.vertexColors,false,'the reconstructed leaflets supply their own color');
  const snapshot=ms=>{motion.set(ms/800);return mounts.map(m=>Array.from(m.geometry.attributes.position.array));};
  const closed=snapshot(215);
  assert.deepEqual(snapshot(540),closed);
  for(const [ms,open] of [[100,['mitral','tricuspid']],[198,['tricuspid']],[240,['pulmonary']],[320,['pulmonary','aortic']],[500,['pulmonary']],[565,['mitral']]]){
    const actual=snapshot(ms);
    cardiacValves.forEach((v,i)=>assert.equal(actual[i].some((x,j)=>Math.abs(x-closed[i][j])>1e-7),open.includes(v.key),v.key+' at '+ms));
  }
  motion.dispose();mounts.forEach((m,i)=>{assert.equal(m.geometry,original[i]);assert.equal(m.material.vertexColors,vertexColors[i]);});
});
