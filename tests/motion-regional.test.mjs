import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {regionalFrame,regionalLessons} from '../src/motion-regional.js';

const assetURL=(asset,ext)=>new URL('../assets/'+asset+ext,import.meta.url);
const shipped=Object.values(regionalLessons).filter(lesson=>existsSync(assetURL(lesson.asset,'.json')));

test('each regional clip connects exact named atlas IDs, available morphs and supported role cues',()=>{
 assert.ok(shipped.length>=4);
 for(const {asset} of shipped){
  const meta=JSON.parse(readFileSync(assetURL(asset,'.json'),'utf8'));
  const bytes=readFileSync(assetURL(asset,'.glb'));
  assert.equal(bytes.length,meta.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),meta.sha256);
  const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
  const muscles=json.nodes.filter(node=>node.mesh!=null&&node.extras?.motionMuscle);
  assert.deepEqual(new Set(muscles.map(node=>node.extras.muscleId)), new Set(meta.components.map(part=>part.id)));
  const roles=new Set(meta.components.map(part=>part.role));
  const used=new Set(meta.clips.flatMap(clip=>Object.keys(clip.morphTracks)));
  for(const node of muscles){
   const targets=json.meshes[node.mesh].extras?.targetNames||[];
   const component=meta.components.find(part=>part.id===node.extras.muscleId);
   assert.equal(targets.some(target=>used.has(target)),!component.modeling.endsWith('-context'));
  }
  for(const clip of meta.clips){
   assert.equal(clip.phases[0].start,0);
   for(const phase of clip.phases){
    for(const role of [...phase.active,...phase.opposes])assert.ok(roles.has(role),asset+' '+role);
    assert.equal(phase.active.some(role=>phase.opposes.includes(role)),false);
   }
   for(const keys of Object.values(clip.morphTracks)){
    assert.equal(keys[0][0],0);
    assert.ok(keys.at(-1)[0]<=clip.duration);
    assert.ok(keys.slice(1).every(([seconds],index)=>seconds>keys[index][0]));
   }
  }
 }
});

test('the regional timeline respects phase changes and eases bounded morph weights',()=>{
 const clip={duration:2,morphTracks:{Relax:[[0,0],[1,1],[2,0]]},phases:[{start:0,label:'Start'},{start:1,label:'Return'}]};
 assert.deepEqual(regionalFrame(clip,.5),{phase:clip.phases[0],weights:{Relax:.5}});
 assert.deepEqual(regionalFrame(clip,1),{phase:clip.phases[1],weights:{Relax:1}});
 assert.equal(regionalFrame(clip,100).weights.Relax,0);
 assert.equal(regionalFrame({...clip,morphInterpolation:'linear'},.25).weights.Relax,.25);
});
