import test from 'node:test';
import assert from 'node:assert/strict';
import {QUICK_PRACTICE_KEY,readQuickPractice,writeQuickPractice} from '../src/quick-practice.js';

const storage=()=>{const data=new Map();return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};};
const terms=[{id:'radius',exact:true,type:'bone'},{id:'ulna',exact:true,type:'bone'}];
test('quick practice restores question order, feedback, and an unfinished answer',()=>{
 const device=storage(),run={id:'run-1',mode:'identify',division:'Appendicular',region:'Upper limb',items:terms,index:1,answers:[{id:'radius',response:'radius',correct:true,assisted:false}],assisted:true,draft:'uln'};
 writeQuickPractice(device,run);
 const restored=readQuickPractice(device,terms);
 for(const [key,value]of Object.entries(run))assert.deepEqual(restored[key],value);
 writeQuickPractice(device,null);
 assert.equal(readQuickPractice(device,terms),null);
});
test('quick practice rejects old or inconsistent question IDs',()=>{
 const device=storage();
 device.setItem(QUICK_PRACTICE_KEY,JSON.stringify({id:'old',mode:'locate',division:'All',region:'All regions',ids:['missing'],index:0,answers:[],draft:''}));
 assert.equal(readQuickPractice(device,terms),null);
});
