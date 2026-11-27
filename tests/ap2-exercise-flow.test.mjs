import test from 'node:test';
import assert from 'node:assert/strict';
import {flowBudget,perfusionBeds} from '../src/ap2-exercise-flow.js';

test('exercise redistributes a conserved cardiac output with constant cerebral flow',()=>{
  for(const [column,total,available,percent] of [[1,5800,1950,'12.9'],[2,9500,5250,'7.9'],[3,17500,13250,'4.3']]){
    const budget=flowBudget(column);
    assert.equal(budget.total,total);
    assert.equal(budget.available,available);
    assert.equal(budget.reserved+available,total);
    assert.equal(budget.brainShare.toFixed(1),percent);
    assert.equal(budget.available-perfusionBeds[0][column],750);
  }
});
