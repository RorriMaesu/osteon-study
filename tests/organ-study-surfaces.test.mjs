import test from 'node:test';
import assert from 'node:assert/strict';
import {indexStudySurfaces} from '../scripts/index-organ-study-surfaces.mjs';
import {motionById,organMotions} from '../src/organ-atlas-catalog.js';
import {organStructureName} from '../src/organ-structure-names.js';

test('inspectable additions identify named renderable source nodes outside the opening anatomy',()=>{
  const expected=indexStudySurfaces();
  for(const entry of organMotions){
    assert.deepEqual(entry.studyOnly,expected[entry.id]||[],entry.id);
    const visible=new Set([...entry.targets,...entry.context]);
    assert.ok(entry.studyOnly.every(name=>!visible.has(name)&&name!=='flow_arrows'),entry.id);
  }
  const parts=id=>{const e=motionById.get(id);return [...e.targets,...e.context,...e.studyOnly]};
  assert.equal(parts('cranial-nerves').filter(name=>/_nerve_\(/.test(name)).length,12);
  for(const raw of ['Fovea','Retina','Optic disc'])assert.ok(parts('eye').includes(raw));
  assert.equal(parts('heart').filter(name=>name.includes('papillary_muscle')).length,5);
  assert.ok(parts('heart').includes('VH_M_interventricular_septum'));
  assert.ok(parts('formed-elements').includes('platelet_fragment'));
  for(const side of ['L','R'])assert.ok(parts('uterine-tubes').includes('VH_F_fibria_of_uterine_tube_'+side));
});

test('numbered cell and leaflet meshes have study names and sided organs stay distinct',()=>{
  assert.equal(organStructureName('thyroid','cell_nucleus.012'),'Follicular cell nuclei');
  assert.equal(organStructureName('glandular-pancreas','acinar_cell_0_3'),'Pancreatic acinar cells');
  assert.equal(organStructureName('artery','vein_leaflet_a'),organStructureName('artery','vein_leaflet_b'));
  assert.equal(organStructureName('uterine-tubes','VH_F_isthmus_of_fallopian_tube_R'),'Isthmus of uterine tube (right)');
  assert.equal(organStructureName('heart','VH_M_papillary_muscle_of_heart_anterolateral'),'Anterolateral papillary muscle');
});

test('named tracer carriers are available with context turned off',()=>{
  const carriers={liver:['hepatic_portal_vein'],pancreas:['pancreatic_duct'],kidneys:['left_renal_artery','right_renal_artery'],
    testes:['epididymis_left'],'parotid-glands':['parotid_duct_left','parotid_duct_right'],'submandibular-glands':['submandibular_duct_left','submandibular_duct_right'],
    'ductus-deferens':['ejaculatory_duct_left'],'seminal-glands':['ejaculatory_duct_left'],prostate:['urethra'],penis:['urethra'],
    ovaries:['VH_F_fibria_of_uterine_tube_L','VH_F_ampulla_of_uterine_tube_L'],'female-collecting-system':['VH_F_left_ureter']};
  for(const [id,names] of Object.entries(carriers))for(const name of names)assert.ok(motionById.get(id).targets.includes(name),id+' / '+name);
  for(const [id,longCarrier] of [['prostate','urethra'],['penis','urethra'],['female-collecting-system','VH_F_left_ureter']]){
    const entry=motionById.get(id);
    assert.ok(entry.fitTargets.length&&entry.fitTargets.every(raw=>entry.targets.includes(raw)));
    assert.ok(!entry.fitTargets.includes(longCarrier),id+' preserves the organ close-up');
  }
});
