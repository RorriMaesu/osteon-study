import test from 'node:test';
import assert from 'node:assert/strict';
import {beatValues,afterloadContext} from '../src/ap2-afterload.js';
import {renderLab} from '../src/ap2-cardio.js';
import {newRecords,validAP2Records,createRecordsStore} from '../src/ap2-records.js';
import {createStudyBackup,restoreStudyBackup} from '../src/study-backup.js';
import {buildTutorMessages} from '../src/tutor-context.js';

test('afterload changes one beat at constant filling and end-systolic pressure-volume slope',()=>{
  const base=beatValues('baseline'),high=beatValues('higher'),low=beatValues('lower');
  assert.ok(high.esv>base.esv&&low.esv<base.esv);
  assert.deepEqual([base.sv,high.sv-base.sv,low.sv-base.sv],[70,-15,10]);
  for(const beat of [low,base,high]){
    const [mc,ao,ac,mo]=beat.events;
    assert.equal(beat.edv,base.edv);
    assert.deepEqual(mc,base.events[0]);
    assert.equal(mc[0],ao[0]);assert.equal(ac[0],mo[0]);
    assert.ok(ac[1]>ao[1]&&beat.peak>=ac[1]);
    assert.equal(ac[1]/ac[0],base.events[2][1]/base.events[2][0]);
  }
  assert.match(renderLab('19.4'),/href="#ap2-lesson-19\.4\/activity\/afterload"/);
  assert.match(renderLab('19.4'),/data-workload/);
});

test('winter lab tutoring uses the displayed trial and learner prediction, without exposing hidden outcomes or independent exam answers',()=>{
  const request=c=>buildTutorMessages('Why did my loop change?',[],c,'socratic');
  const prior=request(afterloadContext('higher'));
  assert.equal(prior.sources.length,1);
  assert.match(prior.sources[0].text,/105 mm Hg/);
  assert.doesNotMatch(prior.sources[0].text,/65 mL|55 mL/);
  const revealed=afterloadContext('higher','larger',2);
  const reviewed=request(revealed);
  assert.match(reviewed.sources[0].text,/65 mL/);
  assert.match(reviewed.sources[0].text,/point C/);
  assert.match(reviewed.messages[0].content,/would be larger/);
  assert.equal(request({...revealed,assessmentMode:'exam'}).blocked,true);
  assert.match(request(afterloadContext('lower','larger')).sources[0].text,/40 mL/);
});

test('winter study records preserve original responses and revisions through a backup, accepting older records without predictions',()=>{
  const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
  assert.equal(validAP2Records(newRecords()),true);
  const source=memory(),target=memory(),store=createRecordsStore(source);
  const written=store.update(r=>{
    r.guidedPredictions={'12.2/0':{draft:'My revision',first:'My first prediction'},'13.2/1':{draft:'Unrevealed'}};
    r.afterload={higher:'larger',lower:'same'};r.studied['12.2']=15;
  });
  restoreStudyBackup(target,createStudyBackup(source));
  assert.deepEqual(createRecordsStore(target).read(),written);
  assert.equal(validAP2Records({...written,afterload:{higher:'unrecognized'}}),false);
  assert.equal(validAP2Records({...written,guidedPredictions:{'28.1/2':{draft:'Wrong course'}}}),false);
});
