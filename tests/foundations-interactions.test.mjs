import test from 'node:test';
import assert from 'node:assert/strict';
import {foundationsVisuals} from '../src/visual-foundations.js';
import {fractureSVG,repairSVG} from '../src/fracture-diagrams.js';
import {foundationCases} from '../src/foundations-cases.js';
import {acidDosePH,foundationExperiments} from '../src/foundations-experiments.js';
import {transcribeTemplate,translateExample} from '../src/cell-labs.js';

test('the mitral valve depicts distinct forward-flow and sealing positions',()=>{
 const art=foundationsVisuals['1.1'].art;
 assert.match(art(1),/--valve-angle:0deg/);
 assert.match(art(2),/--valve-angle:-53deg/);
 assert.match(art(2),/--valve-angle:53deg/);
});

test('fracture pattern stays fixed when the skin is opened',()=>{
 const closed=fractureSVG('oblique',{skinStatus:'closed'});
 const open=fractureSVG('oblique',{skinStatus:'open'});
 const line=svg=>svg.match(/class="fracture-line" d="([^"]+)"/)[1];
 assert.equal(line(open),line(closed));
 assert.match(open,/data-wound-channel/);
 assert.doesNotMatch(closed,/data-wound-channel/);
 assert.match(fractureSVG('open'),/data-wound-channel/);
 assert.match(repairSVG('hematoma'),/L146 147V25Z/);
 assert.doesNotMatch(repairSVG('remodeled'),/L146 147V25Z/);
});

test('every section in Chapters 1–6 has two distinct cases with option-specific feedback',()=>{
 const expected=[7,5,6,6,4,7].flatMap((count,chapter)=>Array.from({length:count},(_,i)=>`${chapter+1}.${i+1}`));
 assert.deepEqual(Object.keys(foundationCases),expected);
 for(const [id,cases] of Object.entries(foundationCases)){
  assert.ok(cases.length>=2,id);
  assert.equal(new Set(cases.map(c=>c.prompt)).size,cases.length,id);
  for(const {choices} of cases){
   assert.equal(new Set(choices.map(([label])=>label)).size,3,id);
   assert.equal(new Set(choices.map(([,reason])=>reason)).size,3,id);
  }
 }
 for(const id of ['1.5','2.4','3.1','3.3','4.2','6.7'])assert.equal(typeof foundationExperiments[id].mount,'function');
});

test('the same added acid changes buffered pH less until acetate capacity is used',()=>{
 assert.ok(Math.abs(acidDosePH(0,true)-acidDosePH(0,false))<.01);
 assert.ok(acidDosePH(2,true)>acidDosePH(2,false)+1);
 assert.ok(acidDosePH(15,true)<acidDosePH(8,true)-1);
 for(const buffered of [true,false]){
  for(let dose=1;dose<=20;dose++)assert.ok(acidDosePH(dose,buffered)<acidDosePH(dose-1,buffered));
 }
});

test('the second protein template uses a distinct set of codons and terminates',()=>{
 const alternate=transcribeTemplate('TACCCGAAAACT');
 assert.equal(alternate,'AUGGGCUUUUGA');
 assert.deepEqual(translateExample(alternate),['Met','Gly','Phe']);
});
