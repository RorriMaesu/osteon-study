import test from 'node:test';
import assert from 'node:assert/strict';
import {chapters} from '../src/ap3-curriculum.js';
import {specimens} from '../src/ap3-specimens-catalog.js';
import {isSpringStudyRoute} from '../src/ap3-backup.js';
import {chapterLabs,renderLab,renderPlot} from '../src/ap3-labs.js';
import {springLessonLabs,labRoute,readLabRoute} from '../src/ap3-lab-links.js';
import {spirometry,antibody,breathing} from '../src/ap3-labs-experiments.js';
import {ovarian} from '../src/ap3-labs-evidence.js';
import {collectingDuct} from '../src/ap3-labs-kidney.js';
import {springLabTutorContext} from '../src/ap3-labs-tutor.js';

test('every spring lesson links to an authored, usable case with a reversible bookmark',()=>{
  const sections=chapters.flatMap(ch=>ch.sections.map(s=>s.id));
  assert.deepEqual(Object.keys(springLessonLabs).sort(),sections.sort());
  for(const [section,recommendation] of Object.entries(springLessonLabs)){
    const {activity:index,label,settings,model,chapter}=recommendation;
    const ch=chapter||section.split('.')[0],activity=chapterLabs[ch][index];
    assert.ok(activity&&label,section);
    if(model)assert.ok(specimens.some(s=>s.id===model),model);
    for(const [key,value] of Object.entries(settings)){
      if(key==='route')assert.ok(activity.routes[value],section);
      else assert.ok(activity.controls.find(c=>c.key===key)?.labels[value],section+' '+key);
    }
    const path=labRoute(ch,index,settings,section);
    assert.equal(isSpringStudyRoute(path),true,path);
    assert.deepEqual(readLabRoute(path.split('/').slice(2)),{from:section,settings});
    assert.ok(renderLab(ch,index,settings).includes(activity.title));
  }
  assert.equal(chapterLabs[21][springLessonLabs['21.3'].activity].section,'21.3');
  assert.equal(springLessonLabs['28.6'].model,'lactating-unit');
  assert.match(renderLab(28,1,{event:2}),/<option value="2" selected>Suckling/);
  assert.equal(isSpringStudyRoute('ap3-lab-22/2'),true);
  assert.equal(isSpringStudyRoute('ap3-lab-22/2/from-22.3/<tag>'),false);
  assert.deepEqual(readLabRoute(['from-false','from-__proto__','outside-250','initialVol-0.8','bogus<script>']),
    {from:'',settings:{outside:250,initialVol:0.8}});
});

test('both spirometry trials plot signed volumes and position each stage at its measured time',()=>{
  for(const form of [0,1]){
    const {plot,frames}=spirometry.run({form});
    assert.equal(frames.length,3);
    for(const [i,expected] of [1,6,9].entries()){
      const svg=renderPlot(plot,i);
      assert.ok(svg.includes('data-event-time="'+expected+'"'));
      assert.ok(svg.includes('>'+plot.rows[6][1]+'</text>'));
      const points=[...svg.matchAll(/<circle cx="[\d.]+" cy="([\d.]+)" r="2.8"/g)].map(m=>Number(m[1]));
      assert.equal(points.length,plot.rows.length);
      assert.equal(points[5],20);assert.equal(points[6],130);
      assert.ok(points.every(y=>y>=20&&y<=130));
    }
  }
  for(const dataset of [antibody.run({series:0}).plot,breathing.run({moment:2}).plotAfter,ovarian.run({interval:2}).plot]){
    for(const [i,row] of dataset.rows.entries())assert.ok(renderPlot(dataset,i).includes('data-event-time="'+row[0]+'"'));
  }
  const lab=renderLab(22,2);
  assert.ok(lab.includes('data-ap3-measure="peak"')&&lab.includes('data-ap3-measure="trough"'));
});

test('ADH and gradient can be tested independently; water balance and fixed solute delivery are preserved',()=>{
  const conditions=new Set();
  let values={adh:1,gradient:1};
  for(let i=0;i<4;i++){
    const {adh,gradient}=values;
    conditions.add(adh+','+gradient);
    const data=collectingDuct.run(values);
    const [water,volume,osm]=data.result.rows[1].slice(1).map(parseFloat);
    assert.ok(Math.abs(water+volume-10)<0.11);
    assert.ok(Math.abs(volume*osm/1000-3)<.05);
    if(gradient===0){assert.equal(water,0);assert.equal(osm,300);}
    else {assert.equal(osm,adh?840:360);assert.ok(water>0);}
    const state={activityIndex:2,values,choice:null,frame:0};
    const context=springLabTutorContext(25,collectingDuct,state);
    assert.equal(context.diagram.answer,'');
    assert.ok(!context.text.includes('Your trial'));
    assert.match(springLabTutorContext(25,collectingDuct,{...state,choice:0}).text,/Your trial/);
    values=collectingDuct.nextTrial(values);
    assert.equal(Number(values.adh!==adh)+Number(values.gradient!==gradient),1);
  }
  assert.equal(conditions.size,4);
  assert.match(renderLab(25,2),/Collecting-duct section/);
  assert.doesNotMatch(renderLab(25,2),/Simulated water and solute balance|data-ap3-discuss/);
});
