import test from 'node:test';
import assert from 'node:assert/strict';
import {neuralCases} from '../src/ap2-neural-cases.js';
import {renderCaseEvidence} from '../src/ap2-neural-case-evidence.js';

test('both visual observation stations supply paired, marked diagrams and an equivalent text view',()=>{
  for(const [section,caseIndex] of [['12.2',0],['13.3',1]]){
    const current=neuralCases[section][caseIndex];
    const html=renderCaseEvidence(current.evidence);
    assert.equal((html.match(/role="img" aria-label="[^"]+"/g)||[]).length,2);
    assert.match(html,/Read the diagrams/);
    assert.match(html,/Osteon teaching schematics/);
    assert.ok(html.includes('OpenStax §'+section));
    assert.ok(!html.includes('undefined'));
    for(const spot of ['A1','A2','B1','B2']){
      assert.ok(html.includes('type="button" data-evidence-pin="'+spot+'"'));
      assert.ok(html.includes('aria-label="Mark '+spot+' · '));
      assert.ok(html.includes(spot+' marks '));
    }
  }
  assert.equal(renderCaseEvidence(neuralCases['13.3'][0].evidence),'');
  assert.ok(!neuralCases['12.2'][0].observation.includes('micrograph'));
});

test('perfusion and ventricular anatomy can be distinguished by pattern, shape and description',()=>{
  const html=renderCaseEvidence(neuralCases['13.3'][1].evidence);
  assert.equal((html.match(/id="neuro-case-perfusion-hatch"/g)||[]).length,1);
  assert.equal((html.match(/fill="url\(#neuro-case-perfusion-hatch\)"/g)||[]).length,1);
  assert.match(html,/right on your left/);
  assert.match(html,/Both central cavities are wider/);
  assert.match(html,/surrounding tissue has no striped area/);
});
