import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {bodyMaps,correspondingOrgan,locationForEntry,mappedActions,mapForKey,mapRoute} from '../src/organ-atlas-bodies.js';
import {organMotions,bodyAtlas,motionById,phaseStart,currentPhase,sourceCredits} from '../src/organ-atlas-catalog.js';
import {dentition,mountDentition} from '../src/organ-motion-dentition.js';

const docs=new Map();
const pathTo=file=>new URL('../'+file,import.meta.url);
function glb(path){
  if(!docs.has(path)){
    const bytes=readFileSync(pathTo(path));
    assert.equal(bytes.toString('ascii',0,4),'glTF',path);
    docs.set(path,JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString()));
  }
  return docs.get(path);
}
function surfaces(path){
  const doc=glb(path),names=new Set();
  function visit(index){
    const node=doc.nodes[index];
    const children=(node.children||[]).map(visit);
    const hasMesh=node.mesh!=null||children.some(Boolean);
    if(hasMesh)names.add(node.name);
    return hasMesh;
  }
  for(const index of doc.scenes[doc.scene??0].nodes)visit(index);
  return names;
}
test('every organ preparation offers a working study route for every selectable surface group',()=>{
  assert.ok(bodyAtlas.organs.length>=50);
  for(const map of bodyMaps){
    const available=new Set([map.asset,...map.extraAssets||[]].flatMap(path=>[...surfaces(path)]));
    const ids=map.organs.map(o=>o.id);
    assert.equal(new Set(ids).size,ids.length,map.key);
    for(const row of map.organs){
      assert.ok(row.targets.length,row.id);
      for(const name of row.targets)assert.ok(available.has(name),map.key+' / '+row.id+' / '+name);
      const actions=mappedActions(map,row);
      assert.ok(actions.length,map.key+' / '+row.id+' lacks an activity');
      assert.ok(actions.every(action=>motionById.get(action.id)===action));
      assert.equal(mapRoute(map,row),'organs/'+map.key+'/'+row.id);
    }
  }
  const male=bodyMaps[0],section=bodyMaps.find(m=>m.key==='pelvic-section');
  const primary=(m,id)=>mappedActions(m,m.organs.find(r=>r.id===id))[0].id;
  assert.equal(primary(male,'heart'),'heart');
  assert.equal(primary(male,'urethra'),'urethra');
  assert.equal(primary(section,'female-urethra'),'female-urethra');
  assert.equal(locationForEntry(motionById.get('aorta')).row.id,'aorta');
});
test('switching reference bodies preserves shared organs and only carries verified surfaces',()=>{
  const male=mapForKey('body'),female=mapForKey('female');
  const find=(map,id)=>map.organs.find(row=>row.id===id);
  assert.notEqual(female.asset,male.asset);
  assert.ok(find(female,'skin')?.contextOnly);
  assert.deepEqual(find(female,'skin').targets,['skin']);
  assert.ok(!female.skeletonAsset,'The female donor uses her own registered bones');
  for(const id of ['bladder','teeth']){
    const a=find(male,id),b=find(female,id);
    assert.ok(a&&b,id);
    assert.equal(correspondingOrgan(male,b),a);
    assert.equal(correspondingOrgan(female,a),b);
    assert.equal(mapRoute(female,b,'unmapped_surface'),'organs/female/'+id);
  }
  assert.equal(correspondingOrgan(female,find(male,'prostate')),undefined);
  assert.equal(correspondingOrgan(male,find(female,'uterus')),undefined);
  const pelvicBladder=find(mapForKey('pelvis'),'female-bladder');
  assert.equal(correspondingOrgan(male,pelvicBladder),find(male,'bladder'));
});
test('all organ activities have real targets, ordered phases, references and specimen credits',()=>{
  assert.equal(motionById.size,organMotions.length);
  assert.ok(organMotions.length>80);
  for(const entry of organMotions){
    const names=surfaces(entry.asset);
    assert.ok(entry.targets.length&&entry.action&&entry.description,entry.id);
    for(const key of [...entry.targets,...entry.context||[],...entry.fitContext||[]])assert.ok(names.has(key),entry.id+' / '+key);
    assert.ok(existsSync(pathTo(entry.credits||sourceCredits(entry.asset))),entry.id+' credit');
    assert.match(entry.source,/^https:\/\//);
    assert.ok(entry.phases.length>=2,entry.id);
    assert.equal(phaseStart(entry,0),0,entry.id);
    for(const [i,phase] of entry.phases.entries()){
      const time=phaseStart(entry,i);
      assert.ok(time>=0&&time<=1&&(!i||time>phaseStart(entry,i-1)),entry.id+' phase '+i);
      assert.equal(currentPhase(entry,time),i);
      assert.ok(phase.label&&phase.text,entry.id);
    }
  }
});
test('the 28-tooth dentition animates the lower arch with the jaw and leaves the upper arch fixed',()=>{
  const file=glb(dentition.asset);
  const map=new Map([...dentition.targets,...dentition.context].map(name=>{
    const node=file.nodes.find(n=>n.name===name),mesh=file.meshes[node.mesh];
    const names=mesh.extras?.targetNames||[];
    const obj={morphTargetDictionary:Object.fromEntries(names.map((n,i)=>[n,i])),morphTargetInfluences:names.map(()=>0)};
    return [name,[obj]];
  }));
  assert.equal(dentition.targets.length,28);
  const control=mountDentition(dentition,{},map);
  control.set(.48);
  for(const name of dentition.targets){
    const [tooth]=map.get(name);
    if(name.startsWith('Lower'))assert.ok(tooth.morphTargetInfluences[tooth.morphTargetDictionary.JawOpen]>0,name);
    else assert.ok(!tooth.morphTargetInfluences.some(Boolean),name);
  }
  control.dispose();
  for(const [mesh] of map.values())assert.ok(!mesh.morphTargetInfluences.some(Boolean));
});
