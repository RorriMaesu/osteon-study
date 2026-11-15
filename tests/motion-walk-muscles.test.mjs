import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const root=new URL('../',import.meta.url);
const file=path=>readFileSync(new URL(path,root));
const read=path=>JSON.parse(file(path));
const asset=path=>file('assets/'+path);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const glb=bytes=>JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
const meshNodes=document=>document.nodes.filter(node=>node.mesh!==undefined);
const manifest=read('assets/motion-walk-muscles.json');
const atlas=read('src/muscle-models.json');

test('whole-body walking covers exactly the active atlas surfaces with the original recorded channels',()=>{
 const expected=new Map(atlas.components.filter(part=>part.kind==='muscle'&&!part.retired).map(part=>[part.id,part]));
 assert.equal(manifest.totalMuscleSurfaces,expected.size);
 const legs=asset('motion-legs.glb');
 assert.equal(hash(legs),manifest.inputs['motion-legs.glb']);
 assert.equal(hash(asset('motion-walk-context.glb')),manifest.inputs['motion-walk-context.glb']);
 const recorded=meshNodes(glb(legs)).filter(node=>node.extras?.motionMuscle).map(node=>node.extras.muscleId);
 assert.equal(recorded.length,8);
 assert.deepEqual(recorded.sort(),[...manifest.baseMuscleIds].sort());
 for(const id of recorded)assert.ok(expected.delete(id),'Recorded part exists in the active atlas');
 const segments=new Set(['head','trunk','pelvis','left-arm','right-arm','left-leg','right-leg']);
 for(const [region,descriptor] of Object.entries(manifest.regions)){
  const bytes=asset(descriptor.file), document=glb(bytes), surfaceNodes=meshNodes(document);
  assert.equal(bytes.length,descriptor.bytes);
  assert.equal(hash(bytes),descriptor.sha256);
  assert.equal(surfaceNodes.length,descriptor.parts);
  const triangles=document.meshes.flatMap(mesh=>mesh.primitives).reduce((sum,part)=>sum+document.accessors[part.indices].count/3,0);
  assert.equal(triangles,descriptor.triangles);
  assert.ok(descriptor.maximumSampledSimplificationErrorMillimeters<=manifest.walkMeshDensity.sampledErrorLimitMillimeters);
  assert.equal(document.skins.length,1);
  const receiverJoints=new Set(document.skins[0].joints.map(index=>document.nodes[index].name));
  const counts={};
  for(const node of surfaceNodes){
   const part=node.extras, source=expected.get(part.muscleId);
   assert.ok(source,'No duplicate or unrecognized surface: '+part.muscleId);
   assert.equal(node.skin,0);
   assert.equal(part.motionSide,source.side);
   assert.equal(part.walkMuscleGroup,source.muscleName);
   assert.equal(part.motionPart,source.geometryReview?.displayName||source.name);
   assert.equal(part.walkRegion,region);
   assert.equal(source.region,region);
   assert.equal(part.walkEvidence,'anatomical-context');
   assert.equal(part.motionMuscle,undefined,'Additive surfaces never enter the recorded channel table');
   assert.equal(part.walkSegments[0],part.walkSegment);
   assert.ok(part.walkSegments.every(scope=>segments.has(scope)));
   assert.ok(part.walkDrivers.every(driver=>receiverJoints.has(manifest.drivers[driver])));
   assert.equal(part.walkDeformation,part.walkDrivers.length===1?'segment-follow':'guided-blend');
   counts[part.walkDeformation]=(counts[part.walkDeformation]||0)+1;
   expected.delete(part.muscleId);
  }
  assert.deepEqual(counts,descriptor.deformation);
 }
 assert.equal(expected.size,0,'All active atlas parts are modeled across the five packs and measured base rig');
});
