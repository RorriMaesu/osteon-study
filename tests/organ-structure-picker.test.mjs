import test from 'node:test';
import assert from 'node:assert/strict';
import {organStructureName,organStructureGroups} from '../src/organ-structure-names.js';
import {normalizeOrganSystem,organLabelRole,organSystemColor} from '../src/organ-label-roles.js';
import {mountStructurePicker} from '../src/organ-structure-picker.js';
import {organMotions} from '../src/organ-atlas-catalog.js';
import {bodyMaps,mapRoute} from '../src/organ-atlas-bodies.js';
import {makeCourseSearch} from '../src/ap2-term-search.js';
import {organStudyDestination} from '../src/atlas-organ-layer.js';
import {organAssetUrl} from '../src/organ-asset-url.js';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

test('every named target and visible context maps to exactly one searchable group',()=>{
  for(const entry of organMotions){
    const names=[...new Set([...entry.targets,...(entry.context||[]),...(entry.studyOnly||[])])];
    const meshes=new Map(names.map(name=>[name,[{name}]]));
    const {byRaw,groups}=organStructureGroups(entry,meshes);
    assert.equal(byRaw.size,names.length,entry.id);
    assert.equal(groups.flatMap(group=>group.meshes).length,names.length,entry.id);
    for(const raw of names){
      const group=byRaw.get(raw);
      assert.ok(group.title.trim()&&group.meshes.some(mesh=>mesh.name===raw),entry.id+' '+raw);
      if(entry.targets.includes(raw))assert.ok(group.target);
    }
  }
});

test('repeated teaching structures share names while sided anatomy remains distinct',()=>{
  const name=organStructureName;
  assert.equal(name('thyroid','follicle_cell_2_11'),name('thyroid','follicle_cell_1_7'));
  assert.equal(name('female-collecting-system','VH_F_minor_calyx_L_b'),'Left minor calyces');
  assert.equal(name('female-collecting-system','VH_F_minor_calyx_R_b'),'Right minor calyces');
  assert.notEqual(name('peripheral-nerve','First node'),name('peripheral-nerve','Second node'));
  assert.equal(name('teeth','Upper medial incisor.r.001'),'Upper central incisor (right)');
  assert.equal(name('artery','artery_media'),'Tunica media');
});

test('a surface gets its own anatomy role regardless of the lesson that contains it',()=>{
  for(const [id,name,role] of [
    ['heart','VH_M_left_coronary_artery','vessel'],['heart','VH_M_aortic_valve','valve'],
    ['lungs','diaphragm','muscle'],['placenta','VH_F_umbilical_vein','vessel'],
    ['liver','bile_duct','passage'],['kidneys','renal_hilum','structure'],
    ['artery','vein_media','wall'],['ovaries','VH_F_fibria_of_uterine_tube_L','structure'],
    ['lymph-node','efferent_vessel','lymph'],['lymphatic','Node | Deep cervical lymph node near internal jugular vein','node'],
    ['peripheral','Nerve | Accessory nerve','nerve'],['lymphatic-drainage','thoracic_duct_territory','structure'],
    ['peripheral-nerve','First node','nerve'],['glandular-pancreas','beta_cell_1','tissue']
  ]){
    const semantic=organLabelRole({id},name,organStructureName(id,name));
    assert.equal(semantic.id,role,name);assert.ok(semantic.symbol&&semantic.title&&semantic.color);
  }
  for(const [a,b] of [['Special senses','sensory'],['Lymphatic and immune','lymphatic']]){
    assert.equal(normalizeOrganSystem(a),normalizeOrganSystem(b));
    assert.equal(organSystemColor(a),organSystemColor(b));
  }
  for(const name of new Set([...organMotions.map(row=>row.system),...bodyMaps.flatMap(map=>map.organs.map(row=>row.system))])){
    assert.notEqual(organSystemColor(name),organSystemColor(''),name);
  }
});

test('a blind station cannot expose a name, role, key or geometry picker through the study controls',()=>{
  const picker=mountStructurePicker(null,null,null,null,{blind:true});
  assert.equal(picker.pick('diaphragm'),false);
  const trial=[{}];
  assert.equal(picker.isolateObjects(trial),trial);
  picker.updatePin();picker.clear();picker.refresh();
});

test('a whole-body component link identifies one registered surface on the selected organ',()=>{
  for(const map of bodyMaps)for(const organ of map.organs){
    const parent=mapRoute(map,organ);
    for(const raw of organ.targets){
      const route=mapRoute(map,organ,raw),segments=route.split('/');
      assert.equal(segments.slice(0,-1).join('/'),parent);
      assert.equal(decodeURIComponent(segments.at(-1)),raw);
      if(map.key==='body')assert.equal(organStudyDestination(organ,raw),route);
    }
    assert.equal(mapRoute(map,organ,'unknown/surface'),parent);
  }
});

test('a common anatomical synonym finds its surface without merging two nephrons',()=>{
  const meshes=new Map(['cortical_glomerular_tuft','juxtamedullary_glomerular_tuft','cortical_glomerular_capsule'].map(raw=>[raw,[{name:raw}]]));
  const {groups}=organStructureGroups({id:'nephron-transit',targets:[]},meshes);
  const search=makeCourseSearch(groups);
  assert.equal(search('glomerulus').items.length,2);
  assert.equal(search("Bowman's capsule").items[0].names[0],'cortical_glomerular_capsule');
});

test('body and course viewers request the current version of repaired bowel meshes',()=>{
  for(const asset of ['assets/organ-atlas/registered-organs.glb','assets/ap3-models/distal-colon.glb','assets/ap3-models/alimentary-tract.glb']){
    const bytes=readFileSync(new URL('../'+asset,import.meta.url));
    const expected=createHash('sha256').update(bytes).digest('hex').slice(0,12);
    const url=new URL(organAssetUrl(asset,'https://example.org/osteon-study/'));
    assert.equal(url.pathname,'/osteon-study/'+asset);
    assert.equal(url.searchParams.get('v'),expected);
  }
});
