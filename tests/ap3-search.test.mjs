import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chapters} from '../src/ap3-curriculum.js';
import {chapterLabs} from '../src/ap3-labs.js';
import {specimens} from '../src/ap3-specimens-catalog.js';
import figures from '../src/ap3-figures.json' with {type:'json'};
import {openSpringSearch, specimenRoute, springSearchEntries, springTargetKey} from '../src/ap3-search.js';
import {springStore} from '../src/ap3-records.js';
import {isSpringStudyRoute} from '../src/ap3-backup.js';
import {rememberAP3Route} from '../src/course-home.js';

const rows=springSearchEntries();
const resources=new Map(rows.map(row=>[row.route,row]));

test('each spring lesson, activity and attributed textbook figure has its own usable search destination',()=>{
  assert.equal(resources.size,rows.length,'Every indexed resource has a distinct destination');
  const sections=chapters.flatMap(ch=>ch.sections.map(s=>s.id));
  for(const chapter of chapters){
    for(const section of chapter.sections){
      const row=resources.get('ap3-lesson-'+section.id);
      assert.equal(row?.kind,'Lesson',section.id);
      assert.equal(row.title,section.title);
    }
    for(const [index,activity] of chapterLabs[chapter.id].entries()){
      const row=resources.get('ap3-lab-'+chapter.id+'/'+index);
      assert.equal(row?.kind,'Activity',activity.title);
      assert.equal(row.title,activity.title);
      assert.ok(sections.includes(row.section),row.section);
    }
  }
  for(const [id,figure] of Object.entries(figures.figures)){
    const matches=rows.filter(row=>row.kind==='Figure'&&row.route.endsWith('/figures/'+id));
    assert.equal(matches.length,1,id);
    const [row]=matches;
    assert.ok(figures.sections[row.section]?.includes(id),'The destination lesson actually contains figure '+id);
    assert.equal(row.route,'ap3-lesson-'+row.section+'/figures/'+id);
    assert.equal(row.title,figure.title);
  }
  for(const row of rows)assert.ok(isSpringStudyRoute(row.route),row.route);
});

test('each selectable model structure round-trips from its search link to one catalog target',()=>{
  for(const model of specimens){
    const base=specimenRoute(model.id);
    assert.equal(resources.get(base)?.kind,'3D model');
    const targets=new Map(model.targets.map(target=>[springTargetKey(target.id),target]));
    assert.equal(targets.size,model.targets.length,'URL-safe structure keys collided in '+base);
    for(const target of model.targets){
      const route=specimenRoute(model.id,target.id);
      const row=resources.get(route);
      assert.equal(row?.kind,'3D structure',route);
      assert.equal(row.title,target.label);
      const [specimen,marker,key]=route.split('/');
      assert.equal(specimen,base);
      assert.equal(marker,'target');
      assert.match(key,/^[\w-]+$/);
      assert.equal(targets.get(key),target);
    }
  }
});

function searchScreen(){
  const input={value:'',focus(){}},kind={value:''},out={};
  const elements={'[data-find]':input,'[data-find-kind]':kind,'[data-matches]':out};
  let hits=[];
  openSpringSearch({root:{querySelector:s=>elements[s]},hero:()=>'',page:()=>{},e:s=>s,link:(route,title)=>{
    hits.push({route,title});return '';
  }});
  return (query,filter='')=>{
    hits=[];input.value=query;kind.value=filter;input.oninput();
    return {hits,status:out.innerHTML};
  };
}

test('students can restrict a misspelled search to 3D structures and find physiological terms in activities',()=>{
  const find=searchScreen();
  const corrected=find('collectng duct','3D structure');
  assert.match(corrected.status,/Closest spelling “collecting duct”/);
  assert.ok(corrected.hits.some(r=>r.route==='ap3-specimen-nephron-pair/target/shared_collecting_duct'));
  assert.ok(corrected.hits.every(r=>resources.get(r.route).kind==='3D structure'));
  const nodes=find('deep popliteal nodes left','3D structure').hits;
  assert.ok(nodes.some(r=>r.route.startsWith('ap3-specimen-nodes-overview/')));
  assert.ok(nodes.some(r=>r.route.startsWith('ap3-specimen-nodes-lower-limb/')));
  assert.equal(new Set(nodes.map(r=>r.title)).size,nodes.length,'Name the parent specimen when structures share a label');
  for(const term of ['counter-current','counter–current','countercurrent']){
    assert.ok(find(term,'Activity').hits.some(r=>r.route==='ap3-lab-25/2'),term);
  }
  assert.ok(find('ABG','Activity').hits.some(r=>r.route==='ap3-lab-26/2'));
  assert.match(find('xzqqzz','3D model').status,/No matches/);
  assert.deepEqual(find('').hits.map(r=>r.route),chapters.flatMap(c=>c.sections.map(s=>'ap3-lesson-'+s.id)));
});

function mockStorage(t,name){
  const original=Object.getOwnPropertyDescriptor(globalThis,name),map=new Map();
  Object.defineProperty(globalThis,name,{configurable:true,value:{
    getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,String(value))
  }});
  t.after(()=>original?Object.defineProperty(globalThis,name,original):Reflect.deleteProperty(globalThis,name));
  return map;
}

test('a named, sided lymph-node target survives shared-atlas return, course resume and spring backup',t=>{
  const local=mockStorage(t,'localStorage'),session=mockStorage(t,'sessionStorage');
  const model=specimens.find(s=>s.id==='nodes-lower-limb'),target=model.targets.find(t=>t.label==='Deep popliteal nodes (left)');
  const route=specimenRoute(model.id,target.id);
  assert.equal(route,'ap3-specimen-nodes-lower-limb/target/Node-Deep-popliteal-nodes-l');
  rememberAP3Route(route);
  assert.equal(local.get('osteon-course-resume-3'),route);
  assert.equal(session.get('osteon-course-atlas-return'),route);
  const store=springStore(null),imported=springStore(null);
  store.write('last',{route});
  assert.equal(imported.restore(store.backup()),1);
  assert.equal(imported.read('last').route,route);
  rememberAP3Route(specimenRoute(model.id));
  assert.equal(session.get('osteon-course-atlas-return'),'ap3-specimen-nodes-lower-limb');
});
