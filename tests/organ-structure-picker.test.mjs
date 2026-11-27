import test from 'node:test';
import assert from 'node:assert/strict';
import {organStructureName,organStructureGroups} from '../src/organ-structure-names.js';
import {organMotions} from '../src/organ-atlas-catalog.js';

test('every named target and visible context maps to exactly one searchable group',()=>{
  for(const entry of organMotions){
    const names=[...new Set([...entry.targets,...(entry.context||[])])];
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
