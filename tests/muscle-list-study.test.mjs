import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {muscleChecklistTargets} from '../src/muscle-checklist-bank.js';
import {courseMuscleTargetById} from '../src/muscle-spatial-data.js';
import {muscleListOpenStaxFigure} from '../src/muscle-list-openstax.js';
import {muscleStudyModels} from '../src/muscle-list-model-data.js';

const asset=src=>new URL('../'+src,import.meta.url);

test('each required card opens a local OpenStax figure and an atlas or supplemental 3D model',()=>{
 assert.equal(muscleChecklistTargets.length,67);
 for(const {id} of muscleChecklistTargets){
  const figure=muscleListOpenStaxFigure(id);
  assert.ok(figure?.sourceUrl.startsWith('https://openstax.org/'),id);
  assert.ok(existsSync(asset(figure.src)),figure.src);
  if(figure.panel){
   const [x,y,w,h]=figure.panel;
   assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=figure.width&&y+h<=figure.height,id);
  }
  assert.ok(muscleStudyModels[id]||courseMuscleTargetById.get(id).componentIds.length,id);
 }
 assert.equal(muscleListOpenStaxFigure('ch11-external-urethral-sphincter').number,'25.4');
});

test('supplemental models have actual mesh data, source credit, and an initial view',()=>{
 assert.ok(Object.keys(muscleStudyModels).length>=3);
 for(const [id,model] of Object.entries(muscleStudyModels)){
  const buffer=readFileSync(asset(model.src));
  assert.equal(buffer.toString('ascii',0,4),'glTF',id);
  assert.equal(buffer.readUInt32LE(8),buffer.length,id);
  const gltf=JSON.parse(buffer.subarray(20,20+buffer.readUInt32LE(12)));
  assert.ok(gltf.meshes?.length && gltf.meshes.every(mesh=>mesh.primitives?.length),id);
  assert.match(model.sourceUrl,/^https:\/\//);
  assert.ok(model.view.length===3&&model.view.every(Number.isFinite)&&Math.hypot(...model.view)>0,id);
  assert.ok(model.kind&&model.note&&model.sourceLabel,id);
 }
});
