import test from 'node:test';
import assert from 'node:assert/strict';
import {renderSpecimen, specimens} from '../src/ap3-specimens.js';

const cases = [
  ['fluid-spaces', ['capillary_wall','plasma','interstitial_fluid','cell_membrane'], ['red_blood_cells','intracellular_fluid']],
  ['placental-exchange', ['chorionic_villus','intervillous_space'], ['fetal_arteriole','fetal_capillaries','fetal_venule']],
  ['blood-compartment', ['plasma','neutrophil_cytoplasm','eosinophil_cytoplasm','basophil_cytoplasm','lymphocyte_cytoplasm','monocyte_cytoplasm'],
    ['neutrophil_nucleus','eosinophil_nucleus','basophil_nucleus','lymphocyte_nucleus','monocyte_nucleus']]
];

for(const [id, layers, contents] of cases){
  test(id+' provides a cutaway and individually selectable internal structures',()=>{
    const spec=specimens.find(s=>s.id===id);
    assert.match(renderSpecimen(id),/data-ap3-section checked/);
    for(const key of [...layers,...contents])assert.ok(spec.targets.some(t=>t.id===key),key);
    for(const key of layers){
      assert.ok(spec.cut.test(key),key);
      const opacity=spec.layers.find(([pattern])=>pattern.test(key))?.[1];
      assert.ok(opacity>0&&opacity<.5,key);
    }
    for(const key of contents){
      assert.ok(!spec.cut.test(key),key);
      assert.ok(!spec.layers.some(([pattern])=>pattern.test(key)),key);
    }
    for(const route of spec.routes)for(const step of route.steps){
      assert.ok(spec.targets.some(target=>target.id===step),step);
    }
  });
}
