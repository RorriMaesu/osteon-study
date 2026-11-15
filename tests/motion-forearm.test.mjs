import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const specifier=name=>new URL('../assets/'+name,import.meta.url);
const manifest=JSON.parse(readFileSync(specifier('motion-forearm.json')));
const bytes=readFileSync(specifier(manifest.asset));
const glb=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
const nodes=glb.nodes.filter(node=>node.mesh!==undefined);
const targets=angle=>'Forearm'+angle;
const atlas=JSON.parse(readFileSync(new URL('../src/muscle-models.json',import.meta.url)));

test('forearm lesson preserves source identities and distinguishes the fixed bones from rotating surfaces',()=>{
 assert.equal(bytes.length,manifest.bytes);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest.sha256);
 assert.equal(manifest.components.length,12);
 assert.equal(new Set(manifest.components.map(part=>part.id)).size,12);
 assert.equal(nodes.filter(node=>node.extras?.motionContext).length,62);
 for(const region of ['right','left']){
  const side=region[0];
  for(const bone of ['Radius','Ulna','Humerus','Scapula']){
   const node=nodes.find(node=>node.extras?.zname===bone+'.'+side);
   assert.equal(node?.extras.motionContext,bone+' · '+region);
   const names=glb.meshes[node.mesh].extras?.targetNames;
   if(bone==='Radius')assert.deepEqual(names,[12,24,36,48,60].map(targets));
   else assert.equal(names,undefined);
  }
  assert.equal(manifest.components.filter(part=>part.side===region).length,6);
  assert.equal(manifest.checks[region].sampledNoBoneIntersectionAtDegrees.length,31);
 }
 for(const part of manifest.components){
  const node=nodes.find(node=>node.extras?.muscleId===part.id);
  const source=atlas.components.find(item=>item.id===part.id);
  assert.equal(node?.extras.motionPart,source?.name);
  assert.equal(node?.extras.motionSide,part.side);
  assert.equal(node?.extras.motionMuscle,part.role);
  assert.equal(glb.meshes[node.mesh].extras?.targetNames?.length??0,part.modeling==='guided-morph'?5:0);
 }
});

test('pronation and return carry direction-specific teaching role groups',()=>{
 const [clip]=manifest.clips;
 assert.equal(clip.id,'forearm-rotation');
 assert.equal(clip.morphInterpolation,'linear');
 const [pronate,hold,supinate]=clip.phases;
 assert.deepEqual(pronate.active,['pronator-teres','pronator-quadratus']);
 assert.deepEqual(hold.active,[]);
 assert.deepEqual(hold.opposes,[]);
 assert.deepEqual(pronate.active,supinate.opposes);
 assert.deepEqual(pronate.opposes,supinate.active);
 for(const [name,keys] of Object.entries(clip.morphTracks)){
  assert.deepEqual(keys[0],[0,0]);
  assert.deepEqual(keys.at(-1),[clip.duration,0]);
  const atPause=name===targets(60)?1:0;
  assert.deepEqual(keys.find(([time])=>time===hold.start),[hold.start,atPause]);
  assert.deepEqual(keys.find(([time])=>time===supinate.start),[supinate.start,atPause]);
 }
});
