import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Box3,Vector3} from 'three';
import {visceralOrgans,mountVisceralMotion} from '../src/organ-motion-visceral.js';
import paths from '../src/organ-motion-visceral-paths.json' with {type:'json'};
import {specimens} from '../src/ap3-specimens-catalog.js';
import {animationForTarget,specimenAnimations} from '../src/ap3-specimen-animations.js';

const loader=new GLTFLoader(), scenes=new Map();
async function specimen(asset){
  if(!scenes.has(asset)){
    const buffer=readFileSync(new URL('../'+asset,import.meta.url));
    const data=buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength);
    scenes.set(asset,loader.parseAsync(data,'').then(g=>g.scene));
  }
  return scenes.get(asset);
}

test('visceral lessons render a changing 3D frame on each actual organ and restore the source', async()=>{
  assert.equal(new Set(visceralOrgans.map(o=>o.id)).size,visceralOrgans.length);
  for(const organ of visceralOrgans){
    const model=await specimen(organ.asset),meshes=new Map();
    for(const name of [...organ.targets,...organ.context]){
      const mesh=model.getObjectByName(name);
      assert(mesh?.isMesh,organ.id+' missing '+name);
      meshes.set(name,[mesh]);
    }
    for(const fx of organ.effects){
      if(fx.mesh)assert(meshes.has(fx.mesh),organ.id+' targets an invisible mesh');
      if(fx.path)assert(paths[fx.path]?.length>1,organ.id+' has no 3D trajectory');
    }
    assert.match(organ.source,/^https:\/\/openstax\.org\//);
    const originals=[...meshes.values()].flat().map(o=>[o,o.geometry,o.material]);
    const initialChildren=model.children.length;
    const motion=mountVisceralMotion(organ,{model,invalidate(){}},meshes);
    function frame(t){
      motion.set(t);
      const values=[];
      for(const [obj,geometry] of originals)if(geometry!==obj.geometry){
        const p=obj.geometry.attributes.position;
        const source=geometry.attributes.position;
        let movement=0;
        for(let i=0;i<p.count;i++)movement+=Math.abs(p.getX(i)-source.getX(i))+Math.abs(p.getY(i)-source.getY(i))+Math.abs(p.getZ(i)-source.getZ(i));
        values.push(movement);
      }
      const overlay=model.getObjectByName('Visceral process indicators');
      for(const marker of overlay.children.filter(o=>o.isGroup))values.push(marker.visible?marker.position.length():-1);
      assert(values.every(Number.isFinite),organ.id+' frame yielded invalid geometry');
      return values;
    }
    const frames=[0,.14,.36,.55,.74,.93,1].map(frame);
    assert(frames.some(row=>row.some((v,i)=>Math.abs(v-frames[0][i])>1e-8)),organ.id+' has no geometric motion');
    for(const [o,g] of originals){
      if(o.geometry===g)continue;
      const p=o.geometry.attributes.position,a=g.attributes.position;
      for(let i=0;i<p.count;i++)assert(Math.abs(p.getX(i)-a.getX(i))+Math.abs(p.getY(i)-a.getY(i))+Math.abs(p.getZ(i)-a.getZ(i))<1e-5,organ.id+' failed to return to rest');
    }
    motion.dispose();motion.dispose();
    assert.equal(model.children.length,initialChildren,organ.id);
    for(const [o,g,m] of originals){assert.equal(o.geometry,g,organ.id);assert.equal(o.material,m,organ.id);}
  }
});

const length=(a,b)=>new Vector3(...a).distanceTo(new Vector3(...b));
test('the pelvic sigmoid loop remains distinct from the rectum in the body, lab and animation',async()=>{
  for(const asset of ['assets/organ-atlas/registered-organs.glb','assets/ap3-models/alimentary-tract.glb']){
    const model=await specimen(asset);
    const sigmoid=new Box3().setFromObject(model.getObjectByName('sigmoid_colon'));
    const rectum=new Box3().setFromObject(model.getObjectByName('rectum'));
    assert(sigmoid.max.x>rectum.max.x+.05,asset+' sigmoid should reach into the left pelvis');
    assert(sigmoid.min.x<rectum.max.x,asset+' sigmoid should return toward the midline');
  }
  const sigmoid=paths['sigmoid-colon'],rectum=paths.rectum;
  assert(sigmoid[0][0]>sigmoid.at(-1)[0]+.05);
  assert(length(sigmoid.at(-1),rectum[0])<.001,'donor segments should meet at the rectosigmoid junction');
  assert(rectum[0][1]>rectum.at(-1)[1]+.10);
  for(const station of specimens.filter(s=>['distal-colon','alimentary-tract'].includes(s.id))){
    for(const target of ['descending_colon','sigmoid_colon','rectum']){
      assert.equal(animationForTarget(station,target,specimenAnimations(station))?.id,target.replace('_','-'));
    }
  }
});
test('urine, semen, milk and portal examples respect source geometry and flow direction',()=>{
  for(const key of ['ureter-left','ureter-right','female-ureter-left','female-ureter-right','urethra','female-urethra','filtration-barrier','ejaculatory-duct','esophagus']){
    assert(paths[key][0][1]>paths[key].at(-1)[1],key+' should finish inferiorly');
  }
  assert(paths['portal-inflow'][0][1]<paths['portal-inflow'].at(-1)[1]);
  assert(length(paths['minor-calyx'].at(-1),paths['major-calyx'][0])<.0005);
  assert(length(paths['major-calyx'].at(-1),paths['female-renal-pelvis'][0])<.0005);
  assert(length(paths['proximal-tubule'].at(-1),paths['nephron-loop'][0])<.001);
  assert(length(paths['nephron-loop'].at(-1),paths['distal-tubule'][0])<.001);
  assert(length(paths['distal-tubule'].at(-1),paths['collecting-duct'][1])<.01);
  assert(length(paths['terminal-ductus'].at(-1),paths['ejaculatory-duct'][0])<.005);
  assert(paths['milk-duct'][0][1]>paths['milk-duct'].at(-1)[1]);
  assert(length(paths['placental-artery'].at(-1),paths['placental-vein'][0])<.01);
  assert(length(paths['placental-artery'][0],paths['placental-vein'].at(-1))<.012);
});

test('renal tracers remain at the ends of both source arteries through the final phase',async()=>{
  const lesson=visceralOrgans.find(o=>o.id==='kidneys');
  const model=(await specimen(lesson.asset)).clone(true);
  const meshes=new Map(lesson.targets.map(name=>[name,[model.getObjectByName(name)]]));
  const motion=mountVisceralMotion(lesson,{model,invalidate(){}},meshes);
  try{
    motion.set(1);
    const markers=model.getObjectByName('Visceral process indicators').children.filter(o=>o.isGroup&&o.visible);
    assert.equal(markers.length,2);
    for(const side of ['left','right']){
      const endpoint=new Vector3(...paths['renal-artery-'+side].at(-1));
      assert.ok(markers.some(m=>m.position.distanceTo(endpoint)<1e-6),side+' renal artery endpoint');
    }
  }finally{motion.dispose();}
});
