import test from 'node:test';
import assert from 'node:assert/strict';
import {spirometry,gradeVolumeTrace} from '../src/ap3-labs-experiments.js';
import {springLabTutorContext} from '../src/ap3-labs-tutor.js';
import {immuneRecognition,oxygenCarriage,alanineFates,lipidJourney} from '../src/ap3-labs-immune-fuel.js';
import {immuneDisorders,altitude,lungDevelopment} from '../src/ap3-labs-immune-respiratory.js';
import {gasSurface,lymphMedia} from '../src/ap3-labs-fields.js';
import {specimens} from '../src/ap3-specimens-catalog.js';

test('each breathing trial grades marked points, calculated excursion and volume name independently',()=>{
  for(const form of [0,1,2]){
    const {plot}=spirometry.run({form}),values=plot.rows.map(p=>p[1]);
    const high=Math.max(...values),low=Math.min(...values),peak=values.indexOf(high),trough=values.indexOf(low);
    const marks={peak,trough,excursion:(high-low).toFixed(1)};
    assert.deepEqual(gradeVolumeTrace(plot,marks,0),{peak:true,trough:true,excursion:true,quantity:true,high,low});
    assert.deepEqual(gradeVolumeTrace(plot,{peak:trough,trough:peak,excursion:'-3.2'},0),{peak:false,trough:false,excursion:false,quantity:true,high,low});
    assert.equal(gradeVolumeTrace(plot,{peak,trough,excursion:''},1).excursion,false);
    const context=springLabTutorContext(22,spirometry,{values:{form},activityIndex:2,frame:0,marks:{peak:trough,excursion:2},choice:0});
    assert.match(context.text,/peak needs review, trough needs review, excursion needs review, quantity correct/);
  }
  assert.equal(spirometry.nextTrial({form:2}).form,0);
});
test('tissue and gas trials have varied outcomes at a fixed pressure gradient',()=>{
  assert.equal(lymphMedia[2].figure,'21.7');
  assert.deepEqual([0,1,2,3].map(condition=>gasSurface.run({condition}).choices[0]),['It falls to about half','It falls to about half','It doubles','It stays fixed']);
  assert.deepEqual([0,1,2].map(trial=>oxygenCarriage.run({trial}).choices[0]),['A carries more','B carries more','Both carry the same amount']);
  assert.equal(oxygenCarriage.run({trial:3}).choices[0],'B');
});
test('disorder mechanisms, altitude responses and developmental transitions have distinct evidence at each step',()=>{
  assert.deepEqual([0,1,2].map(record=>immuneDisorders.run({record}).choices[0]),['Combined immunodeficiency','Immediate hypersensitivity','Autoimmunity']);
  assert.deepEqual([0,1].map(pressure=>altitude.run({pressure}).choices[0]),['115 mmHg','136 mmHg']);
  assert.match(altitude.run({pressure:0},[0]).choices[0],/ventilation/);
  assert.match(altitude.run({pressure:0},[0,0]).choices[0],/erythropoietin/);
  assert.match(lungDevelopment.run({record:1},[0]).choices[0],/collapse/);
  assert.match(lungDevelopment.run({record:2},[0]).choices[0],/after birth/i);
});
test('immune, nutrient and colonic routes preserve anatomical distinctions',()=>{
  assert.match(immuneRecognition.routes[0].steps[1][0],/class II/);
  assert.match(immuneRecognition.routes[1].steps[1][0],/class I$/);
  assert.match(immuneRecognition.routes[2].steps[0][0],/antibody/);
  assert.match(alanineFates.routes[0].steps.at(-1)[0],/Urea/);
  assert.match(alanineFates.routes[1].steps[0][0],/Pyruvate/);
  for(const r of lipidJourney.routes)assert.ok(r.steps.some(step=>/lacteal/i.test(step[0])));
  assert.match(lipidJourney.routes[0].steps.at(-1)[0],/triglyceride/);
  assert.match(lipidJourney.routes[1].steps.at(-1)[0],/oxidation/);
  for(const id of ['alimentary-tract','distal-colon']){
    const specimen=specimens.find(s=>s.id===id);
    for(const [target,[path]] of Object.entries(specimen.handoffs)){
      assert.ok(specimen.targets.find(t=>t.id===target));
      const [next,,name]=path.split('/');
      assert.ok(specimens.find(s=>'ap3-specimen-'+s.id===next).targets.some(t=>t.id===name));
    }
  }
});
