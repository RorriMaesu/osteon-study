import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newRecords,validAP2Records,createRecordsStore,AP2_KEY} from '../src/ap2-records.js';
import {practicalStations,practicalFamilies,byStation,partForMesh} from '../src/ap2-practical-bank.js';
import {newPractical,markStation,practicalScores,validPractical} from '../src/ap2-practical-session.js';

test('each practical surface is present and uniquely matched in the shipped specimen',()=>{
  for(const station of practicalFamilies.flat()){
    const file=readFileSync(new URL('../assets/'+station.asset+'.glb',import.meta.url));
    const gltf=JSON.parse(file.subarray(20,20+file.readUInt32LE(12)));
    const names=gltf.nodes.filter(n=>n.mesh!==undefined).map(n=>n.name);
    station.parts.forEach((p,i)=>{
      for(const name of [].concat(p.mesh)){
        assert.ok(names.includes(name),station.id+' · '+name);
        assert.equal(partForMesh(station,name),i);
      }
    });
    const keys=station.tasks.map(t=>t.answer);
    assert.equal(new Set(keys).size,2);
    assert.ok(keys.every(i=>station.parts[i]));
  }
});
test('old written reports can coexist with a saved 3D practical; first marks and results survive reopening',()=>{
  const mem=new Map(),storage={getItem:k=>mem.get(k)??null,setItem:(k,v)=>mem.set(k,v)};
  assert.ok(validAP2Records(newRecords()));
  const store=createRecordsStore(storage);
  const run=newPractical(practicalStations,()=>.42);
  store.update(r=>{r.practicalDraft=run;});
  assert.ok(validAP2Records(JSON.parse(mem.get(AP2_KEY))));
  for(const [i,item] of run.items.entries()){
    const s=practicalStations.find(s=>s.id===item.station);
    item.answers=[s.tasks[0].answer,s.tasks[1].answer,i?0:1];
    item.methods=['model','description','choice'];assert.ok(markStation(item,s));assert.ok(!markStation(item,s));
  }
  run.index=run.items.length-1;run.submitted=run.started+500;
  assert.ok(validPractical(run,true));
  store.update(r=>{delete r.practicalDraft;r.practicalReports=[run];});
  const copy=createRecordsStore(storage).read();
  assert.deepEqual(practicalScores(copy.practicalReports[0]),[run.items.length,run.items.length,run.items.length-1]);
  assert.deepEqual(copy.reports,[]);
  const tampered=structuredClone(copy);tampered.practicalReports[0].items[0].result[0].correct=false;
  assert.equal(validAP2Records(tampered),false);
});
