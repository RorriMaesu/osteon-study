import test from 'node:test';
import assert from 'node:assert/strict';
import {hematocrit,hematocritCases,lineages,oxygenSites,renderBloodFoundations} from '../src/ap2-blood-foundations.js';

test('hematocrit uses the full volume including the buffy coat',()=>{
  const results=hematocritCases.map(([,sample])=>hematocrit(sample));
  for(const [i,expected] of [37.5,56.25,45].entries())assert.ok(Math.abs(results[i]-expected)<1e-10);
  assert.deepEqual(hematocritCases.map(item=>item[2]),['falls','rises','stays the same']);
});
test('progenitor and maturation routes are distinct for each product',()=>{
  const byName=Object.fromEntries(lineages.map(c=>[c.target,c]));
  assert.equal(byName['T lymphocyte'].branch,'Lymphoid');
  assert.match(byName['T lymphocyte'].precursor,/thymic/);
  assert.match(byName['Platelets'].precursor,/Megakaryocyte/);
  assert.match(byName['Erythrocyte'].precursor,/reticulocyte/);
  assert.match(byName['Neutrophil'].precursor,/granulocyte/);
});
test('one O₂ binds per heme and equal oxygen occupancy can occur at different capacities',()=>{
  for(let n=1;n<=4;n++)for(const sat of [0,25,50,75,100]){
    const data=oxygenSites(n,sat);assert.equal(data.capacity,4*n);
    assert.equal(data.bound/(4*n)*100,sat);
  }
  assert.deepEqual(oxygenSites(4,50),{capacity:16,bound:8});
  assert.deepEqual(oxygenSites(2,100),{capacity:8,bound:8});
});
test('all three practicals expose distinct activities with specific OpenStax sections',()=>{
  for(const id of ['18.1','18.2','18.3']){
    const html=renderBloodFoundations(id);assert.ok(html.includes('data-blood-foundation="'+id+'"'));
    assert.match(html,/data-bf-feedback/);assert.ok(html.includes('pages/'+id.replace('.','-')+'-'));
  }
  assert.equal(renderBloodFoundations('18.6'),'');
});

