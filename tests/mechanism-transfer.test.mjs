import test from 'node:test';
import assert from 'node:assert/strict';
import {validMechanismRecord} from '../src/mechanism-transfer.js';
import {createRecordsStore} from '../src/ap2-records.js';
import {springStore} from '../src/ap3-records.js';
import {createStudyBackup,restoreStudyBackup} from '../src/study-backup.js';

function device(){
  const data=new Map();
  return {get length(){return data.size;},getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k),key:i=>[...data.keys()][i]??null};
}
const first={at:10,helped:false,answers:[2,1]},retry={at:12,helped:true,answers:[0,1]};
test('independent first attempts and assisted retries use bounded, course-specific records',()=>{
  for(const kind of ['afterload','collecting-duct']){
    assert.ok(validMechanismRecord(kind+':initial:first',first,kind));
    assert.ok(validMechanismRecord(kind+':revisit:retry',retry,kind));
    assert.equal(validMechanismRecord(kind+':initial:retry',first,kind),false);
    assert.equal(validMechanismRecord(kind+':initial:first',{...first,answers:[1,3]},kind),false);
    assert.equal(validMechanismRecord(kind+':initial:first',{...first,helped:null},kind),false);
  }
  assert.equal(validMechanismRecord('afterload:initial:first',first,'collecting-duct'),false);
});
test('course and combined backups preserve first responses when adding later coached and revisit records',()=>{
  const source=device(),target=device();
  const earliest={...first,at:8};
  function seed(storage,value){
    createRecordsStore(storage).update(r=>{r.mechanismRecall={'afterload:initial:first':value};});
    springStore(storage).write('mechanism:collecting-duct:initial:first',value);
  }
  seed(source,first);seed(target,earliest);
  createRecordsStore(source).update(r=>{r.mechanismRecall['afterload:revisit:retry']=retry;});
  springStore(source).write('mechanism:collecting-duct:initial:retry',retry);
  const backup=createStudyBackup(source);
  restoreStudyBackup(target,backup);
  assert.deepEqual(createRecordsStore(target).read().mechanismRecall,{'afterload:initial:first':earliest,'afterload:revisit:retry':retry});
  assert.deepEqual(springStore(target).read('mechanism:collecting-duct:initial:first'),earliest);
  const spring=springStore(device());
  spring.restore(springStore(target).backup());
  assert.deepEqual(spring.read('mechanism:collecting-duct:initial:retry'),retry);
  assert.deepEqual(spring.read('mechanism:collecting-duct:initial:first'),earliest);
});
